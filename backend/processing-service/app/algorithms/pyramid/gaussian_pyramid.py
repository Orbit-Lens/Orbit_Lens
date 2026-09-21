import cv2
import numpy as np
from typing import List, Tuple

def build_gaussian_pyramid(image: np.ndarray, levels: int = 4, downscale: float = 2.0) -> List[Tuple[np.ndarray, float]]:
    pyramid = []
    current_img = image.copy()
    current_scale = 1.0
    for i in range(levels):
        pyramid.append((current_img, current_scale))
        w = int(current_img.shape[1] / downscale)
        h = int(current_img.shape[0] / downscale)
        if w < 16 or h < 16:
            break
        current_img = cv2.resize(current_img, (w, h), interpolation=cv2.INTER_AREA)
        current_scale /= downscale
    return pyramid
