import numpy as np
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("orbitlens.pipeline.metrics")

def compute_metrics(
    residuals: np.ndarray,
    total_candidates: int,
    coverage_score: float,
    processing_time_ms: float,
    src_meta: Optional[Dict[str, Any]] = None,
    ref_meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes quantitative evaluation metrics according to the PRD & Blueprint standard:
    RMSE, inlier count, inlier ratio, mean/median reprojection residuals, coverage uniformity.
    """
    inlier_count = len(residuals)
    inlier_ratio = float(inlier_count) / float(total_candidates) if total_candidates > 0 else 0.0

    if inlier_count > 0:
        rmse = float(np.sqrt(np.mean(residuals ** 2)))
        mean_err = float(np.mean(residuals))
        median_err = float(np.median(residuals))
    else:
        rmse = 999.0
        mean_err = 999.0
        median_err = 999.0

    # Sun angle delta
    delta_azimuth = None
    delta_elevation = None
    if src_meta and ref_meta:
        src_az = src_meta.get("sunAzimuthDeg")
        ref_az = ref_meta.get("sunAzimuthDeg")
        if src_az is not None and ref_az is not None:
            delta_azimuth = round(abs(float(src_az) - float(ref_az)), 2)

        src_el = src_meta.get("sunElevationDeg")
        ref_el = ref_meta.get("sunElevationDeg")
        if src_el is not None and ref_el is not None:
            delta_elevation = round(abs(float(src_el) - float(ref_el)), 2)

    # Low confidence warning flag for challenging low-texture lunar regions
    confidence_warning = inlier_count < 10 or inlier_ratio < 0.15 or coverage_score < 0.15 or rmse > 3.0

    return {
        "rmse": round(rmse, 4),
        "inlierCount": inlier_count,
        "totalCandidateMatches": total_candidates,
        "inlierRatio": round(inlier_ratio, 4),
        "meanReprojectionError": round(mean_err, 4),
        "medianReprojectionError": round(median_err, 4),
        "coverageUniformityScore": round(coverage_score, 4),
        "processingTimeMs": round(processing_time_ms, 1),
        "sunAngleDeltaAzimuth": delta_azimuth,
        "sunAngleDeltaElevation": delta_elevation,
        "confidenceWarning": confidence_warning,
    }

def format_match_points_geojson(
    src_pts: np.ndarray,
    ref_pts: np.ndarray,
    residuals: np.ndarray
) -> Dict[str, Any]:
    """
    Formats match tie-points into GeoJSON FeatureCollection for frontend map/deep-zoom overlay.
    """
    features = []
    for i in range(len(ref_pts)):
        res = float(residuals[i]) if i < len(residuals) else 0.0
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(ref_pts[i][0]), float(ref_pts[i][1])],
            },
            "properties": {
                "id": i + 1,
                "sourceX": float(src_pts[i][0]),
                "sourceY": float(src_pts[i][1]),
                "referenceX": float(ref_pts[i][0]),
                "referenceY": float(ref_pts[i][1]),
                "reprojectionResidual": round(res, 4),
            },
        }
        features.append(feature)

    return {
        "type": "FeatureCollection",
        "features": features,
    }
