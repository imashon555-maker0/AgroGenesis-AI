import { useFields } from "@/hooks/useFields";
import { useTelemetryStats } from "@/hooks/useTelemetry";
import { useFieldStore } from "@/stores/fieldStore";
import { TelemetryDropZone } from "@/components/upload/TelemetryDropZone";
import { ZoneComparison } from "@/components/charts/ZoneComparison";
import { ChevronDown } from "lucide-react";

export function TelemetryPage() {
  const { data: fieldsData } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const fields = fieldsData?.fields || [];
  const fieldId = selectedFieldId || fields[0]?.id;
  const { data: stats, isLoading: statsLoading } = useTelemetryStats(fieldId || null);

  return (
    <div className="space-y-5 p-4 lg:p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-earth-100">Telemetry Monitor</h2>
          <p className="text-field-300 text-xs mt-1">Machine data and zone-level aggregation</p>
        </div>
        {fields.length > 0 && (
          <div className="relative">
            <select
              value={fieldId || ""}
              onChange={(e) => selectField(e.target.value)}
              className="appearance-none bg-canopy-800/60 border border-canopy-700/60 rounded-lg pl-3 pr-8 py-2 text-sm text-earth-100 cursor-pointer focus:border-earth-300/60 focus:outline-none"
              style={{ colorScheme: "dark" }}
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-field-300 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-3">Upload Telemetry Data</h3>
        {fieldId ? (
          <TelemetryDropZone fieldId={fieldId} />
        ) : (
          <p className="text-field-300 text-xs">Select a field to enable file upload</p>
        )}
      </div>

      {/* Zone Stats */}
      {fieldId && (
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-3">Zone Statistics</h3>
          {statsLoading ? (
            <div className="text-field-300 text-xs">Loading stats...</div>
          ) : stats && stats.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.zone_id} className="bg-canopy-900/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        s.productivity_class === "high"
                          ? "bg-agro-500"
                          : s.productivity_class === "medium"
                          ? "bg-earth-300"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs font-medium text-earth-100">Zone {s.zone_label}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-field-300">Records</span>
                      <span className="text-earth-100 font-mono">{s.record_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-field-300">Speed</span>
                      <span className="text-earth-100 font-mono">{s.avg_speed_kmh?.toFixed(1) || "—"} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-field-300">Fuel</span>
                      <span className="text-earth-100 font-mono">{s.avg_fuel_l_ha?.toFixed(1) || "—"} L/ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-field-300">Applied</span>
                      <span className="text-earth-100 font-mono">{s.avg_applied_rate_kg_ha?.toFixed(1) || "—"} kg/ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-field-300">NDVI</span>
                      <span className="text-earth-100 font-mono">{s.mean_ndvi?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-field-300 text-xs">No telemetry data yet. Upload a CSV file above.</p>
          )}
        </div>
      )}

      {/* Charts */}
      {stats && stats.length > 0 && (
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-3">Zone Comparison</h3>
          <ZoneComparison stats={stats} />
        </div>
      )}
    </div>
  );
}
