import { Cloud, Sun, Droplets, Wind, Thermometer } from "lucide-react";

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: { day: string; high: number; low: number; icon: string }[];
}

const MOCK_WEATHER: WeatherData = {
  temp: 24,
  condition: "Partly Cloudy",
  humidity: 45,
  windSpeed: 12,
  forecast: [
    { day: "Mon", high: 26, low: 14, icon: "sun" },
    { day: "Tue", high: 28, low: 16, icon: "sun" },
    { day: "Wed", high: 22, low: 13, icon: "cloud" },
    { day: "Thu", high: 20, low: 11, icon: "rain" },
    { day: "Fri", high: 25, low: 15, icon: "sun" },
  ],
};

function ForecastIcon({ icon }: { icon: string }) {
  if (icon === "rain") return <Droplets size={14} className="text-blue-400" />;
  if (icon === "cloud") return <Cloud size={14} className="text-field-300" />;
  return <Sun size={14} className="text-earth-300" />;
}

export function WeatherWidget() {
  const w = MOCK_WEATHER;

  return (
    <div className="bg-canopy-900/60 border border-canopy-700/40 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[10px] font-medium text-field-300 uppercase tracking-wide">Weather</h4>
        <span className="text-[10px] text-field-400">Akmola Region</span>
      </div>

      {/* Current */}
      <div className="flex items-center gap-3 mb-3">
        <Sun size={28} className="text-earth-300" />
        <div>
          <span className="text-2xl font-bold text-earth-100">{w.temp}°C</span>
          <p className="text-[11px] text-field-300">{w.condition}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-[11px] text-field-300 mb-3">
        <div className="flex items-center gap-1">
          <Droplets size={12} className="text-blue-400" />
          <span>{w.humidity}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Wind size={12} className="text-field-300" />
          <span>{w.windSpeed} km/h</span>
        </div>
        <div className="flex items-center gap-1">
          <Thermometer size={12} className="text-red-400" />
          <span>Soil 18°C</span>
        </div>
      </div>

      {/* 5-day forecast */}
      <div className="flex gap-2">
        {w.forecast.map((f) => (
          <div key={f.day} className="flex-1 text-center bg-canopy-900/40 rounded-lg py-1.5">
            <p className="text-[9px] text-field-400 uppercase">{f.day}</p>
            <ForecastIcon icon={f.icon} />
            <p className="text-[10px] text-earth-100 font-mono">{f.high}°</p>
            <p className="text-[9px] text-field-400 font-mono">{f.low}°</p>
          </div>
        ))}
      </div>
    </div>
  );
}
