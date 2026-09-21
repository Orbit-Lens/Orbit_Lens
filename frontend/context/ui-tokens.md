# UI Tokens

Design tokens for OrbitLens. The interface follows the visual language of an official Indian central government web portal (GIGW / india.gov.in style): light page, navy header and navigation, tricolour accent strip, square-edged panels, bordered tables, **Times New Roman** throughout. The dark Stitch screens (Login, Dashboard, New Analysis, Registration, Datasets) remain the layout and content reference; every colour, font, radius and component value below **replaces** the dark theme values used in those screens. Use these exact values throughout the codebase — never hardcode colors or use raw Tailwind color classes in components.

All text and background pairs below were checked against WCAG 2.1 AA (4.5:1 for text). Do not change a colour without re-checking its contrast.

---

## How to Use

This project uses **Tailwind CSS v4**. All design tokens are defined using the `@theme` directive in `app/globals.css`. No `tailwind.config.ts` needed for colors or tokens.

Tailwind v4 automatically generates utility classes from `@theme` variables:

- `--color-accent` → `bg-accent`, `text-accent`, `border-accent`
- `--color-surface` → `bg-surface`, `text-surface`, `border-surface`

```tsx
// Correct — uses generated utility classes
className="bg-surface text-text-primary border-border"

// Also correct — references CSS variable directly
style={{ color: 'var(--color-text-primary)' }}

// Never — hardcoded hex values
className="bg-[#0B2A5B] text-[#1A1A1A]"

// Never — raw Tailwind color classes
className="bg-blue-900 text-slate-300"
```

---

## globals.css — Complete Token Definition

```css
@import "tailwindcss";

@theme {
  /* Fonts — one family for everything. Times New Roman is a system font: no next/font, no Google Fonts.
     Devanagari fallbacks keep Hindi labels legible on systems where Times New Roman has no glyphs. */
  --font-sans: "Times New Roman", Times, "Liberation Serif", "Noto Serif Devanagari", Mangal, serif;
  --font-mono: "Times New Roman", Times, "Liberation Serif", "Noto Serif Devanagari", Mangal, serif;

  /* Page and surface backgrounds — light government portal base */
  --color-background: #f3f6fb;
  --color-surface: #ffffff;
  --color-surface-secondary: #eef3fa;
  --color-surface-tertiary: #e3eaf5;
  --color-surface-muted: #f8fafd;

  /* Navy chrome — nav bar, table headers, footer */
  --color-navy: #0b2a5b;
  --color-navy-dark: #071c3f;
  --color-text-on-navy: #ffffff;
  --color-text-on-navy-muted: #c9d6ec;

  /* Borders — visible, as on official portals */
  --color-border: #b8c2d3;
  --color-border-light: #d5dce8;
  --color-border-muted: #e3e8f0;
  --color-border-input: #6b7a90;

  /* Text */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #3d4a5c;
  --color-text-muted: #5a6678;
  --color-text-dark: #1f2d45;
  --color-text-darkest: #000000;

  /* Primary accent — government navy blue */
  --color-accent: #0b3b8c;
  --color-accent-dark: #082b66;
  --color-accent-light: #dce7f8;
  --color-accent-muted: #eaf1fc;
  --color-accent-foreground: #ffffff;
  --color-link-visited: #5b2c83;

  /* National colours — decorative use only (tricolour strip, active nav marker, focus ring) */
  --color-saffron: #ff9933;
  --color-saffron-dark: #b35400;
  --color-saffron-light: #fff1e0;
  --color-india-green: #138808;
  --color-chakra: #000080;

  /* Success — registration/accuracy green */
  --color-success: #0f6b2e;
  --color-success-dark: #0a4d21;
  --color-success-light: #d6eddd;
  --color-success-lightest: #eaf6ee;
  --color-success-foreground: #0a4d21;

  /* Warning — moderate accuracy / caution */
  --color-warning: #8a5300;
  --color-warning-fill: #e08a00;
  --color-warning-light: #fff0cc;
  --color-warning-foreground: #6b4100;

  /* Error — failed run / low accuracy */
  --color-error: #b3261e;
  --color-error-light: #fbe3e1;
  --color-error-foreground: #8c1d18;

  /* Sensor badge colors */
  --color-ohrc: #0b3b8c;
  --color-ohrc-light: #dce7f8;
  --color-tmc: #0f6b2e;
  --color-tmc-light: #d6eddd;
  --color-iirs: #6b21a8;
  --color-iirs-light: #ebddf7;

  /* Image viewer surfaces — the only dark surfaces in the app, so lunar imagery keeps its contrast */
  --color-overlay: #0a0f1a;
  --color-overlay-dark: #05080f;
  --color-text-on-overlay: #f2f5fa;

  /* Border radius — square, official look */
  --radius-sm: 2px;
  --radius-md: 2px;
  --radius-lg: 4px;
  --radius-xl: 4px;
  --radius-full: 9999px;
}

/* Text size control (A- / A / A+ in the utility bar). All sizes are in rem so they scale. */
html { font-size: 16px; }
html[data-text-size="sm"] { font-size: 14px; }
html[data-text-size="lg"] { font-size: 18px; }

/* High contrast mode (utility bar toggle) */
html[data-theme="contrast"] {
  --color-background: #000000;
  --color-surface: #000000;
  --color-surface-secondary: #0d0d0d;
  --color-surface-tertiary: #1a1a1a;
  --color-navy: #000000;
  --color-navy-dark: #000000;
  --color-border: #ffffff;
  --color-border-light: #ffffff;
  --color-border-input: #ffffff;
  --color-text-primary: #ffffff;
  --color-text-secondary: #ffffff;
  --color-text-muted: #f2f2f2;
  --color-accent: #ffeb3b;
  --color-accent-foreground: #000000;
  --color-link-visited: #ffb3ff;
}
```

