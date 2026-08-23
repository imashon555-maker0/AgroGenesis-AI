import { useState, useRef } from "react";
import { X, Upload, MapPin, FileJson } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fieldsApi } from "@/api/fields";
import { useToast } from "@/components/shared/Toast";

interface FieldCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FieldCreationModal({ isOpen, onClose }: FieldCreationModalProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [soilType, setSoilType] = useState("");
  const [cropType, setCropType] = useState("");
  const [geometryText, setGeometryText] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: (data: { name: string; geometry: object; soil_type?: string; crop_type?: string }) =>
      fieldsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      addToast("Field created successfully!", "success");
      resetForm();
      onClose();
    },
    onError: (err: any) => {
      addToast(`Failed to create field: ${err.message}`, "error");
      setError(err.message);
    },
  });

  const resetForm = () => {
    setName("");
    setSoilType("");
    setCropType("");
    setGeometryText("");
    setFileName("");
    setError("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const geo = JSON.parse(text);
        // Accept raw geometry or Feature/FeatureCollection
        if (geo.type === "Polygon" || geo.type === "MultiPolygon") {
          setGeometryText(JSON.stringify(geo));
        } else if (geo.type === "Feature") {
          setGeometryText(JSON.stringify(geo.geometry));
        } else if (geo.type === "FeatureCollection" && geo.features?.[0]) {
          setGeometryText(JSON.stringify(geo.features[0].geometry));
        } else {
          setGeometryText(text);
        }
        setError("");
      } catch {
        setError("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError("Field name is required");
      return;
    }
    if (!geometryText.trim()) {
      setError("Field boundary geometry is required");
      return;
    }

    try {
      const geometry = JSON.parse(geometryText);
      createMutation.mutate({
        name: name.trim(),
        geometry,
        soil_type: soilType || undefined,
        crop_type: cropType || undefined,
      });
    } catch {
      setError("Invalid geometry JSON");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-field-900 border border-canopy-700/60 rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-canopy-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-canopy-800/60 flex items-center justify-center">
              <MapPin size={20} className="text-earth-300" />
            </div>
            <div>
              <h3 className="font-bold text-earth-100 text-lg">Create New Field</h3>
              <p className="text-xs text-field-300">Define boundary and metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-field-300 hover:text-earth-100 hover:bg-canopy-800/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Field Name */}
          <div>
            <label className="block text-sm font-medium text-field-200 mb-1.5">Field Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g., Northern Quarter"
              className="w-full bg-canopy-900/60 border border-canopy-700/60 rounded-lg px-3 py-2.5 text-sm text-earth-100 placeholder-field-400 focus:border-earth-300/60 focus:ring-1 focus:ring-earth-300/30 outline-none transition-colors"
            />
          </div>

          {/* Soil + Crop row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-field-200 mb-1.5">Soil Type</label>
              <input
                type="text"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                placeholder="e.g., Chernozem"
                className="w-full bg-canopy-900/60 border border-canopy-700/60 rounded-lg px-3 py-2.5 text-sm text-earth-100 placeholder-field-400 focus:border-earth-300/60 focus:ring-1 focus:ring-earth-300/30 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-field-200 mb-1.5">Crop Type</label>
              <input
                type="text"
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                placeholder="e.g., Winter Wheat"
                className="w-full bg-canopy-900/60 border border-canopy-700/60 rounded-lg px-3 py-2.5 text-sm text-earth-100 placeholder-field-400 focus:border-earth-300/60 focus:ring-1 focus:ring-earth-300/30 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Geometry upload */}
          <div>
            <label className="block text-sm font-medium text-field-200 mb-1.5">
              Field Boundary (GeoJSON) *
            </label>

            {/* File upload button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 p-3 bg-canopy-900/60 border border-dashed border-canopy-700/60 rounded-lg cursor-pointer hover:border-earth-300/40 transition-colors"
            >
              <FileJson size={20} className="text-field-300" />
              <div className="flex-1">
                {fileName ? (
                  <span className="text-sm text-earth-300">{fileName}</span>
                ) : (
                  <span className="text-sm text-field-300">Upload GeoJSON file or paste below</span>
                )}
              </div>
              <Upload size={16} className="text-field-400" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".geojson,.json"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Text area for pasting */}
            <textarea
              value={geometryText}
              onChange={(e) => { setGeometryText(e.target.value); setError(""); }}
              placeholder='{"type":"Polygon","coordinates":[[[69.18,43.22],[69.22,43.22],...]]}'
              rows={4}
              className="w-full mt-2 bg-canopy-900/60 border border-canopy-700/60 rounded-lg px-3 py-2.5 text-xs font-mono text-field-200 placeholder-canopy-600 focus:border-earth-300/60 focus:ring-1 focus:ring-earth-300/30 outline-none transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-300 animate-shake">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-canopy-800/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-field-200 hover:text-earth-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-agro-600 hover:bg-agro-500 disabled:opacity-50 text-earth-100 rounded-lg text-sm font-medium transition-colors"
          >
            {createMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                Creating...
              </>
            ) : (
              "Create Field"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
