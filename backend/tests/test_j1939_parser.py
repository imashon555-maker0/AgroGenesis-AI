"""Tests for J1939 CAN-bus parser."""

import tempfile
import os
from datetime import datetime, timezone

import pytest

from app.services.telemetry.j1939_parser import (
    parse_j1939_csv,
    aggregate_j1939_records,
    J1939Record,
    parse_hex_byte,
)


class TestHexParsing:
    def test_parse_hex_byte_valid(self):
        assert parse_hex_byte("0A") == 10
        assert parse_hex_byte("FF") == 255
        assert parse_hex_byte("00") == 0
        assert parse_hex_byte("8C") == 140

    def test_parse_hex_byte_lowercase(self):
        assert parse_hex_byte("0a") == 10
        assert parse_hex_byte("ff") == 255


class TestJ1939CSVParser:
    @pytest.fixture
    def sample_csv(self, tmp_path):
        """Create a sample J1939 CSV file."""
        csv_content = """timestamp,machine_id,pgn,byte0,byte1,byte2,byte3,byte4,byte5,byte6,byte7,lat,lon
2026-07-15T08:00:00+00:00,JD-8R-370,65265,00,00,8C,01,00,00,00,00,43.2015,69.1823
2026-07-15T08:00:00+00:00,JD-8R-370,61444,00,00,7D,32,20,03,00,00,43.2015,69.1823
2026-07-15T08:00:00+00:00,JD-8R-370,65266,00,0A,1E,00,00,00,00,00,43.2015,69.1823
2026-07-15T08:00:05+00:00,JD-8R-370,65265,00,00,8C,01,00,00,00,00,43.2016,69.1825
2026-07-15T08:00:05+00:00,JD-8R-370,61444,00,00,7D,32,20,03,00,00,43.2016,69.1825
"""
        file_path = tmp_path / "test_j1939.csv"
        file_path.write_text(csv_content)
        return str(file_path)

    def test_parse_basic_csv(self, sample_csv):
        records = parse_j1939_csv(sample_csv)
        assert len(records) == 5
        assert records[0].machine_id == "JD-8R-370"

    def test_parse_vehicle_speed(self, sample_csv):
        records = parse_j1939_csv(sample_csv)
        speed_records = [r for r in records if r.speed_kmh is not None]
        assert len(speed_records) > 0
        assert speed_records[0].speed_kmh > 0

    def test_parse_engine_data(self, sample_csv):
        records = parse_j1939_csv(sample_csv)
        engine_records = [r for r in records if r.engine_rpm is not None]
        assert len(engine_records) > 0
        assert engine_records[0].engine_rpm > 0

    def test_parse_fuel_rate(self, sample_csv):
        records = parse_j1939_csv(sample_csv)
        fuel_records = [r for r in records if r.fuel_rate_l_h is not None]
        assert len(fuel_records) > 0
        assert fuel_records[0].fuel_rate_l_h > 0

    def test_parse_gps_coordinates(self, sample_csv):
        records = parse_j1939_csv(sample_csv)
        gps_records = [r for r in records if r.location_lat is not None]
        assert len(gps_records) == 5
        assert abs(gps_records[0].location_lat - 43.2015) < 0.001

    def test_parse_empty_file(self, tmp_path):
        file_path = tmp_path / "empty.csv"
        file_path.write_text("timestamp,machine_id,pgn,byte0,byte1,byte2,byte3,byte4,byte5,byte6,byte7\n")
        records = parse_j1939_csv(str(file_path))
        assert records == []

    def test_parse_malformed_rows(self, tmp_path):
        csv_content = """timestamp,machine_id,pgn,byte0,byte1,byte2,byte3,byte4,byte5,byte6,byte7,lat,lon
invalid-timestamp,JD-8R-370,65265,00,00,8C,01,00,00,00,00,43.20,69.18
2026-07-15T08:00:00+00:00,JD-8R-370,65265,00,00,8C,01,00,00,00,00,43.20,69.18
"""
        file_path = tmp_path / "malformed.csv"
        file_path.write_text(csv_content)
        records = parse_j1939_csv(str(file_path))
        # Should skip malformed row, parse valid one
        assert len(records) == 1


class TestAggregation:
    def test_aggregate_combines_pgn_signals(self):
        records = [
            J1939Record(
                timestamp=datetime(2026, 7, 15, 8, 0, 0, tzinfo=timezone.utc),
                machine_id="TEST",
                speed_kmh=10.0,
                pgn=65265,
            ),
            J1939Record(
                timestamp=datetime(2026, 7, 15, 8, 0, 0, tzinfo=timezone.utc),
                machine_id="TEST",
                fuel_rate_l_h=25.0,
                pgn=65266,
            ),
            J1939Record(
                timestamp=datetime(2026, 7, 15, 8, 0, 5, tzinfo=timezone.utc),
                machine_id="TEST",
                speed_kmh=12.0,
                pgn=65265,
            ),
        ]
        aggregated = aggregate_j1939_records(records)
        assert len(aggregated) == 2
        # First snapshot should have both speed and fuel
        assert aggregated[0].speed_kmh == 10.0
        assert aggregated[0].fuel_rate_l_h == 25.0

    def test_aggregate_empty(self):
        assert aggregate_j1939_records([]) == []
