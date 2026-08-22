"""
Financial optimization and cost-benefit analysis.

Combines carbon accounting with financial modeling to compute total
economic and environmental value of precision agriculture prescriptions.
"""

from dataclasses import dataclass
from typing import Optional

from app.services.ecofin.carbon import (
    CarbonAccounting,
    calculate_carbon_credits,
    calculate_fuel_savings,
    N_FERTILIZER_PRICE_USD,
    DIESEL_PRICE_USD,
    DIESEL_CONSUMPTION_BASELINE,
)
from app.config import get_settings


@dataclass
class FinancialBreakdown:
    """Complete financial impact breakdown."""
    # Cost savings
    fertilizer_cost_saving_usd: float
    fuel_cost_saving_usd: float
    total_cost_saving_usd: float

    # Revenue from carbon credits
    carbon_credit_revenue_usd: float

    # Net benefit
    net_benefit_usd_ha: float
    total_net_benefit_usd: float  # net_benefit * total_area

    def to_dict(self) -> dict:
        return {
            "fertilizer_cost_saving_usd": round(self.fertilizer_cost_saving_usd, 2),
            "fuel_cost_saving_usd": round(self.fuel_cost_saving_usd, 2),
            "total_cost_saving_usd": round(self.total_cost_saving_usd, 2),
            "carbon_credit_revenue_usd": round(self.carbon_credit_revenue_usd, 2),
            "net_benefit_usd_ha": round(self.net_benefit_usd_ha, 2),
            "total_net_benefit_usd": round(self.total_net_benefit_usd, 2),
        }


@dataclass
class EcoFinResult:
    """Complete EcoFin analysis result."""
    carbon: CarbonAccounting
    financial: FinancialBreakdown
    total_area_ha: float
    carbon_price_usd_per_ton: float
    ets_framework: str

    def to_dict(self) -> dict:
        return {
            "carbon": self.carbon.to_dict(),
            "financial": self.financial.to_dict(),
            "total_area_ha": round(self.total_area_ha, 2),
            "carbon_price_usd_per_ton": self.carbon_price_usd_per_ton,
            "ets_framework": self.ets_framework,
        }


def compute_ecofin(
    baseline_n_rate: float,
    optimized_rates: dict[str, float],
    zone_areas: dict[str, float],
    total_area: float,
    baseline_fuel_l_ha: float = DIESEL_CONSUMPTION_BASELINE,
    fuel_savings_pct: float = 11.0,
    carbon_price: Optional[float] = None,
) -> EcoFinResult:
    """
    Compute complete Ecological-Financial analysis.

    Combines:
    - Carbon accounting (N2O avoided + manufacturing offset)
    - Financial modeling (cost savings + carbon credit revenue)

    Args:
        baseline_n_rate: Uniform N rate for comparison (kg/ha)
        optimized_rates: Zone-level optimized rates (kg/ha)
        zone_areas: Zone areas (ha)
        total_area: Total field area (ha)
        baseline_fuel_l_ha: Baseline diesel consumption (L/ha)
        fuel_savings_pct: Expected fuel reduction (%)
        carbon_price: USD per tonne CO2e (uses config default if None)

    Returns:
        EcoFinResult with complete analysis
    """
    settings = get_settings()
    if carbon_price is None:
        carbon_price = settings.carbon_price_usd_per_ton

    # 1. Carbon accounting
    carbon = calculate_carbon_credits(
        baseline_rate=baseline_n_rate,
        optimized_rates=optimized_rates,
        zone_areas=zone_areas,
        total_area=total_area,
    )

    # 2. Fertilizer cost savings
    fertilizer_saving = carbon.n_savings_kg_ha * N_FERTILIZER_PRICE_USD

    # 3. Fuel cost savings
    fuel_saved_l_ha, fuel_savings_actual = calculate_fuel_savings(
        baseline_fuel_l_ha=baseline_fuel_l_ha,
        speed_optimization_pct=fuel_savings_pct,
    )
    fuel_saving = fuel_saved_l_ha * DIESEL_PRICE_USD

    # 4. Carbon credit revenue
    carbon_revenue = carbon.total_carbon_tco2e_ha * carbon_price

    # 5. Total savings per hectare
    total_saving_ha = fertilizer_saving + fuel_saving + carbon_revenue

    # 6. Net benefit (savings minus any additional costs; simplified for MVP)
    net_benefit_ha = total_saving_ha
    total_net_benefit = net_benefit_ha * total_area

    financial = FinancialBreakdown(
        fertilizer_cost_saving_usd=fertilizer_saving,
        fuel_cost_saving_usd=fuel_saving,
        total_cost_saving_usd=fertilizer_saving + fuel_saving,
        carbon_credit_revenue_usd=carbon_revenue,
        net_benefit_usd_ha=net_benefit_ha,
        total_net_benefit_usd=total_net_benefit,
    )

    return EcoFinResult(
        carbon=carbon,
        financial=financial,
        total_area_ha=total_area,
        carbon_price_usd_per_ton=carbon_price,
        ets_framework=settings.ets_framework,
    )
