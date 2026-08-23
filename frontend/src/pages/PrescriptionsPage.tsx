import { useState } from "react";
import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import { useGeneratePrescription, useExportISOBUS, useExportShapefile } from "@/hooks/usePrescription";
import type { Prescription } from "@/types";
import { Bot, Download, FileText, Sparkles, ChevronDown } from "lucide-react";

export function PrescriptionsPage() {
  const { data: fieldsData } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const fields = fieldsData?.fields || [];
  const fieldId = selectedFieldId || fields[0]?.id;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
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
    <div className="space-y-5 p-4 lg:p-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-earth-100">AI Prescription Builder</h2>
          <p className="text-field-300 text-xs mt-1">Generate VRA prescriptions using DeepSeek V4</p>
        </div>

        <div className="flex items-center gap-2">
          {fields.length > 0 && (
            <div className="relative">
              <select
                value={fieldId || ""}
                onChange={(e) => selectField(e.target.value)}
                className="appearance-none bg-canopy-800/60 border border-canopy-700/60 rounded-lg pl-3 pr-8 py-2 text-sm text-earth-100 cursor-pointer focus:border-earth-300/60 focus:outline-none" style={{ colorScheme: "dark" }}
              >
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-field-300 pointer-events-none" />
            </div>
          )}

          <div className="relative">
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
              className="appearance-none bg-canopy-800/60 border border-canopy-700/60 rounded-lg pl-3 pr-8 py-2 text-sm text-earth-100 cursor-pointer focus:border-earth-300/60 focus:outline-none" style={{ colorScheme: "dark" }}
            >
              <option value="nitrogen">Nitrogen (N)</option>
              <option value="potassium">Potassium (K)</option>
              <option value="phosphorus">Phosphorus (P)</option>
              <option value="herbicide">Herbicide</option>
              <option value="fungicide">Fungicide</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-field-300 pointer-events-none" />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!fieldId || generateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-agro-600 hover:bg-agro-500 disabled:opacity-50 text-earth-100 rounded-lg text-sm font-medium transition-colors"
          >
            {generateMutation.isPending ? (
              <Sparkles size={16} className="animate-pulse" />
            ) : (
              <Bot size={16} />
            )}
            {generateMutation.isPending ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Prescription Result */}
      {!prescription && !generateMutation.isPending ? (
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-10 text-center">
          <Bot size={40} className="mx-auto text-canopy-600 mb-4" />
          <p className="text-field-300 text-sm">
            Click "Generate" to create a VRA plan using DeepSeek V4 AI.
          </p>
          <p className="text-canopy-600 text-xs mt-2">
            The AI considers zone NDVI, productivity class, and economic optimization.
          </p>
        </div>
      ) : generateMutation.isPending ? (
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-10 text-center">
          <Sparkles size={40} className="mx-auto text-earth-300 animate-pulse mb-4" />
          <p className="text-earth-100 font-medium text-sm">DeepSeek V4 is generating your prescription...</p>
          <p className="text-field-300 text-xs mt-2">Analyzing zone metrics and computing optimal rates</p>
        </div>
      ) : prescription && (
        <div className="space-y-4">
          {/* Header card */}
          <div className="bg-gradient-to-r from-canopy-800/60 to-canopy-900/40 border border-canopy-700/40 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-bold text-earth-100 text-sm">
                  {prescription.input_type.charAt(0).toUpperCase() + prescription.input_type.slice(1)} Prescription
                </h3>
                <p className="text-field-300 text-xs mt-1">
                  Avg: {prescription.total_estimated_input?.toFixed(1)} kg/ha · Status: <span className="text-agro-400">{prescription.status}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => prescription && exportISOBUS.mutate(prescription.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-canopy-800/60 hover:bg-canopy-700/60 border border-canopy-700/60 text-earth-200 rounded-lg text-xs transition-colors"
                >
                  <FileText size={12} /> ISOBUS XML
                </button>
                <button
                  onClick={() => prescription && exportShapefile.mutate(prescription.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-canopy-800/60 hover:bg-canopy-700/60 border border-canopy-700/60 text-earth-200 rounded-lg text-xs transition-colors"
                >
                  <Download size={12} /> Shapefile
                </button>
              </div>
            </div>
          </div>

          {/* Zone rates */}
          <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-3">Zone Application Rates</h3>
            <div className="space-y-2">
              {prescription.zones.map((zone) => {
                const maxRate = Math.max(...prescription.zones.map((z) => z.application_rate));
                const pct = (zone.application_rate / maxRate) * 100;
                return (
                  <div key={zone.zone_label} className="bg-canopy-900/40 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-earth-100">Zone {zone.zone_label}</span>
                      <span className="font-mono text-agro-400 text-xs font-bold">{zone.application_rate.toFixed(1)} kg/ha</span>
                    </div>
                    <div className="w-full bg-canopy-700 rounded-full h-1.5 mb-1.5">
                      <div className="bg-agro-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-field-300">{zone.rationale}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operator notes */}
          {prescription.operator_notes && (
            <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-2">Operator Notes</h3>
              <pre className="text-xs text-field-200 whitespace-pre-wrap font-mono bg-canopy-900/40 rounded-lg p-3">
                {prescription.operator_notes}
              </pre>
            </div>
          )}

          {/* AI Model info */}
          <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-earth-100 uppercase tracking-wide mb-2">AI Model Details</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-field-300">Model</span>
                <p className="text-earth-100 font-mono">{prescription.deepseek_model || "deepseek-v4-pro"}</p>
              </div>
              <div>
                <span className="text-field-300">Status</span>
                <p className="text-agro-400">{prescription.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
