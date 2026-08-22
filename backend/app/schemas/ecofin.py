"""Pydantic schemas for EcoFin (Ecological-Financial) analysis."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class CarbonAccounting(BaseModel):
    """Carbon accounting breakdown."""
    baseline_n_rate_kg_ha: float
    optimized_n_rate_kg_ha: float
    n_savings_kg_ha: float
    n_savings_pct: float
    n2o_avoided_kg_ha: float
    n2o_avoided_tco2e_ha: float
    manufacturing_offset_tco2e_ha: float
    total_carbon_tco2e_ha: float


class FinancialBreakdown(BaseModel):
    """Financial impact breakdown."""
    fertilizer_cost_saving_usd: float
    fuel_cost_saving_usd: float
    carbon_credit_revenue_usd: float
    total_cost_saving_usd: float
    net_benefit_usd_ha: float
    total_net_benefit_usd: float  # net_benefit_usd_ha * total_area_ha


class EcoFinSummaryResponse(BaseModel):
    """Summary EcoFin response."""
    id: Optional[uuid.UUID] = None
    prescription_id: uuid.UUID
    field_id: uuid.UUID
    season: str
    carbon: CarbonAccounting
    financial: FinancialBreakdown
    ets_framework: str
    carbon_price_usd_per_ton: float
    methodology_notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EcoFinFullResponse(BaseModel):
    """Full EcoFin response with per-zone breakdown."""
    summary: EcoFinSummaryResponse
    zone_details: list["EcoFinZoneDetail"] = []


class EcoFinZoneDetail(BaseModel):
    """EcoFin detail for a single zone."""
    zone_label: str
    area_ha: float
    baseline_rate: float
    optimized_rate: float
    cost_saving_usd: float
    carbon_tco2e: float


# Forward reference resolution
EcoFinFullResponse.model_rebuild()
