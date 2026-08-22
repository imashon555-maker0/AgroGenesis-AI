"""AgroGenesis AI - Main FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db, close_db

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    logger.info("🌾 AgroGenesis AI starting up...")
    logger.info(f"   Database: {settings.database_url.split('@')[-1] if '@' in settings.database_url else 'default'}")
    logger.info(f"   Mock AI: {settings.use_mock_ai}")
    logger.info(f"   Carbon price: ${settings.carbon_price_usd_per_ton}/ton ({settings.ets_framework})")

    # Initialize database
    try:
        await init_db()
        logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")

    yield

    # Shutdown
    logger.info("🌾 AgroGenesis AI shutting down...")
    await close_db()


# Create FastAPI application
app = FastAPI(
    title="AgroGenesis AI",
    description=(
        "Precision Agriculture Decision-Support Platform\n\n"
        "Multi-modal AI system for autonomous farm management, "
        "variable-rate application prescriptions, and ecological-financial analysis."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware (allows frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
from app.api.routes import health, fields, telemetry, imagery, prescriptions, ecofin, export

app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(fields.router, prefix="/api/v1/fields", tags=["Fields"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["Telemetry"])
app.include_router(imagery.router, prefix="/api/v1/imagery", tags=["Imagery"])
app.include_router(prescriptions.router, prefix="/api/v1/prescriptions", tags=["Prescriptions"])
app.include_router(ecofin.router, prefix="/api/v1/ecofin", tags=["EcoFin"])
app.include_router(export.router, prefix="/api/v1/export", tags=["Export"])


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "AgroGenesis AI",
        "version": "0.1.0",
        "description": "Precision Agriculture Decision-Support Platform",
        "docs": "/docs",
        "endpoints": {
            "health": "/api/v1/health",
            "fields": "/api/v1/fields",
            "telemetry": "/api/v1/telemetry",
            "imagery": "/api/v1/imagery",
            "prescriptions": "/api/v1/prescriptions",
            "ecofin": "/api/v1/ecofin",
            "export": "/api/v1/export",
        },
    }
