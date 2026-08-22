import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  icon: ReactNode;
  color: "green" | "yellow" | "blue" | "emerald" | "teal" | "red";
}

const COLOR_MAP = {
  green: "bg-green-900/30 border-green-500/20 text-green-400",
  yellow: "bg-yellow-900/30 border-yellow-500/20 text-yellow-400",
  blue: "bg-blue-900/30 border-blue-500/20 text-blue-400",
  emerald: "bg-emerald-900/30 border-emerald-500/20 text-emerald-400",
  teal: "bg-teal-900/30 border-teal-500/20 text-teal-400",
  red: "bg-red-900/30 border-red-500/20 text-red-400",
};

export function MetricCard({ title, value, unit, icon, color }: MetricCardProps) {
  return (
    <div className={`border rounded-xl p-4 ${COLOR_MAP[color]}`}>
      <div className="flex items-center gap-2 mb-2 opacity-75">
        {icon}
        <span className="text-xs font-medium">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-white">{value}</span>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}
