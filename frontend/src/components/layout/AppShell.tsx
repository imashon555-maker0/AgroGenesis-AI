import { MobileNav } from "@/components/layout/MobileNav";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { useDeviceType } from "@/hooks/useDeviceType";
import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useFields } from "@/hooks/useFields";
import { useFieldStore } from "@/stores/fieldStore";
import { getCurrentUser } from "@/services/authStore";
import { LayoutDashboard, Map, Activity, Satellite, Bot, Leaf, ChevronDown, Wheat, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/fields", label: "Fields", icon: Map },
  { path: "/telemetry", label: "Telemetry", icon: Activity },
  { path: "/imagery", label: "Imagery", icon: Satellite },
  { path: "/prescriptions", label: "Prescriptions", icon: Bot },
  { path: "/ecofin", label: "EcoFin", icon: Leaf },
  { path: "/settings", label: "Settings", icon: Map },
];

interface AppShellProps { children: ReactNode; onLogout?: () => void; }
export function AppShell({ children, onLogout }: AppShellProps) {
  const location = useLocation();
  const { isPhone, isTablet, isDesktop } = useDeviceType();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useKeyboardShortcuts();
  const { data } = useFields();
  const { selectedFieldId, selectField } = useFieldStore();
  const fields = data?.fields || [];
  const user = getCurrentUser();
  const isActive = (p: string) => location.pathname === p;
  return (
    <div className="flex h-screen overflow-hidden bg-field-950">
      {isDesktop && (
        <aside onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)} className={"flex flex-col z-50 border-r transition-all duration-200 ease-in-out bg-field-900/80 border-canopy-800/60 " + (expanded ? "w-[220px]" : "w-[64px]")}>
          <div className="flex items-center gap-3 px-4 h-14 border-b border-canopy-800/60">
            <Wheat size={22} className="text-earth-300 flex-shrink-0" />
            {expanded && <span className="text-sm font-bold text-earth-100 whitespace-nowrap">AgroGenesis</span>}
          </div>
          <nav className="flex-1 py-3 px-2 space-y-1">
            {NAV_ITEMS.map((item) => (<Link key={item.path} to={item.path} title={item.label} className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative " + (isActive(item.path) ? "bg-canopy-700/60 text-earth-200" : "text-field-200 hover:bg-canopy-800/60 hover:text-earth-100")}>{isActive(item.path) && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-earth-300 rounded-r" />}<item.icon size={18} className="flex-shrink-0" />{expanded && <span className="whitespace-nowrap">{item.label}</span>}</Link>))}
          </nav>
          {expanded && <div className="px-4 py-3 border-t border-canopy-800/60"><p className="text-[10px] text-field-300">v0.1.0 EcoFin Track</p></div>}
        </aside>
      )}
      {isTablet && (
        <aside className="flex flex-col z-50 w-[52px] bg-field-900/80 border-r border-canopy-800/60">
          <div className="flex items-center justify-center h-14 border-b border-canopy-800/60"><Wheat size={20} className="text-earth-300" /></div>
          <nav className="flex-1 py-3 px-1.5 space-y-1">
            {NAV_ITEMS.map((item) => (<Link key={item.path} to={item.path} title={item.label} className={"flex items-center justify-center py-2.5 rounded-lg transition-all duration-150 " + (isActive(item.path) ? "bg-canopy-700/60 text-earth-200" : "text-field-300 hover:bg-canopy-800/60 hover:text-earth-100")}><item.icon size={18} /></Link>))}
          </nav>
        </aside>
      )}
      {isPhone && mobileOpen && <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />}
      {isPhone && (
        <aside className={"fixed inset-y-0 left-0 z-50 w-[220px] bg-field-900 border-r border-canopy-800/60 transform transition-transform duration-200 " + (mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex items-center gap-3 px-4 h-14 border-b border-canopy-800/60"><Wheat size={22} className="text-earth-300" /><span className="text-sm font-bold text-earth-100">AgroGenesis</span></div>
          <nav className="py-3 px-2 space-y-1">
            {NAV_ITEMS.map((item) => (<Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium " + (isActive(item.path) ? "bg-canopy-700/60 text-earth-200" : "text-field-200 hover:bg-canopy-800/60")}><item.icon size={18} /><span>{item.label}</span></Link>))}
          </nav>
        </aside>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className={"bg-field-900/60 backdrop-blur-sm border-b border-canopy-800/60 flex items-center justify-between z-30 " + (isPhone ? "h-12 px-3" : "h-14 px-4")}>
          <div className="flex items-center gap-3">
            {isPhone && <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg text-field-300 hover:text-earth-100 hover:bg-canopy-800/60"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>}
            <h2 className={"font-semibold text-earth-100 " + (isPhone ? "text-xs" : "text-sm")}>{NAV_ITEMS.find((i) => i.path === location.pathname)?.label || "AgroGenesis AI"}</h2>
          </div>
          {fields.length > 0 && !isPhone && (<div className="flex items-center"><div className="relative"><select value={selectedFieldId || ""} onChange={(e) => selectField(e.target.value)} className={"appearance-none bg-canopy-800/60 border border-canopy-700/60 rounded-lg pl-3 pr-8 py-1.5 text-earth-100 cursor-pointer hover:border-earth-300/40 focus:border-earth-300/60 focus:outline-none transition-colors " + (isTablet ? "text-xs max-w-[160px]" : "text-sm")} style={{ colorScheme: "dark" }}>{fields.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.area_ha?.toFixed(0)} ha)</option>)}</select><ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-field-300 pointer-events-none" /></div></div>)}
          <div className="flex items-center gap-3">{user && <div className="flex items-center gap-2"><span className="text-[11px] text-field-200 hidden md:inline">{user.profile.name}</span><div className="w-7 h-7 rounded-full bg-agro-600 flex items-center justify-center text-[10px] font-bold text-white">{user.profile.name.charAt(0).toUpperCase()}</div>{onLogout && <button onClick={onLogout} className="p-1 rounded text-field-400 hover:text-red-400 transition-colors" title="Sign out"><LogOut size={14} /></button>}</div>}<NotificationCenter />{!isPhone && <div className="flex items-center gap-2 px-2.5 py-1 bg-canopy-800/40 rounded-md"><div className="w-1.5 h-1.5 rounded-full bg-agro-500 animate-pulse" /><span className="text-[11px] text-field-200 hidden sm:inline">Online</span></div>}</div>
        </header>
        <main className={"flex-1 overflow-auto bg-field-950 " + (isPhone ? "pb-16" : "pb-0")}>{children}</main>
      </div>
      {isPhone && <MobileNav />}
    </div>
  );
}