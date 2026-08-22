import { useState } from "react";
import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import { useGeneratePrescription, useExportISOBUS, useExportShapefile } from "@/hooks/usePrescription";
import { prescriptionsApi } from "@/api/prescriptions";
import type { Prescription } from "@/types";
import { Bot, Download, FileText, Settings, Sparkles } from "lucide-react";

export function PrescriptionsPage() {
  const { data: fieldsData } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const fields = fieldsData?.fields || [];
  const fieldId = selectedFieldId || fields[0]?.id;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [inputType, setInputType] = useState("nitrogen");

  const generateMutation = useGeneratePrescription(fieldId || "");
  const exportISOBUS = useExportISOBUS();
  const exportShapefile = useExportShapefile();

  const handleGenerate = async () => {
    if (!fieldId) return;
    try {
      const result = await generateMutation.mutateAsync(inputType);
      setPrescription(result);
    } catch (err) {
      console.error("Generation failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AI Prescription Builder</h2>
          <p className="text-slate-400 text-sm mt-1">
            Generate variable-rate application prescriptions using DeepSeek V4
          </p>
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

          <select
            value={inputType}
            onChange={(e) => setInputType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="nitrogen">Nitrogen (N)</option>
            <option value="potassium">Potassium (K)</option>
            <option value="phosphorus">Phosphorus (P)</option>
            <option value="herbicide">Herbicide</option>
            <option value="fungicide">Fungicide</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={!fieldId || generateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-agro-600 hover:bg-agro-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {generateMutation.isPending ? (
              <Sparkles size={16} className="animate-pulse" />
            ) : (
              <Bot size={16} />
            )}
            {generateMutation.isPending ? "Generating..." : "Generate Prescription"}
          </button>
        </div>
      </div>

      {/* Prescription Result */}
      {!prescription && !generateMutation.isPending ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
          <Bot size={48} className="mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400">
            Click "Generate Prescription" to create a VRA plan using DeepSeek V4 AI.
          </p>
          <p className="text-slate-500 text-sm mt-2">
            The AI considers zone NDVI, productivity class, and economic optimization.
          </p>
        </div>
      ) : generateMutation.isPending ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
          <Sparkles size={48} className="mx-auto text-agro-400 animate-pulse mb-4" />
          <p className="text-white font-medium">DeepSeek V4 is generating your prescription...</p>
          <p className="text-slate-400 text-sm mt-2">Analyzing zone metrics and computing optimal rates</p>
        </div>
      ) : prescription && (
        <div className="space-y-6">
          {/* Header card */}
          <div className="bg-gradient-to-r from-agro-600/20 to-blue-600/20 border border-agro-500/20 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">
                  {prescription.input_type.charAt(0).toUpperCase() + prescription.input_type.slice(1)} Prescription
                </h3>
                <p className="text-slate-300 text-sm mt-1">
                  Field Average: {prescription.total_estimated_input?.toFixed(1)} kg/ha •{" "}
                  Status: <span className="text-agro-400">{prescription.status}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => prescription && exportISOBUS.mutate(prescription.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  <FileText size={14} /> ISOBUS XML
                </button>
                <button
                  onClick={() => prescription && exportShapefile.mutate(prescription.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  <Download size={14} /> Shapefile
                </button>
              </div>
            </div>
          </div>

          {/* Zone rates */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-4">Zone Application Rates</h3>
            <div className="space-y-3">
              {prescription.zones.map((zone) => {
                const maxRate = Math.max(...prescription.zones.map((z) => z.application_rate));
                const pct = (zone.application_rate / maxRate) * 100;
                return (
                  <div key={zone.zone_label} className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">Zone {zone.zone_label}</span>
                      <span className="font-mono text-agro-400 font-bold">
                        {zone.application_rate.toFixed(1)} kg/ha
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 mb-2">
                      <div
                        className="bg-agro-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400">{zone.rationale}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operator notes */}
          {prescription.operator_notes && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-white mb-3">Operator Notes</h3>
              <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/50 rounded-lg p-4">
                {prescription.operator_notes}
              </pre>
            </div>
          )}

          {/* AI Model info */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-3">AI Model Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Model</span>
                <p className="text-white font-mono">{prescription.deepseek_model || "deepseek-v4-pro"}</p>
              </div>
              <div>
                <span className="text-slate-400">Status</span>
                <p className="text-agro-400">{prescription.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
