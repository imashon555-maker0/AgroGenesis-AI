// Field types
export interface Field {
  id: string;
  name: string;
  geometry: GeoJSON.Geometry;
  area_ha: number | null;
  soil_type: string | null;
  crop_type: string | null;
  zones: FieldZone[];
  created_at: string;
  updated_at: string | null;
}

export interface FieldZone {
  id: string;
  zone_index: number;
  zone_label: string;
  productivity_class: "high" | "medium" | "low";
  area_ha: number | null;
  mean_ndvi: number | null;
  mean_ndre: number | null;
}

// Telemetry types
export interface TelemetryRecord {
  id: string;
  field_id: string;
  machine_id: string;
  timestamp: string;
  speed_kmh: number | null;
  fuel_rate_l_h: number | null;
  fuel_consumption_l_ha: number | null;
  wheel_slip_pct: number | null;
  engine_load_pct: number | null;
  engine_rpm: number | null;
  applied_rate_kg_ha: number | null;
  source_format: string;
  zone_id: string | null;
}

export interface TelemetryStats {
  zone_label: string;
  zone_id: string | null;
  productivity_class: string;
  area_ha: number | null;
  record_count: number;
  avg_speed_kmh: number | null;
  avg_fuel_l_ha: number | null;
  avg_applied_rate_kg_ha: number | null;
  mean_ndvi: number | null;
  mean_ndre: number | null;
}

// Prescription types
export interface PrescriptionZoneDetail {
  zone_label: string;
  application_rate: number;
  rationale: string | null;
}

export interface Prescription {
  id: string;
  field_id: string;
  input_type: string;
  status: string;
  created_at: string;
  zones: PrescriptionZoneDetail[];
  total_estimated_input: number | null;
  operator_notes: string | null;
  deepseek_model: string | null;
  deepseek_reasoning: string | null;
  ecofin: EcoFinSummary | null;
}

// EcoFin types
export interface CarbonAccounting {
  baseline_n_rate_kg_ha: number;
  optimized_n_rate_kg_ha: number;
  n_savings_kg_ha: number;
  n_savings_pct: number;
  n2o_avoided_kg_ha: number;
  n2o_avoided_tco2e_ha: number;
  manufacturing_offset_tco2e_ha: number;
  total_carbon_tco2e_ha: number;
}

export interface FinancialBreakdown {
  fertilizer_cost_saving_usd: number;
  fuel_cost_saving_usd: number;
  total_cost_saving_usd: number;
  carbon_credit_revenue_usd: number;
  net_benefit_usd_ha: number;
  total_net_benefit_usd: number;
}

export interface EcoFinSummary {
  id?: string;
  prescription_id: string;
  field_id: string;
  season: string;
  carbon: CarbonAccounting;
  financial: FinancialBreakdown;
  ets_framework: string;
  carbon_price_usd_per_ton: number;
}

// AI types
export interface DiagnosisResult {
  condition: string;
  confidence: number;
  severity: string;
  description: string;
  affected_areas: string[];
  recommended_action: string;
  model_used: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  total?: number;
}
