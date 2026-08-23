import type { Field } from "@/types";

interface FieldCardProps {
  field: Field;
  isSelected: boolean;
  onClick: () => void;
}

function getHealthColor(ndvi: number): string {
  if (ndvi >= 0.6) return "bg-agro-600";
  if (ndvi >= 0.4) return "bg-earth-400";
  return "bg-red-500";
}

function getHealthDotColor(ndvi: number): string {
  if (ndvi >= 0.6) return "bg-agro-500";
  if (ndvi >= 0.4) return "bg-earth-300";
  return "bg-red-400";
}

export function FieldCard({ field, isSelected, onClick }: FieldCardProps) {
  const avgNdvi =
    field.zones.length > 0
      ? field.zones.reduce((s, z) => s + (z.mean_ndvi || 0), 0) / field.zones.length
      : 0.5;

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-[170px] rounded-lg overflow-hidden text-left
        border transition-all duration-150 cursor-pointer
        ${
          isSelected
            ? "border-earth-300/60 bg-canopy-800/80 shadow-lg shadow-earth-300/10"
            : "border-canopy-700/40 bg-canopy-900/60 hover:border-canopy-600/60 hover:bg-canopy-800/60"
        }
      `}
    >
      {/* NDVI health bar */}
      <div className={`h-1.5 w-full ${getHealthColor(avgNdvi)}`} />

      <div className="px-3 py-2.5">
        {/* Name + health dot */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getHealthDotColor(avgNdvi)}`} />
          <span className="text-xs font-semibold text-earth-100 truncate">{field.name}</span>
        </div>

        {/* Crop + area */}
        <p className="text-[11px] text-field-300 truncate">{field.crop_type || "No crop"}</p>

        {/* Stats row */}
        <div className="flex items-center gap-2 mt-2 text-[10px] text-field-300">
          <span>{field.area_ha?.toFixed(0) || "—"} ha</span>
          <span className="text-canopy-600">·</span>
          <span>{field.zones.length} zones</span>
        </div>

        {/* NDVI bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1 bg-canopy-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${getHealthColor(avgNdvi)}`}
              style={{ width: `${avgNdvi * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-field-300 font-mono">{avgNdvi.toFixed(2)}</span>
        </div>
      </div>
    </button>
  );
}
