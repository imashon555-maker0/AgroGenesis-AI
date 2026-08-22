import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { telemetryApi } from "@/api/telemetry";

export function useTelemetryStats(fieldId: string | null) {
  return useQuery({
    queryKey: ["telemetry-stats", fieldId],
    queryFn: () => telemetryApi.getStats(fieldId!),
    enabled: !!fieldId,
  });
}

export function useTelemetryGeoJSON(fieldId: string | null) {
  return useQuery({
    queryKey: ["telemetry-geojson", fieldId],
    queryFn: () => telemetryApi.getGeoJSON(fieldId!),
    enabled: !!fieldId,
  });
}

export function useUploadTelemetry(fieldId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => telemetryApi.upload(fieldId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["telemetry-stats", fieldId] });
      queryClient.invalidateQueries({ queryKey: ["telemetry-geojson", fieldId] });
    },
  });
}
