"""
ESRI Shapefile export service.

Generates Shapefiles from prescription zones for use in GIS software
and tractor displays that support the format.
"""

import io
import zipfile
import tempfile
from pathlib import Path
from typing import Optional

import geopandas as gpd
import pandas as pd
from shapely.geometry import shape, mapping


def generate_prescription_shapefile(
    zones: list[dict],
    input_type: str,
    prescription_id: str,
) -> bytes:
    """
    Generate an ESRI Shapefile from prescription zones.

    Args:
        zones: List of zone dicts with zone_label, application_rate, geometry
        input_type: Type of input (for layer naming)
        prescription_id: Prescription identifier

    Returns:
        Bytes of a ZIP file containing the shapefile components
    """
    features = []
    for zone in zones:
        geom = zone.get("geometry")
        if geom:
            # If geometry is a GeoJSON dict, convert to shapely
            if isinstance(geom, dict):
                geometry = shape(geom)
            else:
                geometry = geom
        else:
            # Create a placeholder geometry if none provided
            from shapely.geometry import Polygon
            geometry = Polygon()

        features.append({
            "zone_label": zone.get("zone_label", "?"),
            "zone_index": zone.get("zone_index", 0),
            "app_rate": zone.get("application_rate", 0),
            "input_type": input_type,
            "prescription_id": prescription_id,
            "rationale": zone.get("rationale", ""),
            "geometry": geometry,
        })

    if not features:
        raise ValueError("No zones with valid geometry to export")

    # Create GeoDataFrame
    gdf = gpd.GeoDataFrame(features, crs="EPSG:4326")

    # Generate shapefile in memory
    buffer = io.BytesIO()
    with tempfile.TemporaryDirectory() as tmpdir:
        shp_path = Path(tmpdir) / f"prescription_{prescription_id}"
        gdf.to_file(shp_path, driver="ESRI Shapefile", encoding="utf-8")

        # Zip all shapefile components
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for ext in [".shp", ".shx", ".dbf", ".prj", ".cpg"]:
                file_path = Path(tmpdir) / f"prescription_{prescription_id}{ext}"
                if file_path.exists():
                    zf.write(file_path, f"prescription_{prescription_id}{ext}")

    buffer.seek(0)
    return buffer.read()


def generate_field_shapefile(
    field_geometry: dict,
    field_name: str,
    field_id: str,
    zones: Optional[list[dict]] = None,
) -> bytes:
    """
    Generate a Shapefile for field boundaries and optional zones.

    Args:
        field_geometry: GeoJSON geometry of the field
        field_name: Field name
        field_id: Field identifier
        zones: Optional list of zone dicts

    Returns:
        Bytes of a ZIP file containing the shapefile
    """
    features = []

    # Add field boundary
    features.append({
        "name": field_name,
        "feature_type": "field_boundary",
        "id": field_id,
        "geometry": shape(field_geometry),
    })

    # Add zones if provided
    if zones:
        for zone in zones:
            geom = zone.get("geometry")
            if geom:
                features.append({
                    "name": f"Zone {zone.get('zone_label', '?')}",
                    "feature_type": "management_zone",
                    "id": zone.get("zone_id", ""),
                    "geometry": shape(geom) if isinstance(geom, dict) else geom,
                })

    gdf = gpd.GeoDataFrame(features, crs="EPSG:4326")

    buffer = io.BytesIO()
    with tempfile.TemporaryDirectory() as tmpdir:
        shp_path = Path(tmpdir) / f"field_{field_id}"
        gdf.to_file(shp_path, driver="ESRI Shapefile", encoding="utf-8")

        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for ext in [".shp", ".shx", ".dbf", ".prj", ".cpg"]:
                file_path = Path(tmpdir) / f"field_{field_id}{ext}"
                if file_path.exists():
                    zf.write(file_path, f"field_{field_id}{ext}")

    buffer.seek(0)
    return buffer.read()
