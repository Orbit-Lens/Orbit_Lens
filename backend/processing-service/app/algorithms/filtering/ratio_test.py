import numpy as np
from typing import Tuple

def lowes_ratio_test(matches: np.ndarray, scores: np.ndarray,
                     all_knn_matches: list, ratio: float = 0.75) -> np.ndarray:
    keep_mask = []
    for i, m_set in enumerate(all_knn_matches):
        if len(m_set) >= 2:
            dist1 = m_set[0].distance
            dist2 = m_set[1].distance
            keep_mask.append(dist1 < ratio * dist2)
        else:
            keep_mask.append(False)
    return np.array(keep_mask, dtype=bool)

def cross_check_filter(matches: np.ndarray,
                       feat_src_desc: np.ndarray,
                       feat_ref_desc: np.ndarray) -> np.ndarray:
    import cv2
    mask = np.zeros(len(matches), dtype=bool)
    bf = cv2.BFMatcher(cv2.NORM_L2)
    ref_to_src = bf.match(feat_ref_desc, feat_src_desc)
    lookup = {}
    for m in ref_to_src:
        lookup[m.trainIdx] = m.queryIdx
    for i, (src_idx, ref_idx) in enumerate(matches):
        if ref_idx in lookup and lookup[ref_idx] == src_idx:
            mask[i] = True
    return mask
