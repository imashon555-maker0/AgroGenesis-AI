"""Pydantic schemas for Field and FieldZone."""

from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
import uuid


class FieldCreate(BaseModel):
    """Request schema to create a new field."""
    name: str = Field(..., min_length=1, max_length=255, description="Field name")
    geometry: dict = Field(..., description="GeoJSON Polygon geometry")
    soil_type: Optional[str] = Field(None, max_length=100)
    crop_type: Optional[str] = Field(None, max_length=100)


class FieldZoneResponse(BaseModel):
    """Response schema for a management zone."""
    id: uuid.UUID
    zone_index: int
    zone_label: str
    productivity_class: str
    area_ha: Optional[float] = None
    mean_ndvi: Optional[float] = None
    mean_ndre: Optional[float] = None

    class Config:
        from_attributes = True


class FieldResponse(BaseModel):
    """Response schema for a field with all details."""
    id: uuid.UUID
    name: str
    geometry: dict  # GeoJSON
    area_ha: Optional[float] = None
    soil_type: Optional[str] = None
    crop_type: Optional[str] = None
    zones: list[FieldZoneResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FieldListResponse(BaseModel):
    """Response schema for listing fields."""
    fields: list[FieldResponse]
    total: int


class FieldZoneCreate(BaseModel):
    """Request schema to create a zone within a field."""
    zone_index: int
    zone_label: str = Field(..., max_length=10)
    geometry: dict  # GeoJSON MultiPolygon
    productivity_class: str = Field(..., pattern="^(high|medium|low)$")
    area_ha: Optional[float] = None
