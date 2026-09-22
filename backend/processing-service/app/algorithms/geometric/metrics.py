import numpy as np
from typing import Tuple, List
from app.algorithms.types import Transform

def compute_reprojection_error(src_pts: np.ndarray, ref_pts: np.ndarray, transform: Transform) -> np.ndarray:
    if len(src_pts) == 0:
        return np.array([])
    M = transform.matrix
    ones = np.ones((src_pts.shape[0], 1))
    src_h = np.hstack([src_pts, ones])
    if M.shape == (2, 3):
        projected = (M @ src_h.T).T
    else:
        projected_h = (M @ src_h.T).T
        w = projected_h[:, 2:3]
        w[w == 0] = 1e-8
        projected = projected_h[:, :2] / w
    errors = np.linalg.norm(projected - ref_pts, axis=1)
    return errors
