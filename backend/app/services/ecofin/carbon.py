"""
Carbon accounting model using IPCC Tier 1 methodology.

Calculates greenhouse gas (GHG) reductions from variable-rate nitrogen
application optimization, including:
- Direct field N2O emissions avoided
- Manufacturing emissions offset (Haber-Bosch process)
- Conversion to CO2 equivalent (tCO2e)
"""

from dataclasses import dataclass
from typing import Optional


# IPCC Emission Factors (Tier 1)
N2O_EMISSION_FACTOR = 0.01        # kg N2O-N per kg N applied (direct field emissions)
N2O_TO_CO2E_GWP = 298             # Global Warming Potential of N2O over 100 years
MANUFACTURING_EF = 4.55           # kg CO2e per kg N produced (Haber-Bosch process energy)
N_FERTILIZER_PRICE_USD = 0.85     # USD per kg N (approximate market price)
DIESEL_PRICE_USD = 1.10           # USD per liter diesel
DIESEL_CONSUMPTION_BASELINE = 8.0 # L/ha baseline diesel consumption


@dataclass
class CarbonAccounting:
    """Complete carbon accounting result."""
    # Input optimization
    baseline_n_rate_kg_ha: float
    optimized_n_rate_kg_ha: float
    n_savings_kg_ha: float
    n_savings_pct: float

    # Direct N2O field emissions
    n2o_emission_factor: float
    n2o_avoided_kg_ha: float        # kg N2O-N per hectare
    n2o_avoided_tco2e_ha: float     # tonnes CO2e per hectare

    # Manufacturing offset
    manufacturing_ef: float
    manufacturing_offset_tco2e_ha: float

    # Total
    total_carbon_tco2e_ha: float

    @property
    def total_carbon_tco2e_field(self) -> float:
        """Total carbon credits for the entire field (requires area_ha)."""
        return 0.0  # Placeholder - calculated in cost.py with area

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "baseline_n_rate_kg_ha": round(self.baseline_n_rate_kg_ha, 2),
            "optimized_n_rate_kg_ha": round(self.optimized_n_rate_kg_ha, 2),
            "n_savings_kg_ha": round(self.n_savings_kg_ha, 2),
            "n_savings_pct": round(self.n_savings_pct, 1),
            "n2o_avoided_kg_ha": round(self.n2o_avoided_kg_ha, 4),
            "n2o_avoided_tco2e_ha": round(self.n2o_avoided_tco2e_ha, 4),
            "manufacturing_offset_tco2e_ha": round(self.manufacturing_offset_tco2e_ha, 4),
            "total_carbon_tco2e_ha": round(self.total_carbon_tco2e_ha, 4),
            "emission_factor": self.n2o_emission_factor,
            "gwp_n2o": N2O_TO_CO2E_GWP,
            "manufacturing_ef": self.manufacturing_ef,
        }


def calculate_carbon_credits(
    baseline_rate: float,
    optimized_rates: dict[str, float],
    zone_areas: dict[str, float],
    total_area: float,
) -> CarbonAccounting:
    """
    Calculate GHG reduction from variable-rate nitrogen application.

    Methodology (IPCC Tier 1):
    1. Compute area-weighted average of optimized rates
    2. Calculate N reduction: baseline - optimized_avg
    3. N2O avoided = delta_N × EF(0.01) × GWP(298)
    4. Manufacturing offset = delta_N × ManufacturingEF(4.55)
    5. Total = N2O avoided + manufacturing offset

    Args:
        baseline_rate: Uniform N application rate (kg/ha) for comparison
        optimized_rates: Dict of zone_label -> application_rate (kg/ha)
        zone_areas: Dict of zone_label -> area (ha)
        total_area: Total field area (ha)

    Returns:
        CarbonAccounting with complete GHG analysis
    """
    if total_area <= 0:
        raise ValueError("Total area must be positive")

    if not optimized_rates:
        raise ValueError("Must provide at least one zone rate")

    # Compute area-weighted average optimized rate
    weighted_sum = sum(
        optimized_rates.get(zone, baseline_rate) * zone_areas.get(zone, total_area / len(optimized_rates))
        for zone in optimized_rates
    )
    avg_optimized = weighted_sum / total_area

    # Nitrogen savings
    delta_n = baseline_rate - avg_optimized
    savings_pct = (delta_n / baseline_rate * 100) if baseline_rate > 0 else 0.0

    # Direct field N2O emissions avoided
    n2o_avoided_kg_ha = delta_n * N2O_EMISSION_FACTOR
    n2o_avoided_tco2e_ha = n2o_avoided_kg_ha * N2O_TO_CO2E_GWP / 1000.0

    # Manufacturing emissions offset (embodied energy in fertilizer production)
    manufacturing_offset_tco2e_ha = delta_n * MANUFACTURING_EF / 1000.0

    # Total carbon reduction
    total_carbon_tco2e_ha = n2o_avoided_tco2e_ha + manufacturing_offset_tco2e_ha

    return CarbonAccounting(
        baseline_n_rate_kg_ha=baseline_rate,
        optimized_n_rate_kg_ha=avg_optimized,
        n_savings_kg_ha=delta_n,
        n_savings_pct=savings_pct,
        n2o_emission_factor=N2O_EMISSION_FACTOR,
        n2o_avoided_kg_ha=n2o_avoided_kg_ha,
        n2o_avoided_tco2e_ha=n2o_avoided_tco2e_ha,
        manufacturing_ef=MANUFACTURING_EF,
        manufacturing_offset_tco2e_ha=manufacturing_offset_tco2e_ha,
        total_carbon_tco2e_ha=total_carbon_tco2e_ha,
    )


def calculate_fuel_savings(
    baseline_fuel_l_ha: float = DIESEL_CONSUMPTION_BASELINE,
    speed_optimization_pct: float = 11.0,
) -> tuple[float, float]:
    """
    Estimate fuel savings from optimized machine paths and speeds.

    Args:
        baseline_fuel_l_ha: Baseline diesel consumption (L/ha)
        speed_optimization_pct: Expected fuel reduction from speed optimization (%)

    Returns:
        Tuple of (fuel_saved_l_ha, fuel_saved_pct)
    """
    fuel_saved = baseline_fuel_l_ha * (speed_optimization_pct / 100.0)
    return fuel_saved, speed_optimization_pct
