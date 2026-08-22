import { apiClient } from "./client";

export const imageryApi = {
  analyze: async (fieldId: string) => {
    const { data } = await apiClient.post(`/api/v1/imagery/analyze/${fieldId}`);
    return data;
  },

  diagnose: async (imageBase64: string, context?: string) => {
    const { data } = await apiClient.post("/api/v1/imagery/diagnose", {
      image_base64: imageBase64,
      context: context || "",
      field_id: "00000000-0000-0000-0000-000000000000", // placeholder
    });
    return data;
  },
};
