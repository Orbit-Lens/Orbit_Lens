import cv2
import numpy as np
import logging
from typing import Tuple, List, Optional

logger = logging.getLogger("orbitlens.pipeline.detectors.classical")

def extract_sift_features(
    img: np.ndarray,
    n_features: int = 8000,
    contrast_threshold: float = 0.02,
    edge_threshold: float = 15.0
) -> Tuple[List[cv2.KeyPoint], np.ndarray]:
    """
    Extracts SIFT (Scale-Invariant Feature Transform) keypoints and descriptors.
    Optimized for lunar craters with reduced contrast threshold to catch subtle shadow boundaries.
    """
    sift = cv2.SIFT_create(
        nfeatures=n_features,
        contrastThreshold=contrast_threshold,
        edgeThreshold=edge_threshold,
        sigma=1.6
    )
    keypoints, descriptors = sift.detectAndCompute(img, None)
    if descriptors is None:
        descriptors = np.empty((0, 128), dtype=np.float32)
    return keypoints, descriptors

def extract_akaze_features(
    img: np.ndarray,
    threshold: float = 0.0008
) -> Tuple[List[cv2.KeyPoint], np.ndarray]:
    """
    Extracts AKAZE nonlinear scale space features, robust to high shadow contrast.
    """
    akaze = cv2.AKAZE_create(threshold=threshold)
    keypoints, descriptors = akaze.detectAndCompute(img, None)
    if descriptors is None:
        descriptors = np.empty((0, 64), dtype=np.uint8)
    return keypoints, descriptors

def extract_orb_features(
    img: np.ndarray,
    n_features: int = 8000
) -> Tuple[List[cv2.KeyPoint], np.ndarray]:
    """
    Fast binary feature extraction via ORB.
    """
    orb = cv2.ORB_create(nfeatures=n_features, scoreType=cv2.ORB_HARRIS_SCORE)
    keypoints, descriptors = orb.detectAndCompute(img, None)
    if descriptors is None:
        descriptors = np.empty((0, 32), dtype=np.uint8)
    return keypoints, descriptors

def extract_classical_features(
    img: np.ndarray,
    method: str = "sift"
) -> Tuple[List[cv2.KeyPoint], np.ndarray]:
    if method.lower() == "sift":
        return extract_sift_features(img)
    elif method.lower() == "akaze":
        return extract_akaze_features(img)
    elif method.lower() == "orb":
        return extract_orb_features(img)
    else:
        return extract_sift_features(img)
