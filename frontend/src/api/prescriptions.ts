import { apiClient } from "./client";
import * as local from "@/services/localStore";
import { generatePrescriptionWithAI } from "@/services/deepseek";
import type { Prescription } from "@/types";

export const prescriptionsApi = {
  list: async (fieldId: string): Promise<{ prescriptions: Prescription[]; total: number }> => {
    try {
      const { data } = await apiClient.get(`/api/v1/prescriptions/${fieldId}`);
      return data;
    } catch {
      const prescriptions = local.getPrescriptionsForField(fieldId);
      return { prescriptions: prescriptions as unknown as Prescription[], total: prescriptions.length };
    }
  },

  generate: async (fieldId: string, inputType = "nitrogen"): Promise<Prescription> => {
    try {
      const { data } = await apiClient.post(
        `/api/v1/prescriptions/${fieldId}/generate`,
        null,
        { params: { input_type: inputType } }
      );
      return data;
    } catch {
      // Try AI generation, fall back to local
      try {
        const field = local.getField(fieldId);
        if (field) {
          const aiResult = await generatePrescriptionWithAI(field.zones, inputType, field.name);
          return {
            id: crypto.randomUUID(),
            field_id: fieldId,
            input_type: inputType,
            status: "draft",
            created_at: new Date().toISOString(),
            zones: aiResult.zones,
            total_estimated_input: aiResult.total_estimated_input,
            operator_notes: aiResult.operator_notes,
            deepseek_model: "deepseek-chat",
            deepseek_reasoning: null,
            ecofin: null,
          } as Prescription;
        }
      } catch { /* AI failed, use local */ }
      return local.generateLocalPrescription(fieldId, inputType) as unknown as Prescription;
    }
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
