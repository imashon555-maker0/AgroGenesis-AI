import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { FieldsPage } from "@/pages/FieldsPage";
import { TelemetryPage } from "@/pages/TelemetryPage";
import { ImageryPage } from "@/pages/ImageryPage";
import { PrescriptionsPage } from "@/pages/PrescriptionsPage";
import { EcoFinPage } from "@/pages/EcoFinPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/fields" element={<FieldsPage />} />
          <Route path="/telemetry" element={<TelemetryPage />} />
          <Route path="/imagery" element={<ImageryPage />} />
          <Route path="/prescriptions" element={<PrescriptionsPage />} />
          <Route path="/ecofin" element={<EcoFinPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
