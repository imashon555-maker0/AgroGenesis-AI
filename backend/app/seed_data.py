"""
Seed data script.

Populates the database with realistic sample data for demo purposes.
Run with: python -m app.seed_data
"""

import asyncio
import json
import random
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import text
from app.database import async_session_factory, init_db

# ============================================================
# Sample Field Data (Central Kazakhstan region)
# ============================================================

SAMPLE_FIELDS = [
    {
        "name": "Field A - Northern Quarter",
        "soil_type": "Chernozem",
        "crop_type": "Winter Wheat",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [69.180, 43.220], [69.195, 43.222], [69.210, 43.220],
                    [69.215, 43.210], [69.210, 43.198], [69.195, 43.195],
                    [69.180, 43.198], [69.175, 43.210], [69.180, 43.220],
                ]
            ],
        },
        "zones": [
            {"index": 0, "label": "A", "class": "high", "area_ha": 65.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.185, 43.215], [69.197, 43.216], [69.207, 43.215],
                   [69.208, 43.207], [69.197, 43.206], [69.185, 43.207], [69.185, 43.215]]]
             ]}},
            {"index": 1, "label": "B", "class": "medium", "area_ha": 72.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.197, 43.216], [69.210, 43.215], [69.212, 43.207],
                   [69.208, 43.200], [69.197, 43.200], [69.197, 43.216]]]
             ]}},
            {"index": 2, "label": "C", "class": "medium", "area_ha": 58.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.185, 43.207], [69.197, 43.206], [69.197, 43.198],
                   [69.185, 43.198], [69.183, 43.203], [69.185, 43.207]]]
             ]}},
            {"index": 3, "label": "D", "class": "low", "area_ha": 45.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.197, 43.200], [69.210, 43.200], [69.212, 43.198],
                   [69.208, 43.195], [69.197, 43.195], [69.195, 43.198], [69.197, 43.200]]]
             ]}},
        ],
    },
    {
        "name": "Field B - South Steppe",
        "soil_type": "Sierozem",
        "crop_type": "Spring Barley",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [69.250, 43.200], [69.280, 43.202], [69.300, 43.200],
                    [69.305, 43.185], [69.295, 43.170], [69.270, 43.168],
                    [69.250, 43.170], [69.245, 43.185], [69.250, 43.200],
                ]
            ],
        },
        "zones": [
            {"index": 0, "label": "A", "class": "high", "area_ha": 120.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.255, 43.195], [69.275, 43.196], [69.290, 43.195],
                   [69.291, 43.185], [69.275, 43.184], [69.255, 43.185], [69.255, 43.195]]]
             ]}},
            {"index": 1, "label": "B", "class": "medium", "area_ha": 135.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.275, 43.196], [69.298, 43.195], [69.300, 43.185],
                   [69.291, 43.178], [69.275, 43.177], [69.275, 43.196]]]
             ]}},
            {"index": 2, "label": "C", "class": "low", "area_ha": 95.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.255, 43.185], [69.275, 43.184], [69.275, 43.173],
                   [69.255, 43.172], [69.253, 43.179], [69.255, 43.185]]]
             ]}},
            {"index": 3, "label": "D", "class": "low", "area_ha": 80.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.275, 43.177], [69.295, 43.178], [69.298, 43.172],
                   [69.290, 43.168], [69.275, 43.169], [69.273, 43.173], [69.275, 43.177]]]
             ]}},
        ],
    },
    {
        "name": "Field C - Riverside Plots",
        "soil_type": "Alluvial",
        "crop_type": "Sunflower",
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [69.220, 43.240], [69.240, 43.242], [69.245, 43.235],
                    [69.240, 43.225], [69.220, 43.223], [69.215, 43.230],
                    [69.220, 43.240],
                ]
            ],
        },
        "zones": [
            {"index": 0, "label": "A", "class": "high", "area_ha": 45.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.222, 43.237], [69.233, 43.238], [69.240, 43.235],
                   [69.239, 43.230], [69.230, 43.229], [69.222, 43.230], [69.222, 43.237]]]
             ]}},
            {"index": 1, "label": "B", "class": "medium", "area_ha": 38.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.233, 43.238], [69.243, 43.237], [69.244, 43.230],
                   [69.240, 43.226], [69.230, 43.227], [69.233, 43.238]]]
             ]}},
            {"index": 2, "label": "C", "class": "medium", "area_ha": 28.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.222, 43.230], [69.230, 43.229], [69.230, 43.224],
                   [69.222, 43.223], [69.219, 43.227], [69.222, 43.230]]]
             ]}},
            {"index": 3, "label": "D", "class": "low", "area_ha": 19.0,
             "geometry": {"type": "MultiPolygon", "coordinates": [
                 [[[69.230, 43.227], [69.240, 43.226], [69.241, 43.223],
                   [69.237, 43.220], [69.230, 43.221], [69.228, 43.224], [69.230, 43.227]]]
             ]}},
        ],
    },
]

