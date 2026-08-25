import { useDeviceType } from "@/hooks/useDeviceType";
import { EcoFinSummary } from "@/components/charts/EcoFinSummary";
import { DollarSign, Leaf, TrendingUp, Factory } from "lucide-react";

export function EcoFinPage() {
  const { isPhone } = useDeviceType();
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
    <div className="space-y-5 p-4 lg:p-6 animate-fade-in-up">
      {/* Hero number */}
      <div className="bg-gradient-to-r from-canopy-800/60 to-canopy-900/40 border border-canopy-700/40 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-field-300 uppercase tracking-wide font-medium mb-1">Чистая выгода</p>
            <div className="flex items-baseline gap-2">
              <span className={"font-bold text-earth-100 " + (isPhone ? "text-2xl" : "text-4xl")}>${ecofinData.financial.net_benefit_usd_ha.toFixed(2)}</span>
              <span className="text-sm text-field-300">/га за сезон</span>
            </div>
            <p className="text-xs text-field-300 mt-2">
              {ecofinData.total_area_ha} ha × ${ecofinData.financial.net_benefit_usd_ha.toFixed(2)}/ha ={" "}
              <span className="text-agro-400 font-medium">${ecofinData.financial.total_net_benefit_usd.toLocaleString()}</span> итого
            </p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-agro-600/20 flex items-center justify-center">
            <DollarSign size={28} className="text-agro-400" />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className={"grid gap-3 " + (isPhone ? "grid-cols-1" : "grid-cols-3")}>
        <div className="bg-canopy-900/60 border border-l-[3px] border-l-agro-500 border-canopy-700/40 rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-1 text-field-300">
            <Leaf size={12} />
            <span className="text-[10px] uppercase tracking-wide font-medium">Общий углерод</span>
          </div>
          <span className="text-xl font-bold text-earth-100">{ecofinData.carbon.total_carbon_tco2e_ha.toFixed(2)}</span>
          <span className="text-[10px] text-field-300 ml-1">tCO₂e/ha</span>
        </div>
        <div className="bg-canopy-900/60 border border-l-[3px] border-l-earth-300 border-canopy-700/40 rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-1 text-field-300">
            <TrendingUp size={12} />
            <span className="text-[10px] uppercase tracking-wide font-medium">Экономия азота</span>
          </div>
          <span className="text-xl font-bold text-earth-100">{ecofinData.carbon.n_savings_pct.toFixed(1)}%</span>
          <span className="text-[10px] text-field-300 ml-1">{ecofinData.carbon.n_savings_kg_ha} kg N/ha</span>
        </div>
        <div className="bg-canopy-900/60 border border-l-[3px] border-l-blue-500 border-canopy-700/40 rounded-lg p-4">
          <div className="flex items-center gap-1.5 mb-1 text-field-300">
            <Factory size={12} />
            <span className="text-[10px] uppercase tracking-wide font-medium">Итого по полю</span>
          </div>
          <span className="text-xl font-bold text-earth-100">${ecofinData.financial.total_net_benefit_usd.toLocaleString()}</span>
        </div>
      </div>

      {/* Carbon + Financial side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Carbon Accounting */}
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-4">Углеродный учёт (МГЭИК уровень 1)</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-field-200">
              <span>Базовая норма N</span>
              <span className="font-mono text-earth-100">{ecofinData.carbon.baseline_n_rate_kg_ha} kg/ha</span>
            </div>
            <div className="flex justify-between text-field-200">
              <span>Оптимизированная норма N</span>
              <span className="font-mono text-earth-100">{ecofinData.carbon.optimized_n_rate_kg_ha} kg/ha</span>
            </div>
            <hr className="border-canopy-700/60" />
            <div className="flex justify-between text-field-200">
              <span>Избежанные полевые выбросы N₂O</span>
              <span className="font-mono text-earth-100">{ecofinData.carbon.n2o_avoided_tco2e_ha} tCO₂e/ha</span>
            </div>
            <div className="flex justify-between text-field-200">
              <span>Снижение при производстве</span>
              <span className="font-mono text-earth-100">{ecofinData.carbon.manufacturing_offset_tco2e_ha} tCO₂e/ha</span>
            </div>
            <hr className="border-canopy-700/60" />
            <div className="flex justify-between text-earth-100 font-semibold">
              <span>Общее снижение углерода</span>
              <span className="font-mono text-agro-400">{ecofinData.carbon.total_carbon_tco2e_ha} tCO₂e/ha</span>
            </div>
          </div>
        </div>

        {/* Финансовый разбор */}
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-4">Финансовый разбор</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-field-200">
              <span>Экономия на удобрениях</span>
              <span className="font-mono text-agro-400">${ecofinData.financial.fertilizer_cost_saving_usd.toFixed(2)}/ha</span>
            </div>
            <div className="flex justify-between text-field-200">
              <span>Экономия топлива</span>
              <span className="font-mono text-agro-400">${ecofinData.financial.fuel_cost_saving_usd.toFixed(2)}/ha</span>
            </div>
            <div className="flex justify-between text-field-200">
              <span>Доход от углеродных кредитов</span>
              <span className="font-mono text-agro-400">${ecofinData.financial.carbon_credit_revenue_usd.toFixed(2)}/ha</span>
            </div>
            <hr className="border-canopy-700/60" />
            <div className="flex justify-between text-earth-100 font-semibold">
              <span>Чистая выгода</span>
              <span className="font-mono text-agro-400">${ecofinData.financial.net_benefit_usd_ha.toFixed(2)}/ha</span>
            </div>
          </div>
        </div>
      </div>

      {/* Methodology */}
      <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-3">Методология</h3>
        <div className={"grid gap-4 text-sm " + (isPhone ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4")}>
          <div>
            <span className="text-field-300 text-xs">Стандарт</span>
            <p className="text-earth-100">{ecofinData.ets_framework}</p>
          </div>
          <div>
            <span className="text-field-300 text-xs">Цена углерода</span>
            <p className="text-earth-100">${ecofinData.carbon_price_usd_per_ton}/ton</p>
          </div>
          <div>
            <span className="text-field-300 text-xs">Коэффициент выбросов N₂O</span>
            <p className="text-earth-100">0.01 kg N₂O-N/kg N</p>
          </div>
          <div>
            <span className="text-field-300 text-xs">ПГВ (N₂O)</span>
            <p className="text-earth-100">298 × CO₂e</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-4">Разбивка стоимости</h3>
        <EcoFinSummary data={ecofinData} />
      </div>
    </div>
  );
}
