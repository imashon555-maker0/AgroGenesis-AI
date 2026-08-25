import { getCurrentUser } from "@/services/authStore";

/** 
 * localStorage data layer for offline-first operation.
 * Stores fields, telemetry, and prescriptions without any backend.
 */

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const BASE_KEYS = {
  fields: "agro_fields",
  telemetry: "agro_telemetry",
  prescriptions: "agro_prescriptions",
};

function getPrefixedKeys() {
  const user = getCurrentUser();
  const prefix = user?.dataPrefix || "";
  return {
    fields: prefix + BASE_KEYS.fields,
    telemetry: prefix + BASE_KEYS.telemetry,
    prescriptions: prefix + BASE_KEYS.prescriptions,
  };
}

function getStore(key: string): any[] {
  // key is already fully prefixed by caller (getPrefixedKeys)
  const stored = localStorage.getItem(key);
  if (stored !== null) {
    try { return JSON.parse(stored); } catch { return []; }
  }
  // Legacy fallback: strip user prefix to check unprefixed key
  const user = getCurrentUser();
  if (user?.dataPrefix && key.startsWith(user.dataPrefix)) {
    const baseKey = key.slice(user.dataPrefix.length);
    if (baseKey !== key) {
      try { return JSON.parse(localStorage.getItem(baseKey) || "[]"); } catch { return []; }
    }
  }
  return [];
}
function setStore(key: string, data: any[]) {
  // key is already fully prefixed by caller (getPrefixedKeys)
  localStorage.setItem(key, JSON.stringify(data));
}

function computeArea(coords: number[][][]): number {
  const ring = coords[0];
  let area = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    area += (ring[i + 1][0] - ring[i][0]) * (ring[i + 1][1] + ring[i][1]);
  }
  return Math.abs(area * 111320 * 111320 * Math.cos((43 * Math.PI) / 180)) / 10000;
}

function getFieldBounds(geometry: any) {
  const coords = geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates?.[0] || [[[0, 0]]];
  const lons = coords[0].map((c: number[]) => c[0]);
  const lats = coords[0].map((c: number[]) => c[1]);
  return {
    minLon: Math.min(...lons), maxLon: Math.max(...lons),
    minLat: Math.min(...lats), maxLat: Math.max(...lats),
  };
}

// ============================================================
// Fields
// ============================================================

export function createField(data: { name: string; geometry: any; soil_type?: string; crop_type?: string }) {
  const keys = getPrefixedKeys();
  const fields = getStore(keys.fields);
  const totalArea = computeArea(data.geometry.coordinates || [[[0, 0]]]);
  const zones = [
    { id: uuid(), zone_index: 0, zone_label: "A", productivity_class: "high", area_ha: Math.round((totalArea / 4) * 10) / 10, mean_ndvi: 0.72, mean_ndre: 0.58 },
    { id: uuid(), zone_index: 1, zone_label: "B", productivity_class: "medium", area_ha: Math.round((totalArea / 4) * 10) / 10, mean_ndvi: 0.55, mean_ndre: 0.42 },
    { id: uuid(), zone_index: 2, zone_label: "C", productivity_class: "medium", area_ha: Math.round((totalArea / 4) * 10) / 10, mean_ndvi: 0.48, mean_ndre: 0.38 },
    { id: uuid(), zone_index: 3, zone_label: "D", productivity_class: "low", area_ha: Math.round((totalArea / 4) * 10) / 10, mean_ndvi: 0.35, mean_ndre: 0.28 },
  ];
  const field = {
    id: uuid(), name: data.name, geometry: data.geometry,
    area_ha: Math.round(totalArea * 10) / 10,
    soil_type: data.soil_type || null, crop_type: data.crop_type || null,
    zones, created_at: new Date().toISOString(), updated_at: null,
  };
  fields.push(field);
  setStore(getPrefixedKeys().fields, fields);
  return field;
}

export function listFields() {
  const f = getStore(getPrefixedKeys().fields);
  return { fields: f, total: f.length };
}

export function getField(id: string) {
  return getStore(getPrefixedKeys().fields).find((f: any) => f.id === id) || null;
}

export function deleteField(id: string): boolean {
  const keys = getPrefixedKeys();
  const fields = getStore(keys.fields);
  const filtered = fields.filter((f: any) => f.id !== id);
  if (filtered.length === fields.length) return false;
  setStore(getPrefixedKeys().fields, filtered);
  // Also remove associated telemetry
  const telemetry = getStore(getPrefixedKeys().telemetry);
  setStore(getPrefixedKeys().telemetry, telemetry.filter((r: any) => r.field_id !== id));
  return true;
}

