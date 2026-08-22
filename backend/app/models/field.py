"""Field and FieldZone ORM models."""

from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.database import Base


class Field(Base):
    """Represents a farm field with its geographic boundary."""

    __tablename__ = "fields"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False, index=True)
    geometry = Column(Geometry("POLYGON", srid=4326), nullable=False)
    soil_type = Column(String(100))
    crop_type = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    zones = relationship("FieldZone", back_populates="field", cascade="all, delete-orphan")
    telemetry_records = relationship("TelemetryRecord", back_populates="field", cascade="all, delete-orphan")
    observations = relationship("SatelliteObservation", back_populates="field", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="field", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Field {self.name} ({self.id})>"


class FieldZone(Base):
    """A management zone within a field for variable-rate application."""

    __tablename__ = "field_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)
    zone_index = Column(Integer, nullable=False)
    zone_label = Column(String(10), nullable=False)  # 'A', 'B', 'C', 'D'
    geometry = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=False)
    productivity_class = Column(String(20), nullable=False)  # 'high', 'medium', 'low'
    area_ha = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    field = relationship("Field", back_populates="zones")
    telemetry_records = relationship("TelemetryRecord", back_populates="zone")
    prescription_zones = relationship("PrescriptionZone", back_populates="field_zone")

    def __repr__(self):
        return f"<FieldZone {self.zone_label} ({self.productivity_class})>"
