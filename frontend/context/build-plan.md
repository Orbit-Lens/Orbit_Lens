# Build Plan

## Core Principle

Full page UI built with mock data first — verified visually against the delivered Stitch layouts, rendered in the government-portal style from ui-tokens.md, before any logic is written. Then functionality is built and wired to the Express backend (`backend/web-backend`), MongoDB, and the FastAPI ML service step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

The ML pipeline itself (landmark detection, alignment, fusion, anomaly/hazard scoring) is already built and trained in `backend/processing-service` — this build plan covers the Next.js frontend, its proxy connection to the Express orchestration backend, and the MongoDB persistence layer.

---

## Phase 1 — Foundation

### 01 Portal Shell + Landing Page

Build the government-portal shell first, then the complete landing page UI inside it.

**UI:**

- Portal shell in `app/layout.tsx` — tricolour strip, utility bar (skip link, screen reader access, A- A A+, high contrast, English / हिन्दी), brand header, navbar, breadcrumb, footer with policy links and last-updated line
- Global tokens from ui-tokens.md in `globals.css`, Times New Roman applied on `body`
- Navbar — Home, Dashboard, Datasets, New Analysis links, Sign In button
- Hero section — headline, subheadline, Get Started CTA
- Dashboard preview screenshot embedded below hero
- Features section — three value props (automated registration, confidence heatmap, mission-readiness reports)
- Bottom CTA section
- Footer

**Logic:**

- Get Started → /login if not authenticated, /dashboard if authenticated
- Text size and contrast choices persist for the session (`data-text-size`, `data-theme` on `<html>`)
- Language toggle swaps shell labels between English and Hindi

---

### 02 Auth

Express + MongoDB authentication via JWT access tokens and HttpOnly refresh cookies.

**UI:**

- Login page matching `public/signup_in.jpeg` split layout:
  - Left: Lunar imagery with mission telemetry HUD overlay
  - Right: Restricted Government Access Level-3 login card
  - Email & password input fields
  - Google OAuth and Gov e-Pramaan / Institutional SSO buttons (visibly disabled with badge: "Not available in this prototype")
  - TLS 1.3 Active Security status bar

**Logic:**

- POST `/api/v1/auth/login` sends email and password to Express backend
- Backend verifies bcrypt hash against MongoDB `users` collection, enforces account lockout after 5 failed attempts
- Access token stored in memory only (never localStorage); refresh token set in HttpOnly cookie `orbitlens_refresh_token` (path `/api/v1/auth`)
- Session restored on page load through POST `/api/v1/auth/refresh`
- Default project ("Default Workspace") created idempotently on first login/registration
- Route protection for `/dashboard`, `/datasets`, `/datasets/[id]`, `/new-analysis`, `/registration/[id]` redirects unauthenticated users to `/login`
- After login → redirect to `/dashboard`

---

### 03 Database Schema

MongoDB collections and indexes verification and hardening.

**Logic:**

- Verify `users` collection in `backend/web-backend/src/modules/users/user.model.ts`
- Verify `projects` collection in `backend/web-backend/src/modules/projects/project.model.ts` with compound unique index `{ userId: 1, name: 1 }`
- Verify `images` collection (UI "datasets") in `backend/web-backend/src/modules/images/image.model.ts` with indexes `{ userId: 1, createdAt: -1 }` and `{ userId: 1, sensor: 1, createdAt: -1 }`
- Verify `jobs` collection (UI "runs & results") in `backend/web-backend/src/modules/jobs/job.model.ts` with index `{ userId: 1, status: 1, 'metrics.rmse': 1 }`
- Verify storage engine (`backend/web-backend/src/config/storage.ts`) supporting local disk storage and S3 with HMAC signed URLs
- Verify resource ownership scoping (`assertOwnership`) across all Express service methods
- Add production guard to `backend/web-backend/src/scripts/seed.ts`

---

## Phase 2 — Datasets Page

### 04 Datasets Page — Full UI

Build the complete datasets page UI with mock data matching `public/datasets.jpeg`. No upload logic yet.

**UI:**

- Setup banner at top if no datasets uploaded — "Upload your first dataset" CTA
- Repository search bar (`CH2_OHRC_0421`) and Payload filter tabs (`ALL`, `OHRC`, `TMC-2`, `IIRS`, `LROC NAC`, `DFSAR`)
- Granules table: Checkbox, preview thumbnail, dataset UID, instrument/mode, GSD resolution, raster dimensions, acquisition UTC, target morphology, PDS level badge
- Selected dataset detail drawer (right panel from `datasets.jpeg`): PDS4 Calibrated L2B telemetry, 12-bit Radiometric DN spread histogram, "Launch Analysis Workstation →" button, signed download action

