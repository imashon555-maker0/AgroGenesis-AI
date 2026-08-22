"""
Zonal statistics computation service.

Computes per-zone aggregated metrics by joining telemetry and vegetation data
using PostGIS spatial queries.
"""

from dataclasses import dataclass
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import uuid


@dataclass
class ZoneStats:
    """Aggregated statistics for a single management zone."""
    zone_id: str
    zone_label: str
    productivity_class: str
    area_ha: Optional[float]
    mean_ndvi: Optional[float]
    mean_ndre: Optional[float]
    mean_speed_kmh: Optional[float]
    mean_fuel_l_ha: Optional[float]
    mean_applied_rate: Optional[float]
    total_telemetry_points: int


async def compute_zone_stats(session: AsyncSession, field_id: str) -> list[ZoneStats]:
    """
    Compute all statistics for each management zone in a field.

    Joins field_zones with telemetry_records and satellite_observations
    to produce comprehensive zone-level metrics.
    """
    result = await session.execute(
        text("""
            WITH zone_telemetry AS (
                SELECT
                    fz.id AS zone_id,
                    fz.zone_label,
                    fz.productivity_class,
                    fz.area_ha,
                    COUNT(t.id) AS telemetry_count,
                    AVG(t.speed_kmh) AS avg_speed,
                    AVG(t.fuel_consumption_l_ha) AS avg_fuel,
                    AVG(t.applied_rate_kg_ha) AS avg_rate,
                    AVG(t.engine_load_pct) AS avg_engine_load
                FROM field_zones fz
                LEFT JOIN telemetry_records t ON t.zone_id = fz.id
                WHERE fz.field_id = :field_id
                GROUP BY fz.id, fz.zone_label, fz.productivity_class, fz.area_ha
            ),
            zone_ndvi AS (
                SELECT
                    fz.id AS zone_id,
                    AVG(so.mean_ndvi) AS avg_ndvi,
                    AVG(so.mean_ndre) AS avg_ndre
                FROM field_zones fz
                LEFT JOIN satellite_observations so ON so.field_id = fz.field_id
                WHERE fz.field_id = :field_id
                GROUP BY fz.id
            )
            SELECT
                zt.zone_id,
                zt.zone_label,
                zt.productivity_class,
                zt.area_ha,
                zt.telemetry_count,
                zt.avg_speed,
                zt.avg_fuel,
                zt.avg_rate,
                zt.avg_engine_load,
                zn.avg_ndvi,
                zn.avg_ndre
            FROM zone_telemetry zt
            LEFT JOIN zone_ndvi zn ON zt.zone_id = zn.zone_id
            ORDER BY zt.zone_label
        """),
        {"field_id": field_id},
    )

    rows = result.fetchall()
    return [
        ZoneStats(
            zone_id=str(r.zone_id),
            zone_label=r.zone_label,
            productivity_class=r.productivity_class,
            area_ha=r.area_ha,
            mean_ndvi=r.avg_ndvi,
            mean_ndre=r.avg_ndre,
            mean_speed_kmh=r.avg_speed,
            mean_fuel_l_ha=r.avg_fuel,
            mean_applied_rate=r.avg_rate,
            total_telemetry_points=r.telemetry_count,
        )
        for r in rows
    ]


async def compute_field_summary(session: AsyncSession, field_id: str) -> dict:
    """
    Compute field-level summary statistics from all zones.
    """
    zones = await compute_zone_stats(session, field_id)

    if not zones:
        return {
            "field_id": field_id,
            "total_area_ha": 0,
            "zone_count": 0,
            "mean_ndvi": None,
            "mean_ndre": None,
        }

    total_area = sum(z.area_ha or 0 for z in zones)
    ndvi_values = [z.mean_ndvi for z in zones if z.mean_ndvi is not None]
    ndre_values = [z.mean_ndre for z in zones if z.mean_ndre is not None]

    return {
        "field_id": field_id,
        "total_area_ha": total_area,
        "zone_count": len(zones),
        "mean_ndvi": sum(ndvi_values) / len(ndvi_values) if ndvi_values else None,
        "mean_ndre": sum(ndre_values) / len(ndre_values) if ndre_values else None,
        "zones": [
            {
                "zone_label": z.zone_label,
                "productivity_class": z.productivity_class,
                "area_ha": z.area_ha,
                "mean_ndvi": z.mean_ndvi,
                "telemetry_points": z.total_telemetry_points,
            }
            for z in zones
        ],
    }
