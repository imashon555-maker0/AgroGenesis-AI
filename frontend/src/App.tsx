import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/components/shared/Toast";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { FieldsPage } from "@/pages/FieldsPage";
import { TelemetryPage } from "@/pages/TelemetryPage";
import { ImageryPage } from "@/pages/ImageryPage";
import { PrescriptionsPage } from "@/pages/PrescriptionsPage";
import { EcoFinPage } from "@/pages/EcoFinPage";
import { SettingsPage } from "@/pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/fields" element={<FieldsPage />} />
            <Route path="/telemetry" element={<TelemetryPage />} />
            <Route path="/imagery" element={<ImageryPage />} />
            <Route path="/prescriptions" element={<PrescriptionsPage />} />
            <Route path="/ecofin" element={<EcoFinPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppShell>
      </ToastProvider>
    </BrowserRouter>
  );
}
