# Project Overview

## About the Project

OrbitLens is a full stack AI-powered platform for multi-modal lunar image registration, built on Chandrayaan-2 sensor data. A researcher uploads or selects imagery from three sensors — OHRC (high-resolution optical), TMC-2 (terrain/elevation), and IIRS (hyperspectral) — covering the same lunar region. OrbitLens automatically detects landmarks (craters, ridges) as control points, aligns the three sensor modalities against each other, and fuses them into a single registered composite with sub-pixel accuracy.

Every analysis run produces a confidence heatmap, a cross-sensor anomaly report, and a landing-site suitability score, and can be exported as a mission-readiness PDF or in ISRO-compatible formats (GeoTIFF / PDS4). The entire process is tracked on a dashboard showing registration accuracy trends, dataset coverage, and recent activity.

Built for Smart India Hackathon 2026. The interface is designed as an official Indian central government style portal — light page, navy navigation, tricolour accent strip, Times New Roman, GIGW-aligned accessibility — so it reads as a mission-agency tool rather than a consumer app.

---

## The Problem It Solves

Aligning imagery from different lunar sensors is normally a manual, error-prone process — a scientist has to hand-pick tie points across sensors with different resolutions, projections, and illumination conditions, then judge alignment quality by eye. This is slow and does not scale across the volume of data Chandrayaan-2 has collected.

OrbitLens automates the entire pipeline: landmark detection replaces manual tie-point picking, sub-pixel refinement replaces eyeballed alignment, and automated hazard/anomaly scoring replaces manual terrain review. A researcher goes from raw sensor tiles to a registered, analysis-ready composite in minutes instead of hours.

---

## Pages

```
/                       → Landing page
/login                  → Auth page (Email/password, institutional Level-3 portal)
/dashboard              → Overview, recent analyses, accuracy trends
/datasets               → Dataset library — browse + upload OHRC/TMC/IIRS imagery
/datasets/[id]          → Individual dataset details + metadata
/new-analysis           → Select datasets, configure registration run
/registration/[id]      → Registration result — viewer, heatmap, dossier, report export
```

---

## Navigation

Government-portal shell on every page: tricolour strip, utility bar (skip link, screen reader access, A- A A+, high contrast, English / हिन्दी), brand header, navy top navbar, breadcrumb, footer with policy links. Four navigation items:

```
Home    Dashboard    Datasets    New Analysis
```

Centered layout, max width 1280px. No sidebar. Full rules in ui-rules.md, tokens in ui-tokens.md.

---

## Core User Flow

### Homepage

- Hero section — headline, subheadline, mission framing
- Logged in users → redirect to dashboard
- Logged out users → redirect to login

### Onboarding

- User signs in via Express JWT authentication (email/password)
- On login → redirect to /dashboard
- Default project ("Default Workspace") created automatically and idempotently
- Dashboard shows a setup banner if no datasets have been uploaded yet

### Dataset Upload

- User goes to Datasets page
- Uploads imagery tiles (OHRC / TMC / IIRS) via direct signed URLs or selects from pre-loaded ISRO sample sets
- Provides region name, sensor type, and acquisition date metadata
- Dataset appears in the library, tagged by sensor and region

### New Analysis — Registration Run

- User goes to New Analysis page
- Selects reference master (OHRC) and registration target (TMC-2 / IIRS)
- Configures run options: automated landmark detection, sub-pixel refinement, illumination/shadow normalization
- Clicks Run Correspondence Analysis
- Express backend enqueues job and dispatches to FastAPI ML worker
- Worker executes the registration pipeline: landmark detection → coarse alignment → sub-pixel refinement → fusion → anomaly + hazard scoring
- After completion, redirects to `/registration/[id]`

### Registration Results Page

- Correspondence verification section:
  - Reference and source images side by side with verified (solid) and rejected (dashed) tie-point lines
  - Counts: reference points, source points, candidate matches, verified matches, inlier ratio, mean reprojection error
  - Descriptor-distance histogram and reprojection-error histogram with the 1.0 px tolerance line
- Multi-viewport transformation section:
  - Tri-split viewer (Reference, Warped Source, Difference Map)
  - 3x3 Homography Matrix, Scale, Yaw, and Translation metrics
- Co-registration and product specifications:
  - Fused composite viewer with checkerboard, heatmap, and vector overlays
  - L2B Planetary Record photogrammetric specifications
  - Export options — GeoTIFF download, mission-readiness PDF
- Landing Suitability section:
  - Combined score from slope, illumination, and spectral data
  - Empty state with Generate Report button
  - After generation: mission-readiness PDF

### Dashboard

- Stats bar — 4 cards: Total Analyses Run, Avg. Registration Accuracy, Datasets Uploaded, Inlier Matches
- Recent activity — list of recent registrations pulled from MongoDB `jobs`
- Analytics section:
  - Registration accuracy over time — line chart
  - Sensor coverage by region — bar chart
  - Instrument ratio — bar chart

---

## Data Architecture

- **`users` collection**: Stores authentication credentials, hashed refresh token for session rotation, storage usage, and profile details.
- **`projects` collection**: Idempotent workspace groupings (unique index on `userId + name`).
- **`images` collection** (UI: "Datasets"): Raw uploaded sensor tiles with full lunar telemetry (solar angles, resolution, GeoJSON footprint).
- **`jobs` collection** (UI: "Analysis Runs & Results"): Stores run configuration, pipeline status, progress (0-100), quantitative metrics (RMSE, inlier counts), and storage keys for registered GeoTIFF and JSON artifacts.
- **Storage Engine**: Dual driver (local disk bucket or S3/MinIO) using HMAC signed URLs.

---

## Features In Scope

- Landing page with hero, how it works, features, footer
- Government-portal shell (tricolour strip, utility bar, header, navbar, breadcrumb, footer) with text-size, high-contrast and English / Hindi controls
- Top navbar — Home, Dashboard, Datasets, New Analysis
- Express + MongoDB authentication (email/password, HttpOnly refresh cookies)
- Redirect to dashboard after login
- Dataset upload with presigned URLs, sensor type, region, and acquisition metadata
- ML pipeline: automated landmark detection, coarse + sub-pixel registration, illumination normalization
- Correspondence verification panel (matches, inliers, reprojection error, histograms)
- Multi-layer fused composite viewer with before/after slider
- Confidence heatmap overlay
- Cross-sensor anomaly detection
- Landing-site suitability scoring
- Mission-readiness PDF report generation
- GeoTIFF export
- Dashboard with stats bar, recent activity, analytics charts
- Setup banner when no datasets uploaded yet
