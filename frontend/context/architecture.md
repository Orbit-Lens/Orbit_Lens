# Architecture

## Stack

| Layer                          | Tool                     | Purpose                                                  |
| ------------------------------ | ------------------------ | --------------------------------------------------------- |
| Frontend Framework             | Next.js 16 (App Router)  | Official government portal UI, proxy rewrites, server rendering |
| Backend Orchestration API      | Node.js / Express (TypeScript) | Authentication, projects, datasets metadata, job queues, storage signing (`backend/web-backend`) |
| Database                       | MongoDB + Mongoose       | Persistence layer — collections: users, projects, images, jobs |
| ML Inference Service           | FastAPI (Python)         | Core registration pipeline — landmark detection, alignment, fusion, scoring (`backend/processing-service`) |
| Storage Engine                 | Dual Driver (Local disk / S3) | Raw imagery and photogrammetric artifacts with HMAC signed URLs (`storage/bucket`) |
| PDF Generation                 | @react-pdf/renderer      | Mission-readiness verification report rendering           |
| Charts                         | recharts                 | Dashboard analytics charts                                |
| Styling                        | Tailwind CSS v4          | UI components and tokens — government-portal theme, Times New Roman system font |
| Language                       | TypeScript strict        | Full type-safety across frontend and backend              |

The Next.js frontend proxies `/api/v1/:path*` directly to the Express backend via Next.js rewrites, keeping the path same-origin so HttpOnly refresh token cookies remain secure and unexposed to client-side scripts. The Express backend orchestrates the worker queue and delegates heavy photogrammetric computation to the FastAPI ML service.

---

## Folder Structure

```
/
├── AGENTS.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── ui-tokens.md
│   ├── ui-rules.md
│   ├── ui-registry.md
│   ├── code-standards.md
│   ├── library-docs.md
│   ├── build-plan.md
│   └── progress-tracker.md
├── app/
│   ├── layout.tsx                          → Root layout — renders the portal shell (strip, utility bar, header, navbar, breadcrumb, footer)
│   ├── page.tsx                            → Landing page
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                   → Login page (email/password, disabled SSO for prototype)
│   ├── dashboard/
│   │   └── page.tsx                       → Main dashboard (stats bar, activity, analytics)
│   ├── datasets/
│   │   ├── page.tsx                       → Dataset library (images) — browse + upload
│   │   └── [id]/
│   │       └── page.tsx                   → Dataset details + telemetry
│   ├── new-analysis/
│   │   └── page.tsx                       → Configure + submit registration run (creates job)
│   └── registration/
│       └── [id]/
│           └── page.tsx                   → Registration result page (correspondence, transform, composite)
├── components/
│   ├── ui/                                → Shared UI primitives (Panel, Button, Badge, SensorBadge, AccuracyBar)
│   ├── layout/
│   │   ├── TricolourStrip.tsx
│   │   ├── UtilityBar.tsx                 → Skip link, screen reader access, text size, contrast, language
│   │   ├── PortalHeader.tsx
│   │   ├── Navbar.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── Footer.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Features.tsx
│   │   └── DashboardPreview.tsx
│   ├── dashboard/
│   │   ├── StatsBar.tsx
│   │   ├── RecentActivity.tsx
│   │   └── AnalyticsCharts.tsx
│   ├── datasets/
│   │   ├── DatasetUpload.tsx
│   │   ├── DatasetTable.tsx
│   │   └── DatasetDetailDrawer.tsx
│   ├── new-analysis/
│   │   ├── DualFrameSelector.tsx
│   │   ├── MetadataGeometryMatrix.tsx
│   │   ├── RunOptions.tsx
│   │   └── RunStatus.tsx
│   └── registration/
│       ├── CorrespondenceViewer.tsx
│       ├── MultiViewportViewer.tsx
│       ├── CoRegistrationViewer.tsx
│       ├── HomographyMatrixPanel.tsx
│       ├── ResidualHistogram.tsx
│       ├── MissionReport.tsx
│       └── ExportPanel.tsx
├── lib/
│   ├── api-client.ts                      → Unified Express backend HTTP client (in-memory access token, auto-refresh)
│   ├── auth.ts                            → Authentication state management & session restore
│   ├── utils.ts                           → Shared utility functions (cn)
│   └── constants.ts                       → Shared constants, sensor labels, English / Hindi shell labels
└── types/
    ├── index.ts                           → Global TypeScript types
    └── api.ts                             → Backend Mongoose model types & UI mappings (images=datasets, jobs=runs)
```

---

## Data Flow

