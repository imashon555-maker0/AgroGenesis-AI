import { useState } from "react";
import Map, { Source, Layer, NavigationControl, Popup } from "react-map-gl";
import { useMapStore } from "@/stores/mapStore";
import { Layers } from "lucide-react";

interface FieldMapProps {
  selectedFieldId?: string;
  showZones?: boolean;
  showNDVI?: boolean;
  showTelemetry?: boolean;
}

const ZONE_STYLE = {
  id: "zone-overlay",
  type: "fill" as const,
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
    ],
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

const TELEMETRY_STYLE = {
  id: "telemetry-points",
  type: "circle" as const,
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
    ],
    "circle-opacity": 0.7,
  },
};

export function FieldMap({
  selectedFieldId,
  showZones = true,
  showNDVI = false,
  showTelemetry = false,
}: FieldMapProps) {
  const { viewport, setViewport } = useMapStore();
  const [hoveredZone, setHoveredZone] = useState<any>(null);
  const [showControls, setShowControls] = useState(false);

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

  return (
    <div className="relative w-full h-full">
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

        {/* Hover tooltip */}
        {hoveredZone && (
          <Popup
            longitude={hoveredZone.lng || viewport.longitude}
            latitude={hoveredZone.lat || viewport.latitude}
            closeButton={false}
          >
            <div className="text-sm">
              <p className="font-semibold">Zone {hoveredZone.zone_label}</p>
              <p className="text-slate-500">
                {hoveredZone.productivity_class} productivity
              </p>
            </div>
          </Popup>
        )}
      </Map>

      {/* Layer controls */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => setShowControls(!showControls)}
          className="bg-slate-800/90 hover:bg-slate-700 p-2 rounded-lg text-slate-300 border border-slate-600"
        >
          <Layers size={18} />
        </button>
        {showControls && (
          <div className="mt-2 bg-slate-800/90 border border-slate-600 rounded-lg p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-green-500" />
              Zones
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" className="accent-green-500" />
              NDVI Overlay
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" className="accent-green-500" />
              Telemetry Trails
            </label>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 border border-slate-600 rounded-lg p-3 text-xs">
        <p className="text-slate-400 mb-1 font-medium">Productivity</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-slate-300">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-slate-300">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-slate-300">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
