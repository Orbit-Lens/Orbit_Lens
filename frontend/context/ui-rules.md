# UI Rules

Concise rules for building the OrbitLens UI as an official Indian central government style portal (GIGW-aligned). The delivered Stitch screens (Login, Dashboard, New Analysis, Registration, Datasets) remain the source of truth for **layout and content**; ui-tokens.md is the source of truth for **colour, font and component styling**. Where the two disagree, ui-tokens.md wins.

---

## Fonts

**Times New Roman for every piece of text** — headings, body, buttons, inputs, tables, charts, logs, coordinates.

- Do not import any web font. No `next/font/google`, no `<link>` to Google Fonts. Times New Roman is a system font
- The stack is defined once in `@theme` as `--font-sans` (and `--font-mono` as an alias) — set `font-family: var(--font-sans)` on `body` in `globals.css` and let everything inherit
- Use only weight 400 and 700. Never `font-medium` or `font-semibold`
- Numeric and technical values (accuracy figures, coordinates, stat numbers, timestamps) use `tabular-nums` so columns line up
- Body text is 1rem. Never set text below 0.8125rem
- Use `rem` for every size so the A- / A / A+ control works

---

## Portal Shell

Every page renders inside the same shell from `app/layout.tsx`. Order, top to bottom:

1. **Tricolour strip** — 6px, saffron / white / green
2. **Utility bar** — "Skip to Main Content", "Screen Reader Access", text size A- A A+, high-contrast toggle, language toggle (English / हिन्दी)
3. **Brand header** — logo slot, site title "OrbitLens", subtitle "Multi-Modal Lunar Image Registration — Chandrayaan-2 (OHRC · TMC-2 · IIRS)", right-side slot for the programme mark
4. **Navigation bar** — navy, four items: Home, Dashboard, Datasets, New Analysis. Sign In / Sign Out at the far right
5. **Breadcrumb bar** — Home › Section › Page, current page not a link
6. **Main content** — `<main id="main-content">`, the target of the skip link
7. **Footer** — see Footer below

Layout dimensions:

- Page max-width: 1280px, centered, with 24px side padding on small screens
- Main content padding: 24px on all sides
- Gap between page sections: 24px
- All pages use the top navbar only — no sidebar, no drawer

The logo slot never uses the State Emblem of India or a ministry / agency logo without written authorisation (State Emblem of India (Prohibited Improper Use) Act, 2005). Use the OrbitLens mark.

---

## Navbar

Four items: Home, Dashboard, Datasets, New Analysis.

- Bar: `bg-navy`, full viewport width, text `text-text-on-navy`, 16px, weight 700
- Inactive item: no background; hover `bg-accent-dark`
- Active item: `bg-navy-dark` and a 4px `--color-saffron` bottom border, plus `aria-current="page"`
- Items are real `<a>` links inside `<nav aria-label="Main">`, reachable and operable by keyboard
- Below 768px the items collapse into a "Menu" button that opens a stacked list (in normal flow, not fixed)

---

## Footer

Navy-dark band with three parts:

1. Link row: Website Policies · Terms & Conditions · Privacy Policy · Accessibility Statement · Help · Feedback · Sitemap · Contact Us
2. Ownership lines: "Content owned by: OrbitLens Team", "Developed for Smart India Hackathon 2026", "Last updated: DD Mon YYYY" (rendered from the build date)
3. Compliance line: "Best viewed in the latest versions of Chrome, Firefox, Edge, Safari at 1280x768 or higher"

The placeholder pages behind these links can be minimal, but the links must exist.

---

## Panels

Every content section lives in a panel.

```
background: var(--color-surface)
border: 1px solid var(--color-border)
border-radius: 2px
box-shadow: none
header band: bg-surface-tertiary with a bottom border, containing the panel title (18px, 700, text-accent)
```

Never use colored panel backgrounds — always `bg-surface`. Color goes inside panels via badges, bars and text, never on the panel surface itself. Never use shadows to create depth.

---

## Typography Hierarchy

Levels used consistently throughout (sizes in rem, see ui-tokens.md for the full table):

**Page title (h1)** — one per page, 1.75rem, 700, `text-text-primary`, followed by a 1px `border-border` rule

**Panel titles (h2)** — 1.125rem, 700, `text-accent`

**Sub-headings (h3)** — 1rem, 700, `text-text-primary`

**Body / primary content text** — 1rem, 400, `text-text-primary`, line-height 1.5

**Secondary / muted text** — labels, timestamps, subtitles: 0.875rem, 400, `text-text-muted`

**Numeric / technical values** — same family, `tabular-nums`. Stat numbers on the dashboard are 2rem / 700.

Heading levels never skip (h1 → h2 → h3).

---

## Badges

Rectangular (`rounded-sm`), 1px border in the text colour, padding `2px 8px`, 0.875rem, 700. A badge always contains text.

Sensor badges (OHRC / TMC / IIRS) always use their assigned token pair from ui-tokens.md — never a generic color.

---

## Buttons

**Primary:** `bg-accent`, white text, 1px `accent-dark` border, `rounded-sm`, `px-4 py-2`, 700. Hover `bg-accent-dark`.

**Secondary:** `bg-surface`, 1px `accent` border, `text-accent`, `rounded-sm`, `px-4 py-2`. Hover `bg-accent-muted`.

