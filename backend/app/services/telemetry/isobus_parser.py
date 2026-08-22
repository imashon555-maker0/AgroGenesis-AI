"""
ISO 11783 (ISOBUS) Task Controller XML parser.

Parses TASKDATA.XML files produced by ISOBUS-compliant terminals.
Extracts operation data, application rates, and GPS position data.
"""

import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime
from typing import Optional
from lxml import etree


@dataclass
class ISOBUSPosition:
    """A GPS position with an associated value (e.g., application rate)."""
    latitude: float
    longitude: float
    value: float
    timestamp: Optional[datetime] = None


@dataclass
class ISOBUSProcessData:
    """Process data variable (DDI + value)."""
    ddi: str  # Data Determinant Identifier
    value: float
    unit: str
    description: str = ""


@dataclass
class ISOBUSOperation:
    """A single ISOBUS operation (e.g., application, planting)."""
    operation_type: str
    product_name: str = ""
    product_rate: float = 0.0
    product_unit: str = "kg/ha"
    process_data: list[ISOBUSProcessData] = field(default_factory=list)
    positions: list[ISOBUSPosition] = field(default_factory=list)
    machine_id: str = ""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


@dataclass
class ISOBUSTask:
    """A complete ISOBUS task containing one or more operations."""
    task_id: str = ""
    task_name: str = ""
    crop_zone_name: str = ""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    operations: list[ISOBUSOperation] = field(default_factory=list)


# Common DDI codes (ISO 11783-11)
DDI_DESCRIPTIONS = {
    "04": "Prescription map guidance (on/off)",
    "06": "Actual application rate (mass)",
    "07": "Prescribed application rate (mass)",
    "41": "Prescribed application rate (mass/area)",
    "43": "Actual application rate (mass/area)",
    "44": "Actual application rate (volume/area)",
    "67": "Area worked",
    "68": "Time across section",
}


def parse_taskdata_xml(file_path: str | Path) -> ISOBUSTask:
    """
    Parse an ISO 11783 TASKDATA.XML file.

    Handles both namespaced and non-namespaced XML formats.
    """
    tree = ET.parse(file_path)
    root = tree.getroot()

    # Detect namespace
    ns = {}
    if root.tag.startswith("{"):
        ns_uri = root.tag.split("}")[0].lstrip("{")
        ns = {"TD": ns_uri}

    task = ISOBUSTask()

    # Parse task-level info
    task_elem = _find(root, ns, ".//CropZone") or _find(root, ns, ".//Task") or root
    task.task_id = task_elem.get("ID", "unknown")
    task.task_name = task_elem.get("Name", "Unnamed Task")
    task.crop_zone_name = task_elem.get("CropZoneName", "")

    # Parse operations
    for op_elem in _findall(root, ns, ".//OperationData") or _findall(root, ns, ".//Operation"):
        operation = _parse_operation(op_elem, ns)
        task.operations.append(operation)

    return task


def _parse_operation(op_elem: ET.Element, ns: dict) -> ISOBUSOperation:
    """Parse a single OperationData element."""
    operation = ISOBUSOperation(
        operation_type=op_elem.get("OperationType", op_elem.get("Type", "unknown")),
        machine_id=op_elem.get("MachineID", op_elem.get("DeviceElementNumber", "")),
    )

    # Parse start/end times
    start = op_elem.get("OperationDataStartTime") or op_elem.get("StartTime")
    end = op_elem.get("OperationDataEndTime") or op_elem.get("EndTime")
    if start:
        operation.start_time = _parse_datetime(start)
    if end:
        operation.end_time = _parse_datetime(end)

    # Parse process data variables (application rates)
    for pdv in _findall(op_elem, ns, ".//ProcessDataVariable") or _findall(op_elem, ns, ".//ProcessData"):
        ddi = pdv.get("DDI", pdv.get("DataLogPGN", "unknown"))
        value = float(pdv.get("Value", pdv.get("ActualValue", 0)))
        unit = pdv.get("UnitOfMeasure", pdv.get("Unit", "kg/ha"))
        desc = DDI_DESCRIPTIONS.get(ddi, f"DDI {ddi}")

        process_data = ISOBUSProcessData(
            ddi=ddi,
            value=value,
            unit=unit,
            description=desc,
        )
        operation.process_data.append(process_data)

        # Use application rate DDI as primary rate
        if ddi in ("43", "44", "41", "06", "07"):
            operation.product_rate = value
            operation.product_unit = unit

    # Parse product info
    product_elem = _find(op_elem, ns, ".//Product") or _find(op_elem, ns, ".//ProductGroup")
    if product_elem is not None:
        operation.product_name = product_elem.get("ProductType", product_elem.get("Name", ""))

    # Parse position data (GPS points with values)
    for pos in _findall(op_elem, ns, ".//Position") or _findall(op_elem, ns, ".//GeoPoint"):
        try:
            lat = float(pos.get("A", pos.get("Latitude", 0)))
            lon = float(pos.get("B", pos.get("Longitude", 0)))
            val = float(pos.get("C", pos.get("Value", operation.product_rate)))
            ts = _parse_datetime(pos.get("Timestamp")) if pos.get("Timestamp") else None

            operation.positions.append(ISOBUSPosition(
                latitude=lat,
                longitude=lon,
                value=val,
                timestamp=ts,
            ))
        except (ValueError, TypeError):
            continue

    return operation


def task_to_telemetry_records(task: ISOBUSTask, field_id: str) -> list[dict]:
    """
    Convert an ISOBUSTask to a list of normalized telemetry record dicts
    compatible with the TelemetryRecord model.
    """
    records = []
    for op in task.operations:
        for pos in op.positions:
            # Extract rate from position if available, otherwise from operation
            rate = pos.value if pos.value > 0 else op.product_rate

            records.append({
                "field_id": field_id,
                "machine_id": op.machine_id or "ISOBUS-unknown",
                "timestamp": pos.timestamp or op.start_time or datetime.utcnow(),
                "speed_kmh": None,  # ISOBUS doesn't typically include speed in position data
                "applied_rate_kg_ha": rate,
                "source_format": "isobus",
                "location_lat": pos.latitude,
                "location_lon": pos.longitude,
            })

    return records


def _find(elem: ET.Element, ns: dict, path: str) -> Optional[ET.Element]:
    """Find first element, trying with and without namespace."""
    if ns:
        result = elem.find(path, ns)
        if result is not None:
            return result
    # Try without namespace
    clean_path = path.replace("//", "/").lstrip("/")
    return elem.find(clean_path)


def _findall(elem: ET.Element, ns: dict, path: str) -> list[ET.Element]:
    """Find all elements, trying with and without namespace."""
    if ns:
        results = elem.findall(path, ns)
        if results:
            return results
    clean_path = path.replace("//", "/").lstrip("/")
    return elem.findall(clean_path)


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    """Parse ISO 8601 or common datetime formats."""
    if not value:
        return None
    for fmt in ["%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ"]:
        try:
            return datetime.strptime(value.strip(), fmt)
        except ValueError:
            continue
    return None
