import cv2
import numpy as np
import os
import json
import random
from typing import Tuple, Dict, Any

def create_synthetic_pair(image_path: str, output_dir: str, pair_id: str,
                          rotation: float = None, scale: float = None,
                          tx: float = None, ty: float = None,
                          brightness_shift: float = None):
    \"\"\"
    Generates a source-reference pair with a known ground-truth transformation.
    \"\"\"
    # Load image
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Could not load image at {image_path}")

    h, w = img.shape

    # 1. Define transformation parameters
    rot = rotation if rotation is not None else random.uniform(-15, 15)
    scl = scale if scale is not None else random.uniform(0.8, 1.2)
    dx = tx if tx is not None else random.uniform(-20, 20)
    dy = ty if ty is not None else random.uniform(-20, 20)

    # 2. Compute Homography Matrix (Ground Truth)
    # Center of image
    cx, cy = w // 2, h // 2

    # Rotation and scale matrix
    M_rot_scale = cv2.getRotationMatrix2D((cx, cy), rot, scl)

    # Add translation
    M_rot_scale[0, 2] += dx
    M_rot_scale[1, 2] += dy

    # Convert 2x3 to 3x3 Homography
    H = np.eye(3)
    H[0:2, :] = M_rot_scale

    # 3. Warp image to create the "Source" image
    # We warp the original (Reference) to create a distorted version (Source)
    source_img = cv2.warpPerspective(img, H, (w, h), flags=cv2.INTER_CUBIC)

    # 4. Apply synthetic illumination change (Brightness/Contrast)
    if brightness_shift is not None:
        # Simple linear shift: I' = alpha*I + beta
        source_img = cv2.convertScaleAbs(source_img, alpha=1.0, beta=brightness_shift)
    else:
        shift = random.uniform(-20, 20)
        source_img = cv2.convertScaleAbs(source_img, alpha=1.0, beta=shift)

    # 5. Save results
    os.makedirs(output_dir, exist_ok=True)
    src_path = os.path.join(output_dir, f\"{pair_id}_src.tif\")
    ref_path = os.path.join(output_dir, f\"{pair_id}_ref.tif\")

    cv2.imwrite(src_path, source_img)
    cv2.imwrite(ref_path, img)

    return {
        \"pair_id\": pair_id,
        \"source\": src_path,
        \"reference\": ref_path,
        \"ground_truth_h\": H.tolist(),
        \"params\": {
            \"rotation\": rot,
            \"scale\": scl,
            \"translation\": [dx, dy]
        }
    }

if __name__ == \"__main__\":
    # This is a placeholder for the harness.
    # In a real scenario, we would pass a path to a real lunar image.
    print(\"Synthetic Pair Generator initialized. Please run via the validation harness.\")
