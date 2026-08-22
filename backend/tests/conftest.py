"""Pytest fixtures for AgroGenesis AI tests."""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.database import get_db, async_session_factory


@pytest_asyncio.fixture
async def client():
    """Create async test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def db_session():
    """Create a test database session."""
    async with async_session_factory() as session:
        yield session
        await session.rollback()
