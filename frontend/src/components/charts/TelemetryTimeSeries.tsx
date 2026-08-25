import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TimeSeriesPoint {
  date: string;
  fullDate: string;
  speed: number | null;
  fuel: number | null;
  appliedRate: number | null;
  records: number;
}

interface TelemetryTimeSeriesProps {
  data: TimeSeriesPoint[];
}

export function TelemetryTimeSeries({ data }: TelemetryTimeSeriesProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-field-300 text-xs">Недостаточно данных для графика. Загрузите телеметрию за несколько дней.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Speed over time */}
      <div>
        <h4 className="text-xs font-medium text-field-300 mb-3 uppercase tracking-wide">Скорость (км/ч)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a35" />
            <XAxis dataKey="date" tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <YAxis tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1a3326", border: "1px solid #2d4a35", color: "#f5e6c8" }}
              labelStyle={{ color: "#f5e6c8" }}
              formatter={(value: number) => [value + " km/h", "Скорость"]}
              labelFormatter={(label) => "Дата: " + label}
            />
            <Line
              type="monotone"
              dataKey="speed"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6 }}
              name="Скорость"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Fuel consumption over time */}
      <div>
        <h4 className="text-xs font-medium text-field-300 mb-3 uppercase tracking-wide">Расход топлива (л/га)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a35" />
            <XAxis dataKey="date" tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <YAxis tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1a3326", border: "1px solid #2d4a35", color: "#f5e6c8" }}
              labelStyle={{ color: "#f5e6c8" }}
              formatter={(value: number) => [value + " L/ha", "Топливо"]}
              labelFormatter={(label) => "Дата: " + label}
            />
            <Line
              type="monotone"
              dataKey="fuel"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 4, fill: "#f59e0b" }}
              activeDot={{ r: 6 }}
              name="Топливо"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Application rate over time */}
      <div>
        <h4 className="text-xs font-medium text-field-300 mb-3 uppercase tracking-wide">Норма внесения (кг/га)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a35" />
            <XAxis dataKey="date" tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <YAxis tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1a3326", border: "1px solid #2d4a35", color: "#f5e6c8" }}
              labelStyle={{ color: "#f5e6c8" }}
              formatter={(value: number) => [value + " kg/ha", "Внесение"]}
              labelFormatter={(label) => "Дата: " + label}
            />
            <Line
              type="monotone"
              dataKey="appliedRate"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#8b5cf6" }}
              activeDot={{ r: 6 }}
              name="Внесение"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Combined view */}
      <div>
        <h4 className="text-xs font-medium text-field-300 mb-3 uppercase tracking-wide">Все показатели</h4>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d4a35" />
            <XAxis dataKey="date" tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <YAxis tick={{ fill: "#c8d5c0", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1a3326", border: "1px solid #2d4a35", color: "#f5e6c8" }}
              labelStyle={{ color: "#f5e6c8" }}
              labelFormatter={(label) => "Дата: " + label}
            />
            <Legend wrapperStyle={{ color: "#c8d5c0" }} />
            <Line type="monotone" dataKey="speed" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Скорость (км/ч)" connectNulls />
            <Line type="monotone" dataKey="fuel" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Топливо (л/га)" connectNulls />
            <Line type="monotone" dataKey="appliedRate" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Внесение (кг/га)" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}