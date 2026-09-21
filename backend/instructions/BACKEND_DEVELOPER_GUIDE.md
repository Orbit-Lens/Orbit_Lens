# 🛰️ OrbitLens Backend — Master API & Developer Guide

Welcome to the **OrbitLens Backend System**. This document provides an exhaustive, production-grade guide designed to enable any developer to pick up development immediately where the team left off.

It covers:
- **System Architecture & Component Overview**
- **Developer Onboarding & Local Environment Setup**
- **Database Schema & Data Dictionary**
- **Unified Response Schema & Error Taxonomy**
- **Exhaustive Status Codes & Action Scenario Matrix**
- **Complete Endpoints Specification (with Success, Update, Discard, Approve & Error Scenarios)**
- **Presigned S3 Upload & Async Queue Workflows**
- **Technical Debt & Roadmap for Incoming Developers**

---

## 1. System Architecture & Component Overview

OrbitLens utilizes a **Dual-Service Microservices Architecture**:

```mermaid
graph TD
    Client["Frontend Client (React/Vite)"] -->|HTTP / REST| WebBackend["Node.js / Express Web Backend (Port 5000)"]
    Client -->|Direct S3 PUT/GET| S3["AWS S3 / MinIO Storage"]
    Client <-->|WebSockets| SocketIO["Socket.IO Server"]
    WebBackend <-->|Auth & Metadata| Mongo["MongoDB Atlas (Orbit_Lens DB)"]
    WebBackend <-->|Queue Jobs| Redis["Redis + BullMQ (Port 6379)"]
    WebBackend -->|Dispatch Job| ProcService["Python FastAPI Processing Service (Port 8000)"]
    ProcService <-->|Fetch/Put TIF Imagery| S3
    ProcService -->|Status Callback (X-Internal-Key)| WebBackend
    WebBackend -->|Postman Sync| PostmanMCP["Postman MCP Server"]
```

### Key Core Components
1. **Web Backend (`orbitlens-web-backend`)**:
   - **Tech Stack**: Node.js v22+, TypeScript, Express 4.x, Mongoose, Zod validation, JWT, Winston logging.
   - **Port**: `5000`
   - **Role**: Handles user authentication, project management, presigned URL generation, job queuing, WebSocket notifications, and API security.
2. **Processing Service (`orbitlens-processing-service`)**:
   - **Tech Stack**: Python 3.10+, FastAPI, OpenCV, PyTorch / LoFTR, Rasterio, GDAL.
   - **Port**: `8000`
   - **Role**: Executes sub-pixel feature extraction, homography/affine transformation, illumination correction, and RMSE scoring on lunar imagery.
3. **Database**:
   - **MongoDB Atlas** (`Orbit_Lens` database). Includes auto-fallback to embedded `MongoMemoryServer` for local offline development.
4. **Queue & Caching**:
   - **Redis + BullMQ**. Includes auto-fallback to `direct_http_dispatch` if Redis is offline.
5. **Object Storage**:
   - **AWS S3 / MinIO**. All heavy TIF imagery transfers bypass the backend via AWS S3 Presigned URLs.

---

## 2. Developer Onboarding & Quickstart

### Prerequisites
- Node.js `v20+` or `v22+`
- Python `3.10+`
- npm `v10+`
- (Optional) Docker for local Redis and MinIO

### Step 1: Clone & Configure Environment Variables
Navigate to `backend/web-backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xtl4thh.mongodb.net/Orbit_Lens
JWT_ACCESS_SECRET=413f9afef2667382689454144ff0c173
JWT_REFRESH_SECRET=ad2ffa773350ace9f5f7b8c4e0a66fcb
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=orbitlens-imagery
PROCESSING_SERVICE_URL=http://localhost:8000
PROCESSING_SERVICE_API_KEY=shared_internal_orbitlens_secret_key_123
```

### Step 2: Install Dependencies & Run Database Seed
```bash
# Navigate to web backend
cd backend/web-backend

# Install NPM packages
npm install

# Seed default database user and sample projects
npm run seed
```

Default Seeded Account:
- **Email**: `sakthivel@orbitlens.app`
- **Password**: `Password123`
- **Role**: `admin`

### Step 3: Start Development Server
```bash
npm run dev
```

Check health status:
- Liveness: `http://localhost:5000/health`
- Readiness: `http://localhost:5000/ready`

---

## 3. Database Schema & Data Dictionary

