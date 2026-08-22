import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TelemetryStats } from "@/types";

interface ZoneComparisonProps {
  data: TelemetryStats[];
}

export function ZoneComparison({ data }: ZoneComparisonProps) {
  const chartData = data.map((zone) => ({
    name: `Zone ${zone.zone_label}`,
    NDVI: zone.mean_ndvi || 0,
    Speed: zone.avg_speed_kmh || 0,
    Fuel: zone.avg_fuel_l_ha || 0,
    Applied: zone.avg_applied_rate_kg_ha || 0,
    Records: zone.record_count,
    productivity: zone.productivity_class,
  }));

  return (
    <div className="space-y-6">
      {/* NDVI Comparison */}
      <div>
        <h4 className="text-sm font-medium text-slate-300 mb-3">NDVI by Zone</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 1]} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Bar dataKey="NDVI" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Multi-metric comparison */}
      <div>
        <h4 className="text-sm font-medium text-slate-300 mb-3">Machine Metrics by Zone</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #475569" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
            <Legend wrapperStyle={{ color: "#94a3b8" }} />
            <Bar dataKey="Speed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Speed (km/h)" />
            <Bar dataKey="Fuel" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Fuel (L/ha)" />
            <Bar dataKey="Applied" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Applied Rate (kg/ha)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-2 px-3">Zone</th>
              <th className="text-left py-2 px-3">Class</th>
              <th className="text-right py-2 px-3">Area (ha)</th>
              <th className="text-right py-2 px-3">Records</th>
              <th className="text-right py-2 px-3">NDVI</th>
              <th className="text-right py-2 px-3">Speed</th>
              <th className="text-right py-2 px-3">Fuel</th>
            </tr>
          </thead>
          <tbody>
            {data.map((zone) => (
              <tr key={zone.zone_label} className="border-b border-slate-800 text-slate-300">
                <td className="py-2 px-3 font-medium">Zone {zone.zone_label}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      zone.productivity_class === "high"
                        ? "bg-green-900/50 text-green-300"
                        : zone.productivity_class === "medium"
                        ? "bg-yellow-900/50 text-yellow-300"
                        : "bg-red-900/50 text-red-300"
                    }`}
                  >
                    {zone.productivity_class}
                  </span>
                </td>
                <td className="py-2 px-3 text-right font-mono">{zone.area_ha?.toFixed(1) || "—"}</td>
                <td className="py-2 px-3 text-right font-mono">{zone.record_count}</td>
                <td className="py-2 px-3 text-right font-mono">{zone.mean_ndvi?.toFixed(3) || "—"}</td>
                <td className="py-2 px-3 text-right font-mono">{zone.avg_speed_kmh?.toFixed(1) || "—"} km/h</td>
                <td className="py-2 px-3 text-right font-mono">{zone.avg_fuel_l_ha?.toFixed(1) || "—"} L/ha</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
