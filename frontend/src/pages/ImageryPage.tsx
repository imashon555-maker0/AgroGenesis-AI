import { useState } from "react";
import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import { imageryApi } from "@/api/imagery";
import { Satellite, Upload, RefreshCw } from "lucide-react";

export function ImageryPage() {
  const { data: fieldsData } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const fields = fieldsData?.fields || [];
  const fieldId = selectedFieldId || fields[0]?.id;

  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!fieldId) return;
    setIsAnalyzing(true);
    try {
      const result = await imageryApi.analyze(fieldId);
      setAnalysis(result);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Satellite & Drone Imagery</h2>
          <p className="text-slate-400 text-sm mt-1">NDVI/NDRE analysis and crop health monitoring</p>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={handleAnalyze}
            disabled={!fieldId || isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-agro-600 hover:bg-agro-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Satellite size={16} />}
            {isAnalyzing ? "Analyzing..." : "Run NDVI Analysis"}
          </button>
        </div>
      </div>

      {!fieldId ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center text-slate-400">
          Select a field to analyze imagery.
        </div>
      ) : !analysis ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
          <Satellite size={48} className="mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400">Click "Run NDVI Analysis" to process satellite imagery for this field.</p>
          <p className="text-slate-500 text-sm mt-2">
            Uses synthetic Sentinel-2 data for demo. Connect real data in production.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Vegetation Index Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-green-400 mb-3">NDVI (Normalized Difference Vegetation Index)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Mean</span>
                  <span className="font-mono">{analysis.vegetation_indices.ndvi.mean.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Std Dev</span>
                  <span className="font-mono">{analysis.vegetation_indices.ndvi.std.toFixed(4)}</span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1">Class Distribution</p>
                  <div className="flex gap-1 h-6">
                    {Object.entries(analysis.vegetation_indices.ndvi.class_fractions).map(
                      ([cls, frac]) => (
                        <div
                          key={cls}
                          className={`rounded ${
                            cls === "5"
                              ? "bg-green-600"
                              : cls === "4"
                              ? "bg-green-400"
                              : cls === "3"
                              ? "bg-yellow-500"
                              : cls === "2"
                              ? "bg-orange-500"
                              : cls === "1"
                              ? "bg-red-500"
                              : "bg-slate-600"
                          }`}
                          style={{ width: `${(frac as number) * 100}%` }}
                          title={`Class ${cls}: ${((frac as number) * 100).toFixed(1)}%`}
                        />
                      )
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Bare</span>
                    <span>Poor</span>
                    <span>Moderate</span>
                    <span>Good</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-emerald-400 mb-3">NDRE (Normalized Difference Red Edge)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Mean</span>
                  <span className="font-mono">{analysis.vegetation_indices.ndre.mean.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Std Dev</span>
                  <span className="font-mono">{analysis.vegetation_indices.ndre.std.toFixed(4)}</span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1">Class Distribution</p>
                  <div className="flex gap-1 h-6">
                    {Object.entries(analysis.vegetation_indices.ndre.class_fractions).map(
                      ([cls, frac]) => (
                        <div
                          key={cls}
                          className={`rounded ${
                            cls === "5"
                              ? "bg-emerald-600"
                              : cls === "4"
                              ? "bg-emerald-400"
                              : cls === "3"
                              ? "bg-teal-500"
                              : cls === "2"
                              ? "bg-amber-500"
                              : cls === "1"
                              ? "bg-red-500"
                              : "bg-slate-600"
                          }`}
                          style={{ width: `${(frac as number) * 100}%` }}
                          title={`Class ${cls}: ${((frac as number) * 100).toFixed(1)}%`}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Zone-level stats */}
          {analysis.zone_stats && analysis.zone_stats.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-4">Zone Vegetation Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {analysis.zone_stats.map((z: any) => (
                  <div key={z.zone_label} className="bg-slate-900/50 rounded-lg p-3">
                    <span className="font-medium text-white">Zone {z.zone_label}</span>
                    <div className="mt-2 space-y-1 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span>NDVI</span>
                        <span className="font-mono">{z.mean_ndvi?.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>NDRE</span>
                        <span className="font-mono">{z.mean_ndre?.toFixed(3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pixels</span>
                        <span className="font-mono">{z.pixel_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image upload for diagnosis */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-3">Drone Image Diagnosis</h3>
        <p className="text-slate-400 text-sm mb-4">
          Upload a drone or leaf-level photograph for AI-powered crop health diagnosis.
        </p>
        <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
          <Upload size={32} className="mx-auto text-slate-500 mb-3" />
          <p className="text-slate-400 text-sm">Drag and drop an image, or click to browse</p>
          <p className="text-slate-500 text-xs mt-1">Supports JPEG, PNG up to 10MB</p>
        </div>
      </div>
    </div>
  );
}
