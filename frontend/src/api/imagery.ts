import { apiClient } from "./client";
import * as local from "@/services/localStore";

// Generate synthetic NDVI/NDRE results for offline mode
function generateSyntheticAnalysis(fieldId: string) {
  const field = local.getField(fieldId);
  const zones = field?.zones || [];

  const zoneStats = zones.map((z: any) => ({
    zone_label: z.zone_label,
    mean_ndvi: z.mean_ndvi || 0.5,
    mean_ndre: z.mean_ndre || 0.4,
    pixel_count: Math.floor(Math.random() * 5000) + 1000,
    ndvi_percentiles: { p25: (z.mean_ndvi || 0.5) - 0.1, p50: z.mean_ndvi || 0.5, p75: (z.mean_ndvi || 0.5) + 0.1 },
  }));

  const allNdvi = zones.map((z: any) => z.mean_ndvi || 0.5);
  const allNdre = zones.map((z: any) => z.mean_ndre || 0.4);
  const meanNdvi = allNdvi.reduce((a: number, b: number) => a + b, 0) / (allNdvi.length || 1);
  const meanNdre = allNdre.reduce((a: number, b: number) => a + b, 0) / (allNdre.length || 1);

  return {
    field_id: fieldId,
    source: "synthetic-analysis",
    vegetation_indices: {
      ndvi: { mean: meanNdvi, std: 0.12, class_fractions: { "0": 0.02, "1": 0.08, "2": 0.2, "3": 0.35, "4": 0.25, "5": 0.1 } },
      ndre: { mean: meanNdre, std: 0.10, class_fractions: { "0": 0.03, "1": 0.1, "2": 0.22, "3": 0.33, "4": 0.22, "5": 0.1 } },
    },
    zone_stats: zoneStats,
    observation_id: "local-" + Date.now(),
  };
}

export const imageryApi = {
  analyze: async (fieldId: string) => {
    try {
      const { data } = await apiClient.post(`/api/v1/imagery/analyze/${fieldId}`);
      return data;
    } catch {
      return generateSyntheticAnalysis(fieldId);
    }
  },

  diagnose: async (imageBase64: string, context?: string) => {
    try {
      const { data } = await apiClient.post("/api/v1/imagery/diagnose", {
        image_base64: imageBase64,
        context: context || "",
        field_id: "00000000-0000-0000-0000-000000000000",
      });
      return data;
    } catch {
      // Mock diagnosis for offline mode
      return {
        condition: "nitrogen_deficiency",
        confidence: 0.78,
        severity: "moderate",
        description: "Yellowing observed on lower leaves consistent with moderate nitrogen deficiency. Interveinal chlorosis pattern detected.",
        affected_areas: ["Lower canopy leaves", "Field edges"],
        recommended_action: "Apply supplemental nitrogen at 60-80 kg/ha via variable-rate application.",
        model_used: "local-mock",
      };
    }
  },
};
