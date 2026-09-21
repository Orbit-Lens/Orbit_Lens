from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class MultiscaleConfig:
    enabled: bool = True
    max_levels: int = 6
    downscale: float = 2.0

@dataclass
class PipelineConfig:
    # Mode selection
    mode: str = "basic" # "basic" | "advanced" | "ai" | "detector_free"

    # Preprocessing
    use_illumination_invariant: bool = True
    clahe_clip_limit: float = 2.0

    # Multiscale
    multiscale: MultiscaleConfig = field(default_factory=MultiscaleConfig)

    # Matching & Filtering
    ratio_threshold: float = 0.75
    ransac_threshold: float = 3.0

    # Distribution & Coverage
    coverage_grid: Tuple[int, int] = (8, 8)
    max_per_cell: int = 5

    # Evaluation Targets
    rmse_target: float = 0.5
    inlier_ratio_target: float = 0.75
    coverage_target: float = 0.75

    # Sub-pixel
    recompute_transform_after_subpixel: bool = True
