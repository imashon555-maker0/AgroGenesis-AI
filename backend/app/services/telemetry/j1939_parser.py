"""
SAE J1939 CAN-bus log parser.

Parses CSV-formatted J1939 logs containing Parameter Group Numbers (PGNs)
for standard farm machinery signals: engine speed, fuel rate, wheel slip, etc.
"""

import csv
from datetime import datetime
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


# J1939 PGN definitions with extraction lambdas
J1939_PGNS: dict[int, dict] = {
    61444: {
        "name": "Electronic Engine Controller 1 (EEC1)",
        "fields": {
            "engine_load_pct": lambda d: d[3] * 100.0 / 255.0,
            "engine_rpm": lambda d: (d[4] + d[5] * 256) / 8.0,
            "engine_torque_nm": lambda d: (d[2] + d[3] * 256 - 125) * 0.1,
        },
    },
    65265: {
        "name": "Cruise Control / Vehicle Speed (CCVS)",
        "fields": {
            "speed_kmh": lambda d: (d[2] + d[3] * 256) * 0.015625,
        },
    },
    65266: {
        "name": "Fuel Economy (FE)",
        "fields": {
            "fuel_rate_l_h": lambda d: (d[1] + d[2] * 256) * 0.05,
        },
    },
    65270: {
        "name": "Vehicle Direction / Slip (VD)",
        "fields": {
            "wheel_slip_pct": lambda d: (d[2] - 125) * 0.4,
            "heading_deg": lambda d: (d[0] + d[1] * 256) * 0.0078125,
        },
    },
    65280: {
        "name": "Implement Application Rate (IAR)",
        "fields": {
            "applied_rate_kg_ha": lambda d: (d[0] + d[1] * 256) * 0.01,
        },
    },
    65281: {
        "name": "Guidance System (GS)",
        "fields": {
            "guidance_status": lambda d: d[0] & 0x0F,
        },
    },
    65269: {
        "name": "High Resolution Vehicle Position (HRVP)",
        "fields": {
            "latitude": lambda d: (
                ((d[0] + d[1] * 256 + d[2] * 65536 + d[3] * 16777216) * 10.0 / 2.147e9)
                if (d[3] & 0x80) == 0
                else -(((d[0] + d[1] * 256 + d[2] * 65536 + ((d[3] + d[4] * 256) & 0x7FFF)) * 10.0 / 2.147e9))
            ),
            "longitude": lambda d: (
                ((d[5] + d[6] * 256 + d[7] * 65536 + (d[8] if len(d) > 8 else 0) * 16777216) * 10.0 / 2.147e9)
            ) if len(d) > 5 else None,
        },
    },
}


@dataclass
class J1939Record:
    """A parsed J1939 telemetry record."""

    timestamp: datetime
    machine_id: str
    speed_kmh: Optional[float] = None
    fuel_rate_l_h: Optional[float] = None
    fuel_consumption_l_ha: Optional[float] = None
    engine_rpm: Optional[float] = None
    engine_load_pct: Optional[float] = None
    wheel_slip_pct: Optional[float] = None
    applied_rate_kg_ha: Optional[float] = None
    pgn: int = 0
    pgn_name: str = ""
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None


def parse_hex_byte(hex_str: str) -> int:
    """Parse a single hex byte string to int."""
    return int(hex_str.strip(), 16)


def parse_j1939_csv(file_path: str | Path) -> list[J1939Record]:
    """
    Parse a J1939 CSV log file into normalized records.

    Expected CSV columns:
        timestamp, machine_id, pgn, byte0-byte7, [lat, lon]
    """
    records = []
    with open(file_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                timestamp = datetime.fromisoformat(row["timestamp"].strip())
                pgn = int(row["pgn"].strip())
                machine_id = row.get("machine_id", "unknown").strip()

                # Parse 8 data bytes
                data = [parse_hex_byte(row.get(f"byte{i}", "00")) for i in range(8)]

                record = J1939Record(
                    timestamp=timestamp,
                    machine_id=machine_id,
                    pgn=pgn,
                    pgn_name=J1939_PGNS.get(pgn, {}).get("name", "Unknown"),
                    location_lat=_safe_float(row.get("lat")),
                    location_lon=_safe_float(row.get("lon")),
                )

                # Extract fields from this PGN
                if pgn in J1939_PGNS:
                    for field_name, extractor in J1939_PGNS[pgn]["fields"].items():
                        value = extractor(data)
                        if value is not None:
                            setattr(record, field_name, value)

                # Compute fuel consumption L/ha from speed and fuel rate
                if record.fuel_rate_l_h and record.speed_kmh and record.speed_kmh > 0.5:
                    record.fuel_consumption_l_ha = record.fuel_rate_l_h / record.speed_kmh

                records.append(record)
            except (ValueError, KeyError) as e:
                # Skip malformed rows
                continue

    return records


def aggregate_j1939_records(records: list[J1939Record]) -> list[J1939Record]:
    """
    Aggregate raw J1939 records into per-second snapshots.
    Combines signals from different PGNs within the same second.
    """
    from collections import defaultdict

    # Group by (machine_id, timestamp_second)
    snapshots: dict[tuple, J1939Record] = {}

    for record in records:
        # Round timestamp to second
        ts_key = record.timestamp.replace(microsecond=0)
        key = (record.machine_id, ts_key)

        if key not in snapshots:
            snapshots[key] = J1939Record(
                timestamp=ts_key,
                machine_id=record.machine_id,
                pgn_name="Aggregated",
            )

        snap = snapshots[key]
        # Merge non-None values
        for attr in [
            "speed_kmh", "fuel_rate_l_h", "fuel_consumption_l_ha",
            "engine_rpm", "engine_load_pct", "wheel_slip_pct",
            "applied_rate_kg_ha", "location_lat", "location_lon",
        ]:
            val = getattr(record, attr)
            if val is not None and getattr(snap, attr) is None:
                setattr(snap, attr, val)

    return sorted(snapshots.values(), key=lambda r: r.timestamp)


def _safe_float(value: Optional[str]) -> Optional[float]:
    """Safely convert a string to float, returning None on failure."""
    if value is None or value.strip() == "":
        return None
    try:
        return float(value.strip())
    except (ValueError, TypeError):
        return None
