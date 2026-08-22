import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import { EcoFinSummary } from "@/components/charts/EcoFinSummary";
import { DollarSign, Leaf, TrendingUp, Factory } from "lucide-react";

export function EcoFinPage() {
  const { data: fieldsData } = useFields();
  const { selectedFieldId } = useFieldStore();
  const fields = fieldsData?.fields || [];

  // Demo EcoFin data (would come from API in production)
  const ecofinData = {
    carbon: {
      baseline_n_rate_kg_ha: 180.0,
      optimized_n_rate_kg_ha: 140.0,
      n_savings_kg_ha: 40.0,
      n_savings_pct: 22.2,
      n2o_avoided_tco2e_ha: 0.1192,
      manufacturing_offset_tco2e_ha: 0.182,
      total_carbon_tco2e_ha: 0.3012,
    },
    financial: {
      fertilizer_cost_saving_usd: 34.0,
      fuel_cost_saving_usd: 1.21,
      total_cost_saving_usd: 35.21,
      carbon_credit_revenue_usd: 4.52,
      net_benefit_usd_ha: 39.73,
      total_net_benefit_usd: 9932.5,
    },
    ets_framework: "KAZ-ETS",
    carbon_price_usd_per_ton: 15.0,
    total_area_ha: 250,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">EcoFin Analysis</h2>
        <p className="text-slate-400 text-sm mt-1">
          Ecological-Financial carbon credit accounting and cost optimization
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/10 border border-green-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Leaf size={18} />
            <span className="text-sm font-medium">Total Carbon</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {ecofinData.carbon.total_carbon_tco2e_ha.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">tCO₂e per hectare</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border border-emerald-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">N Savings</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {ecofinData.carbon.n_savings_pct.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {ecofinData.carbon.n_savings_kg_ha} kg N/ha reduced
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <DollarSign size={18} />
            <span className="text-sm font-medium">Net Benefit</span>
          </div>
          <p className="text-2xl font-bold text-white">
            ${ecofinData.financial.net_benefit_usd_ha.toFixed(2)}
          </p>
          <p className="text-xs text-slate-400 mt-1">per hectare per season</p>
        </div>

        <div className="bg-gradient-to-br from-violet-900/30 to-violet-800/10 border border-violet-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-violet-400 mb-2">
            <Factory size={18} />
            <span className="text-sm font-medium">Field Total</span>
          </div>
          <p className="text-2xl font-bold text-white">
            ${ecofinData.financial.total_net_benefit_usd.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {ecofinData.total_area_ha} ha × ${ecofinData.financial.net_benefit_usd_ha.toFixed(2)}/ha
          </p>
        </div>
      </div>

      {/* Carbon Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Carbon Accounting (IPCC Tier 1)</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Baseline N Rate</span>
              <span className="font-mono">{ecofinData.carbon.baseline_n_rate_kg_ha} kg/ha</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Optimized N Rate</span>
              <span className="font-mono">{ecofinData.carbon.optimized_n_rate_kg_ha} kg/ha</span>
            </div>
            <hr className="border-slate-700" />
            <div className="flex justify-between text-slate-300">
              <span>N₂O Field Emissions Avoided</span>
              <span className="font-mono">{ecofinData.carbon.n2o_avoided_tco2e_ha} tCO₂e/ha</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Manufacturing Offset</span>
              <span className="font-mono">{ecofinData.carbon.manufacturing_offset_tco2e_ha} tCO₂e/ha</span>
            </div>
            <hr className="border-slate-700" />
            <div className="flex justify-between text-white font-semibold">
              <span>Total Carbon Reduction</span>
              <span className="font-mono text-green-400">
                {ecofinData.carbon.total_carbon_tco2e_ha} tCO₂e/ha
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Financial Breakdown</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-slate-300">
              <span>Fertilizer Cost Savings</span>
              <span className="font-mono text-green-400">
                ${ecofinData.financial.fertilizer_cost_saving_usd.toFixed(2)}/ha
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Fuel Savings</span>
              <span className="font-mono text-green-400">
                ${ecofinData.financial.fuel_cost_saving_usd.toFixed(2)}/ha
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Carbon Credit Revenue</span>
              <span className="font-mono text-green-400">
                ${ecofinData.financial.carbon_credit_revenue_usd.toFixed(2)}/ha
              </span>
            </div>
            <hr className="border-slate-700" />
            <div className="flex justify-between text-white font-semibold">
              <span>Net Enterprise Benefit</span>
              <span className="font-mono text-agro-400">
                ${ecofinData.financial.net_benefit_usd_ha.toFixed(2)}/ha
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-3">Methodology</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-400">Framework</span>
            <p className="text-white">{ecofinData.ets_framework}</p>
          </div>
          <div>
            <span className="text-slate-400">Carbon Price</span>
            <p className="text-white">${ecofinData.carbon_price_usd_per_ton}/ton</p>
          </div>
          <div>
            <span className="text-slate-400">N₂O Emission Factor</span>
            <p className="text-white">0.01 kg N₂O-N/kg N</p>
          </div>
          <div>
            <span className="text-slate-400">GWP (N₂O)</span>
            <p className="text-white">298 × CO₂e</p>
          </div>
        </div>
      </div>

      {/* EcoFin Chart */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">Value Breakdown</h3>
        <EcoFinSummary data={ecofinData} />
      </div>
    </div>
  );
}
