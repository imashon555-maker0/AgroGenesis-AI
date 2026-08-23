import { useState, useRef, DragEvent } from "react";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";
import { useUploadTelemetry } from "@/hooks/useTelemetry";
import { useToast } from "@/components/shared/Toast";

interface TelemetryDropZoneProps {
  fieldId: string;
  onSuccess?: () => void;
}

interface UploadResult {
  records_parsed: number;
  records_imported: number;
  zones_assigned: number;
  source_format: string;
}

export function TelemetryDropZone({ fieldId, onSuccess }: TelemetryDropZoneProps) {
  const { addToast } = useToast();
  const uploadMutation = useUploadTelemetry(fieldId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndSelect(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  const validateAndSelect = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "xml") {
      addToast("Only .csv (J1939) and .xml (ISOBUS) files are supported", "warning");
      return;
    }
    setSelectedFile(file);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const res = await uploadMutation.mutateAsync(selectedFile);
      setResult(res);
      addToast(
        `Imported ${res.records_imported} records (${res.source_format}). ${res.zones_assigned} assigned to zones.`,
        "success"
      );
      onSuccess?.();
    } catch (err: any) {
      addToast(`Upload failed: ${err.message}`, "error");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${
            isDragging
              ? "border-agro-400 bg-canopy-800/20 animate-[dropPulse_1.5s_ease-in-out_infinite]"
              : selectedFile
              ? "border-agro-500/50 bg-canopy-900/40"
              : "border-canopy-700/60 bg-canopy-900/30 hover:border-canopy-600/60 hover:bg-canopy-800/40"
          }
        `}
      >
        {selectedFile ? (
          <div className="animate-pop-in">
            <FileText size={36} className="mx-auto text-earth-300 mb-3" />
            <p className="text-earth-100 font-medium">{selectedFile.name}</p>
            <p className="text-field-300 text-sm mt-1">
              {formatBytes(selectedFile.size)} •{" "}
              {selectedFile.name.endsWith(".csv") ? "J1939 CSV" : "ISOBUS XML"}
            </p>
          </div>
        ) : (
          <>
            <Upload
              size={40}
              className={`mx-auto mb-3 transition-colors duration-300 ${
                isDragging ? "text-agro-400 scale-110" : "text-field-400"
              }`}
            />
            <p className="text-field-200 font-medium">
              {isDragging ? "Drop file here" : "Drag telemetry file here"}
            </p>
            <p className="text-field-300 text-sm mt-1">
              or click to browse — supports .csv (J1939) and .xml (ISOBUS)
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xml"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Upload button */}
      {selectedFile && !result && (
        <button
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-agro-600 hover:bg-agro-500 disabled:opacity-60 text-earth-100 rounded-xl text-sm font-medium transition-all duration-200 animate-fade-in"
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin-slow" />
              Processing {selectedFile.name}...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload & Process
            </>
          )}
        </button>
      )}

      {/* Progress bar */}
      {uploadMutation.isPending && (
        <div className="h-1.5 bg-canopy-700 rounded-full overflow-hidden animate-fade-in">
          <div
            className="h-full bg-gradient-to-r from-agro-600 to-agro-400 rounded-full"
            style={{
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s linear infinite",
              width: "100%",
            }}
          />
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4 animate-pop-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-agro-600/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-agro-400" />
            </div>
            <div>
              <p className="font-medium text-earth-100">Upload Complete</p>
              <p className="text-xs text-field-300">{result.source_format.toUpperCase()} format</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-earth-100">{result.records_parsed}</p>
              <p className="text-xs text-field-300">Parsed</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-agro-400">{result.records_imported}</p>
              <p className="text-xs text-field-300">Imported</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-blue-400">{result.zones_assigned}</p>
              <p className="text-xs text-field-300">Zoned</p>
            </div>
          </div>

          <button
            onClick={() => { setSelectedFile(null); setResult(null); }}
            className="w-full mt-3 py-2 text-sm text-field-300 hover:text-earth-100 transition-colors"
          >
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
}
