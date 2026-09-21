# Progress Tracker

Update this file after every completed feature. Any AI agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Phase 3 — New Analysis
**Last completed:** Phase 2: Datasets (04 Datasets Page Full UI matching `datasets.jpeg`, 05 Dataset Upload Logic with signed URLs, 06 Dataset Details Page).
**Next:** Phase 3: 07 New Analysis Page — Full UI matching `analysis.jpeg`

---

## Progress

### Phase 1 — Foundation

- [x] 01 Portal Shell + Landing Page
- [x] 02 Auth
- [x] 03 Database Schema Verification (MongoDB Mongoose models, API contracts, proxy rewrites verified)

### Phase 2 — Datasets Page

- [x] 04 Datasets Page — Full UI (`datasets.jpeg` layout, filters, search, table, detail drawer, DN histogram)
- [x] 05 Dataset Upload Logic (Direct binary upload via HMAC signed URLs, validation, storage quota)
- [x] 06 Dataset Details Page (`/datasets/[id]` telemetry inspector, high-res preview, delete, launch analysis)

### Phase 3 — New Analysis Page

- [ ] 07 New Analysis Page — Full UI
- [ ] 08 Registration Pipeline Integration

### Phase 4 — Registration Results Page

- [ ] 09 Registration Results Page — Full UI
- [ ] 10 Real Registration Data
- [ ] 11 Mission-Readiness Report Generation

### Phase 5 — Dashboard

- [ ] 12 Dashboard Page — Full UI
- [ ] 13 Stats Bar — Real Data
- [ ] 14 Recent Activity — Real Data
- [ ] 15 Analytics Charts — Real Data

### Phase 6 — Government Portal Restyle

- [ ] 16 Government Portal Restyle

---

## Decisions Made During Build

- **Government portal style**: UI follows GIGW-style conventions — light page, navy nav bar, tricolour strip, square bordered panels, Times New Roman only. Affects ui-tokens.md, ui-rules.md, every component.
- **Single font**: Times New Roman is a system font, so no `next/font`. Only weights 400 and 700 are used. `--font-mono` is kept only as an alias of the same stack.
- **Emblem**: no State Emblem of India or agency logo without written authorisation; the header uses the OrbitLens mark.
- **Top navbar kept**: the four-item top navbar (Home, Dashboard, Datasets, New Analysis) replaces any sidebar.
- **MongoDB replaces Supabase**: Backend uses Express + MongoDB + JWT + Storage engine instead of Supabase. Collections: `users`, `projects`, `images` (UI "datasets"), `jobs` (UI "runs & results").
- **Google OAuth and SSO not implemented**: Buttons for Google OAuth and Gov e-Pramaan / Institutional SSO in `signup_in.jpeg` are visibly disabled with the text "Not available in this prototype". Email/password is the sole active authentication method.
- **Default project decision**: "Default Workspace" created once and idempotently on first login/registration using a compound unique index `{ userId: 1, name: 1 }`.
- **Routing decision**: Next.js rewrite proxies `/api/v1/:path*` to the Express backend (`BACKEND_URL`), ensuring same-origin path for the HttpOnly refresh token cookie (`orbitlens_refresh_token`).
- **In-memory access token**: Access token is held strictly in memory in `lib/api-client.ts`; session restored on page reload via `POST /api/v1/auth/refresh`.

---

## Notes

- Express backend runs in `backend/web-backend` (port 5000), ML processing service runs in `backend/processing-service` (port 8000).
- Stitch design reference covers screens: Login, Dashboard, New Analysis, Registration, Datasets. Match these pixel-for-pixel; fall back to ui-rules.md and ui-tokens.md for anything the design doesn't specify.
- The Stitch screens show correspondence metrics (candidates, verified matches, inlier ratio, reprojection error, RMSE, SSIM). SSIM and histograms will be derived from `Job.metrics` and `matchpoints.json` residual arrays.
