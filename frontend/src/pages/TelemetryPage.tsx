import { useFields } from "@/hooks/useFields";
import { useTelemetryStats } from "@/hooks/useTelemetry";
import { useFieldStore } from "@/stores/fieldStore";
import { ZoneComparison } from "@/components/charts/ZoneComparison";

export function TelemetryPage() {
  const { data: fieldsData } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const fields = fieldsData?.fields || [];
  const fieldId = selectedFieldId || fields[0]?.id;

  const { data: stats, isLoading } = useTelemetryStats(fieldId || null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Telemetry Monitor</h2>
          <p className="text-slate-400 text-sm mt-1">Machine data and zone-level aggregation</p>
        </div>

        {fields.length > 0 && (
          <select
            value={fieldId || ""}
            onChange={(e) => selectField(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {!fieldId ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
          Select a field to view telemetry data.
        </div>
      ) : isLoading ? (
        <div className="text-slate-400">Loading telemetry data...</div>
      ) : !stats || stats.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
          No telemetry data available. Upload J1939 or ISOBUS data to get started.
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.zone_label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-white">Zone {s.zone_label}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      s.productivity_class === "high"
                        ? "bg-green-900/50 text-green-300"
                        : s.productivity_class === "medium"
                        ? "bg-yellow-900/50 text-yellow-300"
                        : "bg-red-900/50 text-red-300"
                    }`}
                  >
                    {s.productivity_class}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Records</span>
                    <span className="font-mono">{s.record_count}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Avg Speed</span>
                    <span className="font-mono">{s.avg_speed_kmh?.toFixed(1) || "—"} km/h</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Fuel (L/ha)</span>
                    <span className="font-mono">{s.avg_fuel_l_ha?.toFixed(1) || "—"}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Applied Rate</span>
                    <span className="font-mono">{s.avg_applied_rate_kg_ha?.toFixed(1) || "—"} kg/ha</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>NDVI</span>
                    <span className="font-mono">{s.mean_ndvi?.toFixed(3) || "—"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Zone comparison chart */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="font-semibold text-white mb-4">Zone Comparison</h3>
            <ZoneComparison data={stats} />
          </div>
        </>
      )}
    </div>
  );
}
