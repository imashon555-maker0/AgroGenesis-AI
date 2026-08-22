import { apiClient } from "./client";
import type { EcoFinSummary } from "@/types";

export const ecofinApi = {
  get: async (prescriptionId: string): Promise<EcoFinSummary> => {
    const { data } = await apiClient.get(`/api/v1/ecofin/${prescriptionId}`);
    return data;
  },
};
