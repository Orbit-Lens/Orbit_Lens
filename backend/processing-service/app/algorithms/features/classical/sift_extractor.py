import cv2
import numpy as np
from typing import Optional
from app.algorithms.features.base import FeatureExtractor
from app.algorithms.types import FeatureSet

class SIFTExtractor(FeatureExtractor):
    def __init__(self, n_features: int = 0, contrast_threshold: float = 0.04, edge_threshold: float = 10.0):
        self.sift = cv2.SIFT_create(
            nfeatures=n_features,
            contrastThreshold=contrast_threshold,
            edgeThreshold=edge_threshold
        )

    def extract(self, image: np.ndarray, mask: Optional[np.ndarray] = None) -> FeatureSet:
        # Ensure image is uint8 for SIFT
        if image.dtype != np.uint8:
            img_u8 = (image * 255).astype(np.uint8) if image.max() <= 1.0 else image.astype(np.uint8)
        else:
            img_u8 = image

        kp, desc = self.sift.detectAndCompute(img_u8, mask)

        if kp is None or len(kp) == 0:
            return FeatureSet(
                keypoints=np.empty((0, 2), dtype=np.float32),
                descriptors=np.empty((0, 128), dtype=np.float32),
                scores=np.empty((0,), dtype=np.float32)
            )

        # Convert cv2.KeyPoint to numpy array [N, 2]
        keypoints = np.float32([k.pt for k in kp])
        # SIFT descriptors are already numpy [N, 128]
        descriptors = desc.astype(np.float32)
        # Use response as score
        scores = np.float32([k.response for k in kp])

        return FeatureSet(
            keypoints=keypoints,
            descriptors=descriptors,
            scores=scores
        )