export function getFieldZonesGeoJSON(fieldId: string) {
  const field = getField(fieldId);
  if (!field) return { type: "FeatureCollection", features: [] };
  const b = getFieldBounds(field.geometry);
  const mL = (b.minLon + b.maxLon) / 2;
  const mT = (b.minLat + b.maxLat) / 2;
  const polys = [
    [[b.minLon, mT], [mL, mT], [mL, b.maxLat], [b.minLon, b.maxLat], [b.minLon, mT]],
    [[mL, mT], [b.maxLon, mT], [b.maxLon, b.maxLat], [mL, b.maxLat], [mL, mT]],
    [[b.minLon, b.minLat], [mL, b.minLat], [mL, mT], [b.minLon, mT], [b.minLon, b.minLat]],
    [[mL, b.minLat], [b.maxLon, b.minLat], [b.maxLon, mT], [mL, mT], [mL, b.minLat]],
  ];
  return {
    type: "FeatureCollection",
    features: field.zones.map((z: any) => ({
      type: "Feature",
      id: z.id,
      geometry: { type: "MultiPolygon", coordinates: [[polys[z.zone_index]]] },
      properties: {
        zone_index: z.zone_index, zone_label: z.zone_label,
        productivity_class: z.productivity_class, area_ha: z.area_ha,
      },
    })),
  };
}

// ============================================================
// Telemetry
// ============================================================

export function parseCSVTelemetry(csvText: string, fieldId: string) {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return { records_parsed: 0, records_imported: 0, zones_assigned: 0, source_format: "unknown" };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const field = getField(fieldId);
  const fCoords = field?.geometry?.coordinates?.[0] || [];
  const records: any[] = [];
  let zonesAssigned = 0;

  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = vals[idx] || ""));

    const isJ1939 = "pgn" in row || "byte0" in row;
    let lat: number | null = null;
    let lon: number | null = null;
    let speed: number | null = null;
    let fuelRate: number | null = null;
    let appliedRate: number | null = null;
    const machineId = row.machine_id || row.machine || "CSV-Import";
    const ts = row.timestamp || row.time || new Date().toISOString();

    if (isJ1939) {
      const pgn = parseInt(row.pgn || "0");
      lat = parseFloat(row.lat || "0") || null;
      lon = parseFloat(row.lon || "0") || null;
      if (pgn === 65265) speed = (parseInt(row.byte2 || "0", 16) + parseInt(row.byte3 || "0", 16) * 256) * 0.015625;
      else if (pgn === 65266) fuelRate = (parseInt(row.byte1 || "0", 16) + parseInt(row.byte2 || "0", 16) * 256) * 0.05;
      else if (pgn === 65280) appliedRate = (parseInt(row.byte0 || "0", 16) + parseInt(row.byte1 || "0", 16) * 256) * 0.01;
    } else {
      lat = parseFloat(row.lat || row.latitude || "0") || null;
      lon = parseFloat(row.lon || row.longitude || "0") || null;
      speed = parseFloat(row.speed_kmh || row.speed || "0") || null;
      fuelRate = parseFloat(row.fuel_rate_l_h || row.fuel_rate || "0") || null;
      appliedRate = parseFloat(row.applied_rate_kg_ha || row.applied_rate || "0") || null;
    }

    let zoneId: string | null = null;
    if (lat && lon && field && fCoords.length) {
      const fLons = fCoords.map((c: number[]) => c[0]);
      const fLats = fCoords.map((c: number[]) => c[1]);
      const midLon = (Math.min(...fLons) + Math.max(...fLons)) / 2;
      const midLat = (Math.min(...fLats) + Math.max(...fLats)) / 2;
      let zi = 0;
      if (lon >= midLon && lat >= midLat) zi = 0;
      else if (lon < midLon && lat >= midLat) zi = 1;
      else if (lon >= midLon && lat < midLat) zi = 2;
      else zi = 3;
      zoneId = field.zones[zi]?.id || null;
      if (zoneId) zonesAssigned++;
    }

    const fuelLHa = fuelRate && speed && speed > 0.5 ? fuelRate / speed : null;
    records.push({
      id: uuid(), field_id: fieldId, machine_id: machineId, timestamp: ts,
      speed_kmh: speed, fuel_rate_l_h: fuelRate, fuel_consumption_l_ha: fuelLHa,
      wheel_slip_pct: null, engine_load_pct: null, engine_rpm: null,
      applied_rate_kg_ha: appliedRate, source_format: isJ1939 ? "j1939" : "csv",
      zone_id: zoneId, lat, lon,
    });
  }

  const existing = getStore(getPrefixedKeys().telemetry);
  existing.push(...records);
  setStore(getPrefixedKeys().telemetry, existing);

  return {
    records_parsed: records.length,
    records_imported: records.length,
    zones_assigned: zonesAssigned,
    source_format: records[0]?.source_format || "csv",
  };
}



