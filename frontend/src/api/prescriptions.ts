import { apiClient } from "./client";
import type { Prescription } from "@/types";

export const prescriptionsApi = {
  list: async (fieldId: string): Promise<{ prescriptions: Prescription[]; total: number }> => {
    const { data } = await apiClient.get(`/api/v1/prescriptions/${fieldId}`);
    return data;
  },

  generate: async (fieldId: string, inputType = "nitrogen"): Promise<Prescription> => {
    const { data } = await apiClient.post(
      `/api/v1/prescriptions/${fieldId}/generate`,
      null,
      { params: { input_type: inputType } }
    );
    return data;
  },

  get: async (prescriptionId: string): Promise<Prescription> => {
    const { data } = await apiClient.get(`/api/v1/prescriptions/detail/${prescriptionId}`);
    return data;
  },

  exportISOBUS: async (prescriptionId: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/api/v1/export/${prescriptionId}/isobus`, {
      responseType: "blob",
    });
    return data;
  },

  exportShapefile: async (prescriptionId: string): Promise<Blob> => {
    const { data } = await apiClient.get(`/api/v1/export/${prescriptionId}/shapefile`, {
      responseType: "blob",
    });
    return data;
  },
};
