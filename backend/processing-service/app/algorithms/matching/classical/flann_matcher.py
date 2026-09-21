import cv2
import numpy as np
from typing import Tuple
from app.algorithms.matching.base import Matcher
from app.algorithms.types import FeatureSet

class FLANNMatcher(Matcher):
    def __init__(self, knn=2):
        self.knn = knn
        # FLANN parameters for SIFT (float descriptors)
        index_params = dict(algorithm=1, trees=5) # KDTree
        search_params = dict(checks=50)
        self.flann = cv2.FlannBasedMatcher(index_params, search_params)

    def match(self, feat_src: FeatureSet, feat_ref: FeatureSet) -> Tuple[np.ndarray, Any]:
        if len(feat_src.descriptors) == 0 or len(feat_ref.descriptors) == 0:
            return np.empty((0, 2), dtype=np.int32), []

        # Use knnMatch to allow for Lowe's Ratio Test
        knn_matches = self.flann.knnMatch(feat_src.descriptors, feat_ref.descriptors, k=self.knn)

        valid_matches = []
        scores = []

        for m_set in knn_matches:
            if len(m_set) > 0:
                best = m_set[0]
                valid_matches.append([best.queryIdx, best.trainIdx])
                scores.append(best.distance)

        return np.array(valid_matches, dtype=np.int32), knn_matches