Tailwind v4 generates utility classes automatically from every `--color-*` token above:

- `bg-accent`, `text-accent`, `border-accent`
- `bg-navy`, `text-text-on-navy`
- `bg-success-light`, `text-text-muted`
- etc.

---

## Color Usage Guide

### Page Layout

| Element           | Token                  |
| ----------------- | ---------------------- |
| Page background   | `bg-background`        |
| Panel / surface   | `bg-surface`           |
| Panel header band | `bg-surface-tertiary`  |
| Secondary surface | `bg-surface-secondary` |
| Nav bar, table header row | `bg-navy` with `text-text-on-navy` |
| Footer            | `bg-navy-dark` with `text-text-on-navy-muted` |
| Default border    | `border-border`        |
| Light border      | `border-border-light`  |

### Typography

| Element                 | Token                            |
| ------------------------ | --------------------------------- |
| Headings, primary text   | `text-text-primary` (#1A1A1A)     |
| Secondary text, labels   | `text-text-secondary` (#3D4A5C)   |
| Meta, timestamps, placeholder | `text-text-muted` (#5A6678)  |
| Panel titles, links      | `text-accent` (#0B3B8C)           |
| Metric values            | `text-text-primary` with `tabular-nums` |

### Accent (Government Navy)

Used for: primary buttons, links, panel titles, control point markers, focus outline, OHRC sensor tag.

| Element                | Token                    |
| ----------------------- | ------------------------- |
| Button background       | `bg-accent`               |
| Button hover            | `bg-accent-dark`          |
| Button text              | `text-accent-foreground`  |
| Light badge background   | `bg-accent-light`         |
| Subtle background        | `bg-accent-muted`         |

### National colours (decorative only)

Saffron, white and green are used **only** for the tricolour strip, the active-nav marker and the focus ring. Never use saffron or India green as the sole carrier of meaning and never for body text. For text that must be orange use `text-saffron-dark`.

### Registration Accuracy Colors

Accuracy badges and the confidence heatmap legend use gradient stops based on accuracy range. Every state also shows a text label — colour is never the only signal.

| Accuracy Range      | Meaning        | Token                                  |
| --------------------- | ---------------- | ----------------------------------------- |
| ≤ 3m                  | High confidence   | `text-success` / `bg-success-lightest`   |
| 3m – 5m                | Acceptable        | `text-success` / `bg-success-light`      |
| 5m – 10m               | Caution           | `text-warning` / `bg-warning-light`      |
| > 10m                  | Low confidence     | `text-error` / `bg-error-light`          |

### Sensor Badges

| Sensor | Background        | Text            |
| ------ | -------------------- | ----------------- |
| OHRC   | `bg-ohrc-light`      | `text-ohrc`        |
| TMC    | `bg-tmc-light`       | `text-tmc`         |
| IIRS   | `bg-iirs-light`      | `text-iirs`        |

### Status Badges

| Status      | Background             | Text                    |
| ------------ | ------------------------- | ------------------------- |
| Completed    | `bg-success-light`        | `text-success-foreground` |
| Processing    | `bg-accent-light`         | `text-accent`             |
| Queued        | `bg-surface-tertiary`     | `text-text-secondary`     |
| Failed        | `bg-error-light`          | `text-error-foreground`   |

---

## Typography

**Times New Roman only.** It ships in regular (400) and bold (700). Use only those two weights — 500 and 600 render unpredictably. All sizes in `rem` so the A- / A / A+ control works.

| Element               | Size (rem / px at 100%) | Weight | Line height | Color token           |
| ----------------------- | ---- | ------ | ----------- | ------------------------ |
| Site title (English)      | 1.625 / 26 | 700 | 1.2  | `text-navy`               |
| Site subtitle (Hindi / department line) | 1.125 / 18 | 400 | 1.3 | `text-text-secondary` |
| Page title (h1)            | 1.75 / 28 | 700 | 1.25 | `text-text-primary`       |
| Panel title (h2)            | 1.125 / 18 | 700 | 1.3  | `text-accent`            |
| Sub-heading (h3)             | 1 / 16 | 700 | 1.4  | `text-text-primary`       |
| Nav item                      | 1 / 16 | 700 | 1.25 | `text-text-on-navy`       |
| Body / table text              | 1 / 16 | 400 | 1.5  | `text-text-primary`       |
| Form label / card label         | 0.9375 / 15 | 700 | 1.4 | `text-text-secondary`  |
| Stat number                      | 2 / 32 | 700 | 1.2  | `text-text-primary`       |
| Accuracy figure (m)               | 1.5 / 24 | 700 | 1.3 | varies by range           |
| Coordinates / metadata             | 0.875 / 14 | 400 | 1.4 | `text-text-muted`       |
| Timestamp / muted                   | 0.875 / 14 | 400 | 1.4 | `text-text-muted`       |
| Chart axis labels                    | 0.8125 / 13 | 400 | 1.2 | `text-text-muted`       |

Minimum text size anywhere is 0.8125rem (13px). Numeric and technical values (accuracy, coordinates, stat numbers, log timestamps) use the same family with the `tabular-nums` utility so digits align in columns.

---

## Spacing

| Token       | Value      | Usage                 |
| ----------- | ---------- | ---------------------- |
| `gap-1`     | 4px        | Tight inline gaps       |
| `gap-2`     | 8px        | Badge and tag gaps      |
| `gap-3`     | 12px       | Form field gaps         |
| `gap-4`     | 16px       | Section internal gaps   |
| `gap-6`     | 24px       | Between sections        |
| `gap-8`     | 32px       | Page section gaps       |
| `p-4`       | 16px       | Panel body padding      |
| `p-6`       | 24px       | Large panel padding     |
| `px-4 py-2` | 16px / 8px | Button padding          |
| `px-2 py-0.5` | 8px / 2px | Badge padding           |

---

## Portal Shell Tokens

Every page is wrapped in the same shell, top to bottom. See ui-rules.md for behaviour.

| Part                | Height / size     | Background            | Notes                                           |
| -------------------- | ----------------- | ---------------------- | ------------------------------------------------- |
| Tricolour strip       | 6px               | saffron / white / green thirds | `--color-saffron`, `#ffffff` with 1px `border-border-light` top and bottom, `--color-india-green` |
| Utility bar            | 36px              | `bg-surface-secondary` | Skip to main content, Screen Reader Access, A- A A+, contrast toggle, language toggle |
| Brand header            | 96px              | `bg-surface`           | Logo slot 64x64, site title, subtitle, right-side slot for sponsor / programme mark |
| Navigation bar           | 48px              | `bg-navy`              | Active item: `bg-navy-dark` + 4px `--color-saffron` bottom border |
| Breadcrumb bar            | 40px              | `bg-surface-secondary` | Below nav, 1px bottom `border-border`           |
| Footer                     | auto              | `bg-navy-dark`         | Policy links, last-updated line, hosting and ownership notes |

**Logo slot:** 64x64, white background, 1px `border-border`, no gradient. Use the OrbitLens mark. Do not place the State Emblem of India or any ministry or agency logo here unless the project has written authorisation — its use is restricted by the State Emblem of India (Prohibited Improper Use) Act, 2005. Until then show the OrbitLens mark and the line "Prototype developed for Smart India Hackathon 2026".

---

## Component Tokens

### Panels (replace the old "cards")

```
background: bg-surface
border: 1px solid var(--color-border)
border-radius: 2px (rounded-sm)
box-shadow: none
header band: bg-surface-tertiary, border-bottom 1px solid var(--color-border), padding 10px 16px, title in Panel title style
body padding: 16px (p-4) — 24px (p-6) for large panels
```

### Buttons

**Primary:**

```
background: bg-accent (hover: bg-accent-dark)
text: text-accent-foreground
border: 1px solid var(--color-accent-dark)
border-radius: rounded-sm
padding: px-4 py-2
font-weight: 700
```

**Secondary:**

```
background: bg-surface
border: 1px solid var(--color-accent)
text: text-accent
border-radius: rounded-sm
padding: px-4 py-2
hover: bg-accent-muted
```

**Ghost / link button:**

```
background: transparent
text: text-accent, underlined
hover: bg-accent-muted
border-radius: rounded-sm
```

Minimum target size 44x44px on touch layouts.

### Input Fields

```
background: bg-surface
border: 1px solid var(--color-border-input)
border-radius: rounded-sm
padding: px-3 py-2
text: text-text-primary
placeholder: text-text-muted
focus: outline 3px solid var(--color-accent), outline-offset 2px
required marker: red asterisk with text "(required)" in the label for screen readers
```

### Badges

```
border-radius: rounded-sm (rectangular)
border: 1px solid currentColor
padding: px-2 py-0.5
font-size: 0.875rem
font-weight: 700
always contains text — never a colour dot alone
```

### Tables

```
border: 1px solid var(--color-border) on the table and every cell
header row: bg-navy, text-text-on-navy, font-weight 700, text-left
body rows: bg-surface, even rows bg-surface-muted
row hover: bg-accent-muted
cell padding: px-3 py-2
caption: visible or sr-only <caption>; header cells use scope="col"
```

### Accuracy Bar / Confidence Meter

```
background track: bg-border-light with 1px border-border
fill: varies by accuracy range (see Registration Accuracy Colors above)
height: 8px
border-radius: rounded-sm
adjacent text shows the numeric value and the range label
```

### Confidence Heatmap Legend

```
gradient stops: error → warning-fill → success (low to high confidence)
height: 12px strip, 1px border-border
labels: text-[0.8125rem] text-text-muted at each stop, with the words "Low" and "High"
```

### Activity List

Each entry is a bordered row with a text tag (not just a dot):

| Activity Type | Tag text | Tag colours |
|---|---|---|
| Analysis completed | Completed | `bg-success-light` / `text-success-foreground` |
| Dataset uploaded | Uploaded | `bg-accent-light` / `text-accent` |
| Report generated | Report | `bg-iirs-light` / `text-iirs` |

### Dashboard Chart Colors

| Chart                              | Color                                                             |
| ------------------------------------ | -------------------------------------------------------------------- |
| Registration Accuracy Over Time (line) | `var(--color-accent)` stroke, 3px width, fill `var(--color-accent-light)` at 60% |
| Sensor Coverage by Region (bars)       | `var(--color-success)`                                           |
| Anomalies Flagged Over Time (bars)     | `var(--color-error)`                                             |
| Chart grid lines                        | `1px dashed var(--color-border)`                                 |
| Chart axis labels                       | `var(--color-text-muted)`, 13px, Times New Roman                 |

Every chart has a title, a visible axis label with units, and a "View data table" toggle that shows the same values as a table.

### Image Viewer

```
container: bg-overlay, 1px solid var(--color-border), border-radius rounded-sm
toolbar and captions: bg-overlay-dark, text-text-on-overlay
control point marker: 2px ring in var(--color-saffron) so it stays visible on grey regolith
```

---

## Invariants

- Never use hex values directly in components — always use CSS variables via Tailwind tokens
- The font is Times New Roman (system font stack from `--font-sans`) — never import Inter, JetBrains Mono, or any web font, and never use a sans-serif or monospace family
- `--font-mono` exists only so older `font-mono` classes keep working; it resolves to the same Times New Roman stack. New code uses `tabular-nums` instead of `font-mono`
- Only font weights 400 and 700 are allowed
- Never use raw Tailwind color classes like `bg-blue-900` or `text-slate-400` — use project tokens only
- `--color-accent` (#0B3B8C) is the only accent blue — never use Tailwind's built-in blue scale
- Saffron, India green and chakra blue are decorative — never body text, never the only signal of state
- Accuracy bars and heatmap legends always use color tokens based on accuracy range — never hardcoded colors
- Sensor badges always use their assigned token (`--ohrc`, `--tmc`, `--iirs`) — never generic colors
- All borders default to `--color-border` (#B8C2D3) — never use `border-gray-*`
- Dark surfaces exist only inside the image viewer — the page itself is always light (or high-contrast when the user toggles it)
- Every text/background pairing must stay at 4.5:1 or better
