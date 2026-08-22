"""EcoFinRecord ORM model for ecological-financial analysis."""

from uuid import uuid4
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class EcoFinRecord(Base):
    """Ecological-financial analysis record for a prescription."""

    __tablename__ = "ecofin_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    prescription_id = Column(UUID(as_uuid=True), ForeignKey("prescriptions.id"), nullable=False)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id"), nullable=False)

    # Season identification
    season = Column(String(10), nullable=False)  # '2026-S1', '2026-S2'

    # Input optimization
    baseline_n_rate_kg_ha = Column(Float)
    optimized_n_rate_kg_ha = Column(Float)
    reduced_n_rate_pct = Column(Float)
    fuel_savings_pct = Column(Float)
    fuel_saved_liters = Column(Float)

    # Carbon accounting (IPCC Tier 1)
    n2o_ef = Column(Float)  # emission factor (0.01)
    n2o_avoided_kg = Column(Float)
    n2o_avoided_tco2e = Column(Float)
    manufacturing_offset_tco2e = Column(Float)
    total_carbon_tco2e = Column(Float)

    # Financial
    fertilizer_cost_saving_usd = Column(Float)
    fuel_cost_saving_usd = Column(Float)
    carbon_credit_revenue_usd = Column(Float)
    total_cost_saving_usd = Column(Float)
    net_benefit_usd_ha = Column(Float)

    # Methodology
    carbon_price_usd_per_ton = Column(Float, default=15.0)
    ets_framework = Column(String(50), default="KAZ-ETS")
    methodology_notes = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    prescription = relationship("Prescription", back_populates="ecofin")

    def __repr__(self):
        return f"<EcoFinRecord {self.season}: {self.net_benefit_usd_ha} $/ha>"
