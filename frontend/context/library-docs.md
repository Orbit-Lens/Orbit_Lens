# Library Docs

Project-specific usage patterns for every third party library in this project. This file covers how we use each library in OrbitLens.

---

## Fonts

No external font library is used. Times New Roman is a system font applied through `--font-sans` in `globals.css`. Do not add `next/font`, `@fontsource/*`, or Google Fonts links. `@react-pdf/renderer` uses its built-in `Times-Roman` and `Times-Bold` to match the UI typography.

---

## Express Backend API Client & JWT Auth

OrbitLens uses a Node/Express backend (`backend/web-backend`) with MongoDB (Mongoose `^8.10.0`). The Next.js frontend interacts with it through Next.js rewrites at `/api/v1/:path*` to keep refresh token cookies same-origin.

### API Client (`lib/api-client.ts`)

- Access token is held **strictly in memory** inside `lib/api-client.ts` (never persisted to `localStorage` or `sessionStorage` to mitigate XSS attacks).
- On initial application load or refresh, the client calls `POST /api/v1/auth/refresh`. The browser automatically includes the `HttpOnly` cookie (`orbitlens_refresh_token`).
- If an API request receives a 401 `TOKEN_EXPIRED`, the API client automatically attempts one token refresh and replays the original request.
- If refresh fails or returns 401, the user's session is cleared and they are redirected to `/login`.

```typescript
// lib/api-client.ts pattern
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (inMemoryAccessToken) {
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }
  headers.set("Content-Type", "application/json");

  let response = await fetch(`/api/v1${endpoint}`, {
    ...options,
    headers,
    credentials: "same-origin", // transmits HttpOnly refresh cookie
  });

  if (response.status === 401 && endpoint !== "/auth/refresh") {
    // Attempt token rotation
    const refreshRes = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setAccessToken(data.data.accessToken);
      headers.set("Authorization", `Bearer ${data.data.accessToken}`);
      response = await fetch(`/api/v1${endpoint}`, { ...options, headers, credentials: "same-origin" });
    }
  }

  return response.json();
}
```

### Storage Engine & Signed URLs

- Images and artifacts are managed through the backend storage engine (`storageDriver: 'local' | 's3'`).
- Uploading imagery:
  1. Client calls `POST /api/v1/images/upload-url` receiving a signed upload URL.
  2. Client uploads raw binary directly to the URL via `PUT`.
  3. Client calls `POST /api/v1/images/:id/confirm` to mark the image ready and trigger metadata extraction.
- Downloading artifacts:
  1. Client calls `GET /api/v1/images/:id/download-url` or `GET /api/v1/jobs/:id/artifacts` to receive short-lived HMAC-signed download URLs.

---

## FastAPI Processing Service

Deployed separately in `backend/processing-service`. The frontend never calls the FastAPI service directly. The Express backend orchestrates jobs, calling the ML service via `POST /internal/jobs` with the `X-Internal-Key` header. Status and progress updates are posted back to Express at `POST /api/v1/jobs/:id/status-internal`.

---

## @react-pdf/renderer

Used only for the mission-readiness report generated from a completed registration run.

```typescript
import { renderToBuffer } from "@react-pdf/renderer";
import { MissionReport } from "@/components/registration/MissionReport";

const buffer = await renderToBuffer(<MissionReport job={jobData} />);
```

- Report layout lives in `components/registration/MissionReport.tsx`.
- Uses built-in `Times-Roman` and `Times-Bold` font families to match the UI.
- Formats photogrammetric specifications, tie-point residual tables, and landing hazard scores into an official exportable PDF.

---

## recharts

Used for dashboard analytics charts (`PipelineActivityChart`, `InstrumentRatioChart`).

```typescript
import { LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
```

- Charts are Client Components (`"use client"`).
- Series colors use tokens: `var(--color-accent)`, `var(--color-success)`, `var(--color-error)`.
- Axis labels use Times New Roman (`var(--font-sans)`), 13px, `var(--color-text-muted)`.
- Every chart has an accessible "View data table" alternative toggle rendering an HTML `<table>`.
