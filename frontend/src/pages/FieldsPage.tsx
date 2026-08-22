import { useFields } from "@/hooks/useFields";

export function FieldsPage() {
  const { data, isLoading } = useFields();
  const fields = data?.fields || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Field Management</h2>
          <p className="text-slate-400 text-sm mt-1">Manage your farm field boundaries and zones</p>
        </div>
        <button className="px-4 py-2 bg-agro-600 hover:bg-agro-700 text-white rounded-lg text-sm font-medium transition-colors">
          + Add Field
        </button>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Loading fields...</div>
      ) : fields.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
          <p className="text-slate-400">No fields yet. Create your first field to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field) => (
            <div
              key={field.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-agro-500/30 transition-colors"
            >
              <h3 className="font-semibold text-white text-lg">{field.name}</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Area</span>
                  <span className="font-mono">{field.area_ha?.toFixed(1) || "—"} ha</span>
                </div>
                <div className="flex justify-between">
                  <span>Soil Type</span>
                  <span>{field.soil_type || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Crop</span>
                  <span>{field.crop_type || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zones</span>
                  <span>{field.zones.length}</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {field.zones.map((z) => (
                  <span
                    key={z.id}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      z.productivity_class === "high"
                        ? "bg-green-900/50 text-green-300"
                        : z.productivity_class === "medium"
                        ? "bg-yellow-900/50 text-yellow-300"
                        : "bg-red-900/50 text-red-300"
                    }`}
                  >
                    {z.zone_label}: {z.productivity_class}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
