"""Field management API routes."""

import json
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload

from app.api.deps import get_db
from app.models.field import Field, FieldZone
from app.schemas.field import FieldCreate, FieldResponse, FieldListResponse, FieldZoneResponse
from app.core.exceptions import not_found
from app.services.geospatial.spatial import get_zone_geometries, compute_field_area

router = APIRouter()


@router.get("", response_model=FieldListResponse)
async def list_fields(db: AsyncSession = Depends(get_db)):
    """List all fields."""
    result = await db.execute(
        select(Field).options(selectinload(Field.zones)).order_by(Field.created_at.desc())
    )
    fields = result.scalars().all()

    return FieldListResponse(
        fields=[FieldResponse.model_validate(f) for f in fields],
        total=len(fields),
    )


@router.post("", response_model=FieldResponse, status_code=201)
async def create_field(data: FieldCreate, db: AsyncSession = Depends(get_db)):
    """Create a new field with a GeoJSON boundary."""
    # Store geometry as WKT via PostGIS
    geometry_json = json.dumps(data.geometry)

    field = Field(
        name=data.name,
        soil_type=data.soil_type,
        crop_type=data.crop_type,
    )

    # Use raw SQL to set geometry
    db.add(field)
    await db.flush()

    await db.execute(
        text("""
            UPDATE fields
            SET geometry = ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)
            WHERE id = :field_id
        """),
        {"geojson": geometry_json, "field_id": str(field.id)},
    )

    await db.refresh(field)
    return FieldResponse.model_validate(field)


@router.get("/{field_id}", response_model=FieldResponse)
async def get_field(field_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific field with zones."""
    result = await db.execute(
        select(Field)
        .options(selectinload(Field.zones))
        .where(Field.id == field_id)
    )
    field = result.scalar_one_or_none()
    if not field:
        raise not_found(f"Field {field_id} not found")

    # Get geometry as GeoJSON
    geo_result = await db.execute(
        text("SELECT ST_AsGeoJSON(geometry)::text FROM fields WHERE id = :id"),
        {"id": field_id},
    )
    geo_row = geo_result.fetchone()

    response = FieldResponse.model_validate(field)
    if geo_row:
        response.geometry = json.loads(geo_row[0])

    return response


@router.get("/{field_id}/zones/geojson")
async def get_field_zones_geojson(field_id: str, db: AsyncSession = Depends(get_db)):
    """Get zone geometries as GeoJSON FeatureCollection."""
    return await get_zone_geometries(db, field_id)


@router.post("/{field_id}/zones", response_model=FieldZoneResponse, status_code=201)
async def create_zone(field_id: str, data: dict, db: AsyncSession = Depends(get_db)):
    """Create a management zone within a field."""
    # Verify field exists
    result = await db.execute(select(Field).where(Field.id == field_id))
    if not result.scalar_one_or_none():
        raise not_found(f"Field {field_id} not found")

    zone = FieldZone(
        field_id=field_id,
        zone_index=data["zone_index"],
        zone_label=data["zone_label"],
        productivity_class=data["productivity_class"],
        area_ha=data.get("area_ha"),
    )
    db.add(zone)
    await db.flush()

    # Set geometry
    geojson = json.dumps(data["geometry"])
    await db.execute(
        text("""
            UPDATE field_zones
            SET geometry = ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)
            WHERE id = :zone_id
        """),
        {"geojson": geojson, "zone_id": str(zone.id)},
    )

    await db.refresh(zone)
    return FieldZoneResponse.model_validate(zone)
