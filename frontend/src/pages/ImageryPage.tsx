import { useState } from "react";
import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import { useDeviceType } from "@/hooks/useDeviceType";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { imageryApi } from "@/api/imagery";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Satellite, Leaf } from "lucide-react";

export function ImageryPage() {
  const { data: fieldsData } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const { isPhone } = useDeviceType();
  const queryClient = useQueryClient();
  const fields = fieldsData?.fields || [];
  const fieldId = selectedFieldId || fields[0]?.id;

  const [ndviResult, setNdviResult] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!fieldId) return;
    setAnalyzing(true);
    try {
      const result = await imageryApi.analyze(fieldId);
      setNdviResult(result);
      queryClient.invalidateQueries({ queryKey: ["fields"] });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-5 p-4 lg:p-6 animate-fade-in-up">
      {/* Header */}
      <div className={"flex items-center justify-between flex-wrap gap-3 " + (isPhone ? "flex-col items-start" : "")}>
        <div>
          <h2 className="text-lg font-bold text-earth-100">Съёмка и диагностика</h2>
          <p className="text-field-300 text-xs mt-1">Анализ НДВИ и ИИ-диагностика культур</p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={handleAnalyze}
            disabled={!fieldId || analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-agro-600 hover:bg-agro-500 disabled:opacity-50 text-earth-100 rounded-lg text-sm font-medium transition-colors"
          >
            <Satellite size={16} />
            {analyzing ? "Анализ..." : "Рассчитать НДВИ"}
          </button>
        </div>
      </div>

      {/* Диагностика по снимкам дронов */}
      <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-3">Диагностика по снимкам дронов</h3>
        <ImageUploader fieldId={fieldId || ""} />
      </div>

      {/* NDVI Results */}
      {ndviResult && (
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4 animate-pop-in">
          <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-3">Анализ растительности</h3>

          {/* Summary */}
          <div className={"grid gap-3 mb-4 " + (isPhone ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4")}>
            <div className="bg-canopy-900/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Leaf size={10} className="text-field-300" />
                <span className="text-[10px] text-field-300 uppercase">Ср. НДВИ</span>
              </div>
              <span className="text-lg font-bold text-earth-100">{ndviResult.vegetation_indices?.ndvi?.mean?.toFixed(3) || "—"}</span>
            </div>
            <div className="bg-canopy-900/40 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Leaf size={10} className="text-field-300" />
                <span className="text-[10px] text-field-300 uppercase">Ср. НДРЕ</span>
              </div>
              <span className="text-lg font-bold text-earth-100">{ndviResult.vegetation_indices?.ndre?.mean?.toFixed(3) || "—"}</span>
            </div>
            <div className="bg-canopy-900/40 rounded-lg p-3">
              <span className="text-[10px] text-field-300 uppercase">Источник</span>
              <p className="text-sm text-earth-100 mt-1">{ndviResult.source || "—"}</p>
            </div>
            <div className="bg-canopy-900/40 rounded-lg p-3">
              <span className="text-[10px] text-field-300 uppercase">Зоны</span>
              <p className="text-sm text-earth-100 mt-1">{ndviResult.zone_stats?.length || 0}</p>
            </div>
          </div>

          {/* Zone breakdown */}
          {ndviResult.zone_stats && ndviResult.zone_stats.length > 0 && (
            <div className="space-y-2">
              {ndviResult.zone_stats.map((z: any) => (
                <div key={z.zone_label} className="flex items-center gap-3 bg-canopy-900/40 rounded-lg px-3 py-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      (z.mean_ndvi || 0.5) >= 0.6 ? "bg-agro-500" : (z.mean_ndvi || 0.5) >= 0.4 ? "bg-earth-300" : "bg-red-500"
                    }`}
                  />
                  <span className="text-xs font-medium text-earth-100 w-16">Зона {z.zone_label}</span>
                  <div className="flex-1 h-1.5 bg-canopy-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (z.mean_ndvi || 0.5) >= 0.6 ? "bg-agro-500" : (z.mean_ndvi || 0.5) >= 0.4 ? "bg-earth-300" : "bg-red-500"
                      }`}
                      style={{ width: `${((z.mean_ndvi || 0.5) / 1.0) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-field-300 font-mono w-12 text-right">{z.mean_ndvi?.toFixed(3)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
