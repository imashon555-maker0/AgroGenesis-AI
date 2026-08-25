import { useState, useEffect, useMemo } from "react";
import { Cloud, Sun, Droplets, Wind, Thermometer, CloudRain, CloudSnow, Zap } from "lucide-react";
import { fetchWeather, getMockWeather, getFieldCentroid } from "@/services/openweather";
import type { WeatherData } from "@/services/openweather";

interface WeatherWidgetProps {
  fieldGeometry?: any;
  fieldName?: string;
}

function ForecastIcon({ condition }: { condition: string }) {
  if (condition === "thunderstorm") return <Zap size={14} className="text-yellow-400" />;
  if (condition === "rain" || condition === "drizzle")
    return <CloudRain size={14} className="text-blue-400" />;
  if (condition === "snow") return <CloudSnow size={14} className="text-white" />;
  if (condition === "cloudy") return <Cloud size={14} className="text-field-300" />;
  return <Sun size={14} className="text-earth-300" />;
}

function WeatherIcon({ condition, size = 28 }: { condition: string; size?: number }) {
  if (condition === "thunderstorm") return <Zap size={size} className="text-yellow-400" />;
  if (condition === "rain" || condition === "drizzle")
    return <CloudRain size={size} className="text-blue-400" />;
  if (condition === "snow") return <CloudSnow size={size} className="text-white" />;
  if (condition === "cloudy") return <Cloud size={size} className="text-field-300" />;
  if (condition === "partly_cloudy") return <Cloud size={size} className="text-field-200" />;
  return <Sun size={size} className="text-earth-300" />;
}

function conditionLabel(condition: string): string {
  const map: Record<string, string> = {
    clear: "Ясное небо",
    partly_cloudy: "Переменная облачность",
    cloudy: "Пасмурно",
    rain: "Дождь",
    drizzle: "Небольшой дождь",
    thunderstorm: "Гроза",
    snow: "Снег",
    mist: "Туман",
    fog: "Туман",
  };
  return map[condition] || condition.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function WeatherWidget({ fieldGeometry, fieldName }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const centroid = useMemo(() => {
    if (fieldGeometry) return getFieldCentroid(fieldGeometry);
    return null;
  }, [fieldGeometry]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        if (centroid) {
          const data = await fetchWeather(centroid.lat, centroid.lon);
          if (!cancelled) {
            setWeather(data);
            setLoading(false);
          }
        } else {
          // No field selected — use mock data
          if (!cancelled) {
            setWeather(getMockWeather());
            setLoading(false);
          }
        }
      } catch {
          if (!cancelled) {
            setWeather(getMockWeather());
            setLoading(false);
          }
        }
    }

    load();
    return () => { cancelled = true; };
  }, [centroid?.lat, centroid?.lon]);

  // Show loading skeleton
  if (loading || !weather) {
    return (
      <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4 animate-pulse">
        <div className="h-3 bg-canopy-700/40 rounded w-20 mb-3" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 bg-canopy-700/40 rounded" />
          <div>
            <div className="h-6 bg-canopy-700/40 rounded w-16 mb-1" />
            <div className="h-2 bg-canopy-700/40 rounded w-24" />
          </div>
        </div>
        <div className="flex gap-4 mb-3">
          <div className="h-2 bg-canopy-700/40 rounded w-12" />
          <div className="h-2 bg-canopy-700/40 rounded w-16" />
        </div>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex-1 h-16 bg-canopy-700/40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const w = weather;
  const locationLabel = fieldName
    ? fieldName.split("-").slice(0, 2).join("-")
    : w.location_name || "Акмолинская область";

  return (
    <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-medium text-field-300 uppercase tracking-wide">Погода</h4>
        <span className="text-[10px] text-field-400">{locationLabel}</span>
      </div>

      {/* Current */}
      <div className="flex items-center gap-3 mb-3">
        <WeatherIcon condition={w.current.condition} size={28} />
        <div>
          <span className="text-2xl font-bold text-earth-100">{w.current.temp}°C</span>
          <p className="text-[11px] text-field-300">{conditionLabel(w.current.condition)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-[11px] text-field-300 mb-3">
        <div className="flex items-center gap-1">
          <Droplets size={12} className="text-blue-400" />
          <span>{w.current.humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind size={12} className="text-field-300" />
          <span>{w.current.wind_speed} km/h</span>
        </div>
        <div className="flex items-center gap-1">
          <Thermometer size={12} className="text-red-400" />
          <span>Ощущается {w.current.feels_like}°C</span>
        </div>
      </div>

      {/* 5-day forecast */}
      <div className="flex gap-2">
        {w.forecast.map((f) => (
          <div key={f.date} className="flex-1 text-center bg-canopy-900/40 rounded-lg py-1.5">
            <p className="text-[9px] text-field-400 uppercase">{f.day_name}</p>
            <ForecastIcon condition={f.condition} />
            <p className="text-[10px] text-earth-100 font-mono">{f.high}°</p>
            <p className="text-[9px] text-field-400 font-mono">{f.low}°</p>
            {f.pop > 0 && (
              <p className="text-[8px] text-blue-400 font-mono">{f.pop}%</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