// ============================================================
// Telemetry time-series aggregation (grouped by day)
// ============================================================

export function getTelemetryTimeSeries(fieldId: string) {
  const records = getStore(getPrefixedKeys().telemetry).filter((r: any) => r.field_id === fieldId);
  if (records.length === 0) return [];

  // Group by date
  const byDay: Record<string, { speeds: number[]; fuels: number[]; rates: number[]; count: number }> = {};
  for (const r of records) {
    const date = (r.timestamp || "").slice(0, 10); // YYYY-MM-DD
    if (!date) continue;
    if (!byDay[date]) byDay[date] = { speeds: [], fuels: [], rates: [], count: 0 };
    const d = byDay[date];
    d.count++;
    if (r.speed_kmh != null && r.speed_kmh > 0) d.speeds.push(r.speed_kmh);
    if (r.fuel_consumption_l_ha != null && r.fuel_consumption_l_ha > 0) d.fuels.push(r.fuel_consumption_l_ha);
    if (r.applied_rate_kg_ha != null && r.applied_rate_kg_ha > 0) d.rates.push(r.applied_rate_kg_ha);
  }

  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => {
      const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length * 10) / 10 : null;
      // Format date for display (DD.MM)
      const parts = date.split("-");
      const displayDate = parts[2] + "." + parts[1];
      return {
        date: displayDate,
        fullDate: date,
        speed: avg(d.speeds),
        fuel: avg(d.fuels),
        appliedRate: avg(d.rates),
        records: d.count,
      };
    });
}

// ============================================================
// Alert computation from real field data
// ============================================================

export interface FieldAlert {
  id: string;
  severity: "warning" | "critical";
  message: string;
  fieldName: string;
  zoneLabel: string;
  type: string;
  timestamp: string;
}

const NDVI_WARN = 0.4;
const NDVI_CRIT = 0.25;
const FUEL_HIGH = 15;
const FUEL_CRIT = 20;
const STALE_PRESCRIPTION_DAYS = 30;

