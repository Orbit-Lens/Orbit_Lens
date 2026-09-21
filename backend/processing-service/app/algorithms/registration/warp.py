import cv2
import numpy as np
from typing import Tuple, Optional
from app.algorithms.types import Transform

def warp_source_to_reference(
    source_img: np.ndarray,
    transform: Transform,
    ref_shape: Tuple[int, int],
    interpolation: int = cv2.INTER_CUBIC
) -> np.ndarray:
    \"\"\"
    Warps the source image to the reference image's coordinate system.
    \"\"\"
    # transform.matrix is the Homography matrix (3x3)
    # ref_shape is (height, width)

    warped = cv2.warpPerspective(
        source_img,
        transform.matrix,
        (ref_shape[1], ref_shape[0]),
        flags=interpolation
    )

    return warped

def create_preview_composite(
    warped_src: np.ndarray,
    ref_img: np.ndarray,
    src_pts: np.ndarray,
    ref_pts: np.ndarray,
    alpha: float = 0.5
) -> np.ndarray:
    \"\"\"
    Creates a visual overlay for debugging:
    - Background: Blended warped_src and ref_img
    - Overlay: Match points connected by lines
    \"\"\"
    # Blend images
    composite = cv2.addWeighted(warped_src, alpha, ref_img, 1 - alpha, 0)

    # Convert to BGR for colorful lines
    composite_bgr = cv2.cvtColor(composite, cv2.COLOR_GRAY2BGR)

    # Draw matches
    for s, r in zip(src_pts, ref_pts):
        # We draw on the reference image coordinates
        # s is the point in source, r is the point in reference
        # For the preview, we just want to see if they align
        cv2.line(composite_bgr, tuple(r.astype(int)), tuple(r.astype(int)), (0, 255, 0), 1)
        cv2.circle(composite_bgr, tuple(r.astype(int)), 2, (0, 0, 255), -1)

    return composite_bgr
