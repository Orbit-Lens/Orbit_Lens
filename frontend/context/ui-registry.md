# UI Registry

Living document. Updated after every component is built. Read this before building any new component — match existing patterns exactly before inventing new ones.

The backend and ML pipeline are complete, and the Stitch design (Login, Dashboard, New Analysis, Registration, Datasets) is the layout reference. The visual language is the government-portal style defined in ui-tokens.md and ui-rules.md (light page, navy chrome, Times New Roman, square panels).

---

## How to Use

Before building any component:
1. Check if a similar component already exists here
2. If yes — match its exact classes
3. If no — build it following ui-rules.md and ui-tokens.md, then add it here

After building any component — update this file with the component name, file path, and exact classes used.

---

## Components

#### TricolourStrip
- **File:** `components/layout/TricolourStrip.tsx`
- **Classes:**
  - Container: `w-full flex h-[6px] shrink-0`
  - Saffron stripe: `flex-1 bg-saffron h-full`
  - White stripe: `flex-1 bg-white h-full border-t border-b border-border-light`
  - Green stripe: `flex-1 bg-india-green h-full`

#### UtilityBar
- **File:** `components/layout/UtilityBar.tsx`
- **Classes:**
  - Bar: `w-full bg-surface-secondary border-b border-border-light text-[0.875rem] text-text-secondary`
  - Inner container: `max-w-[1280px] mx-auto px-4 sm:px-6 h-9 flex items-center justify-between`
  - Skip link: `font-bold text-accent hover:underline focus:bg-surface focus:p-1 focus:outline-3 focus:outline-accent`
  - Text size buttons: `px-1.5 py-0.5 rounded-sm font-bold cursor-pointer text-[0.8125rem]`
  - Contrast & Language toggles: `px-2 py-0.5 text-[0.8125rem] font-bold rounded-sm border cursor-pointer border-border-input bg-surface hover:bg-surface-tertiary`

#### PortalHeader
- **File:** `components/layout/PortalHeader.tsx`
- **Classes:**
  - Container: `w-full bg-surface border-b border-border`
  - Inner container: `max-w-[1280px] mx-auto px-4 sm:px-6 min-h-[96px] py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4`
  - Logo slot: `w-16 h-16 bg-surface border border-border rounded-sm flex items-center justify-center shrink-0 p-1`
  - Site title: `text-[1.625rem] font-bold text-navy leading-tight`
  - Site subtitle: `text-[1.125rem] font-normal text-text-secondary leading-snug`
  - Programme badge: `border border-border bg-surface-secondary px-3 py-1.5 rounded-sm text-right`

#### Navbar
- **File:** `components/layout/Navbar.tsx`
- **Classes:**
  - Bar: `w-full bg-navy border-b border-navy-dark`
  - Inner: `max-w-[1280px] mx-auto px-4 sm:px-6 h-12 flex items-center justify-between`
  - Active Nav Item: `flex items-center px-4 text-[1rem] font-bold text-text-on-navy bg-navy-dark border-b-4 border-saffron text-white`
  - Inactive Nav Item: `flex items-center px-4 text-[1rem] font-bold hover:bg-accent-dark text-text-on-navy-muted hover:text-white`
  - Mobile Menu button: `px-3 py-1.5 text-text-on-navy bg-navy-dark border border-border-light rounded-sm font-bold text-[0.875rem]`

#### Breadcrumb
- **File:** `components/layout/Breadcrumb.tsx`
- **Classes:**
  - Bar: `w-full bg-surface-secondary border-b border-border`
  - Inner: `max-w-[1280px] mx-auto px-4 sm:px-6 h-10 flex items-center text-[0.875rem] text-text-muted`
  - Active page: `font-bold text-text-primary`
  - Link: `text-accent hover:underline`

#### Footer
- **File:** `components/layout/Footer.tsx`
- **Classes:**
  - Bar: `w-full bg-navy-dark text-text-on-navy-muted border-t-2 border-accent-dark mt-auto`
  - Policy links: `text-text-on-navy hover:text-white hover:underline transition-colors`
  - Inner: `max-w-[1280px] mx-auto px-4 sm:px-6 py-8`

#### Panel
- **File:** `components/ui/Panel.tsx`
- **Classes:**
  - Container: `bg-surface border border-border rounded-sm`
  - Header band: `bg-surface-tertiary border-b border-border px-4 py-2.5 flex items-center justify-between`
  - Header title: `text-[1.125rem] font-bold text-accent leading-tight m-0`
  - Body: `p-4`

