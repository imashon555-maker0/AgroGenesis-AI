"""
DeepSeek V4 API client.

Uses OpenAI-compatible SDK for chat completions with tool calling.
Supports both deepseek-v4-pro (text reasoning) and deepseek-v4-flash-vision-exp (vision).
"""

import json
import logging
from typing import Optional

import httpx

from app.config import get_settings
from app.services.ai.mock import MockDeepSeek
from app.services.ai.prompts import (
    DIAGNOSIS_TOOL,
    PRESCRIPTION_TOOL,
    VISION_SYSTEM_PROMPT,
    PRESCRIPTION_SYSTEM_PROMPT,
    build_vision_prompt,
    build_prescription_prompt,
)

logger = logging.getLogger(__name__)
settings = get_settings()


class DeepSeekClient:
    """Async client for DeepSeek V4 API."""

    def __init__(self):
        self.base_url = settings.deepseek_api_base
        self.api_key = settings.deepseek_api_key
        self.use_mock = settings.use_mock_ai
        self.mock = MockDeepSeek()

    async def chat_completion(
        self,
        model: str,
        messages: list[dict],
        tools: list[dict] | None = None,
        tool_choice: str = "auto",
        temperature: float = 0.3,
        max_tokens: int = 4096,
    ) -> dict:
        """
        Send a chat completion request to DeepSeek API.
        Falls back to mock if USE_MOCK_AI=true.
        """
        if self.use_mock:
            logger.info(f"[MOCK] Generating completion with model={model}")
            return self.mock.generate_completion(messages, tools)

        async with httpx.AsyncClient(timeout=60.0) as client:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if tools:
                payload["tools"] = tools
                payload["tool_choice"] = tool_choice

            try:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"DeepSeek API error: {e.response.status_code} - {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.error(f"DeepSeek API connection error: {e}")
                raise

    async def vision_diagnosis(
        self,
        image_base64: str,
        context: str,
        zone_stats: list[dict],
    ) -> dict:
        """
        Analyze a crop image using deepseek-v4-flash-vision-exp.

        Returns a structured diagnosis via tool calling.
        """
        user_prompt = build_vision_prompt(context, zone_stats)

        messages = [
            {"role": "system", "content": VISION_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"},
                    },
                    {"type": "text", "text": user_prompt},
                ],
            },
        ]

        return await self.chat_completion(
            model="deepseek-v4-flash-vision-exp",
            messages=messages,
            tools=[DIAGNOSIS_TOOL],
            tool_choice="required",
        )

    async def generate_prescription(
        self,
        field_name: str,
        zone_stats: list[dict],
        diagnosis: dict | None,
        yield_history: list[dict],
        input_type: str = "nitrogen",
        baseline_rate: float = 180.0,
    ) -> dict:
        """
        Generate a variable-rate application prescription using deepseek-v4-pro.

        Returns a structured prescription via tool calling.
        """
        user_prompt = build_prescription_prompt(
            field_name=field_name,
            zone_stats=zone_stats,
            diagnosis=diagnosis,
            yield_history=yield_history,
            input_type=input_type,
            baseline_rate=baseline_rate,
        )

        messages = [
            {"role": "system", "content": PRESCRIPTION_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]

        return await self.chat_completion(
            model="deepseek-v4-pro",
            messages=messages,
            tools=[PRESCRIPTION_TOOL],
            tool_choice="required",
        )


def extract_tool_call_args(response: dict) -> Optional[dict]:
    """Extract function arguments from a DeepSeek tool call response."""
    try:
        choice = response["choices"][0]
        message = choice["message"]

        if "tool_calls" in message and message["tool_calls"]:
            tool_call = message["tool_calls"][0]
            args_str = tool_call["function"]["arguments"]

            # Handle both string and dict arguments
            if isinstance(args_str, str):
                return json.loads(args_str)
            return args_str

        # Fallback: try to parse content as JSON
        if message.get("content"):
            return json.loads(message["content"])

    except (KeyError, IndexError, json.JSONDecodeError) as e:
        logger.error(f"Failed to extract tool call args: {e}")
        return None

    return None
