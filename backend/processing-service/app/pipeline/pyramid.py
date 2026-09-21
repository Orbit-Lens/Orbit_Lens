import cv2
import numpy as np
import logging
from typing import List, Tuple, Optional

logger = logging.getLogger("orbitlens.pipeline.pyramid")

def calculate_pyramid_levels(
    source_res: Optional[float],
    ref_res: Optional[float],
    max_levels: int = 4
) -> Tuple[int, float]:
    """
    Computes number of pyramid levels and initial scale bridging factor
    from sensor spatial resolutions (e.g., OHRC 0.25m vs TMC 5.0m -> ratio 20x).
    """
    if source_res and ref_res and source_res > 0 and ref_res > 0:
        scale_ratio = ref_res / source_res
        # Compute how many octaves bridge this ratio
        levels = min(max_levels, max(1, int(np.round(np.log2(abs(scale_ratio)) + 1))))
        return levels, scale_ratio

    return max_levels, 1.0

def build_gaussian_pyramid(
    img: np.ndarray,
    levels: int = 4
) -> List[Tuple[np.ndarray, float]]:
    """
    Constructs a Gaussian image pyramid.
    Returns: list of (level_image, scale_factor_relative_to_original)
    """
    pyramid = [(img, 1.0)]
    current = img

    for level in range(1, levels):
        # Downsample by 2x
        current = cv2.pyrDown(current)
        scale = 1.0 / (2.0 ** level)
        pyramid.append((current, scale))

    return pyramid