Buttons that download a file state the type and size: "Download GeoTIFF (GeoTIFF, 32.4 MB)", "Download Report (PDF, 1.2 MB)". Links that leave the site carry an external-link icon and open in a new tab with `rel="noopener noreferrer"`.

---

## Form Inputs

```
background: var(--color-surface)
border: 1px solid var(--color-border-input)
border-radius: 2px
padding: 8px 12px
font-size: 1rem
color: var(--color-text-primary)
placeholder color: var(--color-text-muted)
focus: 3px solid var(--color-accent) outline, 2px offset
```

- Every input has a visible `<label>` (never placeholder-only)
- Required fields say "(required)" in the label text
- Validation errors appear under the field in `text-error-foreground`, with an error icon and the words "Error:", and are linked with `aria-describedby`

---

## Tables (Datasets List, Runs, Tie Points)

- Bordered grid: 1px `border-border` on the table and every cell
- Header row: `bg-navy`, white text, 700, `scope="col"` on every `<th>`
- Body rows: `bg-surface`, even rows `bg-surface-muted`
- Row text: 1rem, `text-text-primary`; numeric columns (resolution, date, RMSE) right-aligned with `tabular-nums`
- Hover state: `background: var(--color-accent-muted)`
- Every table has a `<caption>` (visible or `sr-only`) and wide tables scroll inside an `overflow-x-auto` wrapper
- Pagination shows "Displaying 1–6 of 342 datasets" and numbered page links

---

## Accuracy Bar / Confidence Meter

Inline progress bar shown next to the accuracy figure.

```
height: 8px
border-radius: 2px
background track: var(--color-border-light) with 1px var(--color-border)
```

Fill color by accuracy:

- ≤ 3m: `var(--color-success)` (high confidence)
- 3m–10m: `var(--color-warning-fill)` (caution)
- > 10m: `var(--color-error)` (low confidence)

Always paired with the number and a word ("High confidence", "Caution", "Low confidence").

---

## Before/After Slider & Composite Viewer

- Slider handle: 4px wide, `bg-saffron`, full height of the image container, with a circular grip at the vertical centre. The handle is a keyboard-operable `role="slider"` (arrow keys move it by 1%)
- Layer toggle chips (OHRC / TMC / IIRS): rectangular, use the matching sensor token when active, `bg-surface-secondary` / `text-text-secondary` with a border when inactive; active state also shows a check mark
- Confidence heatmap overlay: rendered at reduced opacity (default 60%) over the composite, with an opacity slider control
- Viewer container sits in a panel with `overflow-hidden` and a fixed aspect ratio to prevent layout shift while imagery loads
- Every image has meaningful `alt` text (region, sensor, acquisition date); decorative images use `alt=""`

---

## Correspondence Verification Panel

Shown on the registration results page. Contains, in this order: side-by-side reference / source images with tie-point lines, a metrics table (reference points, source points, candidates, verified matches, inlier ratio, reprojection error), the descriptor-distance histogram, and the reprojection-error histogram with the 1.0 px tolerance line. Verified matches use `--color-accent` lines, rejected matches `--color-warning-fill`; the legend names both in words, and rejected matches are also drawn dashed so colour is not the only cue.

---

## Accessibility (GIGW / WCAG 2.1 AA)

- Semantic landmarks: `<header>`, `<nav aria-label>`, `<main>`, `<footer>`
- "Skip to Main Content" is the first focusable element
- Every interactive element is reachable by keyboard and has a visible focus outline
- Text and background pairs meet 4.5:1 (see ui-tokens.md); UI component borders meet 3:1
- Colour is never the only carrier of meaning — pair it with text or an icon
- Text can be enlarged with the utility-bar control and by browser zoom to 200% without loss of content
- High-contrast mode is available from the utility bar and persists for the session
- Charts have a text alternative and a "View data table" toggle
- Language toggle switches shell labels between English and Hindi; set `lang` on the `<html>` and on any inline switch
- No content flashes more than three times per second; no auto-playing motion

---

## Empty States

Every section that can be empty must have an empty state. Keep it minimal:

- Short descriptive text in `color: var(--color-text-muted)`
- Optional icon above text
- CTA button if there's a logical next action (e.g. "Upload your first dataset", "Run your first analysis")

---

## Tailwind v4 Note

This project uses Tailwind v4. Tokens are defined with `@theme` in globals.css — no `tailwind.config.ts` needed. Never define colors in a config file. Always use `@theme` for new tokens.

---

## Do Nots

- Never use Tailwind's built-in color classes (`bg-blue-900`, `text-slate-400`) — use project tokens only
- Never define colors in `tailwind.config.ts` — use `@theme` in globals.css
- Never add gradients, shadows or glass effects to panels, buttons or the header
- Never use any font other than Times New Roman; never import a web font
- Never use font weights other than 400 and 700, and never more than one weight in a single UI element
- Never use a border radius above 4px, and never stack more than 2 levels of border radius inside each other
- Never use saffron or India green for body text or as the sole indicator of state
- Never show raw error messages to users — always show human readable text
- Never use `position: fixed` for UI elements — use normal flow layout
- Never place the State Emblem of India or an agency logo without written authorisation
- Never ship the dark theme as the page default — dark surfaces are for the image viewer only
