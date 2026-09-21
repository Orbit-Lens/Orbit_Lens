import cv2
import numpy as np
import logging
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger("orbitlens.pipeline.geometry")

def estimate_transform(
    src_pts: np.ndarray,
    ref_pts: np.ndarray,
    transform_model: str = "homography",
    ransac_threshold: float = 3.0,
    max_iters: int = 5000,
    confidence: float = 0.999
) -> Tuple[Optional[np.ndarray], np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Fits an Affine or Homography geometric transform using RANSAC / USAC_MAGSAC.
    Returns:
      (matrix, inlier_mask, inlier_src_pts, inlier_ref_pts, residuals)
    """
    if len(src_pts) < 4:
        logger.warning(f"Insufficient points for geometric estimation: {len(src_pts)} points")
        return (
            None,
            np.zeros(len(src_pts), dtype=bool),
            np.empty((0, 2), dtype=np.float32),
            np.empty((0, 2), dtype=np.float32),
            np.empty(0, dtype=np.float32),
        )

    matrix = None
    inliers = None

    if transform_model.lower() == "affine":
        # Estimate 2x3 Affine Transform
        matrix, inliers = cv2.estimateAffine2D(
            src_pts,
            ref_pts,
            method=cv2.RANSAC,
            ransacReprojThreshold=ransac_threshold,
            maxIters=max_iters,
            confidence=confidence,
        )
    else:
        # Estimate 3x3 Homography Matrix with USAC_MAGSAC if available, else RANSAC
        ransac_method = getattr(cv2, 'USAC_MAGSAC', cv2.RANSAC)
        matrix, inliers = cv2.findHomography(
            src_pts,
            ref_pts,
            method=ransac_method,
            ransacReprojThreshold=ransac_threshold,
            maxIters=max_iters,
            confidence=confidence,
        )

    if matrix is None or inliers is None:
        logger.warning("RANSAC geometric fitting failed to find a valid transform.")
        return (
            None,
            np.zeros(len(src_pts), dtype=bool),
            np.empty((0, 2), dtype=np.float32),
            np.empty((0, 2), dtype=np.float32),
            np.empty(0, dtype=np.float32),
        )

    inlier_mask = inliers.ravel().astype(bool)
    inlier_src = src_pts[inlier_mask]
    inlier_ref = ref_pts[inlier_mask]

    # Compute Euclidean reprojection residuals for all points
    residuals = compute_reprojection_residuals(src_pts, ref_pts, matrix, transform_model)

    return matrix, inlier_mask, inlier_src, inlier_ref, residuals

def compute_reprojection_residuals(
    src_pts: np.ndarray,
    ref_pts: np.ndarray,
    matrix: np.ndarray,
    transform_model: str = "homography"
) -> np.ndarray:
    """
    Computes Euclidean distance between mapped source points and target reference points.
    """
    if len(src_pts) == 0 or matrix is None:
        return np.empty(0, dtype=np.float32)

    src_homo = np.hstack([src_pts, np.ones((len(src_pts), 1), dtype=np.float32)])

    if transform_model.lower() == "affine":
        # Matrix is 2x3 -> mapped = (2x3) @ (3xN) -> 2xN
        mapped_pts = (matrix @ src_homo.T).T
    else:
        # Matrix is 3x3 -> mapped = (3x3) @ (3xN) -> 3xN
        projected = (matrix @ src_homo.T).T
        # Normalize homogeneous coordinate (w = projected[:, 2])
        w = projected[:, 2:3]
        w[w == 0] = 1e-7
        mapped_pts = projected[:, :2] / w

    diff = mapped_pts - ref_pts
    residuals = np.sqrt(np.sum(diff ** 2, axis=1))
    return residuals.astype(np.float32)
