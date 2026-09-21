import cv2
import numpy as np
import logging
from typing import Tuple, Optional
from PIL import Image

logger = logging.getLogger("orbitlens.pipeline.warp")

def warp_source_to_reference(
    src_img: np.ndarray,
    matrix: np.ndarray,
    ref_shape: Tuple[int, int],
    transform_model: str = "homography",
    interpolation: int = cv2.INTER_CUBIC
) -> np.ndarray:
    """
    Sub-pixel resampling of the moving (source) image onto the reference grid.
    ref_shape: (height, width)
    """
    ref_h, ref_w = ref_shape[:2]

    if transform_model.lower() == "affine":
        warped = cv2.warpAffine(
            src_img,
            matrix,
            (ref_w, ref_h),
            flags=interpolation,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=0
        )
    else:
        warped = cv2.warpPerspective(
            src_img,
            matrix,
            (ref_w, ref_h),
            flags=interpolation,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=0
        )

    return warped

def create_preview_composite(
    warped_src: np.ndarray,
    ref_img: np.ndarray,
    inlier_src: np.ndarray,
    inlier_ref: np.ndarray
) -> np.ndarray:
    """
    Generates a 3-channel visual overlay comparison:
    - Red channel: Warped source image
    - Green channel: Reference image
    - Overlaid inlier tie-points in bright cyan/yellow
    """
    h = min(warped_src.shape[0], ref_img.shape[0])
    w = min(warped_src.shape[1], ref_img.shape[1])

    w_src = cv2.resize(warped_src, (w, h))
    r_img = cv2.resize(ref_img, (w, h))

    # Construct false-color overlay (R=source, G=reference, B=average)
    composite = np.zeros((h, w, 3), dtype=np.uint8)
    composite[:, :, 2] = w_src  # Red channel
    composite[:, :, 1] = r_img  # Green channel
    composite[:, :, 0] = ((w_src.astype(np.uint16) + r_img.astype(np.uint16)) // 2).astype(np.uint8)

    # Plot inlier match points
    for pt in inlier_ref:
        px, py = int(pt[0]), int(pt[1])
        if 0 <= px < w and 0 <= py < h:
            cv2.circle(composite, (px, py), 4, (255, 255, 0), -1)  # Cyan circle

    return composite

def save_geotiff(img_array: np.ndarray, output_path: str) -> str:
    """
    Saves the warped array as TIFF.
    """
    if len(img_array.shape) == 2:
        pil_img = Image.fromarray(img_array)
    else:
        pil_img = Image.fromarray(cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB))

    pil_img.save(output_path, format="TIFF", compression="tiff_lzw")
    return output_path
