"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    database_url: str = "postgresql+asyncpg://agro:devpassword@localhost:5432/agrogenesis"

    # DeepSeek AI
    deepseek_api_key: str = ""
    deepseek_api_base: str = "https://api.deepseek.com/v1"
    use_mock_ai: bool = True

    # Mapbox
    vite_mapbox_token: str = ""

    # EcoFin
    carbon_price_usd_per_ton: float = 15.0
    ets_framework: str = "KAZ-ETS"

    # App
    app_name: str = "AgroGenesis AI"
    debug: bool = True
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings."""
    return Settings()