MACHINES = [
    ("JohnDeere-8R-370", "John Deere"),
    ("CaseIH-Magnum-340", "Case IH"),
    ("NewHolland-T7-315", "New Holland"),
]


def generate_telemetry(field_geom: dict, machine: tuple, count: int = 200) -> list[dict]:
    """Generate realistic telemetry records along a field path."""
    coords = field_geom["coordinates"][0]
    records = []
    base_time = datetime(2026, 7, 15, 6, 0, 0, tzinfo=timezone.utc)

    for i in range(count):
        # Interpolate position along field boundary + offset
        t = (i % len(coords)) / len(coords)
        next_idx = (i + 1) % len(coords)
        lat = coords[i][1] + (coords[next_idx][1] - coords[i][1]) * random.uniform(0, 0.3)
        lon = coords[i][0] + (coords[next_idx][0] - coords[i][0]) * random.uniform(0, 0.3)

        # Add some randomness
        lat += random.uniform(-0.002, 0.002)
        lon += random.uniform(-0.002, 0.002)

        speed = random.uniform(6, 14)  # km/h
        fuel_rate = random.uniform(15, 35)  # L/h
        engine_load = random.uniform(40, 95)  # %
        rpm = random.uniform(1500, 2200)
        applied = random.uniform(100, 200) if i % 3 == 0 else None

        records.append({
            "timestamp": base_time + timedelta(seconds=i * 5),
            "machine_id": machine[0],
            "machine_brand": machine[1],
            "speed_kmh": round(speed, 1),
            "fuel_rate_l_h": round(fuel_rate, 1),
            "fuel_consumption_l_ha": round(fuel_rate / speed, 2),
            "wheel_slip_pct": round(random.uniform(2, 12), 1),
            "engine_load_pct": round(engine_load, 1),
            "engine_rpm": round(rpm),
            "applied_rate_kg_ha": round(applied, 1) if applied else None,
            "source_format": "j1939",
            "pgn_code": random.choice([65265, 65266, 61444, 65270, 65280]),
            "location_lat": round(lat, 6),
            "location_lon": round(lon, 6),
        })

    return records


