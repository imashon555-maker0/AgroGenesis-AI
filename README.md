# 🌾 AgroGenesis AI

**Precision Agriculture Decision-Support Platform**

[![CI](https://github.com/your-org/agrogenesis-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/agrogenesis-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://react.dev/)

---

## 📋 Overview

AgroGenesis AI is an autonomous multi-modal precision agriculture decision-support system and Farm Management Information System (FMIS). It bridges the gap between raw machinery telematics, multispectral satellite/drone imagery, and actionable farm management.

### Key Features

- **Telemetry Ingestion**: Parses SAE J1939 CAN-bus logs and ISOBUS Task Controller files
- **Geospatial Analysis**: NDVI/NDRE vegetation indices from Sentinel-2 imagery
- **AI Prescription Engine**: DeepSeek V4-powered variable-rate application prescriptions
- **EcoFin Carbon Credits**: IPCC Tier 1 carbon accounting and KAZ ETS monetization
- **Cross-Platform Dashboard**: PWA works on Windows, iOS, and Android

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AgroGenesis AI Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │  J1939 Logs   │   │  ISOBUS XML  │   │  Sentinel-2 /    │   │
│  │  (CAN-bus)    │   │  (Task Data)  │   │  Drone Imagery   │   │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘   │
│         │                   │                     │               │
│         ▼                   ▼                     ▼               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Telemetry Ingestion Layer                    │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ J1939 Parser │  │ ISOBUS Parser│  │  Normalizer   │  │   │
│  │  └─────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                             │                                     │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │  PostGIS    │   │  Geospatial  │   │   DeepSeek V4    │   │
│  │  Database   │◄──│  Engine      │──►│   AI Core        │   │
│  │  (Fields,   │   │  (NDVI,NDRE, │   │  (Vision + Pro)  │   │
│  │   Zones,    │   │   Zonal      │   │                  │   │
│  │   Records)  │   │   Stats)     │   │  ┌────────────┐  │   │
│  └──────┬─────┘   └──────────────┘   │  │Prescription │  │   │
│         │                              │  │  Engine     │  │   │
│         │                              │  └────────────┘  │   │
│         ▼                              └────────┬─────────┘   │
│  ┌──────────────────────────────────────────────┴──────────┐   │
│  │                    EcoFin Engine                          │   │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │   │
│  │  │ Carbon     │  │ Cost         │  │ KAZ ETS        │  │   │
│  │  │ Model      │  │ Optimizer    │  │ Compliance     │  │   │
│  │  └────────────┘  └──────────────┘  └────────────────┘  │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                             │                                     │
│                             ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Output Generation                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │ ISOBUS XML   │  │ ESRI         │  │ Direct-to-   │  │   │
│  │  │ Task Files    │  │ Shapefiles   │  │ Tractor      │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                             │                                     │
│                             ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            React Dashboard (PWA)                          │   │
│  │  ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────────────┐  │   │
│  │  │ Mapbox │ │ Telemetry│ │ NDVI   │ │ EcoFin Charts  │  │   │
│  │  │  GL JS │ │ Monitor  │ │ Viewer │ │                │  │   │
│  │  └────────┘ └─────────┘ └────────┘ └────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```



## 📁 Project Structure

```
agrogenesis-ai/
├── backend/                 # FastAPI + Python 3.11
│   ├── app/                 # Application code
│   │   ├── api/             # REST API routes
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── core/            # Config, security
│   ├── tests/               # Backend tests
│   └── data/sample/         # Sample data files
├── frontend/                # React 18 + TypeScript
│   └── src/
│       ├── components/      # UI components
│       ├── pages/           # Route pages
│       ├── api/             # API client
│       └── stores/          # State management
├── data/                    # Shared data schemas
└── docs/                    # Documentation
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI, Pydantic v2 |
| Database | PostgreSQL 16, PostGIS 3.4 |
| AI Engine | DeepSeek V4 (Pro + Vision) |
| Geospatial | GeoAlchemy2, Rasterio, GeoPandas |
| Frontend | React 18, TypeScript, Vite, TailwindCSS |
| Mapbox | Mapbox GL JS, react-map-gl |
| State | Zustand, React Query |
| Charts | Recharts |
| CI/CD | GitHub Actions |

## 🌍 EcoFin Carbon Methodology

AgroGenesis AI uses IPCC Tier 1 methodology:

- **N₂O Emission Factor**: 0.01 kg N₂O-N per kg N applied
- **GWP of N₂O**: 298 × CO₂ equivalent
- **Manufacturing EF**: 4.55 kg CO₂e per kg N (Haber-Bosch)
- **Carbon Price**: $15/ton (KAZ ETS framework)

**Net Benefit**: ~$21.77/ha per season through:
- 20% N reduction → $13.60/ha savings
- 10-12% fuel savings
- 0.42 tCO₂e/ha carbon credits → $6.30/ha revenue

## 📱 Mobile Access (PWA)

### Android
1. Open Chrome → navigate to dashboard
2. Tap "Add to Home Screen"
3. App installs as standalone PWA

### iOS (iPhone)
1. Open Safari → navigate to dashboard
2. Tap Share → "Add to Home Screen"
3. App runs in standalone mode

### Windows
1. Open Edge → navigate to dashboard
2. Click "Install" in address bar
3. App runs as windowed application

## 🧪 Development

```bash
# Backend only
cd backend && uv sync && uv run uvicorn app.main:app --reload

# Frontend only
cd frontend && npm install && npm run dev

# Run tests
uv run pytest                    # Backend
cd frontend && npm test          # Frontend
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
