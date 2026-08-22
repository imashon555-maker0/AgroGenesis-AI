# AgroGenesis AI - Architecture

## System Overview

AgroGenesis AI is a four-tier precision agriculture platform:

```
Tier 1: Data Ingestion → Tier 2: Geospatial Processing → Tier 3: AI Reasoning → Tier 4: Output & UI
```

## Data Flow

1. **Raw Data** (J1939 logs, ISOBUS XML, satellite imagery) enters the system
2. **Telemetry Ingestion Layer** normalizes machine data to a canonical schema
3. **Geospatial Engine** computes NDVI/NDRE indices and assigns data to management zones
4. **DeepSeek V4 AI Core** generates variable-rate prescriptions using multi-modal reasoning
5. **EcoFin Engine** calculates carbon credits and financial savings
6. **Output Layer** exports ISOBUS XML and Shapefiles for tractor terminals
7. **React Dashboard** visualizes everything on a Mapbox-powered PWA

## Database Schema (PostGIS)

Key tables:
- `fields` - Farm field boundaries (PostGIS Polygon)
- `field_zones` - Management zones within fields (PostGIS MultiPolygon)
- `telemetry_records` - Machine data points (PostGIS Point)
- `satellite_observations` - NDVI/NDRE measurements
- `prescriptions` - AI-generated VRA plans
- `prescription_zones` - Per-zone application rates
- `ecofin_records` - Carbon/financial analysis

## AI Integration

DeepSeek V4 serves as the central reasoning node:
- **deepseek-v4-flash-vision-exp**: Rapid vision diagnosis of crop images
- **deepseek-v4-pro**: Structured multi-objective prescription generation
- **Tool/Function Calling**: Enforces schema compliance via `generate_agronomic_prescription`

## EcoFin Methodology

IPCC Tier 1 carbon accounting:
- N₂O Emission Factor: 0.01 kg N₂O-N/kg N
- GWP of N₂O: 298 × CO₂ equivalent
- Manufacturing EF: 4.55 kg CO₂e/kg N (Haber-Bosch)
- Framework: KAZ ETS at $15/ton CO₂e

## API Design

REST API at `/api/v1/` with OpenAPI documentation at `/docs`.

Key endpoints:
- `GET/POST /fields` - CRUD operations
- `POST /telemetry/{id}/upload` - Data ingestion
- `POST /imagery/analyze/{id}` - NDVI/NDRE computation
- `POST /prescriptions/{id}/generate` - AI prescription generation
- `GET /ecofin/{id}` - Carbon/financial analysis
- `GET /export/{id}/isobus` - ISOBUS XML export
- `GET /export/{id}/shapefile` - Shapefile export
