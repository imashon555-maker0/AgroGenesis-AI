"""Telemetry data API routes."""

import json
import csv
import io
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.api.deps import get_db
from app.models.telemetry import TelemetryRecord
from app.models.field import Field
from app.schemas.telemetry import TelemetryRecordResponse, TelemetryStats, TelemetryUploadResponse
from app.core.exceptions import not_found, bad_request
from app.services.telemetry.j1939_parser import parse_j1939_csv, aggregate_j1939_records
from app.services.telemetry.normalizer import normalize_j1939_record, assign_zone
from app.services.geospatial.zonal_stats import compute_zone_stats, compute_field_summary
from app.services.geospatial.spatial import get_telemetry_geojson

router = APIRouter()


@router.get("/{field_id}/records", response_model=list[TelemetryRecordResponse])
async def get_telemetry_records(
    field_id: str,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    """Get telemetry records for a field."""
    result = await db.execute(
        select(TelemetryRecord)
        .where(TelemetryRecord.field_id == field_id)
        .order_by(TelemetryRecord.timestamp.desc())
        .limit(limit)
    )
    records = result.scalars().all()
    return [TelemetryRecordResponse.model_validate(r) for r in records]


@router.get("/{field_id}/stats", response_model=list[TelemetryStats])
async def get_telemetry_stats(field_id: str, db: AsyncSession = Depends(get_db)):
    """Get aggregated telemetry statistics per zone."""
    stats = await compute_zone_stats(db, field_id)
    return [
        TelemetryStats(
            zone_label=s.zone_label,
            zone_id=s.zone_id,
            productivity_class=s.productivity_class,
            area_ha=s.area_ha,
            record_count=s.total_telemetry_points,
            avg_speed_kmh=s.mean_speed_kmh,
            avg_fuel_l_ha=s.mean_fuel_l_ha,
            avg_applied_rate_kg_ha=s.mean_applied_rate,
            mean_ndvi=s.mean_ndvi,
            mean_ndre=s.mean_ndre,
        )
        for s in stats
    ]


@router.get("/{field_id}/geojson")
async def get_telemetry_geojson_route(field_id: str, db: AsyncSession = Depends(get_db)):
    """Get telemetry locations as GeoJSON for map visualization."""
    return await get_telemetry_geojson(db, field_id)


@router.post("/{field_id}/upload", response_model=TelemetryUploadResponse)
async def upload_telemetry(
    field_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload telemetry data (J1939 CSV or ISOBUS XML)."""
    # Verify field exists
    result = await db.execute(select(Field).where(Field.id == field_id))
    if not result.scalar_one_or_none():
        raise not_found(f"Field {field_id} not found")

    content = await file.read()
    filename = file.filename or ""

    if filename.endswith(".csv"):
        # J1939 CSV
        return await _import_j1939_csv(db, field_id, content)
    elif filename.endswith(".xml"):
        # ISOBUS XML
        return await _import_isobus_xml(db, field_id, content)
    else:
        raise bad_request(f"Unsupported file format: {filename}. Use .csv (J1939) or .xml (ISOBUS)")


async def _import_j1939_csv(
    db: AsyncSession, field_id: str, content: bytes
) -> TelemetryUploadResponse:
    """Import J1939 CSV telemetry data."""
    # Write to temp file for parser
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as tmp:
        tmp.write(content.decode("utf-8"))
        tmp_path = tmp.name

    records = parse_j1939_csv(tmp_path)
    aggregated = aggregate_j1939_records(records)

    imported = 0
    zones_assigned = 0

    for record in aggregated:
        normalized = normalize_j1939_record(record, field_id)

        # Skip records without location
        if normalized["location"] is None:
            continue

        # Try to assign to a zone
        if record.location_lat and record.location_lon:
            zone_id = await assign_zone(db, field_id, record.location_lon, record.location_lat)
            if zone_id:
                normalized["zone_id"] = zone_id
                zones_assigned += 1

        # Insert record
        telemetry = TelemetryRecord(**{k: v for k, v in normalized.items() if k != "location"})
        if normalized["location"]:
            await db.execute(
                text("""
                    INSERT INTO telemetry_records (
                        id, field_id, machine_id, timestamp, speed_kmh,
                        fuel_rate_l_h, fuel_consumption_l_ha, wheel_slip_pct,
                        engine_load_pct, engine_rpm, applied_rate_kg_ha,
                        source_format, pgn_code, location, zone_id
                    ) VALUES (
                        gen_random_uuid(), :field_id, :machine_id, :timestamp, :speed_kmh,
                        :fuel_rate_l_h, :fuel_consumption_l_ha, :wheel_slip_pct,
                        :engine_load_pct, :engine_rpm, :applied_rate_kg_ha,
                        :source_format, :pgn_code, ST_GeomFromEWKT(:location), :zone_id
                    )
                """),
                normalized,
            )
            imported += 1

    return TelemetryUploadResponse(
        records_parsed=len(aggregated),
        records_imported=imported,
        zones_assigned=zones_assigned,
        field_id=field_id,
        source_format="j1939",
    )


async def _import_isobus_xml(
    db: AsyncSession, field_id: str, content: bytes
) -> TelemetryUploadResponse:
    """Import ISOBUS XML telemetry data."""
    import tempfile
    with tempfile.NamedTemporaryFile(mode="wb", suffix=".xml", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    from app.services.telemetry.isobus_parser import parse_taskdata_xml, task_to_telemetry_records

    task = parse_taskdata_xml(tmp_path)
    records = task_to_telemetry_records(task, field_id)

    imported = 0
    zones_assigned = 0

    for record in records:
        if record.get("location_lat") and record.get("location_lon"):
            zone_id = await assign_zone(
                db, field_id, record["location_lon"], record["location_lat"]
            )
            if zone_id:
                record["zone_id"] = zone_id
                zones_assigned += 1

            location_wkt = f"SRID=4326;POINT({record['location_lon']} {record['location_lat']})"
            await db.execute(
                text("""
                    INSERT INTO telemetry_records (
                        id, field_id, machine_id, timestamp, applied_rate_kg_ha,
                        source_format, location, zone_id
                    ) VALUES (
                        gen_random_uuid(), :field_id, :machine_id, :timestamp, :applied_rate_kg_ha,
                        'isobus', ST_GeomFromEWKT(:location), :zone_id
                    )
                """),
                {
                    "field_id": field_id,
                    "machine_id": record["machine_id"],
                    "timestamp": record["timestamp"],
                    "applied_rate_kg_ha": record.get("applied_rate_kg_ha"),
                    "location": location_wkt,
                    "zone_id": record.get("zone_id"),
                },
            )
            imported += 1

    return TelemetryUploadResponse(
        records_parsed=len(records),
        records_imported=imported,
        zones_assigned=zones_assigned,
        field_id=field_id,
        source_format="isobus",
    )
