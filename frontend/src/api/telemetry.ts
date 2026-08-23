import { apiClient } from "./client";
import type { TelemetryRecord, TelemetryStats } from "@/types";
import * as local from "@/services/localStore";

export const telemetryApi = {
  getRecords: async (fieldId: string, limit = 100): Promise<TelemetryRecord[]> => {
    try {
      const { data } = await apiClient.get(`/api/v1/telemetry/${fieldId}/records`, {
        params: { limit },
      });
      return data;
    } catch {
      return [] as any;
    }
  },

  getStats: async (fieldId: string): Promise<TelemetryStats[]> => {
    try {
      const { data } = await apiClient.get(`/api/v1/telemetry/${fieldId}/stats`);
      return data;
    } catch {
      return local.getTelemetryStats(fieldId) as any;
    }
  },

  getGeoJSON: async (fieldId: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/telemetry/${fieldId}/geojson`);
      return data;
    } catch {
      return { type: "FeatureCollection", features: [] };
    }
  },

  upload: async (fieldId: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post(`/api/v1/telemetry/${fieldId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch {
      // Fallback: parse CSV client-side
      const text = await file.text();
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv") {
        return local.parseCSVTelemetry(text, fieldId);
      }
      throw new Error("Only CSV files can be parsed offline. Start the backend for XML support.");
    }
  },
};
