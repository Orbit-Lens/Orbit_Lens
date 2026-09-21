import os
import xml.etree.ElementTree as ET
import logging
from typing import Dict, Any, Tuple, Optional
import numpy as np
import cv2
from PIL import Image

logger = logging.getLogger("orbitlens.pipeline.ingest")

def parse_pds4_label(label_path: str) -> Dict[str, Any]:
    """
    Parses PDS4 XML label to extract sun azimuth, elevation, resolution, and sensor properties.
    """
    metadata: Dict[str, Any] = {}
    if not os.path.exists(label_path):
        return metadata

    try:
        tree = ET.parse(label_path)
        root = tree.getroot()

        # Search for common PDS4 tags
        for elem in root.iter():
            tag = elem.tag.split('}')[-1].lower()
            if 'sun_azimuth' in tag or 'solar_azimuth' in tag:
                try:
                    metadata['sunAzimuthDeg'] = float(elem.text.strip())
                except Exception:
                    pass
            elif 'sun_elevation' in tag or 'solar_elevation' in tag:
                try:
                    metadata['sunElevationDeg'] = float(elem.text.strip())
                except Exception:
                    pass
            elif 'incidence_angle' in tag:
                try:
                    metadata['incidenceAngleDeg'] = float(elem.text.strip())
                except Exception:
                    pass
            elif 'emission_angle' in tag:
                try:
                    metadata['emissionAngleDeg'] = float(elem.text.strip())
                except Exception:
                    pass
            elif 'phase_angle' in tag:
                try:
                    metadata['phaseAngleDeg'] = float(elem.text.strip())
                except Exception:
                    pass
            elif 'spatial_resolution' in tag or 'pixel_resolution' in tag:
                try:
                    metadata['resolutionMetersPerPixel'] = float(elem.text.strip())
                except Exception:
                    pass
    except Exception as e:
        logger.warning(f"Failed to parse PDS4 label {label_path}: {e}")

    return metadata

def read_raster_image(
    file_path: str,
    max_dimension: Optional[int] = 4096,
    as_gray: bool = True
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    Reads a raster (GeoTIFF, TIFF, PNG, JPG, or PDS4 image) with memory-safe loading.
    If the image exceeds max_dimension, downsamples it while preserving aspect ratio.
    Returns: (image_array_uint8, metadata_dict)
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Image file not found at {file_path}")

    # Check for accompanying PDS4 XML label (e.g. .xml next to .img / .tif)
    base_no_ext = os.path.splitext(file_path)[0]
    xml_candidates = [f"{base_no_ext}.xml", f"{base_no_ext}.XML", f"{file_path}.xml"]
    label_metadata = {}
    for xml_path in xml_candidates:
        if os.path.exists(xml_path):
            label_metadata = parse_pds4_label(xml_path)
            break

    # Read image data
    img = None
    try:
        # First try OpenCV (handles GeoTIFF, standard TIFF, PNG, JPEG)
        read_flag = cv2.IMREAD_GRAYSCALE if as_gray else cv2.IMREAD_COLOR
        img = cv2.imread(file_path, read_flag)
    except Exception:
        pass

    if img is None:
        # Fallback to Pillow
        try:
            with Image.open(file_path) as pil_img:
                if as_gray:
                    pil_img = pil_img.convert("L")
                img = np.array(pil_img)
        except Exception as e:
            raise ValueError(f"Unable to read image at {file_path}: {e}")

    if img is None or img.size == 0:
        raise ValueError(f"Corrupted or empty image at {file_path}")

    # Ensure 8-bit range for feature detectors
    if img.dtype != np.uint8:
        if img.dtype == np.uint16:
            img = (img / 256).astype(np.uint8)
        elif np.issubdtype(img.dtype, np.floating):
            min_v, max_v = img.min(), img.max()
            if max_v > min_v:
                img = ((img - min_v) / (max_v - min_v) * 255.0).astype(np.uint8)
            else:
                img = np.zeros_like(img, dtype=np.uint8)
        else:
            img = cv2.normalize(img, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)

    orig_h, orig_w = img.shape[:2]
    scale_factor = 1.0

    # Downsample if image is excessively large for memory safety
    if max_dimension and (orig_h > max_dimension or orig_w > max_dimension):
        scale_factor = max_dimension / float(max(orig_h, orig_w))
        new_w = int(orig_w * scale_factor)
        new_h = int(orig_h * scale_factor)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        logger.info(f"Downsampled image from ({orig_w}x{orig_h}) to ({new_w}x{new_h}) by factor {scale_factor:.4f}")

    metadata: Dict[str, Any] = {
        "originalWidth": orig_w,
        "originalHeight": orig_h,
        "loadedWidth": img.shape[1],
        "loadedHeight": img.shape[0],
        "channels": 1 if len(img.shape) == 2 else img.shape[2],
        "scaleFactor": scale_factor,
        **label_metadata,
    }

    return img, metadata
