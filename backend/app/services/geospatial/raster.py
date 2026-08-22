"""
Raster processing utilities for multispectral satellite imagery.

Handles Sentinel-2 band loading, band math, and raster output generation.
"""

import numpy as np
import rasterio
from rasterio.transform import from_bounds
from rasterio.crs import CRS
from pathlib import Path
from typing import Optional, NamedTuple
import io


class RasterData(NamedTuple):
    """Container for loaded raster data."""
    data: np.ndarray
    transform: object
    crs: CRS
    profile: dict
    bounds: tuple


def load_raster(file_path: Path) -> RasterData:
    """Load a single-band GeoTIFF raster file."""
    with rasterio.open(file_path) as src:
        data = src.read(1).astype(np.float32)
        return RasterData(
            data=data,
            transform=src.transform,
            crs=src.crs,
            profile=src.profile.copy(),
            bounds=src.bounds,
        )


def load_raster_from_bytes(raster_bytes: bytes) -> RasterData:
    """Load a raster from in-memory bytes."""
    with rasterio.open(io.BytesIO(raster_bytes)) as src:
        data = src.read(1).astype(np.float32)
        return RasterData(
            data=data,
            transform=src.transform,
            crs=src.crs,
            profile=src.profile.copy(),
            bounds=src.bounds,
        )


def save_raster_to_bytes(data: np.ndarray, profile: dict) -> bytes:
    """Write a raster array to in-memory bytes."""
    profile.update(
        dtype="float32",
        count=1,
        compress="lzw",
        nodata=0.0,
    )
    buffer = io.BytesIO()
    with rasterio.open(buffer, "w", **profile) as dst:
        dst.write(data.astype(np.float32), 1)
    return buffer.getvalue()


def create_synthetic_raster(
    width: int = 512,
    height: int = 512,
    bounds: tuple = (69.18, 43.18, 69.22, 43.22),
    pattern: str = "gradient",
    seed: Optional[int] = None,
) -> tuple[np.ndarray, dict]:
    """
    Create a synthetic raster for demo purposes.

    Patterns:
    - 'gradient': Linear gradient (useful for NDVI demo)
    - 'random': Random values with spatial autocorrelation
    - 'zones': Distinct zone values
    """
    transform = from_bounds(bounds[0], bounds[1], bounds[2], bounds[3], width, height)
    profile = {
        "driver": "GTiff",
        "dtype": "float32",
        "width": width,
        "height": height,
        "count": 1,
        "crs": CRS.from_epsg(4326),
        "transform": transform,
    }

    rng = np.random.default_rng(seed)

    if pattern == "gradient":
        # Smooth gradient from low to high
        y = np.linspace(0.1, 0.9, height).reshape(-1, 1)
        x = np.linspace(0.1, 0.9, width).reshape(1, -1)
        data = (0.3 + 0.5 * x + 0.2 * y).astype(np.float32)
        data += rng.normal(0, 0.02, data.shape).astype(np.float32)

    elif pattern == "random":
        # Random values with spatial autocorrelation
        base = rng.random((height // 4, width // 4), dtype=np.float32) * 0.8 + 0.1
        # Upscale with interpolation
        from scipy.ndimage import zoom
        data = zoom(base, (height / (height // 4), width / (width // 4)), order=1)
        data = data[:height, :width].astype(np.float32)

    elif pattern == "zones":
        # Four distinct zones (A, B, C, D)
        data = np.zeros((height, width), dtype=np.float32)
        mid_h, mid_w = height // 2, width // 2
        data[:mid_h, :mid_w] = 0.8   # Zone A (high NDVI)
        data[:mid_h, mid_w:] = 0.6   # Zone B (medium)
        data[mid_h:, :mid_w] = 0.4   # Zone C (low-medium)
        data[mid_h:, mid_w:] = 0.2   # Zone D (low)
        data += rng.normal(0, 0.03, data.shape).astype(np.float32)
        data = np.clip(data, 0, 1)

    else:
        data = rng.random((height, width), dtype=np.float32)

    return data, profile


def compute_band_math(
    band_a: np.ndarray,
    band_b: np.ndarray,
    formula: str = "ndvi",
) -> np.ndarray:
    """
    Compute vegetation indices using band math.

    Formulas:
    - ndvi: (NIR - Red) / (NIR + Red)
    - ndre: (NIR - RedEdge) / (NIR + RedEdge)
    - evi: 2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1)
    """
    if formula == "ndvi":
        denominator = band_b + band_a  # NIR + Red
        return np.where(denominator > 0, (band_b - band_a) / denominator, 0.0)

    elif formula == "ndre":
        denominator = band_b + band_a  # NIR + RedEdge
        return np.where(denominator > 0, (band_b - band_a) / denominator, 0.0)

    elif formula == "evi":
        denominator = band_b + 6.0 * band_a - 7.5 * band_a + 1.0  # Simplified
        return np.where(denominator > 0, 2.5 * (band_b - band_a) / denominator, 0.0)

    else:
        raise ValueError(f"Unknown formula: {formula}")


def classify_index(data: np.ndarray, index_type: str = "ndvi") -> np.ndarray:
    """
    Classify a vegetation index into health categories.

    Returns uint8 array with values 0-5:
    0: No data, 1: Bare/dead, 2: Poor, 3: Moderate, 4: Good, 5: Excellent
    """
    classes = np.zeros_like(data, dtype=np.uint8)

    if index_type == "ndvi":
        classes[data < 0.1] = 1     # Bare soil
        classes[(data >= 0.1) & (data < 0.3)] = 2   # Poor
        classes[(data >= 0.3) & (data < 0.5)] = 3   # Moderate
        classes[(data >= 0.5) & (data < 0.7)] = 4   # Good
        classes[data >= 0.7] = 5                     # Excellent

    elif index_type == "ndre":
        classes[data < 0.1] = 1
        classes[(data >= 0.1) & (data < 0.25)] = 2
        classes[(data >= 0.25) & (data < 0.4)] = 3
        classes[(data >= 0.4) & (data < 0.55)] = 4
        classes[data >= 0.55] = 5

    return classes
