"""Health check routes."""

from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from fastapi import Depends

router = APIRouter()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """System health check endpoint."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {e}"

    return {
        "status": "ok",
        "service": "AgroGenesis AI",
        "version": "0.1.0",
        "database": db_status,
    }
