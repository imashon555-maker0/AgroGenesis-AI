"""
Mock DeepSeek responses for MVP demo.

Generates realistic prescription and diagnosis payloads based on
input zone metrics, without requiring a real API key.
"""

import json
import random
from typing import Optional

from app.services.ai.prompts import DIAGNOSIS_TOOL, PRESCRIPTION_TOOL


class MockDeepSeek:
    """Generates mock DeepSeek API responses for development and demo."""

    def generate_completion(
        self,
        messages: list[dict],
        tools: list[dict] | None = None,
    ) -> dict:
        """Generate a mock chat completion response."""
        # Determine which tool is being called
        if tools:
            tool_name = tools[0]["function"]["name"]
        else:
            tool_name = "unknown"

        if tool_name == "diagnose_crop_condition":
            return self._mock_diagnosis(messages)
        elif tool_name == "generate_agronomic_prescription":
            return self._mock_prescription(messages)
        else:
            return self._mock_generic(messages)

    def _mock_diagnosis(self, messages: list[dict]) -> dict:
        """Generate a mock vision diagnosis."""
        conditions = [
            {
                "condition": "nitrogen_deficiency",
                "confidence": 0.82,
                "severity": "moderate",
                "description": "Yellowing observed on lower leaves with characteristic V-shaped pattern "
                "extending from leaf tip toward midrib. Upper canopy appears green but lighter "
                "than optimal. Interveinal chlorosis consistent with moderate N deficiency.",
                "affected_areas": ["Lower canopy leaves", "Field edges near drainage"],
                "recommended_action": "Apply supplemental nitrogen at 60-80 kg/ha via variable-rate "
                "application, targeting affected zones. Consider split application "
                "with 40 kg/ha now and remainder in 2-3 weeks.",
            },
            {
                "condition": "healthy",
                "confidence": 0.91,
                "severity": "mild",
                "description": "Crop canopy shows uniform dark green coloration with good leaf area "
                "index. No visible signs of disease, pest damage, or nutrient deficiency. "
                "Growth stage appears consistent with healthy development.",
                "affected_areas": [],
                "recommended_action": "No immediate action required. Continue monitoring. "
                "Next scheduled satellite pass will confirm NDVI trends.",
            },
            {
                "condition": "fungal_infection",
                "confidence": 0.75,
                "severity": "moderate",
                "description": "Brown rust pustules (uredinia) visible on upper leaf surfaces. "
                "Scattered lesions with orange-brown spore masses. Estimated 15-20% "
                "leaf area affected. Infection appears to be spreading from field margins.",
                "affected_areas": ["Upper leaf surfaces", "Field southern margin", "Low-lying areas"],
                "recommended_action": "Apply fungicide (propiconazole or tebuconazole) at labeled rate "
                "within 48 hours. Prioritize affected zones. Reassess in 7-10 days.",
            },
            {
                "condition": "water_stress",
                "confidence": 0.78,
                "severity": "mild",
                "description": "Leaf rolling and curling observed, consistent with early water stress. "
                "Some leaves show slight wilting during midday. Soil appears dry in "
                "visible areas. No permanent damage yet.",
                "affected_areas": ["Mid-field elevated areas", "Sandy soil patches"],
                "recommended_action": "Increase irrigation frequency or volume. Target 25-30mm "
                "application. Monitor soil moisture sensors for confirmation.",
            },
        ]

        selected = random.choice(conditions)
        return self._wrap_tool_call("diagnose_crop_condition", selected)

    def _mock_prescription(self, messages: list[dict]) -> dict:
        """Generate a mock VRA prescription based on input metrics."""
        # Parse zone data from the prompt
        prompt_text = messages[-1]["content"] if messages else ""

        # Extract baseline rate from prompt
        baseline = 180.0
        if "Baseline uniform rate:" in prompt_text:
            try:
                baseline_str = prompt_text.split("Baseline uniform rate:")[1].split("kg")[0].strip()
                baseline = float(baseline_str)
            except (IndexError, ValueError):
                pass

        # Generate realistic zone-based rates
        zones = [
            {
                "zone_label": "A",
                "application_rate": round(baseline * 0.78, 1),  # High productivity: slightly below baseline
                "rationale": "High NDVI zone with good soil productivity. Zone responds well to moderate "
                "N rates. Historical yield data shows diminishing returns above 140 kg/ha. "
                "Rate optimized for maximum economic return.",
            },
            {
                "zone_label": "B",
                "application_rate": round(baseline * 0.65, 1),  # Medium-high
                "rationale": "Medium productivity zone with moderate NDVI. Some soil variability detected. "
                "Rate set to boost yield potential while maintaining cost efficiency. "
                "Monitor for deficiency symptoms mid-season.",
            },
            {
                "zone_label": "C",
                "application_rate": round(baseline * 0.48, 1),  # Medium-low
                "rationale": "Below-average productivity zone. Soil analysis indicates marginal compaction "
                "and lower organic matter. Over-fertilization would be wasteful. "
                "Rate reduced to match soil's limited nutrient uptake capacity.",
            },
            {
                "zone_label": "D",
                "application_rate": round(baseline * 0.32, 1),  # Low productivity
                "rationale": "Low productivity zone with poor drainage and possible salinity issues. "
                "NDVI consistently below field average. Economic analysis shows negative ROI "
                "above 60 kg/ha. Minimum effective rate applied.",
            },
        ]

        total_area_weighted = sum(z["application_rate"] for z in zones) / len(zones)

        prescription = {
            "input_type": "nitrogen",
            "zones": zones,
            "total_estimated_input": round(total_area_weighted, 1),
            "operator_notes": (
                "VRA Prescription - Variable Rate Nitrogen Application\n\n"
                "Machine Setup:\n"
                "- GPS guidance: RTK (2cm accuracy required)\n"
                "- Section control: Enable automatic section shutoff\n"
                "- Nozzle type: 110° flat fan, 04 size\n"
                "- Boom height: 50cm above canopy\n\n"
                "Field Drive Path:\n"
                "- Start from northwest corner, work east-west rows\n"
                "- Boundary buffer: 3m no-spray zone\n"
                "- Switch rate 5m before zone boundary transitions\n\n"
                "Speed: 8-12 km/h for optimal application uniformity"
            ),
            "economic_note": (
                f"Compared to uniform rate ({baseline} kg/ha), this VRA prescription saves "
                f"approximately {round(baseline - total_area_weighted, 1)} kg/ha on average "
                f"({round((1 - total_area_weighted / baseline) * 100, 1)}% reduction). "
                f"Estimated cost savings: ${round((baseline - total_area_weighted) * 0.85, 2)}/ha "
                f"at current nitrogen price of $0.85/kg. "
                f"Carbon credit potential: ~0.42 tCO2e/ha."
            ),
        }

        return self._wrap_tool_call("generate_agronomic_prescription", prescription)

    def _mock_generic(self, messages: list[dict]) -> dict:
        """Generic mock response."""
        return {
            "id": "mock-completion-001",
            "model": "deepseek-v4-pro-mock",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Mock response generated successfully.",
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": 150,
                "completion_tokens": 50,
                "total_tokens": 200,
            },
        }

    def _wrap_tool_call(self, function_name: str, arguments: dict) -> dict:
        """Wrap arguments in a mock DeepSeek tool call response format."""
        return {
            "id": "mock-completion-001",
            "model": "deepseek-v4-pro-mock",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "",
                        "tool_calls": [
                            {
                                "id": f"mock-call-{function_name}",
                                "type": "function",
                                "function": {
                                    "name": function_name,
                                    "arguments": json.dumps(arguments),
                                },
                            }
                        ],
                    },
                    "finish_reason": "tool_calls",
                }
            ],
            "usage": {
                "prompt_tokens": 250,
                "completion_tokens": 180,
                "total_tokens": 430,
            },
        }
