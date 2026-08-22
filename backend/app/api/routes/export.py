"""Export API routes for ISOBUS XML and Shapefile downloads."""

import json
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.api.deps import get_db
from app.models.prescription import Prescription, PrescriptionZone
from app.core.exceptions import not_found
from app.services.output.isobus_xml import generate_taskdata_xml, validate_taskdata_xml
from app.services.output.shapefile import generate_prescription_shapefile

router = APIRouter()


@router.get("/{prescription_id}/isobus")
async def export_isobus_xml(
    prescription_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Export prescription as ISO 11783 TASKDATA.XML file."""
    # Get prescription
    result = await db.execute(
        select(Prescription).where(Prescription.id == prescription_id)
    )
    prescription = result.scalar_one_or_none()
    if not prescription:
        raise not_found(f"Prescription {prescription_id} not found")

    # Get prescription zones
    zones_result = await db.execute(
        select(PrescriptionZone).where(PrescriptionZone.prescription_id == prescription_id)
    )
    zones = zones_result.scalars().all()

    # Build zone data for XML generator
    zone_data = []
    for zone in zones:
        zone_dict = {
            "zone_label": zone.zone_label or "?",
            "application_rate": zone.application_rate,
            "boundary_points": [],
        }

        # Extract boundary points from zone geometry if available
        if zone.geometry:
            geo_result = await db.execute(
                text("SELECT ST_AsGeoJSON(:geom)::text"),
                {"geom": zone.geometry},
            )
            geo_row = geo_result.fetchone()
            if geo_row:
                geojson = json.loads(geo_row[0])
                if geojson.get("type") == "MultiPolygon":
                    # Extract coordinates from first polygon
                    coords = geojson["coordinates"][0][0]
                    zone_dict["boundary_points"] = [
                        {"lon": c[0], "lat": c[1]} for c in coords[:10]  # Limit to 10 points
                    ]

        zone_data.append(zone_dict)

    # Get field name
    field_result = await db.execute(
        text("SELECT name FROM fields WHERE id = :id"),
        {"id": prescription.field_id},
    )
    field_row = field_result.fetchone()
    field_name = field_row[0] if field_row else "Unknown Field"

    # Generate XML
    xml_content = generate_taskdata_xml(
        prescription_id=prescription_id,
        field_name=field_name,
        input_type=prescription.input_type,
        zones=zone_data,
    )

    # Validate
    is_valid, errors = validate_taskdata_xml(xml_content)
    if not is_valid:
        return Response(
            content=json.dumps({"error": "XML validation failed", "details": errors}),
            status_code=500,
            media_type="application/json",
        )

    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={
            "Content-Disposition": f'attachment; filename="TASKDATA_{prescription_id[:8]}.xml"'
        },
    )


@router.get("/{prescription_id}/shapefile")
async def export_shapefile(
    prescription_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Export prescription as ESRI Shapefile (ZIP)."""
    # Get prescription
    result = await db.execute(
        select(Prescription).where(Prescription.id == prescription_id)
    )
    prescription = result.scalar_one_or_none()
    if not prescription:
        raise not_found(f"Prescription {prescription_id} not found")

    # Get prescription zones with geometries
    zones_result = await db.execute(
        select(PrescriptionZone).where(PrescriptionZone.prescription_id == prescription_id)
    )
    zones = zones_result.scalars().all()

    zone_data = []
    for zone in zones:
        zone_dict = {
            "zone_label": zone.zone_label or "?",
            "zone_index": 0,
            "application_rate": zone.application_rate,
            "rationale": zone.rationale or "",
            "geometry": None,
        }

        if zone.geometry:
            geo_result = await db.execute(
                text("SELECT ST_AsGeoJSON(:geom)::text"),
                {"geom": zone.geometry},
            )
            geo_row = geo_result.fetchone()
            if geo_row:
                zone_dict["geometry"] = json.loads(geo_row[0])

        zone_data.append(zone_dict)

    # Generate shapefile
    try:
        shp_bytes = generate_prescription_shapefile(
            zones=zone_data,
            input_type=prescription.input_type,
            prescription_id=prescription_id,
        )
    except ValueError as e:
        return Response(
            content=json.dumps({"error": str(e)}),
            status_code=400,
            media_type="application/json",
        )

    return Response(
        content=shp_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="prescription_{prescription_id[:8]}.zip"'
        },
    )
