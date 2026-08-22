FROM python:3.11-slim AS base

# Install system dependencies for GDAL, rasterio, spatial libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libpq-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set GDAL environment variables
ENV GDAL_LIBRARY_PATH=/usr/lib/libgdal.so
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

WORKDIR /app

# Install uv for fast dependency management
RUN pip install uv

# Copy dependency files first (for Docker layer caching)
COPY pyproject.toml ./

# Install dependencies
RUN uv sync --dev

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/api/v1/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
