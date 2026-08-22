"""Pydantic schemas for Telemetry data."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class TelemetryRecordResponse(BaseModel):
    """Response schema for a single telemetry record."""
    id: uuid.UUID
    field_id: uuid.UUID
    machine_id: str
    machine_brand: Optional[str] = None
    timestamp: datetime
    speed_kmh: Optional[float] = None
    fuel_rate_l_h: Optional[float] = None
    fuel_consumption_l_ha: Optional[float] = None
    wheel_slip_pct: Optional[float] = None
    engine_load_pct: Optional[float] = None
    engine_rpm: Optional[float] = None
    applied_rate_kg_ha: Optional[float] = None
    source_format: str
    zone_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True


class TelemetryStats(BaseModel):
    """Aggregated telemetry statistics for a field or zone."""
    zone_label: str
    zone_id: Optional[uuid.UUID] = None
    productivity_class: str
    area_ha: Optional[float] = None
    record_count: int
    avg_speed_kmh: Optional[float] = None
    avg_fuel_l_ha: Optional[float] = None
    avg_engine_load_pct: Optional[float] = None
    avg_applied_rate_kg_ha: Optional[float] = None
    mean_ndvi: Optional[float] = None
    mean_ndre: Optional[float] = None


class TelemetryUploadResponse(BaseModel):
    """Response after uploading telemetry data."""
    records_parsed: int
    records_imported: int
    zones_assigned: int
    field_id: uuid.UUID
    source_format: str
