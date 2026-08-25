const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";
const BASE_URL = import.meta.env.VITE_DEEPSEEK_API_BASE || "https://api.deepseek.com/v1";

interface ZoneInput {
  zone_label: string;
  productivity_class: string;
  area_ha: number;
  mean_ndvi: number | null;
}

interface PrescriptionResult {
  zones: { zone_label: string; application_rate: number; rationale: string }[];
  total_estimated_input: number;
  operator_notes: string;
}

export async function generatePrescriptionWithAI(
  fieldZones: ZoneInput[],
  inputType: string,
  fieldName: string
): Promise<PrescriptionResult> {
  if (!API_KEY) throw new Error("NO_API_KEY");

  const zoneDesc = fieldZones.map(z =>
    "Zone " + z.zone_label + ": class=" + z.productivity_class + ", area=" + z.area_ha + "ha, NDVI=" + (z.mean_ndvi?.toFixed(2) || "unknown")
  ).join("; ");

  const prompt =
    "You are an agronomic VRA prescription generator. " +
    "Given field zones with productivity class and NDVI, generate optimal application rates for " +
    inputType + ". Field: " + fieldName + ". Zones: " + zoneDesc + ". " +
    "Respond with JSON only: {zones: [{zone_label: A, application_rate: number, rationale: string}], " +
    "operator_notes: string}. Rates in kg/ha. High productivity = more, low = less. Baseline 180 kg/ha for nitrogen.";

  const res = await fetch(BASE_URL + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + API_KEY },
    body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.3, max_tokens: 1000 }),
  });

  if (!res.ok) throw new Error("DeepSeek API error: " + res.status);
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || "";
  const m = text.match(/{[\s\S]*}/);
  if (!m) throw new Error("Invalid AI response: no JSON found");
  const parsed = JSON.parse(m[0]);
  return {
    zones: parsed.zones || [],
    total_estimated_input: parsed.zones
      ? Math.round(parsed.zones.reduce((s: number, z: any) => s + z.application_rate, 0) / parsed.zones.length * 10) / 10
      : 0,
    operator_notes: parsed.operator_notes || "",
  };
}

export async function diagnoseImageWithAI(
  imageBase64: string,
  context: string
): Promise<{ condition: string; confidence: number; severity: string; description: string; affected_areas: string[]; recommended_action: string }> {
  if (!API_KEY) throw new Error("NO_API_KEY");

  const prompt =
    "Analyze this crop image for diseases, nutrient deficiencies, or stress. " +
    "Respond with JSON: { condition: string, confidence: number 0-1, severity: mild|moderate|severe, " +
    "description: string, affected_areas: [string], recommended_action: string }" +
    (context ? " Context: " + context : "");

  const res = await fetch(BASE_URL + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + API_KEY },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: "data:image/jpeg;base64," + imageBase64 } },
      ]}],
      temperature: 0.3,
      max_tokens: 800,
    }),
  });

  if (!res.ok) throw new Error("DeepSeek API error: " + res.status);
  const json2 = await res.json();
  const text2 = json2.choices?.[0]?.message?.content || "";
  const m2 = text2.match(/{[\s\S]*}/);
  if (!m2) throw new Error("Invalid AI response");
  return JSON.parse(m2[0]);
}