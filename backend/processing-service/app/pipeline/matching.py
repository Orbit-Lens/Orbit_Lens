import cv2
import numpy as np
import logging
from typing import List, Tuple

logger = logging.getLogger("orbitlens.pipeline.matching")

def match_descriptors(
    desc_src: np.ndarray,
    desc_ref: np.ndarray,
    ratio_threshold: float = 0.75,
    norm_type: int = cv2.NORM_L2
) -> List[cv2.DMatch]:
    """
    Performs k-NN (k=2) nearest-neighbor search with Lowe's ratio test.
    """
    if desc_src is None or desc_ref is None or len(desc_src) < 2 or len(desc_ref) < 2:
        return []

    # Choose matcher based on norm
    if norm_type == cv2.NORM_HAMMING:
        matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    else:
        # FLANN matcher for high-dimensional floating point descriptors
        index_params = dict(algorithm=1, trees=5)  # KDTree
        search_params = dict(checks=50)
        matcher = cv2.FlannBasedMatcher(index_params, search_params)

    try:
        raw_matches = matcher.knnMatch(desc_src.astype(np.float32), desc_ref.astype(np.float32), k=2)
    except Exception as e:
        logger.warning(f"FLANN matching failed ({e}), trying standard BFMatcher...")
        bf = cv2.BFMatcher(norm_type)
        raw_matches = bf.knnMatch(desc_src, desc_ref, k=2)

    good_matches = []
    for match_pair in raw_matches:
        if len(match_pair) == 2:
            m, n = match_pair
            if m.distance < ratio_threshold * n.distance:
                good_matches.append(m)

    return good_matches

def extract_match_points(
    kp_src: List[cv2.KeyPoint],
    kp_ref: List[cv2.KeyPoint],
    matches: List[cv2.DMatch],
    scale_src: float = 1.0,
    scale_ref: float = 1.0
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Extracts 2D coordinate arrays (Nx2) in original image pixel coordinate space.
    """
    if not matches:
        return np.empty((0, 2), dtype=np.float32), np.empty((0, 2), dtype=np.float32)

    src_pts = np.float32([kp_src[m.queryIdx].pt for m in matches]) / scale_src
    ref_pts = np.float32([kp_ref[m.trainIdx].pt for m in matches]) / scale_ref

    return src_pts, ref_pts
