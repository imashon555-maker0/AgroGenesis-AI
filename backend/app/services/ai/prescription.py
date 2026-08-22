"""
Prescription generation service.

Wraps the DeepSeek V4 Pro model to generate variable-rate application
prescriptions based on zone metrics, diagnoses, and historical data.
"""

import logging
from typing import Optional
from dataclasses import dataclass, field

from app.services.ai.deepseek_client import DeepSeekClient, extract_tool_call_args

logger = logging.getLogger(__name__)


@dataclass
class PrescriptionZone:
    """A single zone's prescription."""
    zone_label: str
    application_rate: float
    rationale: str


@dataclass
class GeneratedPrescription:
    """Complete AI-generated prescription."""
    input_type: str
    zones: list[PrescriptionZone]
    total_estimated_input: float
    operator_notes: str
    economic_note: Optional[str] = None
    model_used: str = ""
    reasoning: str = ""


async def generate_vra_prescription(
    field_name: str,
    zone_stats: list[dict],
    diagnosis: dict | None = None,
    yield_history: list[dict] | None = None,
    input_type: str = "nitrogen",
    baseline_rate: float = 180.0,
) -> GeneratedPrescription:
    """
    Generate a variable-rate application prescription.

    Args:
        field_name: Name of the field
        zone_stats: Per-zone metrics (NDVI, productivity, etc.)
        diagnosis: Optional crop diagnosis from vision analysis
        yield_history: Historical yield data
        input_type: Type of input (nitrogen, herbicide, etc.)
        baseline_rate: Standard uniform application rate for comparison

    Returns:
        GeneratedPrescription with per-zone rates and rationale
    """
    client = DeepSeekClient()

    response = await client.generate_prescription(
        field_name=field_name,
        zone_stats=zone_stats,
        diagnosis=diagnosis,
        yield_history=yield_history or [],
        input_type=input_type,
        baseline_rate=baseline_rate,
    )

    # Extract structured prescription from tool call
    args = extract_tool_call_args(response)

    if args and "zones" in args:
        zones = []
        for z in args["zones"]:
            zones.append(PrescriptionZone(
                zone_label=z.get("zone_label", "?"),
                application_rate=float(z.get("application_rate", 0)),
                rationale=z.get("rationale", ""),
            ))

        return GeneratedPrescription(
            input_type=args.get("input_type", input_type),
            zones=zones,
            total_estimated_input=float(args.get("total_estimated_input", 0)),
            operator_notes=args.get("operator_notes", ""),
            economic_note=args.get("economic_note"),
            model_used=response.get("model", "deepseek-v4-pro"),
            reasoning=response.get("choices", [{}])[0].get("message", {}).get("content", ""),
        )

    # Fallback: return empty prescription with error info
    content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
    return GeneratedPrescription(
        input_type=input_type,
        zones=[],
        total_estimated_input=baseline_rate,
        operator_notes="AI prescription generation returned unexpected format. Manual review required.",
        model_used=response.get("model", "unknown"),
        reasoning=content,
    )