### Authentication Flow (Express + JWT + Cookies)

```
User enters email & password on /login
        ↓
POST /api/v1/auth/login
        ↓
Express verifies with bcrypt against MongoDB 'users' collection
        ↓
Signs JWT access token (15m, kept in memory) + signs JWT refresh token (7d)
        ↓
Saves bcrypt hash of refresh token to user.refreshTokenHash in MongoDB
        ↓
Sets HttpOnly cookie 'orbitlens_refresh_token' (path /api/v1/auth)
        ↓
Client stores access token in memory; Next.js redirects to /dashboard
```

### Session Restore Flow (Page Load / Refresh)

```
User visits protected route (/dashboard, /datasets, etc.)
        ↓
Client checks in-memory access token (empty on hard reload)
        ↓
POST /api/v1/auth/refresh (browser automatically attaches HttpOnly cookie)
        ↓
Express verifies refresh token against stored hash in MongoDB 'users'
        ↓
Rotates refresh token and returns new access token
        ↓
If refresh fails or cookie expired → redirect to /login
```

### Dataset Ingestion Flow (Direct Upload via Storage Signed URLs)

```
User selects lunar raster file (GeoTIFF / PDS4)
        ↓
POST /api/v1/images/upload-url (requests presigned upload URL)
        ↓
Storage engine generates HMAC-signed URL (local disk) or S3 presigned PUT URL
        ↓
Client streams raw binary directly to signed URL
        ↓
POST /api/v1/images/:id/confirm
        ↓
Image status marked 'ready', metadata extraction dispatched
```

### Registration Job Execution (Job Queue → ML Service → Artifacts)

```
User configures registration parameters on /new-analysis and clicks Run
        ↓
POST /api/v1/jobs (specifies sourceImageId, referenceImageId, parameters)
        ↓
Job document created in MongoDB 'jobs' collection with status 'queued'
        ↓
Express dispatches job to FastAPI /internal/jobs with X-Internal-Key
        ↓
Python ML service runs pipeline (SIFT detection → FLANN matching → RANSAC homography → sub-pixel refinement)
        ↓
Artifacts saved to storage: registered image (.tif), matchpoints (.json), metrics (.json), preview overlay (.png)
        ↓
FastAPI posts completion callback to POST /api/v1/jobs/:id/status-internal
        ↓
Job status updated to 'complete', metrics and artifact storage keys saved to MongoDB
        ↓
Frontend navigates to /registration/[id] and renders interactive viewers
```

---

## MongoDB Database Schema

### `users` Collection
*Managed by `backend/web-backend/src/modules/users/user.model.ts`*

| Field | Type | Description / Notes |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `name` | String | Full user name |
| `email` | String | Unique, lowercase, indexed |
| `passwordHash` | String | Bcrypt hash (salt rounds: 10) |
| `role` | String | Enum: `'user'`, `'researcher'`, `'admin'` (default: `'user'`) |
| `googleId` | String | Optional (sparse index) |
| `institution` | String | Optional institutional affiliation |
| `storageUsedBytes` | Number | Current storage consumption in bytes |
| `storageQuotaBytes` | Number | Maximum storage quota (default: 10 GB) |
| `failedLoginAttempts` | Number | Consecutive failed attempts counter |
| `lockUntil` | Date | Account lock timestamp (15m lock after 5 failed attempts) |
| `refreshTokenHash` | String | Bcrypt hash of active refresh token for rotation / reuse detection |
| `isVerified` | Boolean | Verification status (default: true) |
| `lastLoginAt` | Date | Last successful authentication timestamp |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

### `projects` Collection
*Managed by `backend/web-backend/src/modules/projects/project.model.ts`*

| Field | Type | Description / Notes |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `userId` | ObjectId | Ref: `User` (indexed) |
| `name` | String | Project name (e.g. "Default Workspace") |
| `description` | String | Optional project description |
| `tags` | [String] | Categorization tags |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

*Index: `{ userId: 1, name: 1 }, { unique: true }` — enforces idempotent default project creation.*

### `images` Collection (UI: "Datasets")
*Managed by `backend/web-backend/src/modules/images/image.model.ts`*

