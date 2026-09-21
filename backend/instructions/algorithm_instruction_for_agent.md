# Algorithm Instructions for Agent — Lunar Image Registration Backend

**Project:** Multi-modal, Sun-angle and scale-invariant image correspondence using Chandrayaan-2 optical images (OHRC, TMC, IIRS)
**Scope of this document:** The *algorithm layer* of the backend only (image processing / CV / DL pipeline). API wiring, DB, auth, storage are out of scope here.
**Audience:** An AI coding agent implementing this in Python.

---

## 0. How to Use This Document

- Treat each numbered stage in Section 3 as an independent, testable module.
- Every module MUST expose a pure function (or small class) with a fixed input/output contract (Section 2) so stages can be composed, swapped, unit-tested, and mocked independently.
- Do not hardcode any algorithm choice as the only option — every stage that lists multiple techniques must be implemented behind a common interface so the "mode" (Basic / Advanced / AI / Detector-Free — Section 6) can select which implementation runs.
- If a stage is already partially implemented, conform its function signature to Section 2's contracts rather than rewriting it, unless it violates the contract.
- Build order is given in Section 9 — follow it; do not jump to deep-learning matchers before classical stages are working and tested, since classical mode is the fallback and the fastest path to a demoable pipeline.

---

## 1. Module & Folder Structure

```
backend/
  app/
    algorithms/
      io/
        loaders.py            # image + metadata loading (TIFF/GeoTIFF/PNG/JPG)
      preprocessing/
        grayscale.py
        denoise.py             # gaussian/median filtering
        contrast.py            # histogram eq, CLAHE, local contrast norm
        normalize.py           # intensity normalization
        resize.py               # resolution normalization
      illumination/
        clahe.py
        gradients.py            # sobel, scharr, laplacian
        edges.py                # canny
        phase_congruency.py
        shadow.py               # shadow detection / confidence maps
      pyramid/
        gaussian_pyramid.py
        laplacian_pyramid.py
        scale_space.py
      features/
        base.py                 # FeatureExtractor interface
        classical/
          sift_extractor.py
          orb_extractor.py
          akaze_extractor.py
          brisk_extractor.py
          rift_extractor.py
        deep/
          superpoint_extractor.py
          disk_extractor.py
          d2net_extractor.py
      matching/
        base.py                 # Matcher interface
        classical/
          bf_matcher.py
          flann_matcher.py
        deep/
          superglue_matcher.py
          lightglue_matcher.py
          loftr_matcher.py       # detector-free, produces matches directly
      filtering/
        ratio_test.py
        cross_check.py
        mutual_nn.py
        geometric_consistency.py
      geometric/
        ransac_estimator.py
        magsac_estimator.py
        transform_models.py      # translation/similarity/affine/homography/TPS
        transform_selector.py    # auto-selects model
      distribution/
        grid_selection.py
        anms.py
        spatial_nms.py
        farthest_point_sampling.py
      registration/
        warp.py
        geospatial_warp.py       # GDAL/rasterio path
      subpixel/
        ecc_refine.py
        phase_correlation.py
        lucas_kanade.py
      evaluation/
        metrics.py               # RMSE, inlier ratio, reprojection error, spatial coverage
        report.py                # assembles the evaluation report object
      pipeline/
        modes.py                 # Basic/Advanced/AI/Detector-Free presets
        orchestrator.py          # runs the full pipeline end-to-end
        config.py                # dataclasses for all stage parameters
    api/                        # (out of scope here)
  tests/
    algorithms/                 # one test module per algorithm module, mirrors structure above
```

Rules:
- Every algorithm family (feature extraction, matching, geometric verification, transform estimation) lives behind an abstract base class (`base.py`) so new algorithms can be added without touching the orchestrator.
- No stage should import from `api/`. Algorithms must be framework-agnostic (no FastAPI objects inside `algorithms/`).

---

## 2. Data Contracts (fix these before writing any stage)

Define these as `dataclasses` or `pydantic` models in `algorithms/pipeline/config.py` and `algorithms/types.py`, and use them everywhere — no stage should invent its own tuple/dict shape.

