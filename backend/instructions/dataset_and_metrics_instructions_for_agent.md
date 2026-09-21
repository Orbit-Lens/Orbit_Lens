# Dataset Usage & Metrics-Compliant Build Guide for Agent

**Companion document to:** `algorithm_instruction_for_agent.md` (algorithm layer) and `ALGORITHM_NOTES.md` (math spec).
**Purpose of this document:** tell the agent exactly how to turn the datasets you've downloaded into working test/validation pairs, and how to build + validate every stage so the pipeline is measured against the problem statement's actual target metrics — not just "does it run."

Read this alongside the other two files. Where `ALGORITHM_NOTES.md` and the problem statement disagree on a number (flagged in Section 3), **this document's Section 3 table is the one to implement against** — treat `ALGORITHM_NOTES.md`'s figure as a documented fallback, not the primary target.

---

## 1. Dataset Ingestion — What You Actually Have

Chandrayaan-2 data from PRADAN / chmapbrowse is delivered as **PDS4** products: a raster file (commonly `.img`, sometimes `.tif`) plus a companion **XML label** (`*.xml`) that carries the metadata GDAL/rasterio won't infer on its own — sun azimuth, sun elevation, spacecraft altitude, spatial resolution, and the footprint/corner coordinates. Do not treat the label file as optional metadata to skip: **sun angle and resolution, which the whole illumination/scale-invariance design depends on, live in this file, not in the raster itself.**

### 1.1 Required ingestion step before anything else

Build a **dataset manifest** step that runs once over whatever you've downloaded and produces a structured index — do not let later stages re-parse raw folders ad hoc.

```
data/
  raw/
    ohrc/       <- as downloaded, unmodified (product + label pairs)
    tmc/
    iirs/
    reference/  <- any external basemap you're using as ground truth reference (see 1.4)
  manifest.json  <- built by the ingestion script, one entry per product
```

`manifest.json` entry schema (one per raster):

```json
{
  "product_id": "string, from the PDS4 label's logical_identifier",
  "instrument": "OHRC | TMC2 | IIRS",
  "raw_path": "path to .img/.tif",
  "label_path": "path to .xml, if present",
  "resolution_mpp": float,
  "sun_azimuth_deg": float,
  "sun_elevation_deg": float,
  "footprint": {"lat_min": ..., "lat_max": ..., "lon_min": ..., "lon_max": ...},
  "acquisition_time_utc": "string",
  "bands": int,
  "converted_path": "path to the GeoTIFF/PNG this was normalized into"
}
```

Implementation notes for the agent:
- Use `rasterio.open()` first; if it can't read `.img` directly, try GDAL's PDS4 driver (`gdal.Open` with the `.xml` label) — GDAL has native PDS4 support, so prefer this path over hand-parsing the label for the raster itself.
- For fields GDAL doesn't surface as raster metadata (sun angle, footprint corners), parse the XML label directly with `xml.etree.ElementTree` or `lxml`, since PDS4 labels are just structured XML — locate the `Observation_Area` / `Discipline_Area` / geometry blocks. **Do not guess XML tag names from memory** — open one actual downloaded label file and read its real tag names/namespaces before writing the parser, since PDS4 label structure can vary by product type (OHRC vs TMC vs IIRS labels are not identical).
- If a label field is missing (common for early or partial releases), leave it `null` in the manifest rather than defaulting to a fabricated value — downstream stages must treat `null` sun angle as "illumination-invariant mode should be used defensively" rather than assuming benign conditions.
- Convert every raw product to a normalized GeoTIFF (`converted_path`) once, at ingestion time, not per-pipeline-run: single-band float32, CRS/geotransform preserved via `rasterio`. This is the file every later stage actually reads — raw `.img` files are never touched again after ingestion.

### 1.2 IIRS-specific handling

IIRS is a hyperspectral cube (many bands across ~0.8–5.0 µm), not a single-band image. At ingestion:
- Store the full cube in `converted_path` as a multi-band GeoTIFF (don't discard bands at ingestion — that's a feature-extraction-time decision, not an I/O-time one).
- Separately record a `grayscale_band_index` (or `grayscale_method: "pca"`) choice in the manifest so every stage downstream picks the *same* representative band consistently instead of re-deciding per run. Default recommendation: a band near the visible/NIR edge (~0.8–1.0 µm) for closest visual correspondence to OHRC/TMC panchromatic imagery, since matching hyperspectral mineralogy bands against panchromatic optical images will not produce usable keypoints.

### 1.3 Building real cross-instrument pairs (OHRC↔TMC, TMC↔IIRS, OHRC↔IIRS)

You cannot just pick two random downloaded files — they must spatially overlap. Use the manifest's `footprint` field:

- `find_overlapping_pairs(manifest, instrument_a, instrument_b, min_overlap_pct=10.0) -> List[(product_a, product_b, overlap_polygon)]` — compute footprint intersection (Shapely `box`/`Polygon.intersection`) between every product of instrument A and instrument B; keep pairs above the overlap threshold.
- For each accepted pair, **crop both rasters to the overlapping region** (plus a small margin, e.g. 10%) before feeding them to the pipeline — do not run the full-scene pipeline on two images that only share a corner; this wastes compute and makes spatial-coverage/inlier-count metrics meaningless (most of each frame has nothing to match against).
- Record the cropped pair in a separate **pair registry** (`data/pairs.json`), not back in `manifest.json` — a pair is a derived test case, not a raw dataset entry:

