"""
ISOBUS XML task file generator.

Converts AI-generated prescriptions to ISO 11783 Task Controller XML
format (TASKDATA.XML) ready for direct import to tractor terminals.
"""

import xml.etree.ElementTree as ET
from xml.dom import minidom
from datetime import datetime
from typing import Optional


def generate_taskdata_xml(
    prescription_id: str,
    field_name: str,
    input_type: str,
    zones: list[dict],
    target_date: Optional[datetime] = None,
) -> str:
    """
    Generate ISO 11783 TASKDATA.XML from a prescription.

    Args:
        prescription_id: Unique prescription identifier
        field_name: Name of the target field
        input_type: Type of input (nitrogen, herbicide, etc.)
        zones: List of zone dicts with zone_label, application_rate, boundary_points
        target_date: Planned application date

    Returns:
        Pretty-printed XML string
    """
    # Root TASKDATA element
    root = ET.Element("TASKDATA")
    root.set("Version", "3")
    root.set("ManagementSoftwareManufacturer", "AgroGenesis AI")
    root.set("ManagementSoftwareVersion", "1.0.0")
    root.set("LoggedInUser", "AgroGenesis Operator")

    # CropZone
    crop_zone = ET.SubElement(root, "CropZone")
    crop_zone.set("ID", prescription_id)
    crop_zone.set("Name", field_name)
    crop_zone.set("CropZoneID", "1")

    # Task
    task = ET.SubElement(crop_zone, "Task")
    task.set("ID", prescription_id)
    task.set("TaskResource", input_type)
    if target_date:
        task.set("TaskStartTime", target_date.isoformat())
    else:
        task.set("TaskStartTime", datetime.utcnow().isoformat())

    # Product
    product = ET.SubElement(task, "Product")
    product.set("ProductType", _input_type_label(input_type))
    product.set("ProductGroupId", "1")

    # TreatmentZone (one per prescription zone)
    for i, zone in enumerate(zones):
        treatment = ET.SubElement(task, "TreatmentZone")
        treatment.set("TreatmentZoneIndex", str(i + 1))
        treatment.set("TreatmentZoneCode", zone.get("zone_label", str(i + 1)))

        # ProcessDataVariable (application rate)
        pdv = ET.SubElement(treatment, "ProcessDataVariable")
        pdv.set("DDI", "41")  # Prescribed application rate (mass/area)
        pdv.set("Value", str(zone["application_rate"]))
        pdv.set("UnitOfMeasure", "kg/ha")

        # Position data (zone boundary points)
        for point in zone.get("boundary_points", []):
            pos = ET.SubElement(treatment, "Position")
            pos.set("A", str(point.get("lat", 0)))
            pos.set("B", str(point.get("lon", 0)))
            pos.set("C", str(zone["application_rate"]))

    # GuidanceTrack (field boundary for AB lines)
    guidance = ET.SubElement(task, "GuidanceTrack")
    guidance.set("GuidanceTrackType", "StraightTrack")
    guidance.set("GroupName", f"{field_name} - VRA Lines")

    # Pretty print
    rough_string = ET.tostring(root, encoding="unicode")
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ", encoding=None)


def validate_taskdata_xml(xml_string: str) -> tuple[bool, list[str]]:
    """
    Basic validation of generated TASKDATA.XML.

    Returns:
        Tuple of (is_valid, list_of_errors)
    """
    errors = []
    try:
        root = ET.fromstring(xml_string)
    except ET.ParseError as e:
        return False, [f"XML parse error: {e}"]

    # Check required elements
    if root.tag != "TASKDATA":
        errors.append("Root element must be TASKDATA")

    if root.find("CropZone") is None:
        errors.append("Missing CropZone element")

    crop_zone = root.find("CropZone")
    if crop_zone is not None:
        if crop_zone.find("Task") is None:
            errors.append("Missing Task element in CropZone")

        task = crop_zone.find("Task")
        if task is not None:
            if task.find("TreatmentZone") is None:
                errors.append("Missing TreatmentZone in Task")

    return len(errors) == 0, errors


def _input_type_label(input_type: str) -> str:
    """Convert input type code to human-readable label."""
    labels = {
        "nitrogen": "Nitrogen Fertilizer",
        "potassium": "Potassium Fertilizer",
        "phosphorus": "Phosphorus Fertilizer",
        "herbicide": "Herbicide",
        "fungicide": "Fungicide",
    }
    return labels.get(input_type, input_type.title())
