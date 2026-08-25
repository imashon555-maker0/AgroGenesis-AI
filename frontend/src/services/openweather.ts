/**
 * OpenWeatherMap API service for live weather data.
 * Falls back to mock data if no API key is configured.
 */

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherCurrent {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  icon: string;
  visibility: number;
  pressure: number;
  dt: number;
}

export interface WeatherForecastDay {
  date: string;
  day_name: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
  humidity: number;
  pop: number; // probability of precipitation
}

export interface WeatherData {
  current: WeatherCurrent;
  forecast: WeatherForecastDay[];
  location_name: string;
  lat: number;
  lon: number;
}

// Simple in-memory cache (5 minutes)
const cache = new Map<string, { data: WeatherData; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

/**
 * Extract centroid coordinates from a GeoJSON Polygon.
 */
export function getFieldCentroid(geometry: any): { lat: number; lon: number } | null {
  try {
    const coords = geometry?.type === "Polygon"
      ? geometry.coordinates[0]
      : geometry?.coordinates?.[0]?.[0] || [];
    if (!coords.length) return null;
    const lons = coords.map((c: number[]) => c[0]);
    const lats = coords.map((c: number[]) => c[1]);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lon: (Math.min(...lons) + Math.max(...lons)) / 2,
    };
  } catch {
    return null;
  }
}

/**
 * Map OpenWeatherMap condition codes to our icon types.
 */
function mapCondition(code: number, desc: string): string {
  if (code >= 200 && code < 300) return "thunderstorm";
  if (code >= 300 && code < 400) return "drizzle";
  if (code >= 500 && code < 600) return "rain";
  if (code >= 600 && code < 700) return "snow";
  if (code >= 700 && code < 800) return desc;
  if (code === 800) return "clear";
  if (code === 801) return "partly_cloudy";
  if (code >= 802) return "cloudy";
  return desc;
}

/**
 * Fetch current weather + 5-day forecast from OpenWeatherMap.
 */
export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const key = getCacheKey(lat, lon);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  if (!API_KEY) {
    throw new Error("NO_API_KEY");
  }

  // Fetch current + forecast in parallel
  const [currentRes, forecastRes] = await Promise.all([
    fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    ),
    fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&cnt=40`
    ),
  ]);

  if (!currentRes.ok || !forecastRes.ok) {
    throw new Error(`Weather API error: ${currentRes.status}/${forecastRes.status}`);
  }

  const currentJson = await currentRes.json();
  const forecastJson = await forecastRes.json();

  const current: WeatherCurrent = {
    temp: Math.round(currentJson.main.temp),
    feels_like: Math.round(currentJson.main.feels_like),
    humidity: currentJson.main.humidity,
    wind_speed: Math.round(currentJson.wind.speed * 3.6), // m/s → km/h
    condition: mapCondition(
      currentJson.weather[0].id,
      currentJson.weather[0].description
    ),
    icon: currentJson.weather[0].icon,
    visibility: currentJson.visibility,
    pressure: currentJson.main.pressure,
    dt: currentJson.dt,
  };

  // Group forecast by day (take one entry per day at noon)
  const dailyMap = new Map<string, any>();
  for (const entry of forecastJson.list) {
    const date = entry.dt_txt.split(" ")[0];
    const hour = parseInt(entry.dt_txt.split(" ")[1].split(":")[0]);
    if (!dailyMap.has(date) || (hour >= 11 && hour <= 13)) {
      dailyMap.set(date, entry);
    }
  }

  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const forecast: WeatherForecastDay[] = [];

  // Get min/max for each day from all entries
  const dailyTemps = new Map<string, { highs: number[]; lows: number[]; midday: any }>();
  for (const entry of forecastJson.list) {
    const date = entry.dt_txt.split(" ")[0];
    if (!dailyTemps.has(date)) {
      dailyTemps.set(date, { highs: [], lows: [], midday: null });
    }
    const d = dailyTemps.get(date)!;
    d.highs.push(entry.main.temp_max);
    d.lows.push(entry.main.temp_min);
    const hour = parseInt(entry.dt_txt.split(" ")[1].split(":")[0]);
    if (hour >= 11 && hour <= 14) d.midday = entry;
  }

  let dayIndex = 0;
  const now = new Date();
  for (const [date, temps] of dailyTemps) {
    if (forecast.length >= 5) break;
    const entry = temps.midday || forecastJson.list[forecastJson.list.length - 1];
    const forecastDate = new Date(date + "T12:00:00");
    const isToday = forecastDate.toDateString() === now.toDateString();
    const dayName = isToday ? "Сегодня" : days[forecastDate.getDay()];

    forecast.push({
      date,
      day_name: dayName,
      high: Math.round(Math.max(...temps.highs)),
      low: Math.round(Math.min(...temps.lows)),
      condition: mapCondition(
        entry.weather[0].id,
        entry.weather[0].description
      ),
      icon: entry.weather[0].icon,
      humidity: entry.main.humidity,
      pop: Math.round((entry.pop || 0) * 100),
    });
    dayIndex++;
  }

  const result: WeatherData = {
    current,
    forecast,
    location_name: currentJson.name || "Unknown",
    lat,
    lon,
  };

  cache.set(key, { data: result, ts: Date.now() });
  return result;
}

/**
 * Get mock weather data as fallback when no API key is available.
 */
export function getMockWeather(): WeatherData {
  return {
    current: {
      temp: 24,
      feels_like: 23,
      humidity: 45,
      wind_speed: 12,
      condition: "partly_cloudy",
      icon: "02d",
      visibility: 10000,
      pressure: 1013,
      dt: Math.floor(Date.now() / 1000),
    },
    forecast: [
      { date: "2026-08-25", day_name: "Сегодня", high: 26, low: 14, condition: "clear", icon: "01d", humidity: 40, pop: 0 },
      { date: "2026-08-26", day_name: "Вт", high: 28, low: 16, condition: "clear", icon: "01d", humidity: 35, pop: 0 },
      { date: "2026-08-27", day_name: "Ср", high: 22, low: 13, condition: "cloudy", icon: "03d", humidity: 55, pop: 20 },
      { date: "2026-08-28", day_name: "Чт", high: 20, low: 11, condition: "rain", icon: "10d", humidity: 70, pop: 80 },
      { date: "2026-08-29", day_name: "Пт", high: 25, low: 15, condition: "clear", icon: "01d", humidity: 42, pop: 10 },
    ],
    location_name: "Акмолинская область",
    lat: 51.17,
    lon: 71.43,
  };
}