```json
{
  "pair_id": "string",
  "source": {"product_id": ..., "instrument": "OHRC", "crop_path": ...},
  "reference": {"product_id": ..., "instrument": "TMC2", "crop_path": ...},
  "scale_ratio": float,             // reference_mpp / source_mpp, or vice versa — pick one convention and document it
  "sun_angle_delta_deg": float,     // |source.sun_azimuth - reference.sun_azimuth|, null if either is missing
  "has_ground_truth": false,        // true only if you separately hand-verified or derived one — see 1.4
  "ground_truth_transform": null
}
```

### 1.4 Ground truth — what you have and don't have

Real Chandrayaan-2 pairs almost never come with a hand-verified pixel-accurate ground-truth transform. Two ways to get evaluation signal, and the agent must use **both**, not just one:

1. **Synthetic pairs (primary validation signal, use first and most):** take a single real downloaded crop (from any instrument), apply a **known** synthetic transform (rotation, scale, translation) plus a synthetic illumination change (gamma/gain shift, or a synthetic sun-angle-consistent shading change), and use the known transform as exact ground truth. This is the only way to get a numerically exact RMSE/reprojection-error check — build this generator once, in `tests/data_gen/synthetic_pairs.py`, and reuse it for every stage's unit tests referenced in `algorithm_instruction_for_agent.md` Section 7.
2. **Real cross-instrument pairs (primary demo/report signal, no exact ground truth):** for pairs from Section 1.3, there is no independent ground truth, so RMSE/reprojection error are **self-consistency metrics** computed from the estimated transform against the same matches used to fit it (not an external check). Report this honestly in the evaluation output — do not present self-consistency RMSE as if it were externally validated accuracy. If an external LRO NAC/WAC basemap is available as a `reference/` product with reliable geolocation, that CAN serve as a semi-independent check for the *reference* side of a pair (i.e., register OHRC/TMC against a well-geolocated LRO mosaic rather than against another Chandrayaan-2 product) — prefer this pairing when both a Chandrayaan-2 product and an overlapping LRO reference tile are available, precisely because it gives you a more trustworthy reference frame than two mutually-unverified Chandrayaan-2 products.

The agent must tag every pair in `pairs.json` with `has_ground_truth` and must never silently mix synthetic (ground-truthed) and real (self-consistency) results into a single reported number — keep them as two separate rows/sections in any output report.

---

## 2. Per-Instrument-Pair Scale & Sun-Angle Handling

Reconciling `ALGORITHM_NOTES.md` Section 1 with the actual instrument specs you're using:

| Pair | Approx. scale ratio | Pyramid levels needed (per `ALGORITHM_NOTES.md` formula, $L=\min(L_{max}, \lfloor\log_2(\text{ratio})+1\rfloor)$) | Notes |
|---|---|---|---|
| OHRC ↔ TMC-2 | ~20:1 | $\lfloor\log_2 20\rfloor+1 = 5$ | Most tractable pair; both are panchromatic optical, so illumination handling matters more than modality gap. |
| TMC-2 ↔ IIRS | ~16:1 | $\lfloor\log_2 16\rfloor+1 = 5$ | Cross-modal (panchromatic vs. hyperspectral band) — expect fewer, noisier keypoints; consider deep/detector-free modes here first. |
| OHRC ↔ IIRS | ~320:1 | $\lfloor\log_2 320\rfloor+1 \approx 9$, cap at `L_max` (recommend `L_max=6` in `PipelineConfig` — beyond that, per-level image sizes become impractically small/blurry to extract features from) | Hardest pair; expect this to be the one where registration success rate is lowest — do not treat a lower success rate on this specific pair as a pipeline bug without first checking whether the pair genuinely has enough shared structure at any common scale. |

Implementation instruction: `PipelineConfig` must accept `scale_ratio` (computed from the manifest, not guessed) and derive pyramid `levels` from it via the formula above, capped at `L_max`, rather than always using a fixed `levels=4` — this is the concrete fix needed to make `pyramid/gaussian_pyramid.py` (from the algorithm instructions doc) actually scale-aware instead of using one hardcoded depth for every pair type.

For sun-angle handling: use `sun_angle_delta_deg` from the pair registry to **decide which illumination-invariant representation to lean on** (Section 3.2 of the algorithm doc) — if `sun_angle_delta_deg` is large (e.g. >30°), prefer gradient-magnitude/CLAHE representations over raw intensity for feature extraction; if small or unknown, raw intensity + light CLAHE is fine and cheaper. Make this an automatic decision inside the orchestrator driven by the pair's metadata, not a manual per-run flag.

---

## 3. Reconciled Target Metrics — Build and Validate Against These