---

### 05 Dataset Upload Logic

Wire the upload form to the Express backend and storage engine.

**Logic:**

- Request presigned upload URL via POST `/api/v1/images/upload-url` (sends filename, sensor, resolution, solar angles)
- Direct binary stream to the HMAC signed upload URL (local disk or S3)
- Confirm upload via POST `/api/v1/images/:id/confirm`
- Automated header parsing extracts raster dimensions, GSD, and solar geometry
- Updates user storage quota consumption (`storageUsedBytes`)
- Newly uploaded image appears immediately in the Datasets library

---

### 06 Dataset Details Page

Individual dataset view on `/datasets/[id]`.

**UI:**

- Sensor badge, region, acquisition date, full PDS4 orbital telemetry table
- High-resolution preview of the uploaded imagery
- List of registration jobs that utilized this image as reference or source

**Logic:**

- Query `GET /api/v1/images/:id` (scoped to current user via `assertOwnership`)
- Query `GET /api/v1/jobs` where `referenceImageId` or `sourceImageId` matches this image id

---

## Phase 3 — New Analysis Page

### 07 New Analysis Page — Full UI

Build the complete New Analysis page UI matching `public/analysis.jpeg`. No submission logic yet.

**UI:**

- 3-step workflow stepper: Step 01 Select Images, Step 02 Configure Analysis, Step 03 Run Pipeline
- Dual frame selector: Frame A Reference Master (OHRC Nadir) vs Frame B Registration Target (TMC-2 Stereo)
- Metadata & Geometry Comparison Matrix (Center Lat/Lon, Solar Elevation, Solar Azimuth, Sensor Emission Angle, Datum with alignment delta check)
- 3 Pipeline Configuration panels:
  - 1. Preprocessing: Radiometric Normalization, CLAHE Contrast Normalization (clip limit 2.5), Bilateral Filtering, Shadow Mask Exclusion
  - 2. Feature Detection & Matching: Feature Detector Engine (SIFT / ORB), Tie-point Matcher (FLANN), Target Budget slider (5,000 keypoints), Sub-pixel refinement
  - 3. Geometric Verification: Robust Estimator (RANSAC), Transformation Model (Homography 8-DoF / Affine), Inlier Error threshold (2.0 px), Max iterations
- Bottom runtime estimation and "Run Correspondence Analysis →" action button

---

### 08 Registration Pipeline Integration

Wire the New Analysis page to the Express backend and FastAPI ML service.

**Logic:**

- POST `/api/v1/jobs` submits `sourceImageId`, `referenceImageId`, `algorithm`, `transformModel`, and `parameters`
- Express creates Job record in MongoDB with status `queued`
- Express dispatches task to FastAPI ML worker (`POST /internal/jobs`)
- Python ML worker runs pipeline: SIFT feature extraction → FLANN matching → RANSAC homography estimation → sub-pixel refinement → warping → metric calculation
- FastAPI posts updates to POST `/api/v1/jobs/:id/status-internal` with status (`preprocessing`, `matching`, `estimating_transform`, `warping`, `scoring`, `complete`) and progress (0-100)
- On completion, artifacts saved: registered GeoTIFF, `matchpoints.json`, `metrics.json`, preview overlay
- Frontend receives completion and redirects to `/registration/[id]`

---

## Phase 4 — Registration Results Page

### 09 Registration Results Page — Full UI

Build the complete registration results page UI supporting the three distinct design views:

**UI:**

