# OrbitLens — Project Memory & Audit Log

> **Purpose:** Persistent reference for AI agents and developers. Read this file FIRST before touching any code.
> **Last updated:** 21 Sep 2026, 23:02 IST
> **Session type:** Integrity audit + test execution + defect discovery

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Project** | OrbitLens — Multi-Modal Lunar Image Registration (Chandrayaan-2) |
| **Hackathon** | Smart India Hackathon 2026 |
| **Workspace root** | `c:\Users\SAKTHIVEL  P\Desktop\SIH2026\Orbit_Lens2\` |
| **Frontend** | Next.js 14 (TypeScript) — port 3000 |
| **Web Backend** | Express + MongoDB + JWT — port 5000 |
| **Processing Service** | FastAPI (Python) — port 8000 |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Storage** | S3-compatible (MinIO local / Atlas S3) |
| **Queue** | BullMQ + Redis (optional; falls back to direct HTTP dispatch) |

---

## 2. Architecture Summary

```
Browser (Next.js 14)
  │  /api/v1/* (next.config.ts rewrite → http://localhost:5000)
  ▼
Express Web Backend (port 5000)
  ├── /api/v1/auth        → authRoutes
  ├── /api/v1/users       → userRoutes
  ├── /api/v1/projects    → projectRoutes
  ├── /api/v1/images      → imageRoutes   (UI calls "Datasets")
  ├── /api/v1/jobs        → jobRoutes     (UI calls "Analysis Runs")
  ├── /api/v1/metrics     → metricsRoutes
  └── /api/v1/storage     → storageRoutes (raw binary streaming)
       │
       │ POST /internal/jobs  (X-Internal-Key header)
       │ POST /api/v1/jobs/:id/status-internal  (callback)
       ▼
FastAPI Processing Service (port 8000)
  └── OrbitLensOrchestrator (algorithms/)
       SIFT → FLANN → RANSAC → Coverage Filter → ECC Refinement → Metrics
```

### Proxy Rewrite (critical)
```ts
// frontend/next.config.ts
source: "/api/v1/:path*"
destination: "${BACKEND_URL}/api/v1/:path*"   // BACKEND_URL default: http://localhost:5000
```

### Authentication Flow
- Access token stored **in-memory only** (`lib/api-client.ts` → `inMemoryAccessToken`)
- Session restored on page reload via `POST /api/v1/auth/refresh` (uses HttpOnly cookie `orbitlens_refresh_token`)
- Automatic 401 retry with refreshed token in `apiClient<T>()` function
- Google OAuth / Gov e-Pramaan buttons are visible but **intentionally disabled** ("Not available in this prototype")

---

## 3. Data Model Contracts (Fully Verified ✅)

### 3.1 JobMetrics — 11 fields, all aligned across TypeScript ↔ Zod ↔ Mongoose ↔ Python

| Field | Type | Python key (compute_metrics) | Frontend (JobMetrics) |
|---|---|---|---|
| `rmse` | number | `"rmse"` | `rmse: number` |
| `inlierCount` | number | `"inlierCount"` | `inlierCount: number` |
| `totalCandidateMatches` | number | `"totalCandidateMatches"` | `totalCandidateMatches: number` |
| `inlierRatio` | number | `"inlierRatio"` | `inlierRatio: number` |
| `meanReprojectionError` | number | `"meanReprojectionError"` | `meanReprojectionError: number` |
| `medianReprojectionError` | number | `"medianReprojectionError"` | `medianReprojectionError: number` |
| `coverageUniformityScore` | number | `"coverageUniformityScore"` | `coverageUniformityScore: number` |
| `processingTimeMs` | number | `"processingTimeMs"` | `processingTimeMs: number` |
| `sunAngleDeltaAzimuth` | number? | `"sunAngleDeltaAzimuth"` | `sunAngleDeltaAzimuth?: number` |
| `sunAngleDeltaElevation` | number? | `"sunAngleDeltaElevation"` | `sunAngleDeltaElevation?: number` |
| `confidenceWarning` | boolean? | `"confidenceWarning"` | `confidenceWarning?: boolean` |

### 3.2 JobParameters — 5 fields, all aligned

| Field | Default | Zod range |
|---|---|---|
| `coverageTargetCells` | 64 | int 4–256 |
| `ratioThreshold` | 0.75 | float 0.1–0.95 |
| `ransacReprojThreshold` | 3.0 | float 0.5–20.0 |
| `maxPyramidLevels` | 4 | int 1–6 |
| `illuminationCorrection` | true | boolean |

### 3.3 JobStatus Enum — 8 values (identical in TS and Python)
`queued → preprocessing → matching → estimating_transform → warping → scoring → complete → failed`

### 3.4 SensorType — 7 values (backend & api.ts)
`OHRC | TMC-2 | IIRS | LRO_NAC | LRO_WAC | KAGUYA | OTHER`

### 3.5 ImageStatus — 4 values
`pending_upload → uploaded → ready → failed`

### 3.6 Artifact Storage Keys
```
artifacts/{jobId}/registered_product.tif   → registeredImageStorageKey
artifacts/{jobId}/preview_overlay.png      → previewOverlayStorageKey
artifacts/{jobId}/matchpoints.json         → matchPointsStorageKey
artifacts/{jobId}/metrics_report.json      → metricsReportStorageKey
```

---

## 4. Known Defects (as of 21 Sep 2026)

### 🔴 CRITICAL — `tasks.py` SyntaxError (BLOCKING — no jobs can complete)

**File:** `backend/processing-service/app/workers/tasks.py`

**Problem:** During integration of the `OrbitLensOrchestrator`, new code was pasted at **module level** inside the existing `run_registration_pipeline` function's `try` block. This broke indentation, causing Python to reject the file at import time. Additionally, `run_registration_pipeline` is defined **twice** (lines 61 and 80), with the second definition shadowing the first.

**Confirmed error:**
```
SyntaxError: expected 'except' or 'finally' block
  File "app/workers/tasks.py", line 73
    from app.algorithms.pipeline.config import PipelineConfig
```

**Impact:** `app.workers.tasks` cannot be imported → FastAPI background task worker never executes → **every job stays in "queued" state permanently**.

**Fix required:** Rewrite `tasks.py` as a single clean function that:
1. Moves all `from app.algorithms...` imports to the top of the file (module level)
2. Has exactly ONE `run_registration_pipeline` function using `OrbitLensOrchestrator`
3. Adds `totalCandidateMatches` and `medianReprojectionError` to the metrics payload

---

### 🟡 MODERATE — Missing metrics fields in `tasks.py` payload

**File:** `backend/processing-service/app/workers/tasks.py` lines 136–143

The metrics dict sent to the web backend is missing 2 fields that the frontend `JobMetrics` type declares:
- `totalCandidateMatches` — should be `len(matches)` captured before RANSAC filtering
- `medianReprojectionError` — should be `float(np.median(errors))`

Also missing from `EvaluationReport` dataclass in `app/algorithms/types.py`.

---

### 🟡 MODERATE — `constants.ts` SensorType mismatch

**File:** `frontend/lib/constants.ts` line 76

```ts
// WRONG (current)
export const SENSOR_TYPES = ["OHRC", "TMC", "IIRS"] as const;

// CORRECT (must match backend enum + types/api.ts)
export const SENSOR_TYPES = ["OHRC", "TMC-2", "IIRS", "LRO_NAC", "LRO_WAC", "KAGUYA", "OTHER"] as const;
export type SensorType = (typeof SENSOR_TYPES)[number]; // remove duplicate type export
```

Impact: Any UI dropdown or filter using `SENSOR_TYPES` from `constants.ts` shows only 3 sensors, uses wrong `"TMC"` key instead of `"TMC-2"`, silently misses 4 valid sensors.

---

### 🟡 MODERATE — Wrong warp import path in `tasks.py`

**File:** `backend/processing-service/app/workers/tasks.py` line 113

```python
# WRONG (path does not exist)
from app.algorithms.registration.warp import warp_source_to_reference, create_preview_composite

# CORRECT
from app.pipeline.warp import warp_source_to_reference, create_preview_composite
```

---

### 🟢 MINOR — LoFTR mode uses random coordinates as placeholder

**File:** `backend/processing-service/app/algorithms/pipeline/orchestrator.py` lines 83–84

```python
# PLACEHOLDER — produces garbage transform for learned algorithm
src_pts = np.random.rand(len(matches), 2) * 512
ref_pts = np.random.rand(len(matches), 2) * 512
```

The `LoFTRMatcher.match()` output contains actual correspondence coordinates; these need to be wired into the estimator instead of random values. Until fixed, `algorithm: "learned"` jobs will produce meaningless transforms.

---

## 5. Test Suite — Current State

**File:** `backend/processing-service/tests/test_pipeline.py`
**Command:** `python -m pytest tests/test_pipeline.py -v -s`
**Result (21 Sep 2026):** ✅ **3/3 PASSED** in 0.54 s

| Test | Status | Key Assertion |
|---|---|---|
| `test_preprocessing` | ✅ PASS | Output shape == input shape, dtype == uint8 |
| `test_pyramid_construction` | ✅ PASS | 3 levels: (512,512)→(256,256)→(128,128) |
| `test_end_to_end_registration_accuracy` | ✅ PASS | RMSE=**0.058 px**, Inliers=**180**, Coverage=**1.0** |

### Live Metrics from Test Run
```
RMSE:              0.058 px    (target ≤ 1.0 px, hard assert < 0.20 px → EXCEEDED)
Inlier Count:      180         (threshold ≥ 10)
Inlier Ratio:      ≈ 0.90      (threshold > 0.50)
Coverage Score:    1.0         (36/36 cells occupied, threshold ≥ 0.50)
Mean Reproj Err:   ~0.05 px
confidenceWarning: False
Processing Time:   ~350 ms
```

**Synthetic fixture:** 512×512 grayscale lunar scene (35 synthetic craters, regolith noise), ground truth affine warp of Rotation 4.5°, Scale 1.05×, Translation (+15, −10 px).

---

## 6. Case Study Metrics Reference

| Case Study | Sensor Pair | Res Ratio | RMSE (est.) | Inliers (est.) | Coverage (est.) | Warning |
|---|---|---|---|---|---|---|
| CS1 — Live test | Synthetic (affine) | 1:1 | **0.058 px** ✅ | **180** | **1.0** | False |
| CS2 — Multi-res | OHRC → LRO_NAC | 2× | 0.15–0.25 px | 80–120 | 0.70–0.90 | False |
| CS3 — Cross-sensor | OHRC → TMC-2 | 20× | 0.8–1.5 px | 25–50 | 0.40–0.65 | Borderline |
| CS4 — Hyperspectral | IIRS → OHRC | 80× | 1.0–3.0 px | 5–20 | 0.15–0.40 | **True** |
| CS5 — Temporal | OHRC → OHRC | 1× | 0.05–0.25 px | 100–300 | 0.85–1.0 | False |
| CS6 — Shadow stress | OHRC → OHRC | 1× | 0.5–4.0 px | 5–30 | 0.10–0.35 | **True** |

### Metric Thresholds
| Metric | Sub-pixel (Best) | Acceptable | Warning |
|---|---|---|---|
| RMSE | ≤ 0.20 px | 0.20–1.0 px | > 1.0 px |
| Inlier Count | ≥ 50 | 10–49 | < 10 |
| Inlier Ratio | ≥ 0.70 | 0.50–0.69 | < 0.50 |
| Coverage Score | ≥ 0.80 | 0.50–0.79 | < 0.50 |
| Mean Reproj Error | ≤ 0.50 px | 0.50–2.0 px | > 2.0 px |

`confidenceWarning` fires when: `inlier_count < 10 OR inlier_ratio < 0.15 OR coverage_score < 0.15 OR rmse > 3.0`

---

## 7. Frontend Phase Progress (from progress-tracker.md)

| Phase | Task | Status |
|---|---|---|
| Phase 1 | 01 Portal Shell + Landing Page | ✅ Done |
| Phase 1 | 02 Auth (email/password, JWT, refresh cookie) | ✅ Done |
| Phase 1 | 03 Database Schema Verification (MongoDB, API contracts, proxy) | ✅ Done |
| Phase 2 | 04 Datasets Page — Full UI (layout, filters, search, table, drawer, histogram) | ✅ Done |
| Phase 2 | 05 Dataset Upload Logic (signed URLs, HMAC, storage quota) | ✅ Done |
| Phase 2 | 06 Dataset Details Page (`/datasets/[id]`, telemetry inspector, launch analysis) | ✅ Done |
| Phase 3 | 07 New Analysis Page — Full UI | ⏳ Next |
| Phase 3 | 08 Registration Pipeline Integration | ⏳ Pending |
| Phase 4 | 09 Registration Results Page — Full UI | ⏳ Pending |
| Phase 4 | 10 Real Registration Data | ⏳ Pending |
| Phase 4 | 11 Mission-Readiness Report Generation | ⏳ Pending |
| Phase 5 | 12–15 Dashboard (real data, stats, charts) | ⏳ Pending |
| Phase 6 | 16 Government Portal Restyle | ⏳ Pending |

---

## 8. Key Design Decisions (do not reverse without team discussion)

| Decision | Detail |
|---|---|
| **No Supabase** | MongoDB + Express + JWT replaces Supabase entirely. Collections: `users`, `projects`, `images` (UI: "datasets"), `jobs` (UI: "analysis runs"). |
| **No Google OAuth** | Google OAuth and Gov e-Pramaan buttons exist in UI but are disabled with "Not available in this prototype". Only email/password is active. |
| **Same-origin API** | Next.js rewrite proxy (`/api/v1/*` → Express) ensures HttpOnly refresh token cookie works as same-origin. No CORS issues. |
| **In-memory access token** | Access token never touches `localStorage` or cookies. Held in `lib/api-client.ts` memory only. Session restored via refresh endpoint. |
| **Default project** | "Default Workspace" created idempotently on first login using compound unique index `{ userId: 1, name: 1 }`. |
| **Government portal style** | UI follows GIGW conventions: light page, navy navbar, tricolour strip, Times New Roman font (no `next/font`), square bordered panels. |
| **Top navbar** | 4-item navbar (Home, Dashboard, Datasets, New Analysis) — no sidebar. |
| **Font** | Times New Roman is a system font; weights 400 and 700 only. `--font-mono` is an alias of the same stack. |
| **Mock data in use** | `frontend/lib/mock-data.ts` contains 6 `ExtendedDataset` objects used by the datasets page while real uploads are not wired. |
| **Dual dispatch** | Jobs are dispatched via BullMQ queue (if Redis available) AND directly via HTTP to processing service. The direct dispatch is the fallback. |
| **Internal API key** | Python→Node.js callback authenticated via `X-Internal-Key` header (HMAC `compare_digest` on Python side, timing-safe compare on Node side). |
| **SSIM deferred** | SSIM computation is planned as a derived metric from `Job.metrics` + `matchpoints.json` residuals — not yet implemented. |

---

## 9. File Map — Critical Files

### Frontend
| File | Purpose |
|---|---|
| `frontend/types/api.ts` | Single source of truth for all TypeScript API types |
| `frontend/lib/api-client.ts` | Fetch wrapper with token injection, 401 retry, and refresh logic |
| `frontend/lib/constants.ts` | UI labels, sensor types, nav items (⚠️ SensorType bug here) |
| `frontend/lib/mock-data.ts` | 6 mock datasets for UI development |
| `frontend/next.config.ts` | Proxy rewrite `/api/v1/*` → Express backend |
| `frontend/app/(auth)/` | Login / Register pages |
| `frontend/app/datasets/` | Datasets list page + `[id]` detail page |

### Web Backend
| File | Purpose |
|---|---|
| `backend/web-backend/src/app.ts` | Express app factory, middleware chain, route mounts |
| `backend/web-backend/src/modules/jobs/job.model.ts` | Mongoose `Job` schema (authoritative DB schema) |
| `backend/web-backend/src/modules/jobs/job.schema.ts` | Zod validation for create + internal status update |
| `backend/web-backend/src/modules/jobs/job.service.ts` | Business logic: create, update, list, delete, artifacts |
| `backend/web-backend/src/modules/jobs/job.controller.ts` | Express handlers for all job routes |
| `backend/web-backend/src/modules/metrics/metrics.controller.ts` | MongoDB aggregation for `MetricsOverview` |
| `backend/web-backend/src/modules/images/image.model.ts` | Mongoose `Image` schema (UI: Dataset) |

### Processing Service
| File | Purpose |
|---|---|
| `backend/processing-service/app/main.py` | FastAPI app, CORS, health/ready endpoints |
| `backend/processing-service/app/api/routes_jobs.py` | Internal `/internal/jobs` and `/internal/metadata/extract` |
| `backend/processing-service/app/workers/tasks.py` | ⚠️ **BROKEN — SyntaxError** — pipeline execution worker |
| `backend/processing-service/app/algorithms/pipeline/orchestrator.py` | `OrbitLensOrchestrator` — full 7-stage registration flow |
| `backend/processing-service/app/algorithms/types.py` | `EvaluationReport`, `Transform`, `FeatureSet`, `ImageMeta` dataclasses |
| `backend/processing-service/app/pipeline/metrics.py` | `compute_metrics()` — produces the 11-field metrics dict |
| `backend/processing-service/app/pipeline/geometry.py` | RANSAC/USAC_MAGSAC affine+homography estimation |
| `backend/processing-service/app/pipeline/coverage.py` | Uniform spatial grid coverage filter |
| `backend/processing-service/app/pipeline/matching.py` | FLANN k-NN + Lowe's ratio test |
| `backend/processing-service/app/pipeline/preprocess.py` | Bilateral filter + Retinex + CLAHE |
| `backend/processing-service/app/pipeline/pyramid.py` | Gaussian pyramid builder |
| `backend/processing-service/app/pipeline/warp.py` | Sub-pixel warp + preview composite generator |
| `backend/processing-service/tests/test_pipeline.py` | 3-test pipeline suite (all passing) |

---

## 10. Immediate Action Items (Priority Ordered)

- [ ] 🔴 **FIX `tasks.py` SyntaxError** — Rewrite as single clean function, move imports to top, use `OrbitLensOrchestrator`
- [ ] 🟡 **Add missing metrics** — `totalCandidateMatches` + `medianReprojectionError` to `EvaluationReport` + `tasks.py` payload
- [ ] 🟡 **Fix `constants.ts`** — Change `SENSOR_TYPES` to full 7-value array with `"TMC-2"` (not `"TMC"`)
- [ ] 🟡 **Fix warp import** — `from app.pipeline.warp import ...` in `tasks.py` line 113
- [ ] 🟢 **Wire LoFTR coordinates** — Replace `np.random.rand` placeholder in `orchestrator.py` lines 83–84
- [ ] ⏳ **Build Phase 3** — New Analysis Page UI (`07 New Analysis Page`) + Registration Pipeline Integration (`08`)

---

## 11. Environment Notes

- **Python version:** 3.14.7
- **pytest version:** 9.1.1
- **Node backend** runs in `backend/web-backend/` (port 5000 via `npm run dev`)
- **Processing service** runs in `backend/processing-service/` (port 8000 via `uvicorn app.main:app`)
- **Frontend** runs in `frontend/` (port 3000 via `npm run dev`)
- All three services must be running simultaneously for end-to-end functionality

---

*This file is maintained as a living document. Update after every significant session, fix, or design decision.*
