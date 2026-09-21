from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List, Tuple, Union
import numpy as np

@dataclass
class ImageMeta:
    path: str
    driver: str = "gdal"
    crs: Optional[str] = None
    geotransform: Optional[Tuple] = None
    sun_azimuth: Optional[float] = None
    sun_elevation: Optional[float] = None
    resolution_mpp: Optional[float] = None
    bit_depth: int = 8

@dataclass
class FeatureSet:
    keypoints: np.ndarray  # Nx2 float32 (x, y)
    descriptors: np.ndarray # NxD float32 or uint8
    scores: np.ndarray    # N float32
    scale_level: int = 0

@dataclass
class Transform:
    type: str  # "translation"|"similarity"|"affine"|"homography"|"tps"
    matrix: np.ndarray
    params: Dict[str, Any] = field(default_factory=dict)

@dataclass
class EvaluationReport:
    rmse: float
    inlier_count: int
    inlier_ratio: float
    reprojection_error_mean: float
    reprojection_error_per_point: np.ndarray
    spatial_coverage: float
    confidence_score: float
    registration_success: bool
    grid_occupancy: np.ndarray