```python
# Image
Image = np.ndarray            # HxW (grayscale) or HxWx3/4 (color), dtype uint8/uint16/float32
ImageMeta = {
    "path": str,
    "driver": str,             # "gdal" | "pillow"
    "crs": Optional[str],      # for GeoTIFF
    "geotransform": Optional[tuple],
    "sun_azimuth": Optional[float],
    "sun_elevation": Optional[float],
    "resolution_mpp": Optional[float],  # meters per pixel
    "bit_depth": int,
}

# Keypoints & descriptors
Keypoints = np.ndarray         # Nx2 float32, (x, y) in source image pixel coords
Descriptors = np.ndarray       # NxD float32 or uint8 (binary descriptors)
Scores = np.ndarray            # N float32, per-keypoint confidence/response

FeatureSet = {
    "keypoints": Keypoints,
    "descriptors": Descriptors,
    "scores": Scores,
    "scale_level": int,         # which pyramid level these came from
}

# Matches
Matches = np.ndarray           # Mx2 int32, (idx_in_src_keypoints, idx_in_ref_keypoints)
MatchScores = np.ndarray       # M float32, matching confidence/distance

# After geometric verification
InlierMask = np.ndarray        # M bool
Transform = {
    "type": str,                # "translation"|"similarity"|"affine"|"homography"|"piecewise_affine"|"tps"
    "matrix": np.ndarray,        # 2x3 or 3x3, or control points for TPS/piecewise
    "params": dict,
}

# Final evaluation object
EvaluationReport = {
    "rmse": float,
    "inlier_count": int,
    "inlier_ratio": float,
    "reprojection_error_mean": float,
    "reprojection_error_per_point": np.ndarray,
    "spatial_coverage": float,     # 0-1
    "confidence_score": float,     # 0-1, weighted combination
    "registration_success": bool,
    "grid_occupancy": np.ndarray,  # e.g. 8x8 bool/count grid
}
```

Every stage function signature must read as:

```python
def stage_fn(inputs: <TypedInput>, params: <StageParams>) -> <TypedOutput>:
    ...
```

No stage mutates its input in place. Each stage returns a new object plus a small `debug` dict (timings, intermediate counts) for logging/telemetry — do not print inside algorithm modules; return debug info and let the orchestrator/logger handle it.

---

## 3. Stage-by-Stage Instructions

### 3.1 Image I/O & Preprocessing (`io/`, `preprocessing/`)

**Purpose:** Load OHRC/TMC/IIRS/reference images regardless of format, extract metadata, and normalize into a common working representation.

Implement:
- `load_image(path) -> (Image, ImageMeta)`
  - Use `rasterio` for `.tif`/`.tiff`/GeoTIFF (preserves geotransform, CRS, and any embedded sun angle tags if present in metadata/XML sidecar files — Chandrayaan-2 products often ship a `.xml`/`.lbl` label file alongside the image; parse it if present and populate `sun_azimuth`/`sun_elevation`/`resolution_mpp`).
  - Use `Pillow` for PNG/JPEG.
  - Always return a single-band float32 image for algorithm consumption; keep the original alongside for final output rendering.
- `to_grayscale(image) -> Image` — band selection/luminance conversion for multi-band inputs (IIRS is hyperspectral: pick a representative band or PCA-reduce to 1 band; make this a parameter, default = first band or luminance-weighted average for RGB).
- `denoise(image, method="gaussian"|"median", **kwargs) -> Image`
- `equalize(image, method="hist_eq"|"clahe", clip_limit=2.0, tile_grid_size=(8,8)) -> Image`
- `normalize_intensity(image, method="minmax"|"zscore") -> Image` — output float32 in [0,1] for minmax.
- `resize_to_scale(image, target_mpp, current_mpp) -> Image` — resolution normalization using `resolution_mpp` from metadata when available; otherwise expose a manual `scale_factor` param.

**Acceptance criteria:** Given any of the 4 supported formats, `load_image` + `to_grayscale` + `normalize_intensity` produces a float32 image in [0,1] with no NaNs/Infs. Unit test with synthetic arrays plus at least one real sample per format if available.

