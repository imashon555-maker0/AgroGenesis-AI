"""Pydantic schemas for Prescriptions."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class PrescriptionZoneDetail(BaseModel):
    """A single zone's prescription details."""
    zone_id: Optional[uuid.UUID] = None
    zone_label: str
    application_rate: float = Field(..., ge=0, description="Application rate in kg/ha")
    rationale: Optional[str] = None


class PrescriptionCreate(BaseModel):
    """Request schema to generate a new prescription."""
    field_id: uuid.UUID
    input_type: str = Field(
        default="nitrogen",
        pattern="^(nitrogen|potassium|phosphorus|herbicide|fungicide)$",
    )
    target_date: Optional[datetime] = None


class PrescriptionResponse(BaseModel):
    """Response schema for a prescription with all details."""
    id: uuid.UUID
    field_id: uuid.UUID
    input_type: str
    status: str
    created_at: datetime
    target_date: Optional[datetime] = None

    # Prescription details
    zones: list[PrescriptionZoneDetail] = []
    total_estimated_input: Optional[float] = None
    operator_notes: Optional[str] = None

    # AI metadata
    deepseek_model: Optional[str] = None
    deepseek_reasoning: Optional[str] = None

    # EcoFin summary (if computed)
    ecofin: Optional["EcoFinSummaryResponse"] = None

    class Config:
        from_attributes = True


class PrescriptionListResponse(BaseModel):
    """Response schema for listing prescriptions."""
    prescriptions: list[PrescriptionResponse]
    total: int


# Forward reference resolution
from app.schemas.ecofin import EcoFinSummaryResponse
PrescriptionResponse.model_rebuild()
