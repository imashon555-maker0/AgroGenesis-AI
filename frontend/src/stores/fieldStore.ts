import { create } from "zustand";
import type { Field } from "@/types";

interface FieldStore {
  fields: Field[];
  selectedFieldId: string | null;
  isLoading: boolean;
  error: string | null;

  setFields: (fields: Field[]) => void;
  selectField: (fieldId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getSelectedField: () => Field | undefined;
}

export const useFieldStore = create<FieldStore>((set, get) => ({
  fields: [],
  selectedFieldId: null,
  isLoading: false,
  error: null,

  setFields: (fields) => set({ fields }),
  selectField: (fieldId) => set({ selectedFieldId: fieldId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  getSelectedField: () => {
    const { fields, selectedFieldId } = get();
    return fields.find((f) => f.id === selectedFieldId);
  },
}));
