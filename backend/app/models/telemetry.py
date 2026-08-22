"""TelemetryRecord ORM model for machinery data."""

from uuid import uuid4
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.database import Base


class TelemetryRecord(Base):
    """A single telemetry data point from a farm machine."""

    __tablename__ = "telemetry_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    zone_id = Column(UUID(as_uuid=True), ForeignKey("field_zones.id"), nullable=True)

    # Machine identification
    machine_id = Column(String(100), nullable=False, index=True)
    machine_brand = Column(String(50))  # John Deere, Case IH, etc.

    # Temporal
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)

    # Machine parameters
    speed_kmh = Column(Float)
    fuel_rate_l_h = Column(Float)  # liters per hour
    fuel_consumption_l_ha = Column(Float)  # liters per hectare
    wheel_slip_pct = Column(Float)
    engine_load_pct = Column(Float)
    engine_rpm = Column(Float)

    # Application data
    applied_rate_kg_ha = Column(Float)  # chemical application rate
    swath_width_m = Column(Float)

    # Source metadata
    source_format = Column(String(20), nullable=False)  # 'j1939', 'isobus'
    pgn_code = Column(Integer)  # J1939 Parameter Group Number

    # Geospatial
    location = Column(Geometry("POINT", srid=4326))

    # Relationships
    field = relationship("Field", back_populates="telemetry_records")
    zone = relationship("FieldZone", back_populates="telemetry_records")

    def __repr__(self):
        return f"<TelemetryRecord {self.machine_id} @ {self.timestamp}>"
