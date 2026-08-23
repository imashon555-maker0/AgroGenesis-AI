import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  color: "green" | "yellow" | "blue" | "emerald" | "teal" | "red" | "earth";
}

const BORDER_COLORS = {
  green: "border-l-agro-500",
  yellow: "border-l-earth-300",
  blue: "border-l-blue-500",
  emerald: "border-l-agro-400",
  teal: "border-l-agro-600",
  red: "border-l-red-500",
  earth: "border-l-earth-300",
};

export function MetricCard({ title, value, unit, icon, color }: MetricCardProps) {
  return (
    <div
      className={`bg-canopy-900/60 border border-canopy-700/40 border-l-[3px] ${BORDER_COLORS[color]}
        rounded-lg p-3 cursor-default transition-all duration-150
        hover:bg-canopy-800/60 hover:border-canopy-600/50
      `}
    >
      <div className="flex items-center gap-1.5 mb-1 text-field-300">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wide">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-earth-100">{value}</span>
        {unit && <span className="text-[10px] text-field-300">{unit}</span>}
      </div>
    </div>
  );
}