async def seed():
    """Seed the database with sample data."""
    await init_db()

    async with async_session_factory() as session:
        for field_data in SAMPLE_FIELDS:
            # Check if field already exists
            result = await session.execute(
                text("SELECT id FROM fields WHERE name = :name"),
                {"name": field_data["name"]},
            )
            if result.fetchone():
                print(f"⏭️  Field '{field_data['name']}' already exists, skipping")
                continue

            # Create field
            field_id = str(uuid4())
            geojson = json.dumps(field_data["geometry"])
            await session.execute(
                text("""
                    INSERT INTO fields (id, name, soil_type, crop_type, geometry)
                    VALUES (:id, :name, :soil, :crop, ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326))
                """),
                {
                    "id": field_id,
                    "name": field_data["name"],
                    "soil": field_data["soil_type"],
                    "crop": field_data["crop_type"],
                    "geojson": geojson,
                },
            )
            print(f"✅ Created field '{field_data['name']}' ({field_id})")

            # Create zones
            zone_ids = []
            for zone in field_data["zones"]:
                zone_id = str(uuid4())
                zone_geojson = json.dumps(zone["geometry"])
                await session.execute(
                    text("""
                        INSERT INTO field_zones (id, field_id, zone_index, zone_label, productivity_class, area_ha, geometry)
                        VALUES (:id, :field_id, :idx, :label, :pclass, :area,
                                ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326))
                    """),
                    {
                        "id": zone_id,
                        "field_id": field_id,
                        "idx": zone["index"],
                        "label": zone["label"],
                        "pclass": zone["class"],
                        "area": zone["area_ha"],
                        "geojson": zone_geojson,
                    },
                )
                zone_ids.append((zone_id, zone["label"]))
                print(f"   📐 Zone {zone['label']} ({zone['class']}, {zone['area_ha']} ha)")

            # Generate telemetry
            machine = random.choice(MACHINES)
            telemetry = generate_telemetry(field_data["geometry"], machine, count=200)

            for rec in telemetry:
                lat, lon = rec.pop("location_lat"), rec.pop("location_lon")
                rec.pop("machine_brand", None)
                await session.execute(
                    text("""
                        INSERT INTO telemetry_records (
                            id, field_id, machine_id, timestamp, speed_kmh,
                            fuel_rate_l_h, fuel_consumption_l_ha, wheel_slip_pct,
                            engine_load_pct, engine_rpm, applied_rate_kg_ha,
                            source_format, pgn_code, location
                        ) VALUES (
                            gen_random_uuid(), :field_id, :machine_id, :timestamp, :speed_kmh,
                            :fuel_rate_l_h, :fuel_consumption_l_ha, :wheel_slip_pct,
                            :engine_load_pct, :engine_rpm, :applied_rate_kg_ha,
                            :source_format, :pgn_code, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
                        )
                    """),
                    {
                        "field_id": field_id,
                        "machine_id": rec["machine_id"],
                        "timestamp": rec["timestamp"],
                        "speed_kmh": rec["speed_kmh"],
                        "fuel_rate_l_h": rec["fuel_rate_l_h"],
                        "fuel_consumption_l_ha": rec["fuel_consumption_l_ha"],
                        "wheel_slip_pct": rec["wheel_slip_pct"],
                        "engine_load_pct": rec["engine_load_pct"],
                        "engine_rpm": rec["engine_rpm"],
                        "applied_rate_kg_ha": rec["applied_rate_kg_ha"],
                        "source_format": rec["source_format"],
                        "pgn_code": rec["pgn_code"],
                        "lon": lon,
                        "lat": lat,
                    },
                )

            print(f"   🚜 Created {len(telemetry)} telemetry records")

            # Create synthetic satellite observations
            for days_ago in [0, 7, 14, 30]:
                capture_date = datetime.now(timezone.utc) - timedelta(days=days_ago)
                mean_ndvi = random.uniform(0.4, 0.75)
                mean_ndre = random.uniform(0.3, 0.6)
                await session.execute(
                    text("""
                        INSERT INTO satellite_observations (
                            id, field_id, capture_date, source,
                            mean_ndvi, mean_ndre, cloud_cover_pct
                        ) VALUES (
                            gen_random_uuid(), :field_id, :date, 'sentinel2-l2a',
                            :ndvi, :ndre, :cloud
                        )
                    """),
                    {
                        "field_id": field_id,
                        "date": capture_date.date(),
                        "ndvi": round(mean_ndvi, 4),
                        "ndre": round(mean_ndre, 4),
                        "cloud": round(random.uniform(0, 15), 1),
                    },
                )

            print(f"   🛰️  Created 4 satellite observations")

        await session.commit()
        print("\n🎉 Seed data complete!")


if __name__ == "__main__":
    asyncio.run(seed())
