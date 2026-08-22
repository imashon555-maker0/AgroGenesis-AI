"""
System prompts and function/tool schemas for DeepSeek V4.

Defines the agronomic reasoning context and structured output schemas
used for vision diagnosis and prescription generation.
"""

# ============================================================
# Vision Diagnosis
# ============================================================

VISION_SYSTEM_PROMPT = """You are an expert agronomist analyzing crop imagery from precision agriculture operations.

Your task is to examine the provided image and identify any crop health issues, including:
1. **Nitrogen deficiency**: Yellowing of lower leaves, uniform chlorosis
2. **Phosphorus deficiency**: Purple/dark discoloration, stunted growth
3. **Potassium deficiency**: Leaf edge browning (scorch), rolled leaves
4. **Fungal infection**: Spots, lesions, powdery/downy mildew, rust
5. **Pest damage**: Chewed leaves, webbing, visible insects
6. **Weed infestation**: Non-crop species visible among the crop
7. **Water stress**: Wilting, curling, drought symptoms
8. **Hail damage**: Physical leaf damage, shredded appearance
9. **Healthy**: No visible issues

For each diagnosis:
- Provide your confidence level (0.0 to 1.0)
- Rate severity as mild, moderate, or severe
- Describe the specific visual evidence
- Note affected areas in the image
- Recommend a specific corrective action

Always respond through the diagnose_crop_condition function."""

DIAGNOSIS_TOOL = {
    "type": "function",
    "function": {
        "name": "diagnose_crop_condition",
        "description": "Classify crop condition from visual analysis of an agricultural image",
        "parameters": {
            "type": "object",
            "required": ["condition", "confidence", "severity", "description", "recommended_action"],
            "properties": {
                "condition": {
                    "type": "string",
                    "enum": [
                        "healthy",
                        "nitrogen_deficiency",
                        "phosphorus_deficiency",
                        "potassium_deficiency",
                        "fungal_infection",
                        "pest_damage",
                        "weed_infestation",
                        "water_stress",
                        "hail_damage",
                        "mixed",
                    ],
                    "description": "The primary detected condition",
                },
                "confidence": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1,
                    "description": "Confidence score (0-1)",
                },
                "severity": {
                    "type": "string",
                    "enum": ["mild", "moderate", "severe"],
                    "description": "Severity of the condition",
                },
                "description": {
                    "type": "string",
                    "description": "Detailed description of the visual evidence observed",
                },
                "affected_areas": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Description of affected areas in the image (e.g., 'lower leaves', 'center-right')",
                },
                "recommended_action": {
                    "type": "string",
                    "description": "Specific corrective action to take",
                },
            },
        },
    },
}


# ============================================================
# Prescription Generation
# ============================================================

PRESCRIPTION_SYSTEM_PROMPT = """You are an expert precision agriculture prescription engine.

Your task is to generate Variable-Rate Application (VRA) prescriptions that optimize crop input
application (nitrogen, phosphorus, potassium, herbicide, fungicide) across management zones.

## Core Principles

1. **Law of Diminishing Returns**: High-yielding zones with good soil respond less to additional inputs.
   Focus resources on zones with the highest marginal return.

2. **Zone-Based Optimization**:
   - **High productivity zones** (high NDVI, good soil): Moderate input rates (120-150 kg/ha for N)
   - **Medium productivity zones**: Standard rates (80-120 kg/ha for N)
   - **Low productivity zones** (saline, compacted, waterlogged): Reduced rates (40-80 kg/ha for N)
     to avoid wasteful over-application on non-responsive soil

3. **Constraint**: Total field-average rate must stay within 10% of the baseline recommendation
   to maintain overall productivity.

4. **Diagnosis Integration**: If a visual diagnosis indicates a specific deficiency, increase the
   relevant input for affected zones.

5. **Economic Optimization**: Consider the cost of inputs vs. expected yield response.

## Rate Guidelines (Nitrogen for Winter Wheat)
- Zone A (High): 130-150 kg N/ha
- Zone B (Medium-High): 100-130 kg N/ha
- Zone C (Medium-Low): 70-100 kg N/ha
- Zone D (Low): 40-70 kg N/ha

Always respond through the generate_agronomic_prescription function."""

