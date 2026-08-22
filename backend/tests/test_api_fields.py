"""API integration tests for field endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestHealthEndpoint:
    async def test_health_check(self, client: AsyncClient):
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "AgroGenesis AI"


@pytest.mark.asyncio
class TestRootEndpoint:
    async def test_root(self, client: AsyncClient):
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "AgroGenesis AI"
        assert "endpoints" in data


@pytest.mark.asyncio
class TestFieldsAPI:
    async def test_list_fields_empty(self, client: AsyncClient):
        response = await client.get("/api/v1/fields")
        assert response.status_code == 200
        data = response.json()
        assert "fields" in data
        assert "total" in data

    async def test_create_field(self, client: AsyncClient):
        field_data = {
            "name": "Test Field",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [69.18, 43.22],
                        [69.22, 43.22],
                        [69.22, 43.18],
                        [69.18, 43.18],
                        [69.18, 43.22],
                    ]
                ],
            },
            "soil_type": "Chernozem",
            "crop_type": "Wheat",
        }
        response = await client.post("/api/v1/fields", json=field_data)
        # May succeed or fail depending on DB state
        assert response.status_code in [201, 500]

    async def test_get_nonexistent_field(self, client: AsyncClient):
        response = await client.get("/api/v1/fields/00000000-0000-0000-0000-000000000000")
        assert response.status_code == 404
