import { apiClient } from "./client";
import type { Field } from "@/types";

export const fieldsApi = {
  list: async (): Promise<{ fields: Field[]; total: number }> => {
    const { data } = await apiClient.get("/api/v1/fields");
    return data;
  },

  get: async (fieldId: string): Promise<Field> => {
    const { data } = await apiClient.get(`/api/v1/fields/${fieldId}`);
    return data;
  },

  create: async (payload: {
    name: string;
    geometry: object;
    soil_type?: string;
    crop_type?: string;
  }): Promise<Field> => {
    const { data } = await apiClient.post("/api/v1/fields", payload);
    return data;
  },

  getZonesGeoJSON: async (fieldId: string) => {
    const { data } = await apiClient.get(`/api/v1/fields/${fieldId}/zones/geojson`);
    return data;
  },
};
