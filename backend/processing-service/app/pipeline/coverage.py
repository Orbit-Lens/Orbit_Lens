import numpy as np
import logging
from typing import Tuple, List, Dict, Any

logger = logging.getLogger("orbitlens.pipeline.coverage")

def filter_uniform_coverage(
    inlier_src: np.ndarray,
    inlier_ref: np.ndarray,
    residuals: np.ndarray,
    ref_width: int,
    ref_height: int,
    target_cells: int = 64,
    max_points_per_cell: int = 5
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, float]:
    """
    Enforces spatial uniformity across the reference frame:
    1. Divides the reference image into an NxN spatial grid.
    2. In each grid cell, keeps at most `max_points_per_cell` with the lowest reprojection residual.
    3. Computes the coverage distribution score (fraction of active cells).
    """
    if len(inlier_ref) == 0 or ref_width <= 0 or ref_height <= 0:
        return (
            np.empty((0, 2), dtype=np.float32),
            np.empty((0, 2), dtype=np.float32),
            np.empty(0, dtype=np.float32),
            0.0,
        )

    grid_side = int(np.sqrt(target_cells)) or 8
    cell_w = ref_width / float(grid_side)
    cell_h = ref_height / float(grid_side)

    # Bin points into grid cells
    cell_bins: Dict[Tuple[int, int], List[int]] = {}

    for idx, (rx, ry) in enumerate(inlier_ref):
        cx = int(min(grid_side - 1, max(0, rx // cell_w)))
        cy = int(min(grid_side - 1, max(0, ry // cell_h)))
        cell = (cx, cy)
        if cell not in cell_bins:
            cell_bins[cell] = []
        cell_bins[cell].append(idx)

    selected_indices: List[int] = []
    occupied_cells = len(cell_bins)

    for cell, indices in cell_bins.items():
        # Sort by residual ascending (lowest error first)
        sorted_indices = sorted(indices, key=lambda i: residuals[i] if i < len(residuals) else 0.0)
        selected_indices.extend(sorted_indices[:max_points_per_cell])

    selected_indices = sorted(selected_indices)

    filtered_src = inlier_src[selected_indices]
    filtered_ref = inlier_ref[selected_indices]
    filtered_res = residuals[selected_indices] if len(residuals) > 0 else np.empty(0, dtype=np.float32)

    coverage_score = float(occupied_cells) / float(grid_side * grid_side)
    coverage_score = round(min(1.0, max(0.0, coverage_score)), 4)

    logger.info(f"Uniform coverage filtering: {len(inlier_ref)} -> {len(filtered_ref)} points across {occupied_cells}/{grid_side*grid_side} cells (Score: {coverage_score})")

    return filtered_src, filtered_ref, filtered_res, coverage_score