#### Button
- **File:** `components/ui/Button.tsx`
- **Classes:**
  - Base: `inline-flex items-center justify-center font-bold rounded-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`
  - Primary: `bg-accent hover:bg-accent-dark text-accent-foreground border border-accent-dark`
  - Secondary: `bg-surface border border-accent text-accent hover:bg-accent-muted`
  - Ghost: `bg-transparent text-accent underline hover:bg-accent-muted border-none`

#### Badge
- **File:** `components/ui/Badge.tsx`
- **Classes:**
  - Base: `inline-flex items-center gap-1.5 px-2 py-0.5 text-[0.875rem] font-bold rounded-sm border`
  - Success: `bg-success-light text-success-foreground border-success`
  - Warning: `bg-warning-light text-warning-foreground border-warning`
  - Error: `bg-error-light text-error-foreground border-error`
  - Processing: `bg-accent-light text-accent border-accent`
  - Queued: `bg-surface-tertiary text-text-secondary border-border`

#### SensorBadge
- **File:** `components/ui/SensorBadge.tsx`
- **Classes:**
  - OHRC: `bg-ohrc-light text-ohrc border-ohrc`
  - TMC: `bg-tmc-light text-tmc border-tmc`
  - IIRS: `bg-iirs-light text-iirs border-iirs`

#### AccuracyBar
- **File:** `components/ui/AccuracyBar.tsx`
- **Classes:**
  - Track: `h-2 w-full bg-border-light border border-border rounded-sm overflow-hidden`
  - Fill (<=3m): `bg-success`
  - Fill (3-5m): `bg-success`
  - Fill (5-10m): `bg-warning-fill`
  - Fill (>10m): `bg-error`

#### Landing Page Components
- **Files:**
  - `components/landing/Hero.tsx`
  - `components/landing/DashboardPreview.tsx`
  - `components/landing/HowItWorks.tsx`
  - `components/landing/Features.tsx`

#### TelemetryHUD
- **File:** `components/auth/TelemetryHUD.tsx`
- **Classes:**
  - Container: `relative w-full h-full min-h-[560px] lg:min-h-[700px] bg-black overflow-hidden flex flex-col justify-between border-2 border-navy-dark shadow-inner`
  - Badges: `px-3 py-1 bg-black/80 border border-[#3b82f6]/50 rounded-sm text-xs font-bold tracking-wider text-[#93c5fd]`
  - HUD Card: `max-w-md bg-black/80 border border-slate-700/80 p-3.5 rounded-sm backdrop-blur-md text-white font-mono`
  - Reticle: `relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center`
  - Operational Banner: `relative z-10 bg-[#040914]/95 border-t border-slate-800 p-5 backdrop-blur-md`

#### LoginForm
- **File:** `components/auth/LoginForm.tsx`
- **Classes:**
  - Card: `bg-surface border-2 border-border p-6 sm:p-8 shadow-sm`
  - Emblem: `w-12 h-12 rounded-full border border-border bg-surface-secondary flex items-center justify-center shrink-0`
  - Level-3 Badge: `px-2.5 py-1 bg-red-50 border border-error/40 text-error-foreground rounded-sm text-xs font-bold uppercase tracking-wider`
  - Input: `w-full bg-surface border border-border-input pl-9 pr-3 py-2 text-sm text-text-primary rounded-sm focus:outline-3 focus:outline-accent`
  - Disabled SSO Button: `w-full py-2 px-3 border border-border-light bg-surface-secondary/70 text-text-muted rounded-sm text-xs flex items-center justify-between cursor-not-allowed opacity-80`
  - Gateway Bar: `mt-5 p-3 bg-surface-muted border border-border text-xs space-y-2 font-mono`

#### ProtectedRoute
- **File:** `components/auth/ProtectedRoute.tsx`
- **Classes:**
  - Guard Container: `py-12 flex justify-center items-center`
  - Loading Panel: `max-w-md w-full text-center py-6`

#### DatasetSetupBanner
- **File:** `components/datasets/DatasetSetupBanner.tsx`
- **Classes:**
  - Active notice: `px-4 py-2 bg-surface-secondary border border-border flex flex-wrap items-center justify-between gap-3 text-xs`
  - Empty banner: `p-6 bg-surface border-2 border-accent text-text-primary rounded-sm`

#### DatasetFilters
- **File:** `components/datasets/DatasetFilters.tsx`
- **Classes:**
  - Container: `bg-surface border border-border p-4 mb-4 space-y-4`
  - Search input: `w-full bg-surface border border-border-input pl-9 pr-8 py-2 text-sm font-mono`
  - Coordinate lock tag: `flex items-center gap-2 px-3 py-2 bg-surface-secondary border border-border-input/60 rounded-sm font-mono text-xs`
  - Filter chips: `px-2 py-0.5 rounded-sm font-bold border transition-colors cursor-pointer`

#### DatasetTable
- **File:** `components/datasets/DatasetTable.tsx`
- **Classes:**
  - Table container: `bg-surface border border-border`
  - Header info bar: `px-4 py-2 bg-surface-secondary border-b border-border flex flex-wrap items-center justify-between`
  - Table: `w-full text-left border-collapse`
  - Header row: `bg-navy text-white text-xs font-bold border-b border-navy-dark`
  - Body row selected: `bg-accent-muted border-l-4 border-l-accent`
  - Pagination footer: `px-4 py-3 bg-surface-secondary border-t border-border flex flex-col sm:flex-row items-center justify-between`

#### DatasetDetailDrawer
- **File:** `components/datasets/DatasetDetailDrawer.tsx`
- **Classes:**
  - Drawer container: `bg-surface border-2 border-border p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm`
  - Preview canvas: `relative w-full aspect-square bg-black border border-border rounded-sm overflow-hidden`
  - Telemetry grid: `border border-border-light bg-surface-muted p-3 rounded-sm space-y-2.5 text-xs font-mono`
  - Histogram container: `border border-border p-3 bg-surface rounded-sm space-y-1.5 font-mono`
  - Launch button: `w-full py-2.5 px-4 bg-navy hover:bg-navy-dark text-white font-bold text-sm rounded-sm`

#### DatasetUploadModal
- **File:** `components/datasets/DatasetUploadModal.tsx`
- **Classes:**
  - Backdrop: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs`
  - Modal container: `bg-surface border-2 border-border max-w-xl w-full p-6 space-y-4 shadow-xl`
  - Dropzone: `border-2 border-dashed border-border-input hover:border-accent p-6 text-center cursor-pointer bg-surface-muted`
  - Quota bar: `p-2.5 bg-surface-secondary border border-border flex items-center justify-between text-xs font-mono`

---

## Planned Components — By Screen

### Portal Shell (all pages)
- [x] TricolourStrip
- [x] UtilityBar (skip link, screen reader access, TextSizeControl, ContrastToggle, LanguageToggle)
- [x] PortalHeader (logo slot, site title, subtitle, programme mark slot)
- [x] Navbar (Home, Dashboard, Datasets, New Analysis)
- [x] Breadcrumb
- [x] Footer (policy links, ownership, last-updated)

### Login
- [x] Login card / form (`components/auth/LoginForm.tsx`)
- [x] Lunar Mission Telemetry HUD (`components/auth/TelemetryHUD.tsx`)
- [x] Google OAuth & Gov e-Pramaan SSO buttons (visibly disabled with "Not available in this prototype")
- [x] Institutional email / cryptographic password fields
- [x] Smartcard / hardware token PIN field
- [x] Active gateway security status bar
- [x] Protected route guard (`components/auth/ProtectedRoute.tsx`)

### Datasets
- [x] Setup banner (`components/datasets/DatasetSetupBanner.tsx`)
- [x] DatasetFilters (`components/datasets/DatasetFilters.tsx`)
- [x] DatasetTable (`components/datasets/DatasetTable.tsx`)
- [x] Sensor badge (`components/ui/SensorBadge.tsx`)
- [x] DatasetDetailDrawer (`components/datasets/DatasetDetailDrawer.tsx`)
- [x] DatasetUploadModal (`components/datasets/DatasetUploadModal.tsx`)
- [x] Dataset Details Page (`app/datasets/[id]/page.tsx`)

### Dashboard
- [ ] StatsBar (4 stat cards)
- [ ] RecentActivity list
- [ ] AnalyticsCharts (accuracy over time, sensor coverage, anomalies)
- [ ] Setup banner (no datasets uploaded yet)

### New Analysis
- [ ] SensorSelector (pick OHRC + TMC + IIRS datasets for a region)
- [ ] RunOptions (landmark detection / sub-pixel refinement / illumination normalization toggles)
- [ ] RunStatus (queued / processing / completed / failed states)

### Registration Results
- [ ] CompositeViewer (layer toggle for OHRC/TMC/IIRS)
- [ ] BeforeAfterSlider
- [ ] ConfidenceHeatmap overlay + legend
- [x] AccuracyBar / AccuracyPanel
- [ ] CorrespondencePanel (metrics table, descriptor-distance and reprojection-error histograms, tie-point lines)
- [ ] AnomalyList
- [ ] LandingSuitability score card
- [ ] ExportPanel (GeoTIFF / PDS4 / PDF report)

---

## Shared Primitives

- [x] Panel (`components/ui/Panel.tsx`)
- [x] Button (`components/ui/Button.tsx`)
- [x] Badge (`components/ui/Badge.tsx`)
- [x] SensorBadge (`components/ui/SensorBadge.tsx`)
- [x] AccuracyBar (`components/ui/AccuracyBar.tsx`)
