import cv2
import numpy as np
from typing import Tuple, Optional, Dict, Any
from app.algorithms.types import Transform

class GeometricEstimator:
    @staticmethod
    def estimate(
        src_pts: np.ndarray,
        ref_pts: np.ndarray,
        model_type: str = "homography",
        threshold: float = 3.0,
        method: str = "magsac"
    ) -> Tuple[Optional[Transform], np.ndarray]:
        if len(src_pts) < 4:
            return None, np.zeros(len(src_pts), dtype=bool)
        method_flag = cv2.USAC_MAGSAC if method == "magsac" else cv2.RANSAC
        try:
            if model_type == "homography":
                matrix, mask = cv2.findHomography(src_pts, ref_pts, method_flag, threshold)
            elif model_type == "affine":
                matrix, mask = cv2.estimateAffine2D(src_pts, ref_pts, method_flag, threshold)
            elif model_type == "similarity":
                matrix, mask = cv2.estimateAffinePartial2D(src_pts, ref_pts, method_flag, threshold)
            else:
                raise ValueError(f"Unsupported model_type: {model_type}")
            if matrix is None:
                return None, np.zeros(len(src_pts), dtype=bool)
            mask = mask.astype(bool).flatten() if mask is not None else np.zeros(len(src_pts), dtype=bool)
            return Transform(type=model_type, matrix=matrix), mask
        except Exception as e:
            print(f"Geometric estimation error: {e}")
            return None, np.zeros(len(src_pts), dtype=bool)
