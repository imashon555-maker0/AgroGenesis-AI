import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Activity,
  Satellite,
  Bot,
  Leaf,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/fields", label: "Fields", icon: Map },
  { path: "/telemetry", label: "Telemetry", icon: Activity },
  { path: "/imagery", label: "Imagery", icon: Satellite },
  { path: "/prescriptions", label: "Prescriptions", icon: Bot },
  { path: "/ecofin", label: "EcoFin", icon: Leaf },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700/50
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
          <span className="text-2xl">🌾</span>
          <div>
            <h1 className="font-bold text-agro-400">AgroGenesis AI</h1>
            <p className="text-xs text-slate-400">Precision Agriculture</p>
          </div>
        </div>

        <nav className="mt-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${
                    isActive
                      ? "bg-agro-600/20 text-agro-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
                `}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
          <div className="text-xs text-slate-500">
            <p>AgroGenesis AI v0.1.0</p>
            <p className="mt-1">EcoFin Track • Hackathon 2026</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-slate-900/80 backdrop-blur border-b border-slate-700/50 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1 rounded text-slate-400 hover:text-white"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="font-semibold text-slate-100">
              {NAV_ITEMS.find((i) => i.path === location.pathname)?.label || "AgroGenesis AI"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              System Online
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-slate-950 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