export function computeAlerts(): FieldAlert[] {
  const fields = getStore(getPrefixedKeys().fields);
  const telemetry = getStore(getPrefixedKeys().telemetry);
  const prescriptions = getStore(getPrefixedKeys().prescriptions);
  const alerts: FieldAlert[] = [];
  const now = new Date();

  for (const field of fields) {
    const fieldId = field.id;
    const fieldName = field.name;

    // 1. NDVI threshold alerts per zone
    for (const zone of (field.zones || [])) {
      const n = zone.mean_ndvi || 0;
      if (n < NDVI_CRIT) {
        alerts.push({
          id: fieldId + "-ndvi-c-" + zone.id,
          severity: "critical",
          message: "NDVI " + n.toFixed(2) + " — критический стресс растений",
          fieldName, zoneLabel: zone.zone_label,
          type: "ndvi_critical", timestamp: now.toISOString(),
        });
      } else if (n < NDVI_WARN) {
        alerts.push({
          id: fieldId + "-ndvi-w-" + zone.id,
          severity: "warning",
          message: "NDVI " + n.toFixed(2) + " — ниже нормы, требуется внимание",
          fieldName, zoneLabel: zone.zone_label,
          type: "ndvi_warning", timestamp: now.toISOString(),
        });
      }
    }

    // 2. NDVI variability across zones
    const ndviValues = (field.zones || []).map((z: any) => z.mean_ndvi || 0.5);
    if (ndviValues.length >= 2) {
      const spread = Math.max(...ndviValues) - Math.min(...ndviValues);
      if (spread > 0.3) {
        alerts.push({
          id: fieldId + "-ndvi-spread",
          severity: "warning",
          message: "Разброс NDVI " + spread.toFixed(2) + " по зонам — неравномерное развитие",
          fieldName, zoneLabel: "Все",
          type: "ndvi_spread", timestamp: now.toISOString(),
        });
      }
    }

    // 3. High fuel consumption alerts
    const fieldRecords = telemetry.filter((r: any) => r.field_id === fieldId);
    const zoneStats: Record<string, { total_fuel: number; count: number; zone_label: string }> = {};
    for (const record of fieldRecords) {
      const zid = record.zone_id || "unknown";
      if (!zoneStats[zid]) zoneStats[zid] = { total_fuel: 0, count: 0, zone_label: record.zone_label || "?" };
      zoneStats[zid].total_fuel += record.fuel_consumption_l_ha || 0;
      zoneStats[zid].count++;
    }
    for (const [zid, stats] of Object.entries(zoneStats)) {
      if (stats.count === 0) continue;
      const avgFuel = stats.total_fuel / stats.count;
      if (avgFuel > FUEL_CRIT) {
        alerts.push({
          id: fieldId + "-fuel-c-" + zid,
          severity: "critical",
          message: "Расход топлива " + avgFuel.toFixed(1) + " L/ha — критически высокий",
          fieldName, zoneLabel: stats.zone_label,
          type: "fuel_critical", timestamp: now.toISOString(),
        });
      } else if (avgFuel > FUEL_HIGH) {
        alerts.push({
          id: fieldId + "-fuel-w-" + zid,
          severity: "warning",
          message: "Расход топлива " + avgFuel.toFixed(1) + " L/ha — выше нормы",
          fieldName, zoneLabel: stats.zone_label,
          type: "fuel_warning", timestamp: now.toISOString(),
        });
      }
    }

    // 4. Stale prescriptions (older than 30 days)
    const fieldPrescriptions = prescriptions.filter((p: any) => p.field_id === fieldId);
    for (const presc of fieldPrescriptions) {
      const created = new Date(presc.created_at);
      const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      if (daysOld > STALE_PRESCRIPTION_DAYS) {
        alerts.push({
          id: fieldId + "-stale-" + presc.id,
          severity: "warning",
          message: "Рецептура от " + created.toLocaleDateString("ru-RU") + " — устарела (" + daysOld + " дн.)",
          fieldName, zoneLabel: presc.input_type || "VRA",
          type: "stale_prescription", timestamp: now.toISOString(),
        });
      }
    }

    // 5. No telemetry data uploaded
    if (fieldRecords.length === 0) {
      alerts.push({
        id: fieldId + "-no-telemetry",
        severity: "warning",
        message: "Нет данных телеметрии — загрузите CSV для анализа",
        fieldName, zoneLabel: "—",
        type: "no_telemetry", timestamp: now.toISOString(),
      });
    }

    // 6. No prescriptions generated
    if (fieldPrescriptions.length === 0) {
      alerts.push({
        id: fieldId + "-no-prescription",
        severity: "warning",
        message: "Нет рецептур — сгенерируйте VRA-план",
        fieldName, zoneLabel: "—",
        type: "no_prescription", timestamp: now.toISOString(),
      });
    }
  }

  return alerts.sort((a, b) => {
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (a.severity !== "critical" && b.severity === "critical") return 1;
    return 0;
  });
}

export function getTelemetryStats(fieldId: string) {
  const field = getField(fieldId);
  if (!field) return [];
  const records = getStore(getPrefixedKeys().telemetry).filter((r: any) => r.field_id === fieldId);
  return field.zones.map((zone: any) => {
    const zr = records.filter((r: any) => r.zone_id === zone.id);
    return {
      zone_label: zone.zone_label, zone_id: zone.id,
      productivity_class: zone.productivity_class, area_ha: zone.area_ha,
      record_count: zr.length,
      avg_speed_kmh: zr.length ? zr.reduce((s: number, r: any) => s + (r.speed_kmh || 0), 0) / zr.length : null,
      avg_fuel_l_ha: zr.length ? zr.reduce((s: number, r: any) => s + (r.fuel_consumption_l_ha || 0), 0) / zr.length : null,
      avg_applied_rate_kg_ha: zr.length ? zr.reduce((s: number, r: any) => s + (r.applied_rate_kg_ha || 0), 0) / zr.length : null,
      mean_ndvi: zone.mean_ndvi, mean_ndre: zone.mean_ndre,
    };
  });
}