The problem statement and `ALGORITHM_NOTES.md` don't fully agree (RMSE target: problem statement says ≤0.5 px, `ALGORITHM_NOTES.md` says ≤1.0 px; grid retains "top-k by score" in the algorithm doc vs. a fixed `k=5` per cell in `ALGORITHM_NOTES.md`). Resolve as follows — implement this table, not either source alone:

| Metric | Primary target (problem statement) | Where it may relax | Agent implementation note |
|---|---|---|---|
| RMSE | ≤ 0.5 px | ≤ 1.0 px **only** for the hardest scale-ratio pair type in your dataset (e.g. OHRC↔IIRS, ~320:1) — document in the report which threshold applied and why | `registration_success` thresholds must be a function of `scale_ratio` tier, not one global constant — implement `rmse_threshold_for_pair(scale_ratio) -> float` returning 0.5 below a configurable ratio cutoff (default cutoff: 50:1) and 1.0 above it |
| Inlier count | ≥ 100 | only enforced "where sufficient image overlap/features exist" per the problem statement — for small-overlap or low-texture crops, use `expected_min_inliers` scaled by overlap area, not a flat 100 | compute overlap area fraction from Section 1.3's overlap polygon; if overlap area fraction < a configurable threshold (e.g. 15%), lower the enforced floor proportionally rather than failing every small-overlap pair automatically |
| Inlier ratio | ≥ 75% | — | computed pre-uniform-selection-pruning, per the algorithm doc's `inlier_ratio` definition |
| Spatial coverage | ≥ 75% | — | use the entropy-based version from the algorithm doc's `spatial_coverage`, not raw active-cell fraction alone, since raw fraction can hit 75% with an uneven pile-up across just enough cells; report both numbers, gate `registration_success` on the entropy-normalized one |
| Registration success rate | ≥ 90% | computed **across the full pair registry** (Section 1.3 + synthetic set), not per-pair | this is a dataset-level metric, not a per-pipeline-run one — build the validation harness in Section 4 specifically to produce this number |
| Grid cell cap (`max_per_cell`) | Not specified numerically by the problem statement | `ALGORITHM_NOTES.md` recommends `k=5` | adopt `k=5` as the default for `grid_select`'s `max_per_cell` param in the algorithm doc, but keep it configurable — do not hardcode 5 inside the function body |
| RANSAC reprojection threshold | 3.0 px (both sources agree) | — | no reconciliation needed; already consistent between the algorithm doc and `ALGORITHM_NOTES.md` |

**Rule for the agent:** every threshold above must live in `PipelineConfig` (from the algorithm instructions doc, Section 4/9's `config.py`) as a named, documented field with the default from this table — never inline a bare number like `0.5` or `100` inside an evaluation function body. This is what lets you re-run the validation harness (Section 4) with different threshold tiers without touching algorithm code.

---

## 4. Validation Harness — What "Done" Means

Build a standalone script (`scripts/run_validation.py`, separate from the API and from unit tests) that is the actual arbiter of "the pipeline meets the problem statement's expected solution":

1. Load `pairs.json` (Section 1.3) plus a generated batch of synthetic pairs (Section 1.4.1) — recommend at minimum a few pairs per instrument-pair-type tier (OHRC↔TMC, TMC↔IIRS, OHRC↔IIRS) so the aggregate success rate isn't dominated by one easy tier.
2. Run `register_images(...)` (the orchestrator from the algorithm doc, Section 4) for every pair, in every mode you've implemented so far (Basic/Advanced/AI/Detector-Free), and record the full `EvaluationReport` per pair per mode.
3. Aggregate into a single validation report:
   - Per-pair-type, per-mode: mean RMSE, mean inlier count, mean inlier ratio, mean spatial coverage, success rate.
   - Overall registration success rate across the whole registry, compared against the ≥90% target.
   - A clearly separated **synthetic-only** success rate (should be near-100% if the core algorithm is correct — if it isn't, the bug is in the pipeline, not the dataset) versus **real-pair** success rate (expected to be lower and is the actual demo-worthy number).
4. Output this as both a machine-readable JSON (for CI/regression tracking as you keep developing) and a human-readable Markdown/HTML summary table — the JSON is what should be diffed between runs to catch regressions as you add features (e.g., turning on AI mode shouldn't silently regress Basic mode's synthetic success rate).
5. Re-run this harness after every pipeline change that touches feature extraction, matching, filtering, or geometric verification — treat it as the project's regression test, not a one-time report.

**Do not consider any stage "done" per the build order in `algorithm_instruction_for_agent.md` Section 9 until this harness runs on it and the relevant metric row in Section 3 above is checked, not just "the function returns without error."**

---

## 5. Open Items for You to Confirm

- Confirm which specific downloaded products (instrument, count, whether any pairs already visibly overlap) you have on disk right now, so the overlap-pairing step (Section 1.3) has real candidates rather than running against an empty registry.
- Confirm whether you have (or plan to fetch) any LRO NAC/WAC reference tiles for the semi-independent reference path in Section 1.4 — if not, real-pair evaluation will be self-consistency-only for now, which is fine to start with but should be flagged in any report you show to evaluators.
- Confirm the `L_max` cap and the `scale_ratio` cutoff (default 50:1) proposed in Sections 2–3 are acceptable, or provide different values if you have a reason to prefer others.
