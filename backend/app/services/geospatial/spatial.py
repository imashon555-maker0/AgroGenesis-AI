"""
PostGIS spatial query utilities.

Provides common spatial operations for field management, zone assignment,
and geospatial data retrieval.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def get_field_geometry(session: AsyncSession, field_id: str) -> Optional[dict]:
    """Get field geometry as GeoJSON."""
    result = await session.execute(
        text("""
            SELECT ST_AsGeoJSON(geometry)::json AS geometry
            FROM fields
            WHERE id = :field_id
        """),
        {"field_id": field_id},
    )
    row = result.fetchone()
    return row[0] if row else None


async def get_zone_geometries(session: AsyncSession, field_id: str) -> list[dict]:
    """Get all zone geometries as GeoJSON features."""
    result = await session.execute(
        text("""
            SELECT
                id,
                zone_index,
                zone_label,
                productivity_class,
                area_ha,
                ST_AsGeoJSON(geometry)::json AS geometry
            FROM field_zones
            WHERE field_id = :field_id
            ORDER BY zone_index
        """),
        {"field_id": field_id},
    )

    rows = result.fetchall()
    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "id": str(r.id),
            "geometry": r.geometry,
            "properties": {
                "zone_index": r.zone_index,
                "zone_label": r.zone_label,
                "productivity_class": r.productivity_class,
                "area_ha": r.area_ha,
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


async def get_telemetry_geojson(session: AsyncSession, field_id: str, limit: int = 1000) -> dict:
    """Get telemetry locations as GeoJSON for map visualization."""
    result = await session.execute(
        text("""
            SELECT
                id,
                machine_id,
                timestamp,
                speed_kmh,
                fuel_consumption_l_ha,
                applied_rate_kg_ha,
                ST_AsGeoJSON(location)::json AS geometry
            FROM telemetry_records
            WHERE field_id = :field_id
            AND location IS NOT NULL
            ORDER BY timestamp
            LIMIT :limit
        """),
        {"field_id": field_id, "limit": limit},
    )

    rows = result.fetchall()
    features = []
    for r in rows:
        features.append({
            "type": "Feature",
            "geometry": r.geometry,
            "properties": {
                "id": str(r.id),
                "machine_id": r.machine_id,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "speed_kmh": r.speed_kmh,
                "fuel_l_ha": r.fuel_consumption_l_ha,
                "applied_rate": r.applied_rate_kg_ha,
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


async def compute_field_area(session: AsyncSession, field_id: str) -> Optional[float]:
    """Compute field area in hectares using PostGIS."""
    result = await session.execute(
        text("""
            SELECT ST_Area(geometry::geography) / 10000.0 AS area_ha
            FROM fields
            WHERE id = :field_id
        """),
        {"field_id": field_id},
    )
    row = result.fetchone()
    return float(row[0]) if row else None


async def find_nearest_field(session: AsyncSession, lon: float, lat: float) -> Optional[str]:
    """Find the nearest field to a GPS coordinate."""
    result = await session.execute(
        text("""
            SELECT id::text, ST_Distance(
                geometry::geography,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
            ) AS distance
            FROM fields
            ORDER BY distance
            LIMIT 1
        """),
        {"lon": lon, "lat": lat},
    )
    row = result.fetchone()
    return row[0] if row else None
