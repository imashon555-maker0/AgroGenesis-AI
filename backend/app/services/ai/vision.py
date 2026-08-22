"""
Vision diagnosis service.

Wraps the DeepSeek V4 vision model to analyze crop images and produce
structured agronomic diagnoses.
"""

import logging
from typing import Optional
from dataclasses import dataclass

from app.services.ai.deepseek_client import DeepSeekClient, extract_tool_call_args

logger = logging.getLogger(__name__)


@dataclass
class CropDiagnosis:
    """Structured crop diagnosis result."""
    condition: str
    confidence: float
    severity: str
    description: str
    affected_areas: list[str]
    recommended_action: str
    model_used: str
    raw_response: Optional[dict] = None


async def diagnose_crop_image(
    image_base64: str,
    context: str = "",
    zone_stats: list[dict] | None = None,
) -> CropDiagnosis:
    """
    Analyze a crop image for health issues.

    Args:
        image_base64: Base64-encoded image data
        context: Additional context (field name, crop type, growth stage)
        zone_stats: Optional zone-level metrics for additional context

    Returns:
        CropDiagnosis with classified condition and recommendations
    """
    client = DeepSeekClient()

    response = await client.vision_diagnosis(
        image_base64=image_base64,
        context=context,
        zone_stats=zone_stats or [],
    )

    # Extract structured diagnosis from tool call
    args = extract_tool_call_args(response)

    if args:
        return CropDiagnosis(
            condition=args.get("condition", "mixed"),
            confidence=float(args.get("confidence", 0.5)),
            severity=args.get("severity", "moderate"),
            description=args.get("description", "No description provided"),
            affected_areas=args.get("affected_areas", []),
            recommended_action=args.get("recommended_action", "Monitor field"),
            model_used=response.get("model", "deepseek-v4-flash-vision-exp"),
            raw_response=response,
        )

    # Fallback: parse from content
    content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
    return CropDiagnosis(
        condition="mixed",
        confidence=0.3,
        severity="moderate",
        description=content or "Unable to parse diagnosis",
        affected_areas=[],
        recommended_action="Manual field inspection recommended",
        model_used=response.get("model", "unknown"),
        raw_response=response,
    )
