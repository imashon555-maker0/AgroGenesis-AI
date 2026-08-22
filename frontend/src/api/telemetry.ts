import { apiClient } from "./client";
import type { TelemetryRecord, TelemetryStats } from "@/types";

export const telemetryApi = {
  getRecords: async (fieldId: string, limit = 100): Promise<TelemetryRecord[]> => {
    const { data } = await apiClient.get(`/api/v1/telemetry/${fieldId}/records`, {
      params: { limit },
    });
    return data;
  },

  getStats: async (fieldId: string): Promise<TelemetryStats[]> => {
    const { data } = await apiClient.get(`/api/v1/telemetry/${fieldId}/stats`);
    return data;
  },

  getGeoJSON: async (fieldId: string) => {
    const { data } = await apiClient.get(`/api/v1/telemetry/${fieldId}/geojson`);
    return data;
  },

  upload: async (fieldId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post(`/api/v1/telemetry/${fieldId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
