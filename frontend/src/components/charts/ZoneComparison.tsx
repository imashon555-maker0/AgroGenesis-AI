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
  stats: TelemetryStats[];
  data?: TelemetryStats[];
}

export function ZoneComparison({ stats, data: dataProp }: ZoneComparisonProps) {
  const data = stats || dataProp || [];
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
        <h4 className="text-xs font-medium text-field-300 mb-3 uppercase tracking-wide">NDVI by Zone</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a35" />
            <XAxis dataKey="name" tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <YAxis tick={{ fill: "#c8d5c0", fontSize: 11 }} domain={[0, 1]} />
            <Tooltip
              contentStyle={{ background: "#1a3326", border: "1px solid #2d4a35", color: "#f5e6c8" }}
              labelStyle={{ color: "#f5e6c8" }}
            />
            <Bar dataKey="NDVI" fill="#2d8a4e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Multi-metric comparison */}
      <div>
        <h4 className="text-xs font-medium text-field-300 mb-3 uppercase tracking-wide">Machine Metrics by Zone</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a35" />
            <XAxis dataKey="name" tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <YAxis tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1a3326", border: "1px solid #2d4a35", color: "#f5e6c8" }}
              labelStyle={{ color: "#f5e6c8" }}
            />
            <Legend wrapperStyle={{ color: "#c8d5c0" }} />
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
            <tr className="text-field-300 border-b border-canopy-700/60">
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
              <tr key={zone.zone_label} className="border-b border-canopy-800/60 text-field-200">
                <td className="py-2 px-3 font-medium">Zone {zone.zone_label}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      zone.productivity_class === "high"
                        ? "bg-canopy-800/60 text-agro-300"
                        : zone.productivity_class === "medium"
                        ? "bg-canopy-800/60 text-earth-300"
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
