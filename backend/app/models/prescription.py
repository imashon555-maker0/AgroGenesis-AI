"""Prescription and PrescriptionZone ORM models for VRA plans."""

from uuid import uuid4
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, Integer, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry

from app.database import Base


class Prescription(Base):
    """An AI-generated variable-rate application prescription for a field."""

    __tablename__ = "prescriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)

    # Temporal
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    target_date = Column(DateTime(timezone=True))
    applied_at = Column(DateTime(timezone=True))
    exported_at = Column(DateTime(timezone=True))

    # Prescription parameters
    input_type = Column(String(50), nullable=False)  # 'nitrogen', 'herbicide', etc.

    # AI output
    deepseek_model = Column(String(100))
    deepseek_reasoning = Column(Text)
    prompt_tokens = Column(Integer)
    completion_tokens = Column(Integer)

    # Status
    status = Column(String(20), default="draft")  # 'draft', 'validated', 'applied', 'exported'

    # Summary metrics
    total_estimated_input = Column(Float)  # field-average rate kg/ha
    operator_notes = Column(Text)

    # Relationships
    field = relationship("Field", back_populates="prescriptions")
    zones = relationship("PrescriptionZone", back_populates="prescription", cascade="all, delete-orphan")
    ecofin = relationship("EcoFinRecord", back_populates="prescription", uselist=False)

    def __repr__(self):
        return f"<Prescription {self.input_type} ({self.status})>"


class PrescriptionZone(Base):
    """A per-zone application rate within a prescription."""

    __tablename__ = "prescription_zones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    prescription_id = Column(
        UUID(as_uuid=True), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False
    )
    field_zone_id = Column(UUID(as_uuid=True), ForeignKey("field_zones.id"), nullable=False)

    # Application parameters
    application_rate = Column(Float, nullable=False)  # kg/ha
    rationale = Column(Text)
    zone_label = Column(String(10))

    # Zone geometry snapshot (for export even if zones change)
    geometry = Column(Geometry("MULTIPOLYGON", srid=4326))

    # Relationships
    prescription = relationship("Prescription", back_populates="zones")
    field_zone = relationship("FieldZone", back_populates="prescription_zones")

    def __repr__(self):
        return f"<PrescriptionZone {self.zone_label}: {self.application_rate} kg/ha>"
