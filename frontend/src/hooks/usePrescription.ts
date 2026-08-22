import { useMutation, useQueryClient } from "@tanstack/react-query";
import { prescriptionsApi } from "@/api/prescriptions";

export function useGeneratePrescription(fieldId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inputType: string) => prescriptionsApi.generate(fieldId, inputType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions", fieldId] });
    },
  });
}

export function useExportISOBUS() {
  return useMutation({
    mutationFn: async (prescriptionId: string) => {
      const blob = await prescriptionsApi.exportISOBUS(prescriptionId);
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TASKDATA_${prescriptionId.slice(0, 8)}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}

export function useExportShapefile() {
  return useMutation({
    mutationFn: async (prescriptionId: string) => {
      const blob = await prescriptionsApi.exportShapefile(prescriptionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription_${prescriptionId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}
