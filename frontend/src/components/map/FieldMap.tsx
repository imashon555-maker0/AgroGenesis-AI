import { useState } from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl";
import type { FillLayerSpecification, CircleLayerSpecification } from "mapbox-gl";
import { useMapStore } from "@/stores/mapStore";
import { Layers } from "lucide-react";

interface FieldMapProps {
  selectedFieldId?: string;
  showZones?: boolean;
  showTelemetry?: boolean;
  onFieldClick?: (fieldId: string) => void;
}

const ZONE_STYLE: { id: string; type: FillLayerSpecification["type"]; paint: FillLayerSpecification["paint"] } = {
  id: "zone-overlay",
  type: "fill",
  paint: {
    "fill-color": [
      "match",
      ["get", "productivity_class"],
      "high",
      "#22c55e",
      "medium",
      "#eab308",
      "low",
      "#ef4444",
      "#94a3b8",
    ] as any,
    "fill-opacity": 0.45,
  },
};

const BOUNDARY_STYLE = {
  id: "field-boundary",
  type: "line" as const,
  paint: {
    "line-color": "#22c55e",
    "line-width": 2,
    "line-opacity": 0.8,
  },
};

const TELEMETRY_STYLE: { id: string; type: CircleLayerSpecification["type"]; paint: CircleLayerSpecification["paint"] } = {
  id: "telemetry-points",
  type: "circle",
  paint: {
    "circle-radius": 4,
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "speed_kmh"],
      0,
      "#ef4444",
      10,
      "#eab308",
      20,
      "#22c55e",
    ] as any,
    "circle-opacity": 0.7,
  },
};

export function FieldMap({
  selectedFieldId,
  showZones = true,
  showTelemetry = false,
  onFieldClick: _onFieldClick,
}: FieldMapProps) {
  const { viewport, setViewport } = useMapStore();
  const [showControls, setShowControls] = useState(false);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

  return (
    <div className="relative w-full h-full">
      {!MAPBOX_TOKEN ? (
        <div className="w-full h-full bg-field-950 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-canopy-800/60 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-earth-300">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-earth-100 mb-1">Map View</h3>
            <p className="text-xs text-field-300">Set VITE_MAPBOX_TOKEN in .env to enable satellite view</p>
          </div>
        </div>
      ) : (
      <Map
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {/* Field boundary */}
        {selectedFieldId && (
          <Source
            id={`field-${selectedFieldId}`}
            type="geojson"
            data={`/api/v1/fields/${selectedFieldId}`}
          >
            <Layer {...BOUNDARY_STYLE} />
          </Source>
        )}

        {/* Zone overlay */}
        {selectedFieldId && showZones && (
          <Source
            id={`zones-${selectedFieldId}`}
            type="geojson"
            data={`/api/v1/fields/${selectedFieldId}/zones/geojson`}
          >
            <Layer {...ZONE_STYLE} />
          </Source>
        )}

        {/* Telemetry points */}
        {selectedFieldId && showTelemetry && (
          <Source
            id={`telemetry-${selectedFieldId}`}
            type="geojson"
            data={`/api/v1/telemetry/${selectedFieldId}/geojson`}
          >
            <Layer {...TELEMETRY_STYLE} />
          </Source>
        )}


      </Map>
      )}

      {/* Layer controls */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => setShowControls(!showControls)}
          className="bg-field-900/90 hover:bg-canopy-800/90 p-2 rounded-lg text-field-200 border border-canopy-700/60 transition-colors"
        >
          <Layers size={18} />
        </button>
        {showControls && (
          <div className="mt-2 bg-field-900/95 border border-canopy-700/60 rounded-lg p-3 space-y-2 backdrop-blur-sm">
            <label className="flex items-center gap-2 text-sm text-field-200 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-agro-500" />
              Zones
            </label>
            <label className="flex items-center gap-2 text-sm text-field-200 cursor-pointer">
              <input type="checkbox" className="accent-agro-500" />
              NDVI Overlay
            </label>
            <label className="flex items-center gap-2 text-sm text-field-200 cursor-pointer">
              <input type="checkbox" className="accent-agro-500" />
              Telemetry Trails
            </label>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-field-900/90 border border-canopy-700/60 rounded-lg p-3 text-xs z-10 backdrop-blur-sm">
        <p className="text-field-300 mb-1 font-medium">Productivity</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-agro-500" />
            <span className="text-field-200">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-earth-300" />
            <span className="text-field-200">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-field-200">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
