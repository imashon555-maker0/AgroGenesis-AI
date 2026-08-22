"""Tests for EcoFin carbon accounting and financial modeling."""

import pytest

from app.services.ecofin.carbon import (
    calculate_carbon_credits,
    calculate_fuel_savings,
    CarbonAccounting,
    N2O_EMISSION_FACTOR,
    N2O_TO_CO2E_GWP,
    MANUFACTURING_EF,
)
from app.services.ecofin.cost import compute_ecofin


class TestCarbonAccounting:
    def test_basic_calculation(self):
        """Test basic carbon credit calculation."""
        result = calculate_carbon_credits(
            baseline_rate=180.0,
            optimized_rates={"A": 150.0, "B": 120.0, "C": 80.0, "D": 50.0},
            zone_areas={"A": 60.0, "B": 70.0, "C": 50.0, "D": 40.0},
            total_area=220.0,
        )

        # Check N savings
        assert result.n_savings_kg_ha > 0
        assert result.n_savings_pct > 0
        assert result.n_savings_pct < 50  # Should be reasonable

        # Check carbon values are positive
        assert result.n2o_avoided_tco2e_ha > 0
        assert result.manufacturing_offset_tco2e_ha > 0
        assert result.total_carbon_tco2e_ha > 0

        # Check total = N2O + manufacturing
        assert abs(
            result.total_carbon_tco2e_ha
            - (result.n2o_avoided_tco2e_ha + result.manufacturing_offset_tco2e_ha)
        ) < 0.0001

    def test_uniform_rate_no_savings(self):
        """When optimized rate equals baseline, no savings."""
        result = calculate_carbon_credits(
            baseline_rate=180.0,
            optimized_rates={"A": 180.0, "B": 180.0},
            zone_areas={"A": 100.0, "B": 100.0},
            total_area=200.0,
        )

        assert abs(result.n_savings_kg_ha) < 0.001
        assert abs(result.total_carbon_tco2e_ha) < 0.0001

    def test_variable_rate_savings(self):
        """Variable rate should produce some savings."""
        result = calculate_carbon_credits(
            baseline_rate=180.0,
            optimized_rates={"A": 140.0, "B": 100.0, "C": 70.0, "D": 40.0},
            zone_areas={"A": 50.0, "B": 50.0, "C": 50.0, "D": 50.0},
            total_area=200.0,
        )

        # Average optimized = (140+100+70+40)/4 = 87.5
        expected_savings = 180.0 - 87.5  # 92.5 kg/ha
        assert abs(result.n_savings_kg_ha - expected_savings) < 0.01

    def test_emission_factors(self):
        """Verify IPCC emission factors are correctly used."""
        assert N2O_EMISSION_FACTOR == 0.01
        assert N2O_TO_CO2E_GWP == 298
        assert MANUFACTURING_EF == 4.55

    def test_to_dict(self):
        """Test dictionary serialization."""
        result = calculate_carbon_credits(
            baseline_rate=180.0,
            optimized_rates={"A": 130.0},
            zone_areas={"A": 100.0},
            total_area=100.0,
        )
        d = result.to_dict()
        assert "baseline_n_rate_kg_ha" in d
        assert "total_carbon_tco2e_ha" in d
        assert isinstance(d["total_carbon_tco2e_ha"], float)

    def test_invalid_total_area(self):
        with pytest.raises(ValueError, match="Total area must be positive"):
            calculate_carbon_credits(
                baseline_rate=180.0,
                optimized_rates={"A": 140.0},
                zone_areas={"A": 100.0},
                total_area=0,
            )

    def test_empty_zones(self):
        with pytest.raises(ValueError, match="Must provide"):
            calculate_carbon_credits(
                baseline_rate=180.0,
                optimized_rates={},
                zone_areas={},
                total_area=100.0,
            )


class TestFuelSavings:
    def test_fuel_savings_calculation(self):
        saved, pct = calculate_fuel_savings(
            baseline_fuel_l_ha=8.0,
            speed_optimization_pct=11.0,
        )
        assert abs(saved - 0.88) < 0.01
        assert pct == 11.0

    def test_zero_savings(self):
        saved, pct = calculate_fuel_savings(
            baseline_fuel_l_ha=8.0,
            speed_optimization_pct=0.0,
        )
        assert saved == 0.0


class TestEcoFinIntegration:
    def test_complete_ecofin(self):
        result = compute_ecofin(
            baseline_n_rate=180.0,
            optimized_rates={"A": 140.0, "B": 110.0, "C": 80.0, "D": 50.0},
            zone_areas={"A": 60.0, "B": 70.0, "C": 50.0, "D": 40.0},
            total_area=220.0,
        )

        # Financial should be positive
        assert result.financial.fertilizer_cost_saving_usd > 0
        assert result.financial.carbon_credit_revenue_usd > 0
        assert result.financial.net_benefit_usd_ha > 0

        # Total benefit should be positive
        assert result.financial.total_net_benefit_usd > 0

    def test_ecofin_to_dict(self):
        result = compute_ecofin(
            baseline_n_rate=180.0,
            optimized_rates={"A": 140.0},
            zone_areas={"A": 100.0},
            total_area=100.0,
        )
        d = result.to_dict()
        assert "carbon" in d
        assert "financial" in d
        assert d["ets_framework"] == "KAZ-ETS"

    def test_ecofin_target_value(self):
        """Verify we're in the ballpark of the target $21.77/ha."""
        result = compute_ecofin(
            baseline_n_rate=180.0,
            optimized_rates={"A": 140.0, "B": 110.0, "C": 80.0, "D": 50.0},
            zone_areas={"A": 60.0, "B": 70.0, "C": 50.0, "D": 40.0},
            total_area=220.0,
        )
        # Should be in reasonable range (different zone distribution than spec)
        assert 15.0 < result.financial.net_benefit_usd_ha < 50.0
