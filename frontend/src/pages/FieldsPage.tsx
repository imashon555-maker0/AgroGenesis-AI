import { useState } from "react";
import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import { FieldCreationModal } from "@/components/upload/FieldCreationModal";
import { FieldCard } from "@/components/shared/FieldCard";
import { Plus } from "lucide-react";

export function FieldsPage() {
  const { data, isLoading } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const fields = data?.fields || [];
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-5 p-4 lg:p-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-earth-100">Field Management</h2>
          <p className="text-field-300 text-xs mt-1">Manage farm field boundaries and zones</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-agro-600 hover:bg-agro-500 active:scale-95 text-earth-100 rounded-lg text-sm font-medium transition-all duration-150"
        >
          <Plus size={16} />
          Add Field
        </button>
      </div>

      {isLoading ? (
        <div className="text-field-300 text-sm">Loading fields...</div>
      ) : fields.length === 0 ? (
        <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-8 text-center animate-fade-in">
          <p className="text-field-300 text-sm">No fields yet. Click "+ Add Field" to create your first field.</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-canopy-900/40 border border-canopy-700/40 rounded-xl p-4">
              <p className="text-[10px] text-field-300 uppercase mb-1">Total Fields</p>
              <p className="text-xl font-bold text-earth-100">{fields.length}</p>
            </div>
            <div className="bg-canopy-900/40 border border-canopy-700/40 rounded-xl p-4">
              <p className="text-[10px] text-field-300 uppercase mb-1">Total Area</p>
              <p className="text-xl font-bold text-earth-100">{fields.reduce((s, f) => s + (f.area_ha || 0), 0).toFixed(0)} ha</p>
            </div>
            <div className="bg-canopy-900/40 border border-canopy-700/40 rounded-xl p-4">
              <p className="text-[10px] text-field-300 uppercase mb-1">Avg NDVI</p>
              <p className="text-xl font-bold text-earth-100">{fields.length > 0 ? (fields.flatMap(f => f.zones).reduce((s, z, _, a) => s + (z?.mean_ndvi || 0) / a.length, 0)).toFixed(2) : "--"}</p>
            </div>
            <div className="bg-canopy-900/40 border border-canopy-700/40 rounded-xl p-4">
              <p className="text-[10px] text-field-300 uppercase mb-1">Total Zones</p>
              <p className="text-xl font-bold text-earth-100">{fields.reduce((s, f) => s + f.zones.length, 0)}</p>
            </div>
          </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {fields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              isSelected={field.id === selectedFieldId}
              onClick={() => selectField(field.id)}
            />
          ))}
        </div>
        </>
      )}

      <FieldCreationModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
