"""Prescription API routes."""

import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.api.deps import get_db
from app.models.prescription import Prescription, PrescriptionZone
from app.models.field import Field, FieldZone
from app.schemas.prescription import PrescriptionResponse, PrescriptionZoneDetail, PrescriptionListResponse
from app.schemas.ecofin import EcoFinSummaryResponse, CarbonAccounting, FinancialBreakdown
from app.core.exceptions import not_found
from app.services.ai.prescription import generate_vra_prescription
from app.services.geospatial.zonal_stats import compute_zone_stats
from app.services.ecofin.cost import compute_ecofin
from app.config import get_settings

router = APIRouter()


@router.get("/{field_id}", response_model=PrescriptionListResponse)
async def list_prescriptions(field_id: str, db: AsyncSession = Depends(get_db)):
    """List all prescriptions for a field."""
    result = await db.execute(
        select(Prescription)
        .where(Prescription.field_id == field_id)
        .order_by(Prescription.created_at.desc())
    )
    prescriptions = result.scalars().all()

    return PrescriptionListResponse(
        prescriptions=[PrescriptionResponse.model_validate(p) for p in prescriptions],
        total=len(prescriptions),
    )


@router.post("/{field_id}/generate", response_model=PrescriptionResponse)
async def generate_prescription(
    field_id: str,
    input_type: str = "nitrogen",
    db: AsyncSession = Depends(get_db),
):
    """
    AI-generate a variable-rate application prescription for a field.

    Uses DeepSeek V4 Pro to compute optimal per-zone application rates.
    """
    # Verify field exists
    result = await db.execute(
        select(Field).where(Field.id == field_id)
    )
    field = result.scalar_one_or_none()
    if not field:
        raise not_found(f"Field {field_id} not found")

    # Compute zone statistics
    zone_stats = await compute_zone_stats(db, field_id)

    # Call DeepSeek V4 for prescription generation
    ai_prescription = await generate_vra_prescription(
        field_name=field.name,
        zone_stats=[
            {
                "zone_label": z.zone_label,
                "zone_id": z.zone_id,
                "productivity_class": z.productivity_class,
                "area_ha": z.area_ha,
                "mean_ndvi": z.mean_ndvi,
                "mean_ndre": z.mean_ndre,
            }
            for z in zone_stats
        ],
        diagnosis=None,
        yield_history=[],
        input_type=input_type,
    )

    # Create prescription record
    prescription = Prescription(
        field_id=field_id,
        input_type=ai_prescription.input_type,
        deepseek_model=ai_prescription.model_used,
        deepseek_reasoning=ai_prescription.reasoning,
        total_estimated_input=ai_prescription.total_estimated_input,
        operator_notes=ai_prescription.operator_notes,
        status="draft",
    )
    db.add(prescription)
    await db.flush()

    # Create prescription zones
    prescription_zones = []
    for zone in ai_prescription.zones:
        # Find matching field zone
        matching_zone = next(
            (z for z in zone_stats if z.zone_label == zone.zone_label),
            None,
        )

        pz = PrescriptionZone(
            prescription_id=prescription.id,
            field_zone_id=matching_zone.zone_id if matching_zone else zone_stats[0].zone_id,
            application_rate=zone.application_rate,
            rationale=zone.rationale,
            zone_label=zone.zone_label,
        )
        db.add(pz)
        prescription_zones.append(pz)

    await db.flush()

    # Compute EcoFin analysis
    settings = get_settings()
    zone_areas = {z.zone_label: (z.area_ha or 10.0) for z in zone_stats}
    total_area = sum(zone_areas.values())
    optimized_rates = {z.zone_label: z.application_rate for z in ai_prescription.zones}

    ecofin = compute_ecofin(
        baseline_n_rate=180.0,
        optimized_rates=optimized_rates,
        zone_areas=zone_areas,
        total_area=total_area,
    )

    return PrescriptionResponse(
        id=prescription.id,
        field_id=field_id,
        input_type=ai_prescription.input_type,
        status="draft",
        created_at=prescription.created_at,
        zones=[
            PrescriptionZoneDetail(
                zone_label=z.zone_label,
                application_rate=z.application_rate,
                rationale=z.rationale,
            )
            for z in ai_prescription.zones
        ],
        total_estimated_input=ai_prescription.total_estimated_input,
        operator_notes=ai_prescription.operator_notes,
        deepseek_model=ai_prescription.model_used,
        deepseek_reasoning=ai_prescription.reasoning,
        ecofin=EcoFinSummaryResponse(
            prescription_id=prescription.id,
            field_id=field_id,
            season="2026-S1",
            carbon=CarbonAccounting(**ecofin.carbon.to_dict()),
            financial=FinancialBreakdown(**ecofin.financial.to_dict()),
            ets_framework=ecofin.ets_framework,
            carbon_price_usd_per_ton=ecofin.carbon_price_usd_per_ton,
        ),
    )


@router.get("/detail/{prescription_id}", response_model=PrescriptionResponse)
async def get_prescription(prescription_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific prescription with all details."""
    result = await db.execute(
        select(Prescription).where(Prescription.id == prescription_id)
    )
    prescription = result.scalar_one_or_none()
    if not prescription:
        raise not_found(f"Prescription {prescription_id} not found")

    return PrescriptionResponse.model_validate(prescription)