PRESCRIPTION_TOOL = {
    "type": "function",
    "function": {
        "name": "generate_agronomic_prescription",
        "description": "Generate a variable-rate application prescription for a field with per-zone rates",
        "parameters": {
            "type": "object",
            "required": ["input_type", "zones", "total_estimated_input", "operator_notes"],
            "properties": {
                "input_type": {
                    "type": "string",
                    "enum": ["nitrogen", "potassium", "phosphorus", "herbicide", "fungicide"],
                    "description": "Type of input to apply",
                },
                "zones": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["zone_label", "application_rate", "rationale"],
                        "properties": {
                            "zone_label": {
                                "type": "string",
                                "description": "Zone identifier (A, B, C, D)",
                            },
                            "application_rate": {
                                "type": "number",
                                "minimum": 0,
                                "description": "Application rate in kg/ha",
                            },
                            "rationale": {
                                "type": "string",
                                "description": "Brief explanation for this rate based on zone characteristics",
                            },
                        },
                    },
                    "description": "Per-zone application rates",
                },
                "total_estimated_input": {
                    "type": "number",
                    "minimum": 0,
                    "description": "Total field-average application rate in kg/ha",
                },
                "operator_notes": {
                    "type": "string",
                    "description": "Plain-language notes for the machine operator covering target speed, "
                    "nozzle settings, and field drive path recommendations",
                },
                "economic_note": {
                    "type": "string",
                    "description": "Cost-benefit observation comparing this prescription to uniform application",
                },
            },
        },
    },
}


# ============================================================
# Prompt Templates
# ============================================================

def build_vision_prompt(
    context: str,
    zone_stats: list[dict],
    image_description: str = "",
) -> str:
    """Build the user prompt for vision diagnosis."""
    parts = [f"Analyze this agricultural image for crop health issues."]

    if context:
        parts.append(f"\nContext: {context}")

    if image_description:
        parts.append(f"\nImage details: {image_description}")

    if zone_stats:
        parts.append("\nZone Metrics:")
        for zone in zone_stats:
            parts.append(
                f"  Zone {zone.get('zone_label', '?')}: "
                f"NDVI={zone.get('mean_ndvi', 'N/A')}, "
                f"Class={zone.get('productivity_class', 'N/A')}"
            )

    return "\n".join(parts)


def build_prescription_prompt(
    field_name: str,
    zone_stats: list[dict],
    diagnosis: dict | None,
    yield_history: list[dict],
    input_type: str,
    baseline_rate: float = 180.0,
) -> str:
    """Build the user prompt for prescription generation."""
    parts = [
        f"Generate a variable-rate {input_type} application prescription for field \"{field_name}\".",
        f"\nBaseline uniform rate: {baseline_rate} kg/ha",
        "\nZone Data:",
    ]

    for zone in zone_stats:
        parts.append(
            f"  Zone {zone.get('zone_label', '?')}: "
            f"NDVI={zone.get('mean_ndvi', 'N/A')}, "
            f"NDRE={zone.get('mean_ndre', 'N/A')}, "
            f"Productivity={zone.get('productivity_class', 'N/A')}, "
            f"Area={zone.get('area_ha', 'N/A')} ha"
        )

    if diagnosis:
        parts.append(f"\nCrop Diagnosis:")
        parts.append(f"  Condition: {diagnosis.get('condition', 'unknown')}")
        parts.append(f"  Severity: {diagnosis.get('severity', 'unknown')}")
        parts.append(f"  Description: {diagnosis.get('description', 'N/A')}")

    if yield_history:
        parts.append(f"\nYield History ({len(yield_history)} seasons):")
        for entry in yield_history[:3]:
            parts.append(f"  {entry.get('season', '?')}: {entry.get('yield_t_ha', 'N/A')} t/ha")

    parts.append(
        "\nCompute optimal per-zone application rates. Follow the law of diminishing returns. "
        "Ensure the field-average rate stays within 10% of the baseline."
    )

    return "\n".join(parts)
