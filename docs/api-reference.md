# AgroGenesis AI - API Reference

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs` (Swagger UI)

## Health

```bash
curl http://localhost:8000/api/v1/health
```

## Fields

### List Fields
```bash
curl http://localhost:8000/api/v1/fields
```

### Create Field
```bash
curl -X POST http://localhost:8000/api/v1/fields \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Northern Quarter",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[69.18,43.22],[69.22,43.22],[69.22,43.18],[69.18,43.18],[69.18,43.22]]]
    },
    "soil_type": "Chernozem",
    "crop_type": "Winter Wheat"
  }'
```

### Get Field
```bash
curl http://localhost:8000/api/v1/fields/{field_id}
```

## Telemetry

### Upload J1939 CSV
```bash
curl -X POST http://localhost:8000/api/v1/telemetry/{field_id}/upload \
  -F "file=@j1939_log.csv"
```

### Get Telemetry Stats
```bash
curl http://localhost:8000/api/v1/telemetry/{field_id}/stats
```

## Imagery

### Run NDVI Analysis
```bash
curl -X POST http://localhost:8000/api/v1/imagery/analyze/{field_id}
```

### Diagnose Crop Image
```bash
curl -X POST http://localhost:8000/api/v1/imagery/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "field_id": "field-uuid",
    "image_base64": "base64-encoded-image",
    "context": "Winter wheat field, mid-July"
  }'
```

## Prescriptions

### Generate AI Prescription
```bash
curl -X POST "http://localhost:8000/api/v1/prescriptions/{field_id}/generate?input_type=nitrogen"
```

### Export ISOBUS XML
```bash
curl -O http://localhost:8000/api/v1/export/{prescription_id}/isobus
```

### Export Shapefile
```bash
curl -O http://localhost:8000/api/v1/export/{prescription_id}/shapefile
```

## EcoFin

### Get EcoFin Analysis
```bash
curl http://localhost:8000/api/v1/ecofin/{prescription_id}
```

## Response Formats

All responses are JSON unless specified (ISOBUS returns XML, Shapefile returns ZIP).

### Field Response
```json
{
  "id": "uuid",
  "name": "Northern Quarter",
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "area_ha": 250.0,
  "zones": [...],
  "created_at": "2026-07-15T00:00:00Z"
}
```

### Prescription Response
```json
{
  "id": "uuid",
  "input_type": "nitrogen",
  "zones": [
    {
      "zone_label": "A",
      "application_rate": 140.5,
      "rationale": "High productivity zone..."
    }
  ],
  "total_estimated_input": 110.0,
  "ecofin": {
    "carbon": { "total_carbon_tco2e_ha": 0.3012 },
    "financial": { "net_benefit_usd_ha": 39.73 }
  }
}
```
