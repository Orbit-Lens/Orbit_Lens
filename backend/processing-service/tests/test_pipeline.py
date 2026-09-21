import numpy as np
import cv2
import pytest
from typing import Tuple

from app.pipeline.preprocess import preprocess_image
from app.pipeline.pyramid import build_gaussian_pyramid
from app.pipeline.detectors.classical import extract_classical_features
from app.pipeline.matching import match_descriptors, extract_match_points
from app.pipeline.geometry import estimate_transform
from app.pipeline.coverage import filter_uniform_coverage
from app.pipeline.warp import warp_source_to_reference
from app.pipeline.metrics import compute_metrics

def generate_synthetic_lunar_scene(width: int = 512, height: int = 512) -> np.ndarray:
    """
    Generates a synthetic lunar surface containing craters of various radii,
    elevation gradients, and regolith texture.
    """
    np.random.seed(42)
    img = np.full((height, width), 120, dtype=np.uint8)

    # Add background noise (regolith granularity)
    noise = np.random.normal(0, 8, (height, width))
    img = np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    # Draw synthetic impact craters
    num_craters = 35
    for _ in range(num_craters):
        cx = np.random.randint(40, width - 40)
        cy = np.random.randint(40, height - 40)
        radius = np.random.randint(12, 45)

        # Crater rim (bright sun-facing rim + dark shadow inside)
        cv2.circle(img, (cx, cy), radius, 190, thickness=3)
        cv2.circle(img, (cx, cy), radius - 2, 70, thickness=-1)
        # Inner crater floor
        cv2.circle(img, (cx + 2, cy + 2), max(2, radius // 2), 110, thickness=-1)

    # Smooth to simulate natural orbital optics
    img = cv2.GaussianBlur(img, (3, 3), 0)
    return img

@pytest.fixture
def synthetic_image_pair() -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Creates a fixed reference image and a moving source image transformed with
    a known ground-truth affine warp (rotation 4.5 deg, scale 1.05, translation dx=15, dy=-10).
    """
    ref_img = generate_synthetic_lunar_scene(512, 512)

    # Known ground truth transformation matrix
    center = (256.0, 256.0)
    angle = 4.5
    scale = 1.05
    M = cv2.getRotationMatrix2D(center, angle, scale)
    M[0, 2] += 15.0
    M[1, 2] -= 10.0

    # Warp to produce source image
    src_img = cv2.warpAffine(ref_img, M, (512, 512), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

    return src_img, ref_img, M

def test_preprocessing(synthetic_image_pair):
    src_img, ref_img, _ = synthetic_image_pair
    preprocessed = preprocess_image(src_img, illumination_correction=True, denoise=True)
    assert preprocessed.shape == src_img.shape
    assert preprocessed.dtype == np.uint8

def test_pyramid_construction(synthetic_image_pair):
    src_img, _, _ = synthetic_image_pair
    pyramid = build_gaussian_pyramid(src_img, levels=3)
    assert len(pyramid) == 3
    assert pyramid[0][0].shape == (512, 512)
    assert pyramid[1][0].shape == (256, 256)
    assert pyramid[2][0].shape == (128, 128)

def test_end_to_end_registration_accuracy(synthetic_image_pair):
    """
    Tests the complete registration pipeline on the synthetic fixture
    and asserts sub-pixel RMSE accuracy (target <= 1.0 px).
    """
    src_img, ref_img, gt_matrix = synthetic_image_pair

    # 1. Preprocess
    src_clean = preprocess_image(src_img)
    ref_clean = preprocess_image(ref_img)

    # 2. Extract SIFT features
    kp_src, desc_src = extract_classical_features(src_clean, method="sift")
    kp_ref, desc_ref = extract_classical_features(ref_clean, method="sift")

    assert len(kp_src) > 50
    assert len(kp_ref) > 50

    # 3. Match
    matches = match_descriptors(desc_src, desc_ref, ratio_threshold=0.80)
    src_pts, ref_pts = extract_match_points(kp_src, kp_ref, matches)

    assert len(src_pts) >= 15

    # 4. Estimate Geometry
    matrix, inlier_mask, inlier_src, inlier_ref, residuals = estimate_transform(
        src_pts,
        ref_pts,
        transform_model="affine",
        ransac_threshold=2.5,
    )

    assert matrix is not None
    assert len(inlier_src) >= 10

    raw_inlier_ratio = float(len(inlier_src)) / float(len(src_pts))
    assert raw_inlier_ratio > 0.50, f"Raw inlier ratio {raw_inlier_ratio} was too low"

    # 5. Uniform Coverage Filtering
    filt_src, filt_ref, inlier_res, coverage_score = filter_uniform_coverage(
        inlier_src,
        inlier_ref,
        residuals[inlier_mask],
        ref_width=512,
        ref_height=512,
        target_cells=36,
    )

    assert len(filt_src) > 0
    assert coverage_score > 0.0

    # 6. Compute Metrics
    metrics = compute_metrics(
        inlier_res,
        total_candidates=len(src_pts),
        coverage_score=coverage_score,
        processing_time_ms=50.0,
    )

    print(f"\n[Test Result] Registration RMSE: {metrics['rmse']:.3f} px | Inliers: {metrics['inlierCount']} | Coverage: {metrics['coverageUniformityScore']}")

    # Assert sub-pixel RMSE target (RMSE <= 1.0 px)
    assert metrics["rmse"] <= 1.0, f"RMSE {metrics['rmse']} exceeded sub-pixel threshold 1.0px"
    assert metrics["rmse"] < 0.20  # Sub-pixel accuracy achieved!
    assert metrics["coverageUniformityScore"] >= 0.50

    # 7. Warp
    warped = warp_source_to_reference(src_img, matrix, (512, 512), transform_model="affine")
    assert warped.shape == ref_img.shape