### 3.2 Illumination-Invariant Representations (`illumination/`)

**Purpose:** Produce a representation that is stable under different sun azimuth/elevation, for use as an *alternative input* to feature extraction (not a replacement for the raw image — keep both, since some detectors work better on raw intensity for craters).

Implement each as `compute_X(image, **params) -> Image` (single-band float32, same H/W as input):
- `sobel_gradient_magnitude`, `scharr_gradient_magnitude`
- `canny_edges(image, low_thresh, high_thresh) -> binary Image`
- `laplacian_response`
- `local_contrast_normalize(image, kernel_size)`
- `phase_congruency(image, nscale=4, norient=6)` — use an existing implementation (e.g. port of Kovesi's phase congruency, or `phasepack` if available) rather than writing from scratch; if no reliable library exists in the environment, mark this as **optional/stretch** and fall back to gradient-based representations.
- `detect_shadow_mask(image, threshold_method="otsu"|"adaptive") -> (mask: Image, confidence: Image)`

**Design decision the agent must make explicit in code comments:** which representation(s) feed the feature extractor for illumination-robust mode. Recommended default: gradient magnitude (Sobel/Scharr) + CLAHE-equalized image, concatenated as extra channels or used to pick keypoints, since this is cheap and well-understood; phase congruency is the "advanced" option gated behind an AI/Advanced mode flag.

### 3.3 Multi-Scale Pyramids (`pyramid/`)

Implement:
- `build_gaussian_pyramid(image, levels=4, downscale=2.0) -> List[Image]`
- `build_laplacian_pyramid(image, levels=4) -> List[Image]`
- `scale_space_extrema(image, sigmas: List[float]) -> List[Image]` (only needed if implementing SIFT from scratch — otherwise rely on OpenCV's internal scale space and skip this).

**Contract:** Pyramid functions return coarsest-to-finest or finest-to-coarsest — pick one order and document it in the docstring (`level 0 = full resolution`); the orchestrator uses this ordering to do coarse-to-fine matching (rough alignment at low res, refine at full res).

### 3.4 Feature Extraction (`features/`)

Define the interface first:

```python
class FeatureExtractor(ABC):
    def extract(self, image: Image, mask: Optional[Image] = None) -> FeatureSet: ...
```

Implement, each as a thin wrapper:
- `SIFTExtractor` — `cv2.SIFT_create()`, expose `n_features`, `contrast_threshold`, `edge_threshold`.
- `ORBExtractor` — `cv2.ORB_create()`.
- `AKAZEExtractor` — `cv2.AKAZE_create()`.
- `BRISKExtractor` — `cv2.BRISK_create()`.
- `RIFTExtractor` — no standard OpenCV binding; implement via phase-congruency-based orientation histograms, or wrap a published reference implementation if one is vendorable. **Mark as stretch goal**; do not block the pipeline on this — SIFT/AKAZE must work first since RIFT specifically targets multi-modal SAR/optical robustness which the deep-learning path (LoFTR/SuperPoint) can substitute for in an "Advanced" mode.
- Deep extractors (`SuperPointExtractor`, `DISKExtractor`, `D2NetExtractor`): wrap pretrained models (via `kornia.feature` where available, e.g. `kornia.feature.SuperPoint`/similar, or a vendored checkpoint). Each must:
  - Accept a torch device param (`"cuda"` if available else `"cpu"`).
  - Normalize the image to the model's expected input range/size internally.
  - Return the same `FeatureSet` contract as classical extractors (convert torch tensors to numpy before returning).

**Acceptance criteria:** For a fixed test image, each extractor returns `keypoints.shape[1] == 2`, `len(keypoints) == len(descriptors) == len(scores)`, and at least 50 keypoints on a 512x512 test crater image.

### 3.5 Feature Matching (`matching/`)

Interface:

```python
class Matcher(ABC):
    def match(self, feat_src: FeatureSet, feat_ref: FeatureSet) -> Tuple[Matches, MatchScores]: ...
```

Implement:
- `BFMatcher` — `cv2.BFMatcher`, distance = Hamming for binary descriptors (ORB/AKAZE/BRISK), L2 for float descriptors (SIFT). Auto-select norm type from descriptor dtype.
- `FlannMatcher` — `cv2.FlannBasedMatcher`, KD-tree params for float descriptors, LSH params for binary.
- Deep matchers (`SuperGlueMatcher`, `LightGlueMatcher`): consume raw keypoints+descriptors (or raw images, for LightGlue's newer API) and return match indices + confidence.
- `LoFTRMatcher` — **detector-free**: input is the two images directly (bypasses `features/` entirely), output is dense correspondences at a coarse grid, refined to fine matches internally by the model. Because this bypasses the standalone feature stage, the orchestrator must special-case detector-free mode (Section 6).

Always return matches sorted by descending confidence.

**Acceptance criteria:** On a synthetic pair (image + known homography-warped version of itself), matcher recovers correct correspondences with >90% precision before any RANSAC filtering.

### 3.6 Match Filtering (`filtering/`)

- `lowes_ratio_test(matches_knn, ratio=0.75) -> Matches` — requires the matcher to return k=2 nearest neighbors upstream; add a `knn_match` mode to `BFMatcher`/`FlannMatcher` for this.
- `cross_check(matches_src_to_ref, matches_ref_to_src) -> Matches` — keep only mutually-best pairs.
- `mutual_nearest_neighbor(...)` — same idea, vectorized over full distance matrix for small feature counts (guard with a size threshold — for >5000 keypoints, fall back to ratio test only to avoid O(N²) blowup).
- `descriptor_distance_threshold(matches, scores, max_distance)`
- `geometric_consistency_filter(kp_src, kp_ref, matches, neighborhood_k=5)` — a lightweight local-neighborhood consistency check (e.g., each match's local displacement should agree with its k nearest spatial neighbors' displacement within a tolerance) — useful as a pre-RANSAC cheap filter to speed up RANSAC by removing obvious outliers first.

**Order of application (default pipeline):** ratio test → cross check → descriptor distance threshold → (geometric consistency filter, optional) → RANSAC. Make this order configurable but ship this as the default.

### 3.7 Geometric Verification (`geometric/`)

- `estimate_ransac(kp_src, kp_ref, matches, model_type, reproj_threshold=3.0, max_iters=2000, confidence=0.99) -> (Transform, InlierMask)` using `cv2.findHomography(..., cv2.RANSAC, ...)` / `cv2.estimateAffinePartial2D` / `cv2.estimateAffine2D` depending on `model_type`.
- `estimate_magsac(...)` — use `cv2.USAC_MAGSAC` flag in `cv2.findHomography`/`findFundamentalMat` (OpenCV ≥4.5 supports `USAC_MAGSAC`, `USAC_ACCURATE`, `USAC_FAST` as flags) instead of hand-rolling MAGSAC++.
- Return both the transform and a boolean inlier mask aligned to the input `matches` array — never silently drop entries, since downstream distribution/evaluation stages need the mask to compute inlier ratio.

**Acceptance criteria:** On the synthetic homography test pair, recovered homography matches the ground-truth matrix within 1e-2 relative error, and inlier ratio ≥ 90%.

### 3.8 Transformation Model Selection (`geometric/transform_models.py`, `transform_selector.py`)

Implement each model as a small class exposing `.fit(src_pts, ref_pts)`, `.apply(pts)`, `.inverse()`:
- `TranslationModel`, `SimilarityModel`, `AffineModel`, `HomographyModel` — all via OpenCV estimators.
- `PiecewiseAffineModel` — `skimage.transform.PiecewiseAffineTransform`.
- `ThinPlateSplineModel` — `skimage.transform.ThinPlateSplineTransform` (or implement TPS via control points + radial basis if not available in the installed `scikit-image` version — check version first).

`select_transform_model(inlier_ratio, spatial_spread, residual_by_model: dict) -> str`:
- Heuristic default: start with Homography if inlier count ≥ 15 and reprojection error is acceptable; fall back to Similarity/Affine if homography is degenerate (near-planar/insufficient parallax) or inlier count is low; escalate to Piecewise Affine/TPS only when residuals after a global model remain high AND matches are spatially well distributed (local deformation is only trustworthy with good coverage — don't fit TPS on 12 clustered points).
- Document this heuristic in the docstring; it is a starting point, not a hard rule — make thresholds configurable in `config.py`.

### 3.9 Uniform Spatial Distribution (`distribution/`)

**Purpose:** ensure the final inlier set used for registration/reporting isn't clustered in one bright, feature-rich region.

- `grid_select(keypoints, scores, image_shape, grid=(8,8), max_per_cell=None, min_per_cell=None) -> selected_indices` — bin keypoints into an 8×8 grid (parametrized), keep top-`k` by score per cell.
- `anms(keypoints, scores, num_to_keep, robustness_ratio=0.9)` — classic adaptive non-maximum suppression: keep a point if it's the strongest in its neighborhood, else suppress; implement via the "minimum suppression radius" algorithm (sort by score, for each point find distance to the nearest higher-scored point, keep the top-N by that distance).
- `spatial_nms(keypoints, scores, radius)` — simple radius-based NMS irrespective of score ranking of neighbors.
- `farthest_point_sampling(keypoints, num_to_keep)` — greedy FPS for maximal spatial spread when score isn't the priority.
- Combine as: `select_uniform_matches(kp_src, kp_ref, inlier_mask, scores, image_shape, grid=(8,8), target_total=200) -> final_indices` — run grid_select first (fast, guarantees coverage), then ANMS within cells if a cell is over-full.

**This stage operates on inliers only** (after Section 3.7), to guarantee the final reported/used matches are both geometrically correct and spatially uniform. Compute `spatial_coverage` (Section 3.11) from this final selected set.

### 3.10 Registration / Warping (`registration/`)

- `warp_image(source_image, transform, output_shape) -> Image` using `cv2.warpAffine` (2x3 matrices) or `cv2.warpPerspective` (3x3 matrices); dispatch based on `transform["type"]`.
- For `PiecewiseAffine`/`TPS`, use the fitted model's own inverse-mapping to build a dense warp field, then `cv2.remap`.
- `geospatial_warp(source_path, transform, reference_meta, output_path)` — for GeoTIFF inputs, use `rasterio`'s `warp` module (or GDAL directly) to produce a georeferenced output that preserves/updates the CRS and geotransform, rather than only warping raw pixel arrays. This path is required when either input carries a valid CRS/geotransform; otherwise fall back to pure pixel-space `warp_image`.

### 3.11 Sub-Pixel Refinement (`subpixel/`)

- `ecc_refine(source_patch, reference_patch, initial_transform, motion_type="euclidean"|"affine"|"homography", n_iters=50, eps=1e-6) -> refined_transform` — wraps `cv2.findTransformECC`.
- `phase_correlation_refine(source_patch, reference_patch) -> (dx, dy)` — wraps `cv2.phaseCorrelate` (already gives sub-pixel shift).
- `lucas_kanade_refine(...)` — `cv2.calcOpticalFlowPyrLK` in "single point, small patch" mode to nudge a point to sub-pixel location, or use it as a sparse local refiner around each matched point independently.
- `refine_point(kp_src, kp_ref, source_image, reference_image, patch_size=21, method="ecc"|"phase_corr"|"lucas_kanade") -> refined_kp_ref (float, sub-pixel)`

**Apply this per-point** on the final uniformly-distributed inlier set (Section 3.9), not on the whole image — extract a small patch around each matched point pair, refine locally, and report the refined coordinate. This is what produces "(125, 250) → (125.37, 250.62)".

### 3.12 Evaluation Metrics (`evaluation/`)

Implement pure functions, each taking the final matches/inliers/transform and returning a scalar or array:

- `compute_rmse(src_pts, ref_pts, transform) -> float` — RMSE of `transform(src_pts)` vs `ref_pts` after refinement.
- `inlier_count(inlier_mask) -> int`
- `inlier_ratio(inlier_mask) -> float` — inliers / total candidate matches (before final uniform-selection pruning, so this reflects match quality, not the pruned display set).
- `reprojection_error(src_pts, ref_pts, transform) -> (mean: float, per_point: np.ndarray)`
- `spatial_coverage(selected_points, image_shape, grid=(8,8)) -> float` — fraction of grid cells containing ≥1 selected point (or a smoother measure like normalized entropy of the per-cell point-count distribution — implement entropy-based version as it rewards *even* spread, not just presence, then document the choice).
- `confidence_score(rmse, inlier_ratio, spatial_coverage, weights=(0.4,0.4,0.2)) -> float` — a documented weighted combination in [0,1]; make weights configurable.
- `registration_success(rmse, inlier_count, inlier_ratio, thresholds) -> bool` — apply the targets from the problem statement: RMSE ≤ 0.5px, inliers ≥ 100 (only enforce this floor when the image pair has enough overlap/texture — expose an `expected_min_inliers` override for small/sparse pairs so this doesn't unfairly fail legitimate low-feature regions), inlier ratio ≥ 75%, spatial coverage ≥ 75%.
- `build_report(...) -> EvaluationReport` — assembles all of the above into the single object defined in Section 2.

---

## 4. Orchestrator (`pipeline/orchestrator.py`)

Single entry point:

```python
def register_images(source_path, reference_path, mode: str, config: PipelineConfig) -> RegistrationResult:
    ...
```

Responsibilities:
1. Load + preprocess both images (3.1).
2. Compute illumination-robust representations if `config.use_illumination_invariant` (3.2).
3. Build pyramids if `config.multiscale.enabled` (3.3); run coarse-to-fine: extract/match at lowest resolution first to get a rough transform, use it to constrain search region at the next level (bounding box around the projected point, not full-frame search) — this both speeds things up and improves robustness to repetitive terrain patterns.
4. Extract features per selected mode (3.4) — or skip if mode is detector-free (LoFTR).
5. Match (3.5).
6. Filter (3.6).
7. Geometric verification + transform model selection (3.7, 3.8).
8. Uniform spatial selection over inliers (3.9).
9. Warp source image (3.10).
10. Sub-pixel refine the final selected points (3.11).
11. Recompute the transform from refined points if `config.recompute_transform_after_subpixel` (recommended: yes, refit using the sub-pixel-refined points for a tighter final transform).
12. Build evaluation report (3.12).
13. Return `RegistrationResult { registered_image, match_points (src+ref, pixel + sub-pixel), inlier/outlier visualization data, transform, evaluation_report }`.

The orchestrator must be resilient: if a stage produces too few features/matches to proceed (e.g. <4 matches for homography), it must return a structured failure (`registration_success=False`, populate whatever partial results exist, and a `failure_reason` string) rather than raising an unhandled exception — the API layer depends on this contract.

---

## 5. Debugging & Visualization Hooks

Even though this is the "algorithm" layer, expose (but don't compute unless asked, to keep the hot path fast):
- `draw_matches(src_image, ref_image, kp_src, kp_ref, inlier_mask) -> Image` (BGR visualization, inliers green / outliers red).
- `draw_grid_occupancy(image_shape, grid_occupancy) -> Image` (heatmap overlay for spatial coverage debugging).
- Per-stage `debug` dict returned alongside outputs: `{"n_keypoints": ..., "n_matches": ..., "elapsed_ms": ...}` so the orchestrator can assemble a stage-by-stage timing/count trace for logging — critical for tuning thresholds later without re-instrumenting code.

---

## 6. Matching Modes (`pipeline/modes.py`)

Implement as named presets that populate `PipelineConfig`, not as separate code paths:

| Mode | Feature Extractor | Matcher | Filtering | Geometric Verification |
|---|---|---|---|---|
| Basic | SIFT | FLANN (knn=2) | Lowe's ratio test | RANSAC (homography) |
| Advanced | SIFT or AKAZE (configurable) | FLANN/BF + cross-check | Ratio test + cross check + geometric consistency | RANSAC or MAGSAC (USAC_MAGSAC) |
| AI | SuperPoint | LightGlue (fallback SuperGlue) | Confidence threshold + mutual NN | MAGSAC |
| Detector-Free | — (LoFTR consumes raw images) | LoFTR | Confidence threshold | MAGSAC |

Every mode still passes through preprocessing, illumination handling, pyramid (if enabled), distribution, warping, sub-pixel refinement, and evaluation identically — only the extractor+matcher+filter+verifier differ. This is the entire point of the interface-based design in Section 1: modes are config, not forked code.

---

## 7. Testing Strategy

For each module in Section 3, write:
1. **Synthetic unit test** — take one real lunar crop, apply a known synthetic transform (rotation + scale + brightness gain/gamma shift to simulate illumination change) to generate a paired "source" image, and assert the pipeline recovers the known transform within tolerance. This is the single most valuable test in the whole project — build it first, before any real multi-modal data, since it fully controls ground truth.
2. **Real-pair smoke test** — once available, run on an actual OHRC/TMC or TMC/reference pair and assert `registration_success` and sane metric ranges (not exact values, since ground truth is unknown).
3. **Degenerate-input test** — near-featureless patch (e.g. flat mare region), extreme illumination difference, and a pair with near-zero overlap — assert graceful structured failure, not a crash.

---

## 8. Non-Functional Requirements for the Agent to Respect

- No stage should assume a specific image size; support arbitrarily large inputs by tiling where needed (OHRC images can be very large — implement a tiled feature-extraction path for `features/` if full-image extraction becomes a memory bottleneck, gated behind a config flag, not built by default until proven necessary).
- All deep-learning components must run on CPU if no GPU is available (check `torch.cuda.is_available()`), just slower — never hard-require CUDA.
- Keep classical-mode dependencies (OpenCV, NumPy, SciPy, scikit-image) fully decoupled from deep-learning dependencies (PyTorch, Kornia) at the import level — deep extractor/matcher modules should lazily import torch inside the module so Basic/Advanced mode can run in an environment without PyTorch installed at all.
- All randomized algorithms (RANSAC family) must accept a `random_state`/seed param for reproducible tests.

---

## 9. Recommended Build Order

1. Data contracts + folder skeleton (Section 1, 2) — even as empty stubs, so every later PR conforms.
2. `io/` + `preprocessing/` (3.1) — get real images loading and normalized.
3. Synthetic-pair test harness (Section 7.1) — build this early; it will be reused for every stage after.
4. Classical feature extraction: SIFT + AKAZE (3.4).
5. Classical matching: FLANN + BF, with ratio test + cross check (3.5, 3.6).
6. RANSAC + homography/affine (3.7, 3.8) — at this point "Basic" and part of "Advanced" mode are functional end-to-end (skip pyramid/illumination/distribution/subpixel for a first vertical slice).
7. Warping (3.10) — close the loop to a visually verifiable registered image.
8. Evaluation metrics (3.12) — so every subsequent change can be measured, not eyeballed.
9. Uniform distribution (3.9) + sub-pixel refinement (3.11) — layer onto the working Basic pipeline.
10. Illumination-invariant preprocessing (3.2) + multi-scale pyramid (3.3) — test specifically against the synthetic illumination-shifted pair.
11. MAGSAC (USAC flags) + transform model auto-selection (3.8 selector).
12. Deep learning path: SuperPoint + LightGlue (AI mode), then LoFTR (Detector-Free mode) — last, since these have the heaviest new dependencies and are the least needed for a first working demo.
13. RIFT / D2-Net / DISK / phase congruency — stretch goals, only if time remains; do not block core deliverables on these.

---

## 10. Open Assumptions (flag/confirm if these are wrong)

- IIRS is treated as multi-band and reduced to a single representative band before feature extraction — confirm which band/combination is scientifically appropriate, since this is a domain decision, not a CV one.
- "Reference image" is assumed to already be roughly geolocated/oriented (i.e., not related to source by an arbitrary unknown rotation of, say, 180°) — if large arbitrary rotations must be supported, feature extractors/matchers need rotation-invariant configurations verified explicitly (SIFT/AKAZE are rotation-invariant by construction; confirm the deep models used are too, or add an explicit rotation-search step).
- Ground-truth transforms for real Chandrayaan-2 pairs are not assumed to exist; evaluation on real data relies on RMSE/reprojection error computed from the estimated transform itself (self-consistency), not an external ground truth, unless one is separately provided.
