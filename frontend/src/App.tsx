import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DeviceProvider } from "@/hooks/useDeviceType";
import { ToastProvider } from "@/components/shared/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { LoginModal } from "@/components/auth/LoginModal";
import { DashboardPage } from "@/pages/DashboardPage";
import { FieldsPage } from "@/pages/FieldsPage";
import { TelemetryPage } from "@/pages/TelemetryPage";
import { ImageryPage } from "@/pages/ImageryPage";
import { PrescriptionsPage } from "@/pages/PrescriptionsPage";
import { EcoFinPage } from "@/pages/EcoFinPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { getCurrentUser, logout, type AuthUser } from "@/services/authStore";
import { useQueryClient } from "@tanstack/react-query";
import { fieldsApi } from "@/api/fields";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const existing = getCurrentUser();
    setUser(existing);
    setChecking(false);
  }, []);

  const handleAuth = useCallback(async (authUser: AuthUser) => {
    setUser(authUser);
    // Auto-load sample data for new users (no existing fields)
    const { fields } = await fieldsApi.list();
    if (fields.length === 0) {
      try {
        await fieldsApi.loadSampleData();
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      } catch { /* sample data load failed, continue */ }
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-field-950">
        <div className="w-8 h-8 border-2 border-earth-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginModal onAuth={handleAuth} />;
  }

  return (
    <BrowserRouter>
      <DeviceProvider>
        <ToastProvider>
          <AppShell onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/fields" element={<FieldsPage />} />
              <Route path="/telemetry" element={<TelemetryPage />} />
              <Route path="/imagery" element={<ImageryPage />} />
              <Route path="/prescriptions" element={<PrescriptionsPage />} />
              <Route path="/ecofin" element={<EcoFinPage />} />
              <Route path="/settings" element={<SettingsPage onLogout={handleLogout} />} />
            </Routes>
          </AppShell>
        </ToastProvider>
      </DeviceProvider>
    </BrowserRouter>
  );
}
