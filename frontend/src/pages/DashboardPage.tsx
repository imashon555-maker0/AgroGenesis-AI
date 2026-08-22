import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import { MetricCard } from "@/components/shared/MetricCard";
import { FieldMap } from "@/components/map/FieldMap";
import {
  Wheat,
  MapPin,
  Satellite,
  TrendingUp,
  DollarSign,
  Leaf,
} from "lucide-react";

export function DashboardPage() {
  const { data, isLoading } = useFields();
  const { selectedFieldId } = useFieldStore();

  const fields = data?.fields || [];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-agro-600/20 to-agro-800/10 border border-agro-500/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white">🌾 AgroGenesis AI Dashboard</h2>
        <p className="text-slate-300 mt-1">
          Precision agriculture decision-support platform powered by DeepSeek V4.
          Monitor fields, analyze imagery, and generate VRA prescriptions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Fields"
          value={fields.length.toString()}
          icon={<MapPin size={18} />}
          color="green"
        />
        <MetricCard
          title="Total Area"
          value={`${fields.reduce((s, f) => s + (f.area_ha || 0), 0).toFixed(0)}`}
          unit="ha"
          icon={<Wheat size={18} />}
          color="yellow"
        />
        <MetricCard
          title="Active Zones"
          value={fields.reduce((s, f) => s + f.zones.length, 0).toString()}
          icon={<MapPin size={18} />}
          color="blue"
        />
        <MetricCard
          title="Avg NDVI"
          value="0.62"
          icon={<Satellite size={18} />}
          color="green"
        />
        <MetricCard
          title="Cost Savings"
          value="$21.77"
          unit="/ha"
          icon={<DollarSign size={18} />}
          color="emerald"
        />
        <MetricCard
          title="Carbon Credits"
          value="0.42"
          unit="tCO₂e/ha"
          icon={<Leaf size={18} />}
          color="teal"
        />
      </div>

      {/* Map + Field list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 h-[500px] rounded-xl overflow-hidden border border-slate-700/50">
          <FieldMap
            selectedFieldId={selectedFieldId || fields[0]?.id}
            showZones={true}
          />
        </div>

        {/* Field list */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-200">Your Fields</h3>
          {isLoading ? (
            <div className="text-slate-400 text-sm">Loading fields...</div>
          ) : fields.length === 0 ? (
            <div className="text-slate-500 text-sm bg-slate-800/50 rounded-lg p-4">
              No fields found. Run the seed script or create a field to get started.
            </div>
          ) : (
            fields.map((field) => (
              <div
                key={field.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 cursor-pointer hover:border-agro-500/50 transition-colors"
              >
                <h4 className="font-medium text-white">{field.name}</h4>
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  <span>{field.area_ha?.toFixed(0) || "—"} ha</span>
                  <span>{field.zones.length} zones</span>
                  <span>{field.crop_type || "N/A"}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  {field.zones.map((z) => (
                    <span
                      key={z.id}
                      className={`px-2 py-0.5 rounded text-xs ${
                        z.productivity_class === "high"
                          ? "bg-green-900/50 text-green-300"
                          : z.productivity_class === "medium"
                          ? "bg-yellow-900/50 text-yellow-300"
                          : "bg-red-900/50 text-red-300"
                      }`}
                    >
                      Zone {z.zone_label}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