### Collection: `users`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes | Primary Key |
| `name` | String | Yes | Full Name (min 2 chars) |
| `email` | String | Yes | Unique Email address |
| `passwordHash` | String | Yes | bcrypt hashed password |
| `role` | String | Yes | Enum: `'user' \| 'researcher' \| 'admin'` |
| `createdAt` | Date | Auto | ISO timestamp |
| `updatedAt` | Date | Auto | ISO timestamp |

### Collection: `projects`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes | Primary Key |
| `userId` | ObjectId | Yes | Reference to `users._id` |
| `name` | String | Yes | Project title |
| `description` | String | No | Detailed description |
| `tags` | Array<String> | No | Keywords (e.g. `['chandrayaan-2', 'ohrc']`) |
| `createdAt` | Date | Auto | ISO timestamp |
| `updatedAt` | Date | Auto | ISO timestamp |

### Collection: `images`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes | Primary Key |
| `userId` | ObjectId | Yes | Reference to `users._id` |
| `projectId` | ObjectId | No | Optional reference to `projects._id` |
| `name` | String | Yes | Display name |
| `filename` | String | Yes | Original filename |
| `s3Key` | String | Yes | Storage object key in S3 |
| `contentType` | String | Yes | MIME type (`image/tiff`, `image/png`) |
| `format` | String | Yes | Enum: `'GEOTIFF' \| 'PDS4_IMG' \| 'PNG' \| 'JPEG' \| 'TIFF'` |
| `sensor` | String | Yes | Enum: `'OHRC' \| 'TMC-2' \| 'IIRS' \| 'LRO_NAC' \| 'LRO_WAC' \| 'KAGUYA' \| 'OTHER'` |
| `status` | String | Yes | Enum: `'pending_upload' \| 'uploaded' \| 'failed'` |
| `fileSizeBytes` | Number | No | File size in bytes |
| `resolutionMetersPerPixel` | Number | No | Spatial resolution (e.g. `0.25`) |
| `sunAzimuthDeg` | Number | No | Sun azimuth angle (0-360°) |
| `sunElevationDeg` | Number | No | Sun elevation angle (-90 to +90°) |

### Collection: `jobs`
| Field | Type | Required | Description |
|---|---|---|---|
| `_id` | ObjectId | Yes | Primary Key |
| `userId` | ObjectId | Yes | Reference to `users._id` |
| `projectId` | ObjectId | No | Reference to `projects._id` |
| `sourceImageId` | ObjectId | Yes | Reference to `images._id` |
| `referenceImageId` | ObjectId | Yes | Reference to `images._id` |
| `algorithm` | String | Yes | Enum: `'classical' \| 'learned'` |
| `transformModel` | String | Yes | Enum: `'affine' \| 'homography'` |
| `status` | String | Yes | Enum: `'queued' \| 'preprocessing' \| 'matching' \| 'estimating_transform' \| 'warping' \| 'scoring' \| 'complete' \| 'failed'` |
| `progress` | Number | Yes | 0 to 100 percentage |
| `metrics` | Object | No | `{ rmse, inlierCount, totalCandidateMatches, inlierRatio, meanReprojectionError }` |
| `artifacts` | Object | No | `{ registeredImageStorageKey, matchPointsStorageKey, metricsReportStorageKey }` |

---

## 4. Unified Response Schema & Error Taxonomy

All API endpoints strictly adhere to a consistent JSON response shape.

### Success Response Format (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response Format (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable summary of what went wrong",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address"
      }
    ]
  }
}
```

### Complete Error Code Matrix
| Error Code | HTTP Status | Trigger Condition |
|---|---|---|
| `VALIDATION_ERROR` | `400` | Zod schema validation failed (missing/invalid body fields) |
| `INVALID_ID` | `400` | Invalid MongoDB ObjectId string format |
| `SAME_IMAGE_SELECTION` | `400` | Source and reference image IDs are identical |
| `UNAUTHORIZED` | `401` | Missing, expired, or invalid JWT Bearer token |
| `FORBIDDEN` | `403` | User does not own the requested resource or lacks Admin role |
| `NOT_FOUND` | `404` | Requested record, image, job, or route does not exist |
| `USER_EXISTS` | `409` | Email address is already registered |
| `RATE_LIMIT_EXCEEDED` | `429` | Exceeded endpoint rate limit threshold |
| `INTERNAL_SERVER_ERROR` | `500` | Uncaught exception or server bug |
| `DEPENDENCY_NOT_READY` | `503` | MongoDB, Redis, or S3 dependency connection down |

---

## 5. HTTP Status Codes & Action Scenario Matrix

| Scenario Type | HTTP Code | Real-World Application |
|---|---|---|
| **Success (Fetch/Read)** | `200 OK` | Successfully retrieved profile, projects, images, or job metrics |
| **Success (Created)** | `201 Created` | Registered new user, created project, generated upload URL, queued job |
| **Action: Change / Update** | `200 OK` | Successfully updated project tags, user profile name, or image metadata |
| **Action: Discard / Delete** | `200 OK` | Successfully deleted project, image, or canceled registration job |
| **Action: Approve / Confirm** | `200 OK` | Confirmed S3 image upload completion, verified job internal status callback |
| **Client Error: Bad Body** | `400 Bad Request` | Missing password in login, password too weak, invalid status enum |
| **Security: Unauthenticated** | `401 Unauthorized` | Calling `/users/me` without `Authorization: Bearer <token>` |
| **Security: Permission** | `403 Forbidden` | Non-admin user attempting to view contact messages |
| **Not Found** | `404 Not Found` | Requesting non-existent job ID `/jobs/60d5ec49f1a2c80015f8a000` |
| **Conflict** | `409 Conflict` | Attempting to register an email address that already exists |
| **Rate Limit** | `429 Too Many Requests` | Attempting >5 auth attempts per minute or >10 job submissions/min |
| **System Down** | `503 Service Unavailable` | Backend database is disconnecting or undergoing maintenance |

---

## 6. Complete API Endpoints Specification

Below is the complete specification for all backend categories, documenting **Success**, **Update**, **Discard**, **Approve**, and **Error** scenarios.

---

### Category 1: System & Health

#### Endpoint: `GET /health`
- **Auth**: None (Public)
- **Description**: Returns backend liveness state.

##### Scenario: Success (200 OK)
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-09-07T21:10:00.000Z",
    "service": "orbitlens-web-backend",
    "version": "1.0.0"
  }
}
```

---

#### Endpoint: `GET /ready`
- **Auth**: None (Public)
- **Description**: Verifies status of MongoDB, Redis queue, and FastAPI processing service.

##### Scenario: Success (200 OK)
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "mongodb": { "status": "connected" },
    "redis": { "status": "connected", "mode": "bullmq_queue" },
    "processingService": { "status": "healthy", "service": "orbitlens-processing-service" }
  }
}
```

##### Scenario: Error — Dependency Not Ready (503 Service Unavailable)
```json
{
  "success": false,
  "error": {
    "code": "DEPENDENCY_NOT_READY",
    "message": "One or more required backend dependencies (MongoDB) are not connected yet."
  }
}
```

---

### Category 2: Authentication

#### Endpoint: `POST /api/v1/auth/register`
- **Auth**: None (Public)

##### Scenario 1: Success (201 Created)
- **Request Body**:
```json
{
  "name": "Sakthivel Prakash",
  "email": "newuser@orbitlens.app",
  "password": "Password123",
  "role": "user"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "6a9e6120f22b86a60022d980",
      "name": "Sakthivel Prakash",
      "email": "newuser@orbitlens.app",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

##### Scenario 2: Error — Email Already Registered (409 Conflict)
```json
{
  "success": false,
  "error": {
    "code": "USER_EXISTS",
    "message": "User with this email already exists"
  }
}
```

##### Scenario 3: Error — Validation Failure (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "password",
        "message": "Password must contain at least one uppercase letter"
      }
    ]
  }
}
```

---

#### Endpoint: `POST /api/v1/auth/login`
- **Auth**: None (Public)

##### Scenario 1: Success (200 OK)
- **Request Body**:
```json
{
  "email": "sakthivel@orbitlens.app",
  "password": "Password123"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "6a9d6ad0f14be50d908ad7bc",
      "name": "Sakthivel Prakash",
      "email": "sakthivel@orbitlens.app",
      "role": "admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

##### Scenario 2: Error — Invalid Credentials (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

---

#### Endpoint: `POST /api/v1/auth/refresh`
- **Auth**: Cookie-based Refresh Token

##### Scenario 1: Success (200 OK)
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

---

### Category 3: User Management

#### Endpoint: `GET /api/v1/users/me`
- **Auth**: Required (`Authorization: Bearer <token>`)

##### Scenario 1: Success (200 OK)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "6a9d6ad0f14be50d908ad7bc",
      "name": "Sakthivel Prakash",
      "email": "sakthivel@orbitlens.app",
      "role": "admin",
      "createdAt": "2026-09-07T12:00:00.000Z"
    }
  }
}
```

##### Scenario 2: Error — Missing Token (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid access token."
  }
}
```

---

#### Endpoint: `PUT /api/v1/users/me` (Action Scenario: Change / Update Profile)
- **Auth**: Required (`Authorization: Bearer <token>`)

##### Scenario 1: Change Profile Name (200 OK)
- **Request Body**:
```json
{
  "name": "Dr. Sakthivel Prakash"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "6a9d6ad0f14be50d908ad7bc",
      "name": "Dr. Sakthivel Prakash",
      "email": "sakthivel@orbitlens.app",
      "role": "admin"
    }
  }
}
```

---

#### Endpoint: `DELETE /api/v1/users/me` (Action Scenario: Discard / Delete Account)
- **Auth**: Required (`Authorization: Bearer <token>`)

##### Scenario 1: Account Deletion Confirmed (200 OK)
- **Request Body**:
```json
{
  "confirmation": "DELETE MY ACCOUNT"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "User account permanently deleted"
}
```

##### Scenario 2: Error — Confirmation Literal Mismatch (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "confirmation",
        "message": "Invalid enum value. Expected 'DELETE MY ACCOUNT'"
      }
    ]
  }
}
```

---

### Category 4: Projects Management

#### Endpoint: `POST /api/v1/projects`
- **Auth**: Required (`Authorization: Bearer <token>`)

##### Scenario 1: Create Project (201 Created)
- **Request Body**:
```json
{
  "name": "Chandrayaan-2 South Pole Crater Alignment",
  "description": "Registration and radiometric normalization of OHRC 25cm and TMC 5m images.",
  "tags": ["chandrayaan-2", "ohrc", "lunar-crater"]
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "project": {
      "id": "6a9e6540f22b86a60022d990",
      "userId": "6a9d6ad0f14be50d908ad7bc",
      "name": "Chandrayaan-2 South Pole Crater Alignment",
      "description": "Registration and radiometric normalization of OHRC 25cm and TMC 5m images.",
      "tags": ["chandrayaan-2", "ohrc", "lunar-crater"],
      "createdAt": "2026-09-07T21:00:00.000Z"
    }
  }
}
```

---

#### Endpoint: `PUT /api/v1/projects/:id` (Action Scenario: Update Project)
- **Auth**: Required (`Authorization: Bearer <token>`)

##### Scenario 1: Change Title & Tags (200 OK)
- **Request Body**:
```json
{
  "name": "Chandrayaan-2 South Pole Crater Alignment (Phase 2)",
  "tags": ["chandrayaan-2", "ohrc", "tmc", "sub-pixel"]
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "project": {
      "id": "6a9e6540f22b86a60022d990",
      "name": "Chandrayaan-2 South Pole Crater Alignment (Phase 2)",
      "tags": ["chandrayaan-2", "ohrc", "tmc", "sub-pixel"]
    }
  }
}
```

---

#### Endpoint: `DELETE /api/v1/projects/:id` (Action Scenario: Discard Project)
- **Auth**: Required (`Authorization: Bearer <token>`)

##### Scenario 1: Project Deleted (200 OK)
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

##### Scenario 2: Error — Project Not Found (404 Not Found)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found or access denied"
  }
}
```

---

### Category 5: Images & Presigned S3 Management

#### Endpoint: `POST /api/v1/images/upload-url`
- **Auth**: Required (`Authorization: Bearer <token>`)
- **Description**: Generates a secure AWS S3 presigned PUT URL allowing direct browser-to-S3 TIF upload.

##### Scenario 1: Success (201 Created)
- **Request Body**:
```json
{
  "name": "Chandrayaan-2 OHRC Crater Image",
  "filename": "ohrc_lunar_crater_001.tif",
  "contentType": "image/tiff",
  "format": "GEOTIFF",
  "sensor": "OHRC",
  "resolutionMetersPerPixel": 0.25,
  "sunAzimuthDeg": 145.2,
  "sunElevationDeg": 32.5
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "imageId": "6a9e7010f22b86a60022d9a5",
    "uploadUrl": "https://s3.amazonaws.com/orbitlens-imagery/raw/6a9e7010.tif?AWSAccessKeyId=...",
    "s3Key": "raw/6a9e7010f22b86a60022d9a5_ohrc_lunar_crater_001.tif"
  }
}
```

---

#### Endpoint: `POST /api/v1/images/:id/confirm` (Action Scenario: Approve / Confirm S3 Upload)
- **Auth**: Required (`Authorization: Bearer <token>`)
- **Description**: Client notifies backend after completing S3 upload. Backend verifies S3 object and changes status to `uploaded`.

##### Scenario 1: S3 Upload Approved & Confirmed (200 OK)
- **Request Body**:
```json
{
  "fileSizeBytes": 10485760,
  "width": 4096,
  "height": 4096,
  "channels": 1
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Image upload confirmed successfully",
  "data": {
    "image": {
      "id": "6a9e7010f22b86a60022d9a5",
      "status": "uploaded",
      "fileSizeBytes": 10485760,
      "width": 4096,
      "height": 4096
    }
  }
}
```

---

### Category 6: Image Registration Jobs

#### Endpoint: `POST /api/v1/jobs`
- **Auth**: Required (`Authorization: Bearer <token>`)
- **Description**: Enqueues sub-pixel registration job between source and reference lunar images.

##### Scenario 1: Success — Job Queued (201 Created)
- **Request Body**:
```json
{
  "sourceImageId": "6a9e7010f22b86a60022d9a5",
  "referenceImageId": "6a9e7011f22b86a60022d9a6",
  "algorithm": "classical",
  "transformModel": "homography",
  "parameters": {
    "coverageTargetCells": 64,
    "ratioThreshold": 0.75,
    "ransacReprojThreshold": 3.0,
    "maxPyramidLevels": 4,
    "illuminationCorrection": true
  }
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Registration job enqueued successfully",
  "data": {
    "job": {
      "id": "6a9e8100f22b86a60022d9b2",
      "status": "queued",
      "progress": 0,
      "algorithm": "classical",
      "transformModel": "homography"
    }
  }
}
```

##### Scenario 2: Error — Same Source and Reference Selected (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "SAME_IMAGE_SELECTION",
    "message": "Source and reference images must be different"
  }
}
```

---

#### Endpoint: `POST /api/v1/jobs/:id/status-internal` (Action Scenario: Approve / Update Internal Callback)
- **Auth**: Internal Secret Header (`X-Internal-Key: shared_internal_orbitlens_secret_key_123`)
- **Description**: Python FastAPI processing service pushes execution status and sub-pixel alignment metrics.

##### Scenario 1: Job Status Completed (200 OK)
- **Request Body**:
```json
{
  "status": "complete",
  "progress": 100,
  "statusMessage": "Registration completed successfully",
  "metrics": {
    "rmse": 0.42,
    "inlierCount": 384,
    "totalCandidateMatches": 512,
    "inlierRatio": 0.75,
    "meanReprojectionError": 0.38,
    "medianReprojectionError": 0.35,
    "coverageUniformityScore": 0.88,
    "processingTimeMs": 1420
  }
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Job status updated successfully"
}
```

##### Scenario 2: Error — Invalid Internal Secret (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid internal API key"
  }
}
```

---

## 7. Key Workflows & Sequence Diagrams

### Direct S3 Presigned Upload Sequence
```
Client                      Web Backend                     AWS S3
  |                              |                            |
  |-- 1. POST /images/upload-url ->|                            |
  |                              |-- 2. Generate Presigned -> |
  |<- 3. Return Presigned URL ---|                            |
  |                                                           |
  |-- 4. Direct PUT Raw TIF Image Binary Bytes --------------->|
  |<- 5. 200 OK Upload Successful ----------------------------|
  |                                                           |
  |-- 6. POST /images/:id/confirm --------------------------->|
  |                              |-- 7. Update status DB ---->|
  |<- 8. 200 OK Upload Confirmed |                            |
```

---

## 8. Technical Debt & Next Steps for Incoming Developers

1. **GPU Acceleration in Processing Service**:
   - Currently defaults to CPU-bound OpenCV matcher. To enable CUDA acceleration for LoFTR deep learning matcher, set `USE_GPU=true` in `processing-service/.env` and build Docker image with CUDA 12 support.
2. **S3 Presigned Multi-part Upload**:
   - Files >100MB should be upgraded to S3 Multipart Upload endpoints in `src/modules/images/image.service.ts`.
3. **Automated Integration Testing**:
   - Run existing unit/db tests using `npm run test:db`. Consider adding Supertest endpoints coverage in `tests/`.

---

*Documentation compiled & validated for OrbitLens Version 1.0.0.*
