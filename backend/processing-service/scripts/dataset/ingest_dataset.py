import os
import xml.etree.ElementTree as ET
import json
import numpy as np
from typing import List, Dict, Any, Optional

def parse_pds4_label(xml_path: str) -> Dict[str, Any]:
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        ns = {'pds': 'http://pds.nasa.gov/PDS4'}
        meta = {
            "sun_azimuth": None,
            "sun_elevation": None,
            "resolution_mpp": None,
            "footprint": {},
            "product_id": os.path.basename(xml_path).replace('.xml', '')
        }
        for elem in root.iter():
            text = elem.text.lower() if elem.text else ""
            tag = elem.tag.lower()
            if "sun_azimuth" in tag:
                meta["sun_azimuth"] = float(elem.text) if elem.text else None
            elif "sun_elevation" in tag:
                meta["sun_elevation"] = float(elem.text) if elem.text else None
            elif "resolution" in tag and "mpp" in tag:
                meta["resolution_mpp"] = float(elem.text) if elem.text else None
        return meta
    except Exception as e:
        print(f"Error parsing {xml_path}: {e}")
        return {}

def build_manifest(dataset_root: str) -> List[Dict[str, Any]]:
    manifest = []
    instruments = ["OHRC-1", "OHRC-2", "OHRC-3", "TMC", "iirs-nci"]
    for inst in instruments:
        inst_path = os.path.join(dataset_root, inst)
        if not os.path.exists(inst_path):
            continue
        print(f"Processing instrument: {inst}...")
        for root, dirs, files in os.walk(inst_path):
            for file in files:
                if file.endswith('.xml') and ('_d_img' in file or '_d_oth' in file):
                    xml_path = os.path.join(root, file)
                    base_name = file.replace('.xml', '')
                    img_path = None
                    for ext in ['.img', '.tif', '.qub']:
                        potential_path = os.path.join(root, base_name + ext)
                        if os.path.exists(potential_path):
                            img_path = potential_path
                            break
                    if img_path:
                        meta = parse_pds4_label(xml_path)
                        meta["instrument"] = inst
                        meta["raw_path"] = img_path
                        meta["label_path"] = xml_path
                        manifest.append(meta)
    return manifest

if __name__ == "__main__":
    DATASET_ROOT = r"C:\Users\SAKTHIVEL  P\Desktop\SIH2026\Orbit_Lens2\backend\datasets"
    print("Starting PDS4 Dataset Ingestion...")
    manifest = build_manifest(DATASET_ROOT)
    output_path = "backend/processing-service/data/manifest.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"Ingestion complete. Found {len(manifest)} products.")
