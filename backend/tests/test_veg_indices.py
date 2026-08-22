"""Tests for vegetation index computation."""

import numpy as np
import pytest

from app.services.geospatial.veg_indices import (
    compute_vegetation_indices,
    compute_zone_vegetation_stats,
)
from app.services.geospatial.raster import compute_band_math, classify_index


class TestBandMath:
    def test_ndvi_calculation(self):
        """Test NDVI = (NIR - Red) / (NIR + Red)."""
        red = np.array([0.1, 0.2, 0.3], dtype=np.float32)
        nir = np.array([0.5, 0.4, 0.3], dtype=np.float32)

        ndvi = compute_band_math(red, nir, "ndvi")

        # (0.5-0.1)/(0.5+0.1) = 0.667
        assert abs(ndvi[0] - 0.6667) < 0.01
        # (0.4-0.2)/(0.4+0.2) = 0.333
        assert abs(ndvi[1] - 0.3333) < 0.01
        # (0.3-0.3)/(0.3+0.3) = 0.0
        assert abs(ndvi[2] - 0.0) < 0.01

    def test_ndvi_zero_denominator(self):
        """Test NDVI handles zero denominator."""
        red = np.array([0.0], dtype=np.float32)
        nir = np.array([0.0], dtype=np.float32)
        ndvi = compute_band_math(red, nir, "ndvi")
        assert ndvi[0] == 0.0

    def test_ndre_calculation(self):
        """Test NDRE = (NIR - RedEdge) / (NIR + RedEdge)."""
        re = np.array([0.15, 0.25], dtype=np.float32)
        nir = np.array([0.5, 0.4], dtype=np.float32)

        ndre = compute_band_math(re, nir, "ndre")

        assert abs(ndre[0] - 0.5385) < 0.01
        assert abs(ndre[1] - 0.2308) < 0.01

    def test_invalid_formula(self):
        with pytest.raises(ValueError, match="Unknown formula"):
            compute_band_math(np.zeros(1), np.zeros(1), "invalid")


class TestClassification:
    def test_ndvi_classification(self):
        data = np.array([-0.1, 0.05, 0.2, 0.4, 0.6, 0.85], dtype=np.float32)
        classes = classify_index(data, "ndvi")

        assert classes[0] == 1  # Bare soil
        assert classes[1] == 1  # Bare soil (< 0.1)
        assert classes[2] == 2  # Poor
        assert classes[3] == 3  # Moderate
        assert classes[4] == 4  # Good
        assert classes[5] == 5  # Excellent

    def test_ndvi_classification_all_classes_used(self):
        data = np.array([0.05, 0.2, 0.4, 0.6, 0.8], dtype=np.float32)
        classes = classify_index(data, "ndvi")
        unique = set(classes.tolist())
        assert 1 in unique
        assert 2 in unique
        assert 3 in unique
        assert 4 in unique
        assert 5 in unique


class TestVegetationIndices:
    def test_synthetic_computation(self):
        result = compute_vegetation_indices(use_synthetic=True)

        assert result.ndvi is not None
        assert result.ndre is not None
        assert result.ndvi.shape == result.ndre.shape
        assert -1.0 <= result.mean_ndvi <= 1.0
        assert -1.0 <= result.mean_ndre <= 1.0
        assert result.std_ndvi >= 0
        assert result.std_ndre >= 0

    def test_synthetic_class_fractions(self):
        result = compute_vegetation_indices(use_synthetic=True)

        # Fractions should sum to approximately 1.0
        total_ndvi = sum(result.ndvi_class_fractions.values())
        assert abs(total_ndvi - 1.0) < 0.01

    def test_synthetic_ndvi_range(self):
        result = compute_vegetation_indices(use_synthetic=True)

        # NDVI should be in valid range
        valid = result.ndvi[result.ndvi != 0]
        assert len(valid) > 0
        assert np.all(valid >= -1.0)
        assert np.all(valid <= 1.0)

    def test_synthetic_with_different_seeds(self):
        r1 = compute_vegetation_indices(use_synthetic=True)
        r2 = compute_vegetation_indices(use_synthetic=True)
        # Same seed should produce same result
        assert abs(r1.mean_ndvi - r2.mean_ndvi) < 0.001


class TestZoneStats:
    def test_zone_vegetation_stats(self):
        result = compute_vegetation_indices(use_synthetic=True)
        zone_stats = compute_zone_vegetation_stats(result, [], (69.18, 43.18, 69.22, 43.22))

        assert len(zone_stats) == 4  # 4 zones (A, B, C, D)
        labels = [z["zone_label"] for z in zone_stats]
        assert "A" in labels
        assert "B" in labels
        assert "C" in labels
        assert "D" in labels

    def test_zone_stats_have_ndvi(self):
        result = compute_vegetation_indices(use_synthetic=True)
        zone_stats = compute_zone_vegetation_stats(result, [], (69.18, 43.18, 69.22, 43.22))

        for zone in zone_stats:
            assert "mean_ndvi" in zone
            assert "mean_ndre" in zone
            assert -1.0 <= zone["mean_ndvi"] <= 1.0
