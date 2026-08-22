"""Tests for ISOBUS TASKDATA.XML parser."""

import tempfile
import pytest

from app.services.telemetry.isobus_parser import parse_taskdata_xml, task_to_telemetry_records


SAMPLE_TASKDATA_XML = """<?xml version="1.0" encoding="UTF-8"?>
<TASKDATA Version="3" ManagementSoftwareVersion="AgroGenesis Test">
  <CropZone ID="1" Name="Test Field">
    <Task ID="task-001" TaskResource="nitrogen" TaskStartTime="2026-07-15T08:00:00">
      <Product ProductType="Nitrogen Fertilizer" ProductGroupId="1"/>
      <OperationData OperationType="Application">
        <ProcessDataVariable DDI="43" Value="150" UnitOfMeasure="kg/ha"/>
        <ProcessDataVariable DDI="67" Value="25.5" UnitOfMeasure="ha"/>
        <Position A="43.2015" B="69.1823" C="150"/>
        <Position A="43.2020" B="69.1830" C="145"/>
        <Position A="43.2025" B="69.1835" C="155"/>
      </OperationData>
      <OperationData OperationType="Application">
        <ProcessDataVariable DDI="43" Value="120" UnitOfMeasure="kg/ha"/>
        <Position A="43.2030" B="69.1840" C="120"/>
        <Position A="43.2035" B="69.1845" C="115"/>
      </OperationData>
    </Task>
  </CropZone>
</TASKDATA>
"""


@pytest.fixture
def sample_xml(tmp_path):
    file_path = tmp_path / "TASKDATA.xml"
    file_path.write_text(SAMPLE_TASKDATA_XML)
    return str(file_path)


class TestISOBUSParser:
    def test_parse_task(self, sample_xml):
        task = parse_taskdata_xml(sample_xml)
        assert task.task_id == "1"
        assert task.task_name == "Test Field"

    def test_parse_operations(self, sample_xml):
        task = parse_taskdata_xml(sample_xml)
        assert len(task.operations) == 2
        assert task.operations[0].operation_type == "Application"

    def test_parse_process_data(self, sample_xml):
        task = parse_taskdata_xml(sample_xml)
        op = task.operations[0]
        assert len(op.process_data) == 2
        assert op.product_rate == 150.0
        assert op.product_unit == "kg/ha"

    def test_parse_positions(self, sample_xml):
        task = parse_taskdata_xml(sample_xml)
        op = task.operations[0]
        assert len(op.positions) == 3
        assert abs(op.positions[0].latitude - 43.2015) < 0.001
        assert abs(op.positions[0].longitude - 69.1823) < 0.001

    def test_task_to_telemetry_records(self, sample_xml):
        task = parse_taskdata_xml(sample_xml)
        records = task_to_telemetry_records(task, "test-field-id")

        # 3 positions from op1 + 2 from op2 = 5 records
        assert len(records) == 5
        assert all(r["field_id"] == "test-field-id" for r in records)
        assert all(r["source_format"] == "isobus" for r in records)

    def test_telemetry_record_has_location(self, sample_xml):
        task = parse_taskdata_xml(sample_xml)
        records = task_to_telemetry_records(task, "test-field-id")

        for record in records:
            assert "location_lat" in record
            assert "location_lon" in record
            assert record["location_lat"] is not None
            assert record["location_lon"] is not None
