import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFields } from "@/hooks/useFields";
import { fieldsApi } from "@/api/fields";
import { getCurrentUser, updateProfile } from "@/services/authStore";
import { Trash2, Download, Info, Wheat, Database, LogOut, User } from "lucide-react";

interface Props { onLogout?: () => void; }

export function SettingsPage({ onLogout }: Props) {
  const queryClient = useQueryClient();
  const { data } = useFields();
  const user = getCurrentUser();
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editName, setEditName] = useState(user?.profile.name || "");
  const [editOrg, setEditOrg] = useState(user?.profile.organization || "");
  const [saved, setSaved] = useState(false);
  const fields = data?.fields || [];

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await fieldsApi.clearAll();
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry-stats"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry-geojson"] });
      setConfirmClear(false);
    } finally { setClearing(false); }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const geojson = await fieldsApi.exportFieldsAsGeoJSON();
      const blob = new Blob([geojson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "agrogenesis-all-fields.geojson";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const handleSaveProfile = () => {
    updateProfile({ name: editName, organization: editOrg });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const ic = "w-full bg-canopy-800/60 border border-canopy-700/60 rounded-lg px-3 py-2 text-sm text-earth-100 focus:border-earth-300/60 focus:outline-none transition-colors";

  return (
    <div className="h-full overflow-auto p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-bold text-earth-100">Settings</h1>
        <p className="text-xs text-field-300 mt-1">Manage your account and data</p>
      </div>

      {user && (
        <div className="bg-canopy-900/40 border border-canopy-700/40 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-earth-300" />
            <h2 className="text-sm font-semibold text-earth-100">Profile</h2>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-agro-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {user.profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-earth-100">{user.profile.name}</p>
              <p className="text-xs text-field-300">{user.profile.email}</p>
              <p className="text-[10px] text-field-400 mt-0.5">{user.profile.organization}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-field-300 uppercase mb-1">Name</label>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-[10px] text-field-300 uppercase mb-1">Organization</label>
              <input value={editOrg} onChange={(e) => setEditOrg(e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-[10px] text-field-300 uppercase mb-1">Email</label>
              <input value={user.profile.email} disabled className={ic + " opacity-60"} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveProfile} className="flex-1 px-4 py-2 bg-agro-600 hover:bg-agro-500 text-earth-100 rounded-lg text-sm font-medium transition-colors">
                {saved ? "Saved!" : "Save Changes"}
              </button>
              {onLogout && (
                <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 rounded-lg text-sm text-red-300 transition-colors">
                  <LogOut size={14} /> Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-canopy-900/40 border border-canopy-700/40 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database size={16} className="text-earth-300" />
          <h2 className="text-sm font-semibold text-earth-100">Data Management</h2>
        </div>
        <div className="bg-canopy-800/40 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-field-300">Stored Fields</p>
            <p className="text-lg font-bold text-earth-100">{fields.length}</p>
          </div>
          <div className="text-right text-[10px] text-field-300">
            <p>Account: {user?.profile.email}</p>
          </div>
        </div>
        <button onClick={handleExportAll} disabled={exporting || fields.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-canopy-800/60 hover:bg-canopy-700/60 border border-canopy-700/40 rounded-lg text-sm text-earth-200 disabled:opacity-50 mb-3">
          <Download size={16} />
          {exporting ? "Exporting..." : "Export All Fields (GeoJSON)"}
        </button>
        {confirmClear ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-xs text-red-300 mb-3">Delete all data for this account.</p>
            <div className="flex gap-2">
              <button onClick={handleClearAll} disabled={clearing} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium">Yes, Clear</button>
              <button onClick={() => setConfirmClear(false)} className="flex-1 px-4 py-2 bg-canopy-800/60 text-earth-200 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmClear(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/20 hover:bg-red-900/40 border border-red-500/20 rounded-lg text-sm text-red-300">
            <Trash2 size={16} />Clear All Data
          </button>
        )}
      </div>

      <div className="bg-canopy-900/40 border border-canopy-700/40 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-earth-300" />
          <h2 className="text-sm font-semibold text-earth-100">About</h2>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-canopy-800/60 flex items-center justify-center">
            <Wheat size={20} className="text-earth-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-earth-100">AgroGenesis AI</p>
            <p className="text-[11px] text-field-300">Precision Agriculture Decision Support</p>
          </div>
        </div>
        <div className="bg-canopy-800/40 rounded-lg p-3 text-[11px] space-y-1">
          <p className="text-field-300">Version: 0.1.0-alpha</p>
          <p className="text-field-300">AI Engine: DeepSeek V4</p>
          <p className="text-field-300">Track: EcoFin - Carbon Credit Optimization</p>
          <p className="text-field-300">Standards: ISO 11783 (ISOBUS), SAE J1939</p>
        </div>
      </div>
    </div>
  );
}
