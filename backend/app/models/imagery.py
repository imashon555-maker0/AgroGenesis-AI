"""SatelliteObservation ORM model for multispectral imagery."""

from uuid import uuid4
from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Date, LargeBinary, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class SatelliteObservation(Base):
    """A satellite or drone imagery observation with vegetation indices."""

    __tablename__ = "satellite_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    field_id = Column(UUID(as_uuid=True), ForeignKey("fields.id", ondelete="CASCADE"), nullable=False)

    # Temporal
    capture_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Source
    source = Column(String(50), nullable=False)  # 'sentinel2-l2a', 'drone-mosaic'
    cloud_cover_pct = Column(Float)

    # Vegetation indices (pre-computed for fast queries)
    mean_ndvi = Column(Float)
    std_ndvi = Column(Float)
    mean_ndre = Column(Float)
    std_ndre = Column(Float)

    # Raster data (stored as binary for simplicity; in production use object storage)
    ndvi_raster = Column(LargeBinary)
    ndre_raster = Column(LargeBinary)

    # Relationships
    field = relationship("Field", back_populates="observations")

    def __repr__(self):
        return f"<SatelliteObservation {self.source} @ {self.capture_date}>"
