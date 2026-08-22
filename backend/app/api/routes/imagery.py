"""Imagery analysis API routes."""

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.field import Field
from app.models.imagery import SatelliteObservation
from app.schemas.ai import DiagnosisRequest, DiagnosisResponse
from app.services.ai.vision import diagnose_crop_image
from app.services.geospatial.veg_indices import compute_vegetation_indices, compute_zone_vegetation_stats
from app.core.exceptions import not_found

router = APIRouter()


@router.post("/analyze/{field_id}")
async def analyze_field_imagery(
    field_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Run NDVI/NDRE analysis on a field using synthetic or uploaded imagery.
    Returns vegetation indices and per-zone statistics.
    """
    # Verify field exists
    result = await db.execute(select(Field).where(Field.id == field_id))
    field = result.scalar_one_or_none()
    if not field:
        raise not_found(f"Field {field_id} not found")

    # Compute vegetation indices (using synthetic data for MVP)
    vi_result = compute_vegetation_indices(use_synthetic=True)

    # Get zone geometries for zonal stats
    zone_result = await db.execute(
        select("id", "zone_label", "productivity_class", "area_ha")
        .select_from("field_zones")
        .where("field_id = :field_id")
        .params(field_id=field_id)
    )

    # Compute zone-level vegetation stats
    zone_stats = compute_zone_vegetation_stats(
        vi_result,
        zone_geometries=[],
        field_bounds=(69.18, 43.18, 69.22, 43.22),
    )

    # Store observation
    observation = SatelliteObservation(
        field_id=field_id,
        source="synthetic-sentinel2",
        mean_ndvi=vi_result.mean_ndvi,
        std_ndvi=vi_result.std_ndvi,
        mean_ndre=vi_result.mean_ndre,
        std_ndre=vi_result.std_ndre,
        cloud_cover_pct=0.0,
    )
    db.add(observation)

    return {
        "field_id": field_id,
        "source": "synthetic-sentinel2",
        "vegetation_indices": {
            "ndvi": {
                "mean": round(vi_result.mean_ndvi, 4),
                "std": round(vi_result.std_ndvi, 4),
                "class_fractions": vi_result.ndvi_class_fractions,
            },
            "ndre": {
                "mean": round(vi_result.mean_ndre, 4),
                "std": round(vi_result.std_ndre, 4),
                "class_fractions": vi_result.ndre_class_fractions,
            },
        },
        "zone_stats": zone_stats,
        "observation_id": str(observation.id),
    }


@router.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose_image(request: DiagnosisRequest):
    """
    Analyze a crop image for health issues using DeepSeek V4 Vision.

    Upload a drone RGB or leaf-level photograph for AI-powered diagnosis.
    """
    diagnosis = await diagnose_crop_image(
        image_base64=request.image_base64,
        context=request.context or "",
        zone_stats=[],
    )

    return DiagnosisResponse(
        condition=diagnosis.condition,
        confidence=diagnosis.confidence,
        severity=diagnosis.severity,
        description=diagnosis.description,
        affected_areas=diagnosis.affected_areas,
        recommended_action=diagnosis.recommended_action,
        model_used=diagnosis.model_used,
        raw_response=diagnosis.raw_response,
    )
