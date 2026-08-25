import { useRef, useEffect } from "react";
import { useMap } from "react-map-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

interface MapDrawControlProps {
  onDrawComplete: (geometry: any) => void;
  enabled: boolean;
}

export function MapDrawControl({ onDrawComplete, enabled }: MapDrawControlProps) {
  const { current: map } = useMap();
  const drawRef = useRef<MapboxDraw | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // Initialize draw control
  useEffect(() => {
    if (!map) return;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      modes: {
        ...MapboxDraw.modes,
        // Custom simple_select that ignores clicks when disabled
      },
      defaultMode: "simple_select",
      styles: [
        { id: "gl-draw-polygon-fill", type: "fill", paint: { "fill-color": "#22c55e", "fill-opacity": 0.3 } },
        { id: "gl-draw-polygon-stroke-active", type: "line", paint: { "line-color": "#22c55e", "line-width": 2 } },
        { id: "gl-draw-polygon-midpoint", type: "circle", paint: { "circle-radius": 4, "circle-color": "#22c55e" } },
        { id: "gl-draw-polygon-and-line-vertex-active", type: "circle", paint: { "circle-radius": 6, "circle-color": "#16a34a", "circle-stroke-color": "#fff", "circle-stroke-width": 2 } },
        { id: "gl-draw-line-active", type: "line", paint: { "line-color": "#22c55e", "line-width": 2 } },
      ],
    });

    map.addControl(draw, "top-left");
    drawRef.current = draw;

    // Listen for draw events
    const onDraw = (e: any) => {
      if (!enabledRef.current) return;
      const features = e.features;
      if (features && features.length > 0) {
        const feature = features[0];
        if (feature.geometry && feature.geometry.type === "Polygon") {
          onDrawComplete(feature.geometry);
          // Clear the drawing after passing it back
          setTimeout(() => {
            try { draw.deleteAll(); } catch {}
          }, 100);
        }
      }
    };

    map.on("draw.create", onDraw);

    return () => {
      map.off("draw.create", onDraw);
      try {
        map.removeControl(draw);
        drawRef.current = null;
      } catch {}
    };
  }, [map, onDrawComplete]);

  // Toggle draw mode when enabled changes
  useEffect(() => {
    if (!drawRef.current) return;
    if (enabled) {
      try { drawRef.current.changeMode("draw_polygon"); } catch {}
    } else {
      try { drawRef.current.changeMode("simple_select"); } catch {}
    }
  }, [enabled]);

  return null;
}