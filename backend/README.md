# OrbitLens — Backend Engine

> Multi-modal, Sun-angle, and Scale-Invariant Image Correspondence for Chandrayaan-2 Optical Imagery (OHRC, TMC, IIRS)

---

## 🛰️ Architecture Overview

OrbitLens uses a **two-tier decoupled architecture**:

```
[Client / Frontend SPA]
       │
       ▼ (REST / JWT)
[web-backend (Node.js + Express 5 + TypeScript)]  <── Socket.io ──> [Client UI]
       │                                     │
       ▼                                     ▼
 [MongoDB Atlas]                       [Redis Queue]
(Users, Jobs, Metadata)                      │
                                             ▼
                             [processing-service (Python FastAPI)]
                                (OpenCV, PyTorch, NumPy, SciPy)
                                             │
                                             ▼
                              [S3 / MinIO Object Storage]
                             (Raw & Warped GeoTIFF Products)
```

1. **`web-backend/` (Node.js / Express / TypeScript):**
   - Authentication (short-lived JWT + rotated refresh cookies).
   - Projects, Images, and Jobs metadata management.
   - S3 presigned URL generation (raw multi-GB rasters bypass Express memory).
   - Real-time job status streaming over Socket.io.
   - Central error handling and rate-limiting.

2. **`processing-service/` (Python / FastAPI / CV-ML Engine):**
   - Internal-only microservice secured with `INTERNAL_API_KEY`.
   - Ingestion of GeoTIFF, TIFF, PNG, JPEG, and PDS4 labels.
   - Preprocessing: Bilateral filtering, Retinex log-domain illumination correction, and CLAHE radiometric normalization.
   - Multi-scale Gaussian pyramid scale bridging (OHRC ~25cm, TMC ~5m, IIRS ~80m).
   - Classical (SIFT/AKAZE/ORB) and learned feature extraction.
   - Geometric transform estimation: RANSAC / USAC_MAGSAC affine and homography fitting.
   - Uniform spatial coverage grid enforcement.
   - Sub-pixel bicubic/lanczos warping and GeoTIFF output generation.
   - Quantitative evaluation: RMSE, inlier count, inlier ratio, coverage score, reprojection residuals.

---

## 🚀 Quick Start Guide

### 1. Web Backend Setup (`web-backend/`)

```bash
cd web-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run development server (with tsx hot reload)
npm run dev

# Build TypeScript
npm run build

# Type check
npm run lint
```

Default Web Backend URL: `http://localhost:5000`  
- Health probe: `GET http://localhost:5000/health`
- Readiness probe: `GET http://localhost:5000/ready`

---

### 2. Processing Service Setup (`processing-service/`)

```bash
cd processing-service

# Create and activate Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python requirements
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Run FastAPI internal service
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Run end-to-end synthetic pytest test suite
pytest -v tests/test_pipeline.py
```

Default Processing Service URL: `http://localhost:8000`  
- Health probe: `GET http://localhost:8000/health`
- Readiness probe: `GET http://localhost:8000/ready`

---

## 📬 Postman Collection

Import the pre-configured Postman collection and environment located in `web-backend/postman/`:
- `web-backend/postman/collection.json`
- `web-backend/postman/environment.json`

### Standard Request Flow in Postman:
1. `POST /api/v1/auth/register` or `POST /api/v1/auth/login` (stores access token in environment).
2. `POST /api/v1/images/upload-url` for moving (source) image and fixed (reference) image.
3. Upload imagery binary directly to S3/MinIO using the returned `uploadUrl`.
4. `POST /api/v1/images/:id/confirm` to extract metadata and mark image as ready.
5. `POST /api/v1/jobs` with `sourceImageId`, `referenceImageId`, `algorithm`, and `transformModel`.
6. `GET /api/v1/jobs/:id` (poll status or listen via Socket.io).
7. `GET /api/v1/jobs/:id/metrics` (inspect RMSE, inlier count, inlier ratio, coverage score).
8. `GET /api/v1/jobs/:id/artifacts` (download warped GeoTIFF, GeoJSON match points, and metrics JSON).

---

## 🛡️ Security Best Practices Implemented

- ✅ **No Direct Raster Upload to Express:** All imagery transfers use presigned S3 URLs directly to object storage.
- ✅ **Short-Lived Access Tokens:** 15-minute JWT access tokens with 7-day rotated `HttpOnly`, `Secure`, `SameSite=Strict` refresh cookies.
- ✅ **Timing Attack Protection:** Internal service keys and tokens compared with constant-time `crypto.timingSafeEqual()`.
- ✅ **Resource Ownership Protection:** `assertOwnership()` returns 404 (NOT_FOUND) instead of 403 to prevent resource ID harvesting.
- ✅ **NoSQL Injection Sanitization:** `express-mongo-sanitize` on all request payloads.
- ✅ **Rate Limiting:** Distinct limiters for general API, Auth endpoints, and compute-heavy Job submissions.
- ✅ **Strict Zod and Pydantic Validation:** Runtime type validation on every incoming endpoint.
