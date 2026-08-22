import { create } from "zustand";

interface MapStore {
  viewport: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  layers: {
    zones: boolean;
    ndvi: boolean;
    telemetry: boolean;
    prescription: boolean;
  };

  setViewport: (viewport: Partial<MapStore["viewport"]>) => void;
  toggleLayer: (layer: keyof MapStore["layers"]) => void;
  setLayer: (layer: keyof MapStore["layers"], visible: boolean) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  // Default: Central Kazakhstan
  viewport: {
    longitude: 69.2,
    latitude: 43.2,
    zoom: 12,
  },
  layers: {
    zones: true,
    ndvi: false,
    telemetry: false,
    prescription: false,
  },

  setViewport: (viewport) =>
    set((state) => ({ viewport: { ...state.viewport, ...viewport } })),

  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),

  setLayer: (layer, visible) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: visible },
    })),
}));