export function getAllTelemetryForField(fieldId: string) {
  return getStore(getPrefixedKeys().telemetry).filter((r: any) => r.field_id === fieldId);
}

// ============================================================
// Prescriptions
// ============================================================

export function getPrescriptionsForField(fieldId: string) {
  return getStore(getPrefixedKeys().prescriptions).filter((r: any) => r.field_id === fieldId);
}

export function generateLocalPrescription(fieldId: string, inputType: string) {
  const field = getField(fieldId);
  if (!field) return null;
  const rates: Record<string, number> = { A: 140, B: 110, C: 80, D: 50 };
  const zones = field.zones.map((z: any) => ({
    zone_label: z.zone_label,
    application_rate: rates[z.zone_label] || 100,
    rationale: "Зона " + z.zone_label + " (класс " + z.productivity_class + "): оптимальная норма " + inputType,
  }));
  const avg = zones.reduce((s: number, z: any) => s + z.application_rate, 0) / zones.length;
  return {
    id: uuid(), field_id: fieldId, input_type: inputType, status: "draft",
    created_at: new Date().toISOString(), zones,
    total_estimated_input: Math.round(avg * 10) / 10,
    operator_notes: "Рецептура VRA: " + inputType,
    deepseek_model: "local-generator",
  };
}

// ============================================================
// Data Export
// ============================================================

export function exportFieldsAsGeoJSON(): string {
  const keys = getPrefixedKeys();
  const fields = getStore(keys.fields);
  const features = fields.map((f: any) => ({
    type: "Feature", id: f.id, geometry: f.geometry,
    properties: {
      name: f.name, area_ha: f.area_ha, soil_type: f.soil_type, crop_type: f.crop_type,
      zones: f.zones.map((z: any) => ({
        label: z.zone_label, productivity_class: z.productivity_class,
        area_ha: z.area_ha, mean_ndvi: z.mean_ndvi,
      })),
    },
  }));
  return JSON.stringify({ type: "FeatureCollection", features }, null, 2);
}

export function exportTelemetryAsCSV(fieldId: string): string {
  const records = getStore(getPrefixedKeys().telemetry).filter((r: any) => r.field_id === fieldId);
  if (records.length === 0) return "";
  const headers = ["timestamp", "machine_id", "lat", "lon", "speed_kmh", "fuel_rate_l_h", "fuel_consumption_l_ha", "applied_rate_kg_ha", "source_format", "zone_id"];
  const rows = records.map((r: any) => headers.map((h) => r[h] ?? "").join(","));
  return [headers.join(","), ...rows].join("\n");
}

// ============================================================
// Load Sample Data
// ============================================================

export async function loadSampleData(): Promise<{ fieldsCreated: number; recordsImported: number }> {
  const field1 = createField({
    name: "KZ-Akmola-Wheat-01",
    geometry: { type: "Polygon", coordinates: [[[76.93, 43.25], [76.96, 43.25], [76.96, 43.27], [76.93, 43.27], [76.93, 43.25]]] },
    soil_type: "Chernozem", crop_type: "Winter Wheat",
  });
  const field2 = createField({
    name: "KZ-Turgai-Barley-01",
    geometry: { type: "Polygon", coordinates: [[[68.20, 49.50], [68.25, 49.50], [68.25, 49.53], [68.20, 49.53], [68.20, 49.50]]] },
    soil_type: "Kastanozem", crop_type: "Spring Barley",
  });
  // Fetch sample J1939 telemetry CSV from public folder
  let csvText = "";
  try {
    const resp = await fetch("/sample-telemetry.csv");
    if (resp.ok) csvText = await resp.text();
  } catch { /* CSV fetch failed, continue with empty telemetry */ }
  let recordsImported = 0;
  if (csvText) {
    const r1 = parseCSVTelemetry(csvText, field1.id);
    recordsImported += r1.records_imported;
    const r2 = parseCSVTelemetry(csvText, field2.id);
    recordsImported += r2.records_imported;
  }
  return { fieldsCreated: 2, recordsImported };
}

export function clearAll() {
  const keys = getPrefixedKeys();
  Object.values(keys).forEach((k) => localStorage.removeItem(k));
  // Also clear legacy unprefixed keys
  Object.values(BASE_KEYS).forEach((k) => localStorage.removeItem(k));
}