1. **Correspondence Verification View** (`public/correspondence.jpeg`):
   - Dual-frame interactive canvas with solid inlier tie-point lines (842) and dashed rejected lines (304)
   - Disparity & Residual Distribution histogram with 2.0 px cutoff limit
   - Keypoint Inspector (#KP-0428) showing source/reference coordinates and residual error
   - Quantitative Metrics table (reference points, source points, candidate matches, verified matches, inlier ratio, reprojection error, RMSE)
2. **Multi-Viewport Transformation View** (`public/registration.jpeg`):
   - 1:1:1 Tri-Split viewer: Reference Frame (OHRC 0.25 m/px), Warped Source (TMC-2), Difference Map (Residual & DEM)
   - 3x3 Homography Matrix panel, Scale ratio, Azimuth rotation, Translations dX/dY
   - Residual error histogram showing sub-pixel tolerance
3. **Co-Registration & Photogrammetric Specs View** (`public/result.jpeg`):
   - Checkerboard, Residual Heatmap, and Vector overlays with blend alpha slider
   - 4 Summary stat cards: Inlier Consensus, Reprojection Error, SSIM Index, Coordinate Residual Delta
   - L2B Planetary Record Photogrammetric Product Specifications table
   - Export Registered GeoTIFF (COG), PDS-4 XML Archive, and Scientific Report buttons

---

### 10 Real Registration Data

Wire `/registration/[id]` to live data from Express and storage.

**Logic:**

- Query `GET /api/v1/jobs/:id` (scoped to current user)
- Fetch signed URLs for artifacts via `GET /api/v1/jobs/:id/artifacts` (`registeredImageUrl`, `matchPointsUrl`, `metricsReportUrl`, `previewOverlayUrl`)
- Render live correspondence lines and residuals from `matchpoints.json`
- Show real-time progress bar if `status` is active (`preprocessing` ... `scoring`), polling until `complete` or `failed`
- Show error banner with `errorMessage` if status is `failed`

---

### 11 Mission-Readiness Report Generation

Scientific Report generation button on registration results page.

**Logic:**

- Generate client/server mission-readiness PDF using `@react-pdf/renderer`
- Formatted in Times-Roman typography with photogrammetric specifications, tie-point residual tables, landing suitability score, and sensor calibration records
- Downloads as a standard handoff PDF: `OrbitLens_Mission_Report_[id].pdf`

---

## Phase 5 — Dashboard

### 12 Dashboard Page — Full UI

Build the complete dashboard UI matching `public/dashboard.jpeg`.

**UI:**

- 4 Stat Cards: Completed runs (128), Images count (342), Inlier Matches (24,681), Mean Error (0.84 px)
- Pipeline Activity (30d daily registration throughput bar chart per sensor)
- Instrument Ratio breakdown chart (OHRC, TMC-2, IIRS)
- Footprint Preview (TMC-2 crater imagery with solar angle overlay)
- Telemetry Stream terminal showing live log messages
- Ephemeris State panel (Altitude, Velocity, Solar Lat/Lon)
- Recent Analyses table with pagination, status badges, and action buttons

---

### 13 Stats Bar — Real Data

Wire stat cards to real MongoDB data.

**Logic:**

- Query `GET /api/v1/metrics/overview`
- Displays `totalCompletedJobs`, average RMSE with sub-pixel indicator (`< 1.0 px`), total image count from `GET /api/v1/images`
- Rendered with `tabular-nums` in Times New Roman

---

### 14 Recent Activity — Real Data

Wire recent analyses table and activity to real MongoDB data.

**Logic:**

- Extract `recentRegistrations` from `GET /api/v1/metrics/overview` or query `GET /api/v1/jobs?limit=10`
- Render populated reference and source image names, sensor badges, match counts, inlier ratio, and status badges (`Completed`, `Processing`, `Failed`)

---

### 15 Analytics Charts — Real Data

Wire dashboard analytics charts to real aggregated data.

**Logic:**

- Render Pipeline Activity throughput chart and Instrument Ratio chart using `recharts`
- Colors mapped to design tokens (`var(--color-accent)`, `var(--color-success)`, `var(--color-error)`)
- Times New Roman axis labels
- Accessible "View data table" alternative toggle for every chart

---

## Phase 6 — Government Portal Restyle & Verification

### 16 Portal Audit & Verification

Comprehensive quality and accessibility verification across all pages.

**UI & Accessibility Verify:**

- Full keyboard navigation walkthrough (skip link, tab traversal, visible focus outlines)
- Text size scaling check (A- / A / A+) in `rem`
- High-contrast mode verification (`data-theme="contrast"`)
- WCAG 2.1 AA text contrast confirmation (>= 4.5:1)
- Update `context/ui-registry.md` and `context/progress-tracker.md`

---

## Feature Count

| Phase | Features | Description |
| :--- | :--- | :--- |
| Phase 1 — Foundation | 3 | Portal Shell & Landing Page, Express/JWT Auth, MongoDB Schema |
| Phase 2 — Datasets | 3 | Datasets Library UI, Signed URL Upload, Details Page |
| Phase 3 — New Analysis | 2 | New Analysis UI, Job Queue & Pipeline Integration |
| Phase 4 — Registration Results | 3 | Results UI (3 views), Live Artifacts, PDF Report |
| Phase 5 — Dashboard | 4 | Dashboard UI, Stats Overview, Recent Activity, Recharts |
| Phase 6 — Government Restyle | 1 | GIGW Accessibility & Contrast Final Audit |
| **Total** | **16** | |
