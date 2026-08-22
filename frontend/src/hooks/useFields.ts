import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fieldsApi } from "@/api/fields";
import { useFieldStore } from "@/stores/fieldStore";

export function useFields() {
  const { setFields, setLoading, setError } = useFieldStore();

  const query = useQuery({
    queryKey: ["fields"],
    queryFn: fieldsApi.list,
  });

  useEffect(() => {
    if (query.data) {
      setFields(query.data.fields);
    }
    setLoading(query.isLoading);
    if (query.error) {
      setError(query.error.message);
    }
  }, [query.data, query.isLoading, query.error]);

  return query;
}

export function useField(fieldId: string | null) {
  return useQuery({
    queryKey: ["field", fieldId],
    queryFn: () => fieldsApi.get(fieldId!),
    enabled: !!fieldId,
  });
}
