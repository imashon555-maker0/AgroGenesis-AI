import { useState } from "react";
import { Plus, MapPin, Activity, Camera, Bot, X } from "lucide-react";

interface FABProps {
  onCreateField: () => void;
  onUploadTelemetry: () => void;
  onUploadPhoto: () => void;
  onGeneratePrescription: () => void;
}

const ACTIONS = [
  { id: "field", label: "Создать поле", icon: MapPin, color: "bg-agro-600" },
  { id: "telemetry", label: "Загрузить данные", icon: Activity, color: "bg-blue-600" },
  { id: "photo", label: "Фото с дрона", icon: Camera, color: "bg-purple-600" },
  { id: "prescription", label: "Рецептура", icon: Bot, color: "bg-earth-400" },
];

export function FAB({
  onCreateField,
  onUploadTelemetry,
  onUploadPhoto,
  onGeneratePrescription,
}: FABProps) {
  const [open, setOpen] = useState(false);

  const handlerMap: Record<string, () => void> = {
    field: onCreateField,
    telemetry: onUploadTelemetry,
    photo: onUploadPhoto,
    prescription: onGeneratePrescription,
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Action items */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col-reverse items-end gap-3">
        {/* Main FAB */}
        <button
          onClick={() => setOpen(!open)}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center
            shadow-lg transition-all duration-200
            ${open
              ? "bg-canopy-700 rotate-45 shadow-canopy-900/50"
              : "bg-agro-600 hover:bg-agro-500 shadow-agro-900/50 hover:shadow-agro-800/50"
            }
          `}
        >
          {open ? (
            <X size={24} className="text-earth-100" />
          ) : (
            <Plus size={24} className="text-earth-100" />
          )}
        </button>

        {/* Action buttons */}
        {open &&
          ACTIONS.map((action, i) => (
            <div
              key={action.id}
              className="flex items-center gap-3"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-xs text-earth-200 bg-canopy-800/90 px-2.5 py-1 rounded-md whitespace-nowrap shadow-md">
                {action.label}
              </span>
              <button
                onClick={() => {
                  handlerMap[action.id]?.();
                  setOpen(false);
                }}
                className={`
                  w-11 h-11 rounded-full flex items-center justify-center
                  ${action.color} hover:brightness-110
                  shadow-md transition-all duration-150
                  hover:scale-110 active:scale-95
                `}
              >
                <action.icon size={18} className="text-white" />
              </button>
            </div>
          ))}
      </div>
    </>
  );
}
