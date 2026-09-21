import numpy as np
from typing import Tuple, List

def grid_select_inliers(
    src_pts: np.ndarray,
    ref_pts: np.ndarray,
    inlier_mask: np.ndarray,
    image_shape: Tuple[int, int],
    grid: Tuple[int, int] = (8, 8),
    max_per_cell: int = 5
) -> np.ndarray:
    h, w = image_shape
    rows, cols = grid
    cell_h, cell_w = h / rows, w / cols
    inliers_src = src_pts[inlier_mask]
    inliers_ref = ref_pts[inlier_mask]
    original_indices = np.where(inlier_mask)[0]
    if len(inliers_src) == 0:
        return np.array([], dtype=np.int32)
    cell_indices = (
        (inliers_ref[:, 1] // cell_h).astype(int),
        (inliers_ref[:, 0] // cell_w).astype(int)
    )
    cell_indices = (
        np.clip(cell_indices[0], 0, rows - 1),
        np.clip(cell_indices[1], 0, cols - 1)
    )
    selected_indices = []
    for r in range(rows):
        for c in range(cols):
            cell_mask = (cell_indices[0] == r) & (cell_indices[1] == c)
            cell_pts_indices = np.where(cell_mask)[0]
            if len(cell_pts_indices) > 0:
                count = min(len(cell_pts_indices), max_per_cell)
                selected_indices.extend(cell_pts_indices[:count])
    return original_indices[selected_indices].astype(np.int32)

def compute_spatial_coverage(selected_pts: np.ndarray, image_shape: Tuple[int, int], grid: Tuple[int, int] = (8, 8)) -> float:
    if len(selected_pts) == 0:
        return 0.0
    h, w = image_shape
    rows, cols = grid
    cell_h, cell_w = h / rows, w / cols
    cell_indices = (
        np.clip((selected_pts[:, 1] // cell_h).astype(int), 0, rows - 1),
        np.clip((selected_pts[:, 0] // cell_w).astype(int), 0, cols - 1)
    )
    unique_cells = set(zip(cell_indices[0], cell_indices[1]))
    return len(unique_cells) / (rows * cols)
