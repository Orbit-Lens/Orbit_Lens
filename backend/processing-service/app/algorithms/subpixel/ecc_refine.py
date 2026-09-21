import cv2
import numpy as np
from typing import Tuple, Optional
from app.algorithms.types import Transform

def refine_transform_ecc(
    src_img: np.ndarray,
    ref_img: np.ndarray,
    initial_transform: Transform,
    motion_type: str = "homography",
    n_iters: int = 50,
    epsilon: float = 1e-6
) -> Transform:
    def to_u8(img):
        if img.dtype != np.uint8:
            return (img * 255).astype(np.uint8) if img.max() <= 1.0 else img.astype(np.uint8)
        return img

    src_u8 = to_u8(src_img)
    ref_u8 = to_u8(ref_img)

    motion_map = {
        "translation": cv2.MOTION_TRANSLATION,
        "euclidean": cv2.MOTION_EUCLIDEAN,
        "affine": cv2.MOTION_AFFINE,
        "homography": cv2.MOTION_HOMOGRAPHY
    }

    motion_model = motion_map.get(motion_type, cv2.MOTION_HOMOGRAPHY)
    matrix = initial_transform.matrix.copy()
    criteria = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, n_iters, epsilon)

    try:
        if motion_model != cv2.MOTION_HOMOGRAPHY:
            matrix = matrix[0:2, 0:3]
        (_, refined_matrix) = cv2.findTransformECC(
            ref_u8, src_u8, matrix, motion_model, criteria
        )
        return Transform(type=motion_type, matrix=refined_matrix)
    except Exception as e:
        print(f"ECC Refinement failed: {e}. Falling back to initial transform.")
        return initial_transform
