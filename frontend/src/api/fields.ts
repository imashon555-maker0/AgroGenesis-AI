import { apiClient } from "./client";
import type { Field } from "@/types";
import * as local from "@/services/localStore";

export const fieldsApi = {
  list: async (): Promise<{ fields: Field[]; total: number }> => {
    try {
      const { data } = await apiClient.get("/api/v1/fields");
      return data;
    } catch {
      return local.listFields();
    }
  },

  get: async (id: string): Promise<Field> => {
    try {
      const { data } = await apiClient.get(`/api/v1/fields/${id}`);
      return data;
    } catch {
      return local.getField(id);
    }
  },

  create: async (fieldData: {
    name: string;
    geometry: any;
    soil_type?: string;
    crop_type?: string;
  }): Promise<Field> => {
    try {
      const { data } = await apiClient.post("/api/v1/fields", fieldData);
      return data;
    } catch {
      return local.createField(fieldData) as unknown as Field;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/api/v1/fields/${id}`);
      return true;
    } catch {
      return local.deleteField(id);
    }
  },

  getZonesGeoJSON: async (fieldId: string) => {
    try {
      const { data } = await apiClient.get(`/api/v1/fields/${fieldId}/zones/geojson`);
      return data;
    } catch {
      return local.getFieldZonesGeoJSON(fieldId);
    }
  },

  loadSampleData: async (): Promise<{ fieldsCreated: number; recordsImported: number }> => {
    try {
      const { data } = await apiClient.post("/api/v1/fields/sample-data");
      return data;
    } catch {
      return await local.loadSampleData();
    }
  },

  clearAll: async (): Promise<void> => {
    try {
      await apiClient.delete("/api/v1/fields");
    } catch {
      local.clearAll();
    }
  },

  exportFieldsAsGeoJSON: async (): Promise<string> => {
    try {
      const { data } = await apiClient.get("/api/v1/fields/export/geojson");
      return JSON.stringify(data);
    } catch {
      return local.exportFieldsAsGeoJSON();
    }
  },

  exportTelemetryAsCSV: async (fieldId: string): Promise<string> => {
    try {
      const { data } = await apiClient.get(`/api/v1/telemetry/${fieldId}/export/csv`);
      return data;
    } catch {
      return local.exportTelemetryAsCSV(fieldId);
    }
  },
};