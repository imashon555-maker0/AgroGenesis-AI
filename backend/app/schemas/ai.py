"""Pydantic schemas for AI (DeepSeek) requests and responses."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class DiagnosisRequest(BaseModel):
    """Request schema for crop image diagnosis."""
    field_id: uuid.UUID
    image_base64: str = Field(..., description="Base64-encoded image")
    context: Optional[str] = Field(None, description="Additional context about the image")
    capture_date: Optional[datetime] = None


class DiagnosisResponse(BaseModel):
    """Response schema for crop image diagnosis."""
    condition: str = Field(
        ...,
        description="Detected condition",
        pattern="^(healthy|nitrogen_deficiency|phosphorus_deficiency|potassium_deficiency|"
                "fungal_infection|pest_damage|weed_infestation|water_stress|hail_damage|mixed)$",
    )
    confidence: float = Field(..., ge=0, le=1)
    severity: str = Field(..., pattern="^(mild|moderate|severe)$")
    description: str
    affected_areas: list[str] = []
    recommended_action: str
    model_used: str
    raw_response: Optional[dict] = None


class PrescriptionGenerateRequest(BaseModel):
    """Request schema for AI prescription generation."""
    field_id: uuid.UUID
    input_type: str = Field(
        default="nitrogen",
        pattern="^(nitrogen|potassium|phosphorus|herbicide|fungicide)$",
    )
    diagnosis_id: Optional[uuid.UUID] = Field(
        None, description="Optional prior diagnosis to incorporate"
    )


class PrescriptionGenerateResponse(BaseModel):
    """Response after AI generates a prescription."""
    prescription_id: uuid.UUID
    input_type: str
    zones: list[dict]
    total_estimated_input: float
    operator_notes: str
    economic_note: Optional[str] = None
    model_used: str
    reasoning: str
    ecofin_summary: Optional[dict] = None
