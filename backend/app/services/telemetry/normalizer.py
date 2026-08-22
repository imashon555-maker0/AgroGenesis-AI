"""
Telemetry normalizer.

Unifies J1939 and ISOBUS records into the canonical TelemetryRecord schema.
Handles unit conversions and spatial zone assignment via PostGIS.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.services.telemetry.j1939_parser import J1939Record


def normalize_j1939_record(record: J1939Record, field_id: str) -> dict:
    """
    Convert a J1939Record to a dict compatible with TelemetryRecord model.

    Handles unit conversions and missing field computation.
    """
    # Compute fuel consumption in L/ha from speed and fuel rate
    fuel_l_ha = record.fuel_consumption_l_ha
    if fuel_l_ha is None and record.fuel_rate_l_h and record.speed_kmh and record.speed_kmh > 0.5:
        # fuel_rate (L/h) / speed (km/h) ≈ L/km, then convert to L/ha
        # This is an approximation; real conversion needs swath width
        fuel_l_ha = record.fuel_rate_l_h / record.speed_kmh

    # Build location WKT if coordinates available
    location_wkt = None
    if record.location_lon is not None and record.location_lat is not None:
        if -180 <= record.location_lon <= 180 and -90 <= record.location_lat <= 90:
            location_wkt = f"SRID=4326;POINT({record.location_lon} {record.location_lat})"

    return {
        "field_id": field_id,
        "machine_id": record.machine_id,
        "timestamp": record.timestamp,
        "speed_kmh": _clamp(record.speed_kmh, 0, 60),
        "fuel_rate_l_h": _clamp(record.fuel_rate_l_h, 0, 200),
        "fuel_consumption_l_ha": _clamp(fuel_l_ha, 0, 50),
        "wheel_slip_pct": _clamp(record.wheel_slip_pct, -10, 50),
        "engine_load_pct": _clamp(record.engine_load_pct, 0, 100),
        "engine_rpm": _clamp(record.engine_rpm, 0, 3000),
        "applied_rate_kg_ha": _clamp(record.applied_rate_kg_ha, 0, 500),
        "source_format": "j1939",
        "pgn_code": record.pgn,
        "location": location_wkt,
    }


async def assign_zone(session: AsyncSession, field_id: str, lon: float, lat: float) -> Optional[str]:
    """
    Find which management zone a GPS point falls in using PostGIS ST_Within.

    Returns the zone UUID as string, or None if point is outside all zones.
    """
    if not (-180 <= lon <= 180 and -90 <= lat <= 90):
        return None

    result = await session.execute(
        text("""
            SELECT id::text FROM field_zones
            WHERE field_id = :field_id
            AND ST_Within(
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                geometry
            )
            LIMIT 1
        """),
        {"field_id": field_id, "lon": lon, "lat": lat},
    )
    row = result.fetchone()
    return row[0] if row else None


async def assign_zones_batch(
    session: AsyncSession, field_id: str, records: list[dict]
) -> tuple[int, dict[str, int]]:
    """
    Assign zones to a batch of telemetry records.

    Returns (total_assigned, zone_distribution).
    """
    zone_counts: dict[str, int] = {}
    total_assigned = 0

    for record in records:
        lat = record.get("location_lat")
        lon = record.get("location_lon")
        if lat and lon:
            zone_id = await assign_zone(session, field_id, lon, lat)
            if zone_id:
                record["zone_id"] = zone_id
                zone_counts[zone_id] = zone_counts.get(zone_id, 0) + 1
                total_assigned += 1

    return total_assigned, zone_counts


def normalize_isobus_records(isobus_records: list[dict], field_id: str) -> list[dict]:
    """
    Normalize ISOBUS records (already partially processed by isobus_parser).
    Adds missing fields and validates data.
    """
    normalized = []
    for record in isobus_records:
        location_wkt = None
        lat = record.get("location_lat")
        lon = record.get("location_lon")
        if lat and lon and -180 <= lon <= 180 and -90 <= lat <= 90:
            location_wkt = f"SRID=4326;POINT({lon} {lat})"

        normalized.append({
            "field_id": field_id,
            "machine_id": record.get("machine_id", "ISOBUS-unknown"),
            "timestamp": record.get("timestamp"),
            "speed_kmh": None,
            "fuel_rate_l_h": None,
            "fuel_consumption_l_ha": None,
            "wheel_slip_pct": None,
            "engine_load_pct": None,
            "engine_rpm": None,
            "applied_rate_kg_ha": record.get("applied_rate_kg_ha"),
            "source_format": "isobus",
            "pgn_code": None,
            "location": location_wkt,
        })

    return normalized


def _clamp(value: Optional[float], min_val: float, max_val: float) -> Optional[float]:
    """Clamp a value to a valid range, returning None for None inputs."""
    if value is None:
        return None
    return max(min_val, min(max_val, value))
