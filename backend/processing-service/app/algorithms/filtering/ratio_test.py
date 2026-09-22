import numpy as np
from typing import Tuple

def lowes_ratio_test(matches: np.ndarray, scores: np.ndarray,
                     all_knn_matches: list, ratio: float = 0.75) -> np.ndarray:
    keep_mask = []
    for m_set in all_knn_matches:
        if len(m_set) >= 2:
            keep_mask.append(m_set[0].distance < ratio * m_set[1].distance)
        elif len(m_set) == 1:
            keep_mask.append(True)
        else:
            keep_mask.append(False)
    mask_arr = np.array(keep_mask, dtype=bool)
    if len(mask_arr) != len(matches):
        if len(mask_arr) > len(matches):
            mask_arr = mask_arr[:len(matches)]
        else:
            padded = np.zeros(len(matches), dtype=bool)
            padded[:len(mask_arr)] = mask_arr
            mask_arr = padded
    return mask_arr

def cross_check_filter(matches: np.ndarray,
                       feat_src_desc: np.ndarray,
                       feat_ref_desc: np.ndarray) -> np.ndarray:
    if len(matches) == 0:
        return np.empty(0, dtype=bool)
    if feat_src_desc is None or feat_ref_desc is None or len(feat_src_desc) == 0 or len(feat_ref_desc) == 0:
        return np.ones(len(matches), dtype=bool)
    import cv2
    mask = np.zeros(len(matches), dtype=bool)
    bf = cv2.BFMatcher(cv2.NORM_L2)
    ref_to_src = bf.match(feat_ref_desc, feat_src_desc)
    # Query is ref (m.queryIdx), Train is src (m.trainIdx)
    # So mapping from ref_idx -> src_idx is lookup[m.queryIdx] = m.trainIdx
    lookup = {m.queryIdx: m.trainIdx for m in ref_to_src}
    for i, (src_idx, ref_idx) in enumerate(matches):
        if ref_idx in lookup and lookup[ref_idx] == src_idx:
            mask[i] = True
    return mask
