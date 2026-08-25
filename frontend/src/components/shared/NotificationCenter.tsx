import { useState, useRef, useEffect } from "react";
import { computeAlerts } from "@/services/localStore";
import { Bell, AlertTriangle, Leaf, X } from "lucide-react";
import { sounds } from "@/services/sounds";



export function NotificationCenter() {
    const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const alerts = computeAlerts().filter(a => !dismissed.has(a.id));
  const prevCount = useRef(alerts.length);
  useEffect(() => {
    if (alerts.length > prevCount.current) sounds.notification();
    prevCount.current = alerts.length;
  }, [alerts.length]);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-1.5 rounded-lg text-field-300 hover:text-earth-100 hover:bg-canopy-800/60 transition-colors">
        <Bell size={18} />
        {alerts.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center">{alerts.length}</span>}
      </button>
      {open && <>
        <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />
        <div className="absolute right-0 top-full mt-2 w-[320px] max-h-[400px] overflow-auto bg-[#161e18] border-2 border-canopy-600 shadow-[0_16px_48px_0px_rgba(0,0,0,0.9)] rounded-xl shadow-2xl z-50 animate-pop-in">
          <div className="sticky top-0 bg-[#161e18] border-b border-canopy-700/50 border-canopy-800/60 px-4 py-3 flex items-center justify-between"><h3 className="text-sm font-bold text-earth-50">Оповещения</h3><span className="text-[10px] text-field-300">{alerts.length} active</span></div>
          {alerts.length === 0 ? <div className="p-6 text-center"><Leaf size={24} className="mx-auto text-agro-500 mb-2" /><p className="text-xs text-field-300">Все поля в норме</p></div> : alerts.map(alert => (
            <div key={alert.id} className="px-4 py-3 border-b border-canopy-800/60 last:border-0">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className={alert.severity === "critical" ? "text-red-400 mt-0.5 shrink-0" : alert.type.includes("fuel") ? "text-orange-400 mt-0.5 shrink-0" : alert.type.includes("stale") ? "text-yellow-400 mt-0.5 shrink-0" : "text-earth-300 mt-0.5 shrink-0"} />
                <div className="flex-1 min-w-0"><p className="text-xs text-earth-50">{alert.fieldName}  - Зона {alert.zoneLabel}</p><p className="text-[11px] text-field-200 mt-0.5 truncate">{alert.message}</p>
                  <span className="text-[9px] text-field-400 mt-0.5 inline-block">{alert.type.replace(/_/g, " ")}</span></div>
                <button onClick={() => setDismissed(p => new Set(p).add(alert.id))} className="p-0.5 text-field-400 hover:text-earth-100 shrink-0"><X size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}
