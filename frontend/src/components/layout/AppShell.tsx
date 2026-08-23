import { MobileNav } from "@/components/layout/MobileNav";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import {
  LayoutDashboard,
  Map,
  Activity,
  Satellite,
  Bot,
  Leaf,
  ChevronDown,
  Wheat,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/fields", label: "Fields", icon: Map },
  { path: "/telemetry", label: "Telemetry", icon: Activity },
  { path: "/imagery", label: "Imagery", icon: Satellite },
  { path: "/prescriptions", label: "Prescriptions", icon: Bot },
  { path: "/ecofin", label: "EcoFin", icon: Leaf },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useKeyboardShortcuts();
  const { data } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const fields = data?.fields || [];
  return (
    <div className="flex h-screen overflow-hidden bg-field-950">
      {/* Sidebar — narrow icon bar, expands on hover */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`
          hidden lg:flex flex-col z-50 border-r transition-all duration-200 ease-in-out
          ${expanded ? "w-[220px]" : "w-[64px]"}
          bg-field-900/80 border-canopy-800/60
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-canopy-800/60">
          <Wheat size={22} className="text-earth-300 flex-shrink-0" />
          {expanded && (
            <span className="text-sm font-bold text-earth-100 whitespace-nowrap overflow-hidden">
              AgroGenesis
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 relative
                  ${
                    isActive
                      ? "bg-canopy-700/60 text-earth-200"
                      : "text-field-200 hover:bg-canopy-800/60 hover:text-earth-100"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-earth-300 rounded-r" />
                )}
                <item.icon size={18} className="flex-shrink-0" />
                {expanded && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Version */}
        {expanded && (
          <div className="px-4 py-3 border-t border-canopy-800/60">
            <p className="text-[10px] text-field-300">v0.1.0 · EcoFin Track</p>
          </div>
        )}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[220px] bg-field-900 border-r border-canopy-800/60
          transform transition-transform duration-200 lg:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center gap-3 px-4 h-14 border-b border-canopy-800/60">
          <Wheat size={22} className="text-earth-300" />
          <span className="text-sm font-bold text-earth-100">AgroGenesis</span>
        </div>
        <nav className="py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  ${isActive ? "bg-canopy-700/60 text-earth-200" : "text-field-200 hover:bg-canopy-800/60"}
                `}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-field-900/60 backdrop-blur-sm border-b border-canopy-800/60 flex items-center justify-between px-4 z-30">
          {/* Left: mobile menu + page title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-lg text-field-300 hover:text-earth-100 hover:bg-canopy-800/60"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <h2 className="font-semibold text-earth-100 text-sm">
              {NAV_ITEMS.find((i) => i.path === location.pathname)?.label || "AgroGenesis AI"}
            </h2>
          </div>

          {/* Center: Field selector */}
          {fields.length > 0 && (
            <div className="hidden md:flex items-center">
              <div className="relative">
                <select
                  value={selectedFieldId || ""}
                  onChange={(e) => selectField(e.target.value)}
                  className="appearance-none bg-canopy-800/60 border border-canopy-700/60 rounded-lg pl-3 pr-8 py-1.5 text-sm text-earth-100 cursor-pointer hover:border-earth-300/40 focus:border-earth-300/60 focus:outline-none transition-colors" style={{ colorScheme: "dark" }}
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} · {f.area_ha?.toFixed(0)} ha
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-field-300 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Right: status */}
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="flex items-center gap-2 px-2.5 py-1 bg-canopy-800/40 rounded-md">
              <div className="w-1.5 h-1.5 rounded-full bg-agro-500 animate-pulse" />
              <span className="text-[11px] text-field-200 hidden sm:inline">Online</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-field-950 pb-16 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
