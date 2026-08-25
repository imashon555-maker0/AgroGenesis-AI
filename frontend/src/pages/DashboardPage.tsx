import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import { useDeviceType } from "@/hooks/useDeviceType";
import { FieldMap } from "@/components/map/FieldMap";
import { FieldCard } from "@/components/shared/FieldCard";
import { FAB } from "@/components/shared/FAB";
import { WeatherWidget } from "@/components/shared/WeatherWidget";
import { FieldCreationModal } from "@/components/upload/FieldCreationModal";
import { fieldsApi } from "@/api/fields";
import { Database, Wheat, Leaf, DollarSign, Satellite, TrendingUp, X, Trash2, Download, FileJson } from "lucide-react";

export function DashboardPage() {
  const { data, isLoading } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const { isPhone, isTablet } = useDeviceType();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [detailField, setDetailField] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const fields = data?.fields || [];
  const activeField = fields.find((f) => f.id === (detailField || selectedFieldId || fields[0]?.id));

  const handleLoadSample = async () => {
    setLoadingSample(true);
    try {
      await fieldsApi.loadSampleData();
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry-stats"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry-geojson"] });
    } finally {
      setLoadingSample(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    try {
      await fieldsApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry-stats"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry-geojson"] });
      setDetailField(null);
      setConfirmDelete(null);
    } catch { /* ignore */ }
  };

  // Detail panel width adapts to device
  const detailPanelWidth = isPhone ? "w-full" : isTablet ? "w-[260px]" : "w-[320px]";

  // Empty state

  const downloadFile = (content: string, filename: string, mime: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = async () => {
    try {
      setExporting("geojson");
      const content = await fieldsApi.exportFieldsAsGeoJSON();
      downloadFile(content, "agrogenesis-fields.geojson", "application/json");
    } finally { setExporting(null); }
  };

  const handleExportCSV = async (fieldId: string, fieldName: string) => {
    try {
      setExporting("csv");
      const content = await fieldsApi.exportTelemetryAsCSV(fieldId);
      downloadFile(content, fieldName + "-telemetry.csv", "text/csv");
    } finally { setExporting(null); }
  };

  if (fields.length === 0 && !isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-canopy-800/60 flex items-center justify-center mb-6">
          <Wheat size={36} className="text-earth-300" />
        </div>
        <h2 className="text-xl font-bold text-earth-100 mb-2">Добро пожаловать в AgroGenesis AI</h2>
        <p className="text-field-300 text-center max-w-md mb-6 text-sm">
          Начните с создания первого поля или загрузки тестовых данных.
        </p>
        <div className={isPhone ? "flex flex-col w-full max-w-xs" : "flex gap-3"}>
          <button
            onClick={() => setShowFieldModal(true)}
            className="px-5 py-2.5 bg-agro-600 hover:bg-agro-500 text-earth-100 rounded-lg text-sm font-medium transition-colors"
          >
            Создать поле
          </button>
          <button
            onClick={handleLoadSample}
            disabled={loadingSample}
            className="flex items-center gap-2 px-5 py-2.5 bg-canopy-800/60 hover:bg-canopy-700/60 border border-canopy-600/40 text-earth-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            <Database size={16} />
            {loadingSample ? "Загрузка..." : "Загрузить тестовые данные"}
          </button>
        </div>
        <FieldCreationModal isOpen={showFieldModal} onClose={() => setShowFieldModal(false)} />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Map — takes all remaining space */}
      <div className="flex-1 relative">
        <FieldMap
          selectedFieldId={activeField?.id}
          showZones={true}
          onFieldClick={(id) => {
            selectField(id);
            setDetailField(id);
          }}
        />

        {/* Field detail slide-in panel */}
        {detailField && activeField && (
          <div className={"absolute top-0 right-0 h-full bg-field-900/95 backdrop-blur-sm border-l border-canopy-700/60 overflow-y-auto animate-slide-in-right z-20 " + detailPanelWidth}>
            {/* Close button */}
            <button
              onClick={() => setDetailField(null)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-field-300 hover:text-earth-100 hover:bg-canopy-800/60 transition-colors z-10"
            >
              <X size={16} />
            </button>

            {/* Field header */}
            <div className="p-5 border-b border-canopy-800/60">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-agro-500" />
                <h3 className="font-bold text-earth-100 text-sm">{activeField.name}</h3>
              </div>
              <p className="text-[11px] text-field-300 mt-1">
                {activeField.crop_type || "Без культуры"} · {activeField.area_ha?.toFixed(0)} ha · {activeField.zones.length} зон
              </p>
            </div>

            {/* Quick stats */}
            <div className="p-4 border-b border-canopy-800/60">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-canopy-900/60 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Satellite size={12} className="text-field-300" />
                    <span className="text-[10px] text-field-300 uppercase">Средний NDVI</span>
                  </div>
                  <span className="text-lg font-bold text-earth-100">
                    {activeField.zones.length > 0
                      ? (activeField.zones.reduce((s, z) => s + (z.mean_ndvi || 0), 0) / activeField.zones.length).toFixed(2)
                      : "—"}
                  </span>
                </div>
                <div className="bg-canopy-900/60 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={12} className="text-field-300" />
                    <span className="text-[10px] text-field-300 uppercase">Зоны</span>
                  </div>
                  <span className="text-lg font-bold text-earth-100">{activeField.zones.length}</span>
                </div>
              </div>
            </div>

            {/* Zone list */}
            <div className="p-4">
              <h4 className="text-[10px] font-medium text-field-300 uppercase tracking-wide mb-3">Зоны управления</h4>
              <div className="space-y-2">
                {activeField.zones.map((z) => (
                  <div
                    key={z.id}
                    className="flex items-center gap-3 bg-canopy-900/40 rounded-lg px-3 py-2.5"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        z.productivity_class === "high"
                          ? "bg-agro-500"
                          : z.productivity_class === "medium"
                          ? "bg-earth-300"
                          : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-earth-100">Зона {z.zone_label}</span>
                        <span className="text-[10px] text-field-300">{z.area_ha?.toFixed(0)} ha</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-canopy-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              z.productivity_class === "high"
                                ? "bg-agro-500"
                                : z.productivity_class === "medium"
                                ? "bg-earth-300"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${(z.mean_ndvi || 0.5) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-field-300 font-mono">{z.mean_ndvi?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* EcoFin summary (dynamic) */}
            {(() => {
              const avgNdvi = activeField.zones.length > 0 ? activeField.zones.reduce((s: number, z: any) => s + (z.mean_ndvi || 0), 0) / activeField.zones.length : 0.5;
              const nSavings = Math.max(0, Math.round((0.65 - avgNdvi) * 40 * 10) / 10);
              const carbonCredit = Math.round(nSavings * 0.0105 * 100) / 100;
              const costSaving = Math.round((nSavings * 0.34 + (activeField.area_ha || 250) * 0.001) * 100) / 100;
              const netBenefit = Math.round((costSaving + carbonCredit * 15) * 100) / 100;
              return (
            <div className="p-4 border-t border-canopy-800/60">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-canopy-900/40 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign size={10} className="text-agro-400" />
                    <span className="text-[10px] text-field-300">Экономия</span>
                  </div>
                  <span className="text-sm font-bold text-agro-400">${netBenefit.toFixed(2)}/ha</span>
                </div>
                <div className="bg-canopy-900/40 rounded-lg p-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Leaf size={10} className="text-agro-400" />
                    <span className="text-[10px] text-field-300">Углерод</span>
                  </div>
                  <span className="text-sm font-bold text-agro-400">{carbonCredit} tCO₂e</span>
                </div>
              </div>
            </div>
            ); })()}

            {/* Weather Widget */}
            <div className="p-4 border-b border-canopy-800/60">
              <WeatherWidget fieldGeometry={activeField?.geometry} fieldName={activeField?.name} />
            </div>

            {/* Actions */}
            <div className="p-4 space-y-2">
              <button
                onClick={() => handleExportCSV(activeField.id, activeField.name)}
                disabled={exporting === "csv"}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-canopy-800/60 hover:bg-canopy-700/60 border border-canopy-700/40 rounded-lg text-xs text-earth-200 transition-colors disabled:opacity-50"
              >
                <Download size={14} />
                Экспорт телеметрии CSV
              </button>
              {confirmDelete === activeField.id ? (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                  <p className="text-xs text-red-300 mb-2">Это поле и его данные будут удалены.</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDeleteField(activeField.id)} className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors">Удалить</button>
                    <button onClick={() => setConfirmDelete(null)} className="flex-1 px-3 py-1.5 bg-canopy-800/60 hover:bg-canopy-700/60 text-earth-200 rounded-lg text-xs transition-colors">Отмена</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(activeField.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 rounded-lg text-xs text-red-300 transition-colors">
                  <Trash2 size={14} />
                  Удалить поле
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom field strip — horizontal scroll */}
      <div className="h-[100px] bg-field-900/60 border-t border-canopy-800/60 px-4 py-2.5 overflow-x-auto">
        <div className="flex gap-2.5 h-full">
          {fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              isSelected={field.id === (detailField || selectedFieldId)}
              onClick={() => {
                selectField(field.id);
                setDetailField(field.id);
              }}
            />
          ))}
          {fields.length > 0 && (
            <button
              onClick={handleExportGeoJSON}
              disabled={exporting === "geojson"}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-[100px] h-full rounded-lg border border-dashed border-canopy-700/40 bg-canopy-900/30 hover:bg-canopy-800/40 text-field-300 hover:text-earth-200 transition-colors disabled:opacity-50"
              title="Экспорт всех полей"
            >
              <FileJson size={16} />
              <span className="text-[10px]">Экспорт</span>
            </button>
          )}
        </div>
      </div>

      {/* FAB */}
      <FAB
        onCreateField={() => setShowFieldModal(true)}
        onUploadTelemetry={() => navigate("/telemetry")}
        onUploadPhoto={() => navigate("/imagery")}
        onGeneratePrescription={() => navigate("/prescriptions")}
      />

      <FieldCreationModal isOpen={showFieldModal} onClose={() => setShowFieldModal(false)} />
    </div>
  );
}
