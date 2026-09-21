# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

The AI agent on this project operates as a senior engineer. This means:

- **Think before implementing** — understand what is being built and why before writing a single line
- **Read context files first** — never assume, always verify against architecture.md and project-overview.md
- **Scope is sacred** — only build what the current feature requires. Never go beyond scope even if it seems helpful
- **Every feature must be testable** — if it cannot be verified immediately after implementation, it is incomplete
- **Clean over clever** — simple readable code that a junior developer can understand is always preferred over clever abstractions
- **One thing at a time** — complete one feature fully before touching the next
- **Failures are expected** — wrap API service calls in try/catch, log failures, never let one failed run crash the app

---

## TypeScript

- Strict mode enabled in tsconfig.json — no exceptions
- Never use `any` — use `unknown` and narrow the type
- Never use type assertions (`as SomeType`) unless absolutely necessary and commented why
- All function parameters and return types must be explicitly typed
- Use `type` for object shapes and unions — use `interface` only for extendable component props
- All async functions must have proper error handling — never let promises float unhandled
- Use `const` by default — only use `let` when reassignment is necessary

---

## Next.js 16 Conventions

- App Router only — no Pages Router
- All components are Server Components by default
- Only add `"use client"` when the component requires:
  - useState or useReducer
  - useEffect or useSyncExternalStore
  - Browser APIs
  - Event listeners
  - Interactive viewers (composite viewer, before/after slider)
- Never add `"use client"` to layout files unless absolutely required
- Data fetching happens in Server Components or dedicated client hooks via `lib/api-client.ts`
- Caching is uncached by default — all dynamic code runs at request time
- Rewrites proxy `/api/v1/:path*` to the Express backend

---

## File and Folder Naming

- Folders: kebab-case — `new-analysis`, `registration-viewer`
- Component files: PascalCase — `StatsBar.tsx`, `CompositeViewer.tsx`
- Utility files: camelCase — `api-client.ts`, `utils.ts`
- Type files: camelCase — `api.ts`, `index.ts`
- One component per file — never export multiple components from one file
- Index files only in `components/ui/` — never barrel export from other folders

---

## Component Structure

Every component follows this exact order:

```typescript
"use client"; // only if needed

// 1. External imports
import { useState } from "react";
import { Button } from "@/components/ui/Button";

// 2. Internal imports
import { AccuracyBar } from "@/components/ui/AccuracyBar";

// 3. Type definitions
type Props = {
  jobId: string;
  accuracyMeters: number;
};

// 4. Component
export function ComponentName({ jobId, accuracyMeters }: Props) {
  // state
  // derived values
  // handlers
  // return JSX
}
```

- Never use default exports for components — always named exports
- Props type defined directly above the component — not in a separate types file unless shared
- No inline styles — all styling via Tailwind classes using CSS variables from ui-tokens.md
- Fonts: never import a web font — the Times New Roman stack is applied once on `body` in `globals.css`

---

## Backend Communication Pattern

All communication with the Express orchestration API uses `lib/api-client.ts`:

```typescript
import { apiClient } from "@/lib/api-client";
import { Dataset, AnalysisJob } from "@/types/api";

export async function fetchUserDatasets(): Promise<Dataset[]> {
  const res = await apiClient<{ success: boolean; data: Dataset[] }>("/images");
  return res.data;
}
```

- Access token is held strictly in memory — never in `localStorage` or `sessionStorage`
- Refresh token is stored in the `orbitlens_refresh_token` HttpOnly cookie on `/api/v1/auth`
- Session is restored on page load through `POST /api/v1/auth/refresh`
- Every Express query and mutation is strictly scoped to the authenticated `userId`
- Default project ("Default Workspace") is created idempotently on first login/registration using the unique compound index `{ userId: 1, name: 1 }`

---

## Accessibility and Localisation

The portal follows GIGW / WCAG 2.1 AA. In every component:

- Use semantic HTML first (`button`, `a`, `nav`, `main`, `table` with `caption` and `th scope`) — ARIA only where HTML cannot express the role
- Every interactive element is keyboard operable and shows the focus outline from ui-tokens.md
- Every input has a `<label>`; every image has `alt` (or `alt=""` if decorative)
- Never use color as the only signal — pair it with text or an icon
- Sizes are in `rem`, never `px`, for text, so the text-size control works
- Shell labels (nav items, utility bar, footer links) live in `lib/constants.ts` as `{ en, hi }` pairs — never hardcode them in components. Scientific and data labels stay in English
- Downloadable files show their type and size in the link text

---

## Error Handling

- Never use empty catch blocks — always log or handle
- Console errors always include context prefix: `[component/function name]`
- User-facing errors must be human readable — never expose raw error messages
- Backend errors follow standard structure: `{ success: false, error: { code: string, message: string } }`

---

## Environment Variables

All environment variables defined in `.env.local` for development:

| Variable | Used In | Purpose |
| :--- | :--- | :--- |
| `BACKEND_URL` | next.config.ts | Target for Next.js `/api/v1` rewrite proxy (default: `http://localhost:5000`) |
| `NEXT_PUBLIC_APP_URL` | lib/api-client.ts | Public frontend application origin |

---

## Accuracy Threshold

The registration accuracy pass/fail threshold is defined once as a constant:

```typescript
// lib/constants.ts
export const ACCURACY_THRESHOLD_METERS = 5;
```
