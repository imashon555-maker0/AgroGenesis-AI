"""
Vegetation index computation service.

Computes NDVI and NDRE from multispectral raster bands (Sentinel-2).
"""

import numpy as np
from dataclasses import dataclass
from typing import Optional
from pathlib import Path

from app.services.geospatial.raster import (
    load_raster,
    create_synthetic_raster,
    compute_band_math,
    classify_index,
    save_raster_to_bytes,
)


@dataclass
class VegetationIndexResult:
    """Result of vegetation index computation."""
    ndvi: np.ndarray
    ndre: np.ndarray
    ndvi_classified: np.ndarray
    ndre_classified: np.ndarray
    transform: object
    crs: str
    profile: dict
    # Summary statistics
    mean_ndvi: float
    std_ndvi: float
    mean_ndre: float
    std_ndre: float
    # Per-class area fractions
    ndvi_class_fractions: dict[int, float]
    ndre_class_fractions: dict[int, float]


def compute_vegetation_indices(
    red_path: Optional[Path] = None,
    rededge_path: Optional[Path] = None,
    nir_path: Optional[Path] = None,
    use_synthetic: bool = False,
    bounds: tuple = (69.18, 43.18, 69.22, 43.22),
) -> VegetationIndexResult:
    """
    Compute NDVI and NDRE from Sentinel-2 band files.

    Sentinel-2 Band Mapping:
    - B04 (Red): 665nm center wavelength
    - B05 (Red Edge): 705nm center wavelength
    - B08 (NIR): 842nm center wavelength

    NDVI = (NIR - Red) / (NIR + Red)
    NDRE = (NIR - RedEdge) / (NIR + RedEdge)
    """
    if use_synthetic:
        # Generate synthetic bands for demo
        red_data, profile = create_synthetic_raster(
            pattern="gradient", seed=42, bounds=bounds
        )
        re_data, _ = create_synthetic_raster(
            pattern="gradient", seed=43, bounds=bounds
        )
        nir_data, _ = create_synthetic_raster(
            pattern="gradient", seed=44, bounds=bounds
        )
        # Make NIR values higher than Red for realistic NDVI
        nir_data = nir_data * 1.5 + 0.2
        re_data = re_data * 1.3 + 0.15
        red_data = red_data * 0.8

        transform = profile["transform"]
        crs = profile["crs"].to_string()
    else:
        if not all([red_path, rededge_path, nir_path]):
            raise ValueError("Must provide band file paths when use_synthetic=False")

        red_raster = load_raster(red_path)
        re_raster = load_raster(rededge_path)
        nir_raster = load_raster(nir_path)

        red_data = red_raster.data
        re_data = re_raster.data
        nir_data = nir_raster.data
        transform = nir_raster.transform
        crs = nir_raster.crs.to_string()
        profile = nir_raster.profile

    # Clip to [0, 1] range for reflectance data
    red_data = np.clip(red_data, 0, 1)
    re_data = np.clip(re_data, 0, 1)
    nir_data = np.clip(nir_data, 0, 1)

    # Compute indices
    ndvi = compute_band_math(red_data, nir_data, "ndvi")
    ndre = compute_band_math(re_data, nir_data, "ndre")

    # Classify
    ndvi_classified = classify_index(ndvi, "ndvi")
    ndre_classified = classify_index(ndre, "ndre")

    # Compute statistics
    valid_ndvi = ndvi[ndvi != 0]
    valid_ndre = ndre[ndre != 0]

    mean_ndvi = float(np.mean(valid_ndvi)) if len(valid_ndvi) > 0 else 0.0
    std_ndvi = float(np.std(valid_ndvi)) if len(valid_ndvi) > 0 else 0.0
    mean_ndre = float(np.mean(valid_ndre)) if len(valid_ndre) > 0 else 0.0
    std_ndre = float(np.std(valid_ndre)) if len(valid_ndre) > 0 else 0.0

    # Class fractions (percentage of area in each class)
    total_pixels = ndvi.size
    ndvi_class_fractions = {
        int(c): float(np.sum(ndvi_classified == c)) / total_pixels
        for c in range(6)
    }
    ndre_class_fractions = {
        int(c): float(np.sum(ndre_classified == c)) / total_pixels
        for c in range(6)
    }

    return VegetationIndexResult(
        ndvi=ndvi,
        ndre=ndre,
        ndvi_classified=ndvi_classified,
        ndre_classified=ndre_classified,
        transform=transform,
        crs=crs,
        profile=profile,
        mean_ndvi=mean_ndvi,
        std_ndvi=std_ndvi,
        mean_ndre=mean_ndre,
        std_ndre=std_ndre,
        ndvi_class_fractions=ndvi_class_fractions,
        ndre_class_fractions=ndre_class_fractions,
    )


def compute_zone_vegetation_stats(
    result: VegetationIndexResult,
    zone_geometries: list[dict],
    field_bounds: tuple,
) -> list[dict]:
    """
    Compute per-zone vegetation statistics by overlaying zone geometries
    on the computed index rasters.

    In production, this uses zonal statistics with rasterio.mask.
    For MVP, divides the raster into quadrants matching zone positions.
    """
    h, w = result.ndvi.shape
    zone_stats = []

    # Simple quadrant-based zone assignment for demo
    zone_positions = [
        ("A", slice(0, h // 2), slice(0, w // 2)),
        ("B", slice(0, h // 2), slice(w // 2, w)),
        ("C", slice(h // 2, h), slice(0, w // 2)),
        ("D", slice(h // 2, h), slice(w // 2, w)),
    ]

    for i, (label, row_slice, col_slice) in enumerate(zone_positions):
        ndvi_zone = result.ndvi[row_slice, col_slice]
        ndre_zone = result.ndre[row_slice, col_slice]

        valid_ndvi = ndvi_zone[ndvi_zone != 0]
        valid_ndre = ndre_zone[ndre_zone != 0]

        zone_stats.append({
            "zone_label": label,
            "zone_index": i,
            "mean_ndvi": float(np.mean(valid_ndvi)) if len(valid_ndvi) > 0 else 0.0,
            "std_ndvi": float(np.std(valid_ndvi)) if len(valid_ndvi) > 0 else 0.0,
            "mean_ndre": float(np.mean(valid_ndre)) if len(valid_ndre) > 0 else 0.0,
            "std_ndre": float(np.std(valid_ndre)) if len(valid_ndre) > 0 else 0.0,
            "pixel_count": int(ndvi_zone.size),
            "ndvi_percentiles": {
                "p25": float(np.percentile(valid_ndvi, 25)) if len(valid_ndvi) > 0 else 0.0,
                "p50": float(np.percentile(valid_ndvi, 50)) if len(valid_ndvi) > 0 else 0.0,
                "p75": float(np.percentile(valid_ndvi, 75)) if len(valid_ndvi) > 0 else 0.0,
            },
        })

    return zone_stats
