import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface EcoFinDataProps {
  data: {
    carbon: {
      total_carbon_tco2e_ha: number;
      n2o_avoided_tco2e_ha: number;
      manufacturing_offset_tco2e_ha: number;
    };
    financial: {
      fertilizer_cost_saving_usd: number;
      fuel_cost_saving_usd: number;
      carbon_credit_revenue_usd: number;
      net_benefit_usd_ha: number;
    };
  };
}

const PIE_COLORS = ["#2d8a4e", "#3b82f6", "#d4a843", "#8b5cf6"];

export function EcoFinSummary({ data }: EcoFinDataProps) {
  const pieData = [
    { name: "Fertilizer Savings", value: data.financial.fertilizer_cost_saving_usd },
    { name: "Fuel Savings", value: data.financial.fuel_cost_saving_usd },
    { name: "Carbon Credits", value: data.financial.carbon_credit_revenue_usd },
  ];

  const carbonPieData = [
    { name: "N₂O Avoided", value: data.carbon.n2o_avoided_tco2e_ha },
    { name: "Manufacturing", value: data.carbon.manufacturing_offset_tco2e_ha },
  ];

  const barData = [
    {
      name: "Baseline",
      rate: 180,
    },
    {
      name: "Optimized",
      rate: 140,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Financial breakdown pie */}
      <div>
        <h4 className="text-xs font-medium text-field-300 mb-2 text-center uppercase tracking-wide">Value Breakdown ($/ha)</h4>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((_, index) => (
                <Cell key={index} fill={PIE_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1a3326", border: "1px solid #2d4a35", borderRadius: "8px", color: "#f5e6c8" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#c8d5c0" }}
              formatter={(value) => <span className="text-field-200">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Carbon breakdown pie */}
      <div>
        <h4 className="text-xs font-medium text-field-300 mb-2 text-center uppercase tracking-wide">Carbon Sources (tCO₂e/ha)</h4>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={carbonPieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              <Cell fill="#2d8a4e" />
              <Cell fill="#3b82f6" />
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1a3326", border: "1px solid #2d4a35", borderRadius: "8px", color: "#f5e6c8" }}
              formatter={(value: number) => [`${value.toFixed(4)} tCO₂e`, ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#c8d5c0" }}
              formatter={(value) => <span className="text-field-200">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* N rate comparison */}
      <div>
        <h4 className="text-xs font-medium text-field-300 mb-2 text-center uppercase tracking-wide">N Rate Comparison</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a35" />
            <XAxis dataKey="name" tick={{ fill: "#c8d5c0", fontSize: 12 }} />
            <YAxis tick={{ fill: "#c8d5c0", fontSize: 12 }} domain={[0, 200]} />
            <Tooltip
              contentStyle={{ background: "#1a3326", border: "1px solid #2d4a35", borderRadius: "8px", color: "#f5e6c8" }}
              formatter={(value: number) => [`${value} kg/ha`, ""]}
            />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
              <Cell fill="#ef4444" />
              <Cell fill="#2d8a4e" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