| Field | Type | Description / Notes |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `userId` | ObjectId | Ref: `User` (indexed) |
| `projectId` | ObjectId | Ref: `Project` (optional workspace) |
| `name` | String | Human readable image name |
| `filename` | String | Sanitized original filename |
| `format` | String | Enum: `'GEOTIFF'`, `'PDS4_IMG'`, `'PNG'`, `'JPEG'`, `'TIFF'` |
| `sensor` | String | Enum: `'OHRC'`, `'TMC-2'`, `'IIRS'`, `'LRO_NAC'`, `'LRO_WAC'`, `'KAGUYA'`, `'OTHER'` |
| `resolutionMetersPerPixel` | Number | Ground Sampling Distance (GSD) in meters/pixel |
| `sunAzimuthDeg` | Number | Solar azimuth angle in degrees |
| `sunElevationDeg` | Number | Solar elevation angle in degrees |
| `incidenceAngleDeg` | Number | Solar incidence angle in degrees |
| `emissionAngleDeg` | Number | Sensor emission angle in degrees |
| `phaseAngleDeg` | Number | Phase angle in degrees |
| `acquisitionTime` | Date | Observation acquisition timestamp |
| `storageKey` | String | Physical storage key (e.g. `imagery/<userId>/<timestamp>_<file>`) |
| `fileSizeBytes` | Number | File size in bytes |
| `width` / `height` | Number | Raster pixel dimensions |
| `channels` | Number | Number of radiometric channels / bands |
| `footprint` | GeoJSON | Polygon coordinates for lunar surface coverage |
| `status` | String | Enum: `'pending_upload'`, `'uploaded'`, `'ready'`, `'failed'` |
| `errorMessage` | String | Error details if upload or processing failed |
| `metadataParsed` | Boolean | True once automated header parsing completes |

*Indexes: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, sensor: 1, createdAt: -1 }`, `{ userId: 1, status: 1 }`.*

### `jobs` Collection (UI: "Analysis Runs & Results")
*Managed by `backend/web-backend/src/modules/jobs/job.model.ts`*

| Field | Type | Description / Notes |
| :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key |
| `userId` | ObjectId | Ref: `User` (indexed) |
| `projectId` | ObjectId | Ref: `Project` (optional) |
| `sourceImageId` | ObjectId | Ref: `Image` (the target image to be warped) |
| `referenceImageId` | ObjectId | Ref: `Image` (the base master coordinate frame) |
| `algorithm` | String | Enum: `'classical'` (SIFT/ORB), `'learned'` (SuperPoint) |
| `transformModel` | String | Enum: `'affine'`, `'homography'` (8-DoF) |
| `parameters` | Object | `{ coverageTargetCells, ratioThreshold, ransacReprojThreshold, maxPyramidLevels, illuminationCorrection }` |
| `status` | String | Enum: `'queued'`, `'preprocessing'`, `'matching'`, `'estimating_transform'`, `'warping'`, `'scoring'`, `'complete'`, `'failed'` |
| `progress` | Number | 0 to 100 percentage |
| `statusMessage` | String | Current pipeline stage status string |
| `metrics` | Object | `{ rmse, inlierCount, totalCandidateMatches, inlierRatio, meanReprojectionError, medianReprojectionError, coverageUniformityScore, processingTimeMs, sunAngleDeltaAzimuth, sunAngleDeltaElevation, confidenceWarning }` |
| `artifacts` | Object | `{ registeredImageStorageKey, matchPointsStorageKey, metricsReportStorageKey, previewOverlayStorageKey }` |
| `errorMessage` / `errorCode` | String | Failure code and message if pipeline fails |

*Indexes: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, status: 1, 'metrics.rmse': 1 }`.*

---

## File Storage Architecture

Storage uses a dual-driver system (`backend/web-backend/src/config/storage.ts`):
- **Local Disk Driver**: Stored under `backend/web-backend/storage/bucket/imagery/<userId>/...`. Served via HMAC-SHA256 signed URLs (`/api/v1/storage/download/*` and `/api/v1/storage/upload/*`) validating signature, expiration, and user ownership.
- **S3 Driver**: Direct presigned PUT and GET URLs against an S3/MinIO bucket.
- **Artifact Keys**: Generated results (registered GeoTIFFs, `matchpoints.json`, `metrics.json`) are stored as storage keys on the `Job` document and retrieved via signed download URLs.

---

## Invariants

- Next.js proxies `/api/v1/:path*` to the Express backend; no hardcoded backend URLs in components.
- Access token is kept strictly in memory; never persisted to `localStorage` or `sessionStorage`.
- Refresh token is maintained in an `HttpOnly` same-origin cookie (`orbitlens_refresh_token`).
- All queries and mutations in Express are strictly scoped to the authenticated `userId`.
- Default project ("Default Workspace") is created idempotently on first login/registration using the unique compound index `{ userId: 1, name: 1 }`.
- Every image and job deletion cascades to clean up physical storage files and decrements user storage quota.
