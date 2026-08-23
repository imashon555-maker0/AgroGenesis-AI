import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Map, Activity, Satellite, MoreHorizontal } from "lucide-react";

const TABS = [
  { path: "/", label: "Home", icon: 0 },
  { path: "/fields", label: "Fields", icon: 1 },
  { path: "/telemetry", label: "Data", icon: 2 },
  { path: "/imagery", label: "Imagery", icon: 3 },
];

const MORE_ITEMS = [
  { path: "/prescriptions", label: "Prescriptions" },
  { path: "/ecofin", label: "EcoFin" },
  { path: "/settings", label: "Settings" },
];

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isMoreActive = MORE_ITEMS.some(i => i.path === location.pathname);
  const icons = [LayoutDashboard, Map, Activity, Satellite];

  return (
    <>
      {open && (<>
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setOpen(false)} />
        <div className="fixed bottom-16 right-2 z-50 lg:hidden bg-field-900 border border-canopy-700/60 rounded-xl shadow-2xl overflow-hidden animate-pop-in min-w-[140px]">
          {MORE_ITEMS.map(item => (
            <button key={item.path} onClick={() => { navigate(item.path); setOpen(false); }}
              className={"w-full px-4 py-3 text-left text-sm hover:bg-canopy-800/60 transition-colors " + (location.pathname === item.path ? "text-earth-100 bg-canopy-800/40" : "text-field-200")}>
              {item.label}
            </button>
          ))}
        </div>
      </>)}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-field-900/95 backdrop-blur-sm border-t border-canopy-800/60 flex items-center justify-around px-2 py-1 lg:hidden">
        {TABS.map(tab => {
          const Icon = icons[tab.icon];
          const active = location.pathname === tab.path;
          return (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={"flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px] " + (active ? "text-earth-100" : "text-field-400 active:text-field-200")}>
              <Icon size={20} />
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          );
        })}
        <button onClick={() => setOpen(!open)}
          className={"flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors min-w-[56px] " + (isMoreActive || open ? "text-earth-100" : "text-field-400")}>
          <MoreHorizontal size={20} />
          <span className="text-[9px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}