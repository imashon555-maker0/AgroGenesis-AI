"""Tests for AI prescription generation."""

import pytest

from app.services.ai.prescription import generate_vra_prescription, GeneratedPrescription
from app.services.ai.mock import MockDeepSeek


class TestMockDeepSeek:
    def test_mock_diagnosis(self):
        mock = MockDeepSeek()
        response = mock.generate_completion(
            messages=[],
            tools=[{
                "type": "function",
                "function": {"name": "diagnose_crop_condition"},
            }],
        )
        assert "choices" in response
        assert response["choices"][0]["message"]["tool_calls"] is not None

    def test_mock_prescription(self):
        mock = MockDeepSeek()
        response = mock.generate_completion(
            messages=[
                {"role": "user", "content": "Generate prescription. Baseline uniform rate: 180 kg/ha"},
            ],
            tools=[{
                "type": "function",
                "function": {"name": "generate_agronomic_prescription"},
            }],
        )
        assert "choices" in response
        tool_call = response["choices"][0]["message"]["tool_calls"][0]
        assert tool_call["function"]["name"] == "generate_agronomic_prescription"


class TestPrescriptionGeneration:
    @pytest.mark.asyncio
    async def test_generate_prescription_mock(self):
        result = await generate_vra_prescription(
            field_name="Test Field",
            zone_stats=[
                {"zone_label": "A", "productivity_class": "high", "area_ha": 60, "mean_ndvi": 0.7},
                {"zone_label": "B", "productivity_class": "medium", "area_ha": 70, "mean_ndvi": 0.5},
                {"zone_label": "C", "productivity_class": "medium", "area_ha": 50, "mean_ndvi": 0.4},
                {"zone_label": "D", "productivity_class": "low", "area_ha": 40, "mean_ndvi": 0.2},
            ],
            input_type="nitrogen",
        )

        assert isinstance(result, GeneratedPrescription)
        assert result.input_type == "nitrogen"
        assert len(result.zones) == 4
        assert all(z.application_rate > 0 for z in result.zones)
        assert result.total_estimated_input > 0
        assert result.operator_notes != ""

    @pytest.mark.asyncio
    async def test_prescription_zone_labels(self):
        result = await generate_vra_prescription(
            field_name="Test Field",
            zone_stats=[
                {"zone_label": "A", "productivity_class": "high", "area_ha": 100, "mean_ndvi": 0.7},
                {"zone_label": "B", "productivity_class": "medium", "area_ha": 100, "mean_ndvi": 0.5},
            ],
            input_type="nitrogen",
        )

        labels = {z.zone_label for z in result.zones}
        assert "A" in labels
        assert "B" in labels

    @pytest.mark.asyncio
    async def test_high_ndvi_gets_higher_rate(self):
        result = await generate_vra_prescription(
            field_name="Test Field",
            zone_stats=[
                {"zone_label": "A", "productivity_class": "high", "area_ha": 50, "mean_ndvi": 0.8},
                {"zone_label": "D", "productivity_class": "low", "area_ha": 50, "mean_ndvi": 0.2},
            ],
            input_type="nitrogen",
        )

        rates = {z.zone_label: z.application_rate for z in result.zones}
        # High NDVI zone should get higher rate than low NDVI zone
        assert rates.get("A", 0) > rates.get("D", 0)
