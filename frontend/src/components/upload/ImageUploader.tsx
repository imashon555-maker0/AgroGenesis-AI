import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, Bug, Leaf, AlertTriangle } from "lucide-react";
import { imageryApi } from "@/api/imagery";
import { useToast } from "@/components/shared/Toast";
import type { DiagnosisResult } from "@/types";

interface ImageUploaderProps {
  fieldId?: string;
  onDiagnosis?: (result: DiagnosisResult) => void;
}

export function ImageUploader({ fieldId: _fieldId, onDiagnosis }: ImageUploaderProps) {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      addToast("Загрузите изображение (JPEG или PNG)", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setDiagnosis(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!preview) return;

    setIsAnalyzing(true);
    try {
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = preview.split(",")[1];
      const result = await imageryApi.diagnose(base64, context);
      setDiagnosis(result);
      onDiagnosis?.(result);
      addToast(`Diagnosis: ${result.condition.replace(/_/g, " ")} (${(result.confidence * 100).toFixed(0)}% confidence)`, "info");
    } catch (err: any) {
      addToast(`Ошибка диагностики: ${err.message}`, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setContext("");
    setDiagnosis(null);
  };

  const conditionIcons: Record<string, any> = {
    healthy: Leaf,
    nitrogen_deficiency: AlertTriangle,
    fungal_infection: Bug,
    pest_damage: Bug,
    water_stress: AlertTriangle,
    weed_infestation: Leaf,
  };

  const severityColors: Record<string, string> = {
    mild: "text-yellow-400 bg-yellow-900/30 border-yellow-500/30",
    moderate: "text-orange-400 bg-orange-900/30 border-orange-500/30",
    severe: "text-red-400 bg-red-900/30 border-red-500/30",
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        /* Upload area */
        <div className="grid grid-cols-2 gap-3">
          {/* File upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-canopy-700/60 rounded-xl cursor-pointer hover:border-earth-300/40 hover:bg-canopy-800/30 transition-all duration-200"
          >
            <Upload size={28} className="text-field-400" />
            <span className="text-sm text-field-300">Загрузить фото</span>
            <span className="text-xs text-field-400">JPEG, PNG до 10MB</span>
          </div>

          {/* Camera capture (mobile) */}
          <div
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-canopy-700/60 rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-canopy-800/30 transition-all duration-200"
          >
            <Camera size={28} className="text-field-400" />
            <span className="text-sm text-field-300">Сфотографировать</span>
            <span className="text-xs text-field-400">Использовать камеру</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        /* Preview + analyze */
        <div className="animate-fade-in-up">
          {/* Image preview */}
          <div className="relative rounded-xl overflow-hidden border border-canopy-700/60">
            <img
              src={preview}
              alt="Crop image"
              className="w-full h-64 object-cover"
            />
            <button
              onClick={reset}
              className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Context input */}
          <div className="mt-3">
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Optional: describe what you see (e.g., 'yellowing on lower leaves')"
              className="w-full bg-canopy-900/60 border border-canopy-700/60 rounded-lg px-3 py-2.5 text-sm text-earth-100 placeholder-field-400 focus:border-earth-300/60 focus:ring-1 focus:ring-earth-300/30 outline-none transition-colors"
            />
          </div>

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all duration-200"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin-slow" />
                Анализ через DeepSeek V4 Vision...
              </>
            ) : (
              <>
                <Bug size={16} />
                Анализ здоровья культур
              </>
            )}
          </button>

          {/* Progress bar */}
          {isAnalyzing && (
            <div className="h-1.5 bg-canopy-700 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                style={{ backgroundSize: "200% 100%", animation: "shimmer 1.5s linear infinite", width: "100%" }}
              />
            </div>
          )}
        </div>
      )}

      {/* Diagnosis result */}
      {diagnosis && (
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-5 animate-pop-in">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-canopy-800/60 flex items-center justify-center shrink-0">
              {(() => {
                const Icon = conditionIcons[diagnosis.condition] || Leaf;
                return <Icon size={24} className="text-agro-400" />;
              })()}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-earth-100 text-lg capitalize">
                {diagnosis.condition.replace(/_/g, " ")}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severityColors[diagnosis.severity] || ""}`}>
                  {diagnosis.severity}
                </span>
                <span className="text-sm text-field-300">
                  {(diagnosis.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-field-200 mb-3">{diagnosis.description}</p>

          {diagnosis.affected_areas.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-field-300 mb-1">Поражённые области</p>
              <div className="flex flex-wrap gap-1">
                {diagnosis.affected_areas.map((area, i) => (
                  <span key={i} className="px-2 py-0.5 bg-canopy-800/60 rounded text-xs text-field-200">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-canopy-900/40 rounded-lg p-3">
            <p className="text-xs text-field-300 mb-1">Рекомендуемое действие</p>
            <p className="text-sm text-earth-300">{diagnosis.recommended_action}</p>
          </div>
        </div>
      )}
    </div>
  );
}
