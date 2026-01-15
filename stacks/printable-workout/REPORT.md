# Project Initialization Report

- Single-page printable workout log in `index.html` using Tailwind CDN, Marked.js CDN, and vanilla JS; no build step or external assets.
- Markdown-driven content (`rawMarkdown`) is parsed to HTML, then headings are wrapped into nested `<details>` for collapsible sections; top-level opens by default, print forces all open.
- Expand/Collapse controls plus auto-open on print; hot-reload polls `Last-Modified` and reloads.
- Each `h4` exercise gets an auto-generated set table (defaults to 3×10–12 if parsing fails), with checkboxes, alternating/hovered row styling, borders, and shadow.
- Work/rest timing (defaults) drives:
  - Exercise pills: “Done X/Y” (or “Completed” when finished), “Sets N”, timing pill (completed/total/remaining), and ETA from live clock.
  - Section/group pills (levels 1–3): same structure with ETAs and “Completed” on full completion.
  - Remaining time decreases as sets are checked.
- Completion visuals: completed exercises get green badge styling; completed rows strike through; completed sections tint green via `section-done` on their summaries. Pills restyled to neutral low-contrast tones with compact sizing.
- Time formatting: clock-style `m:ss` or `h:mm:ss` (e.g., `09:00/01:30:00 (01:21:00)`), applied across exercise and group pills.
- Tables enhanced: stronger border (`border-slate-300`), shadow, row dividers, striping, and hover highlight. Each exercise is wrapped in its own card containing the title, placeholder thumbnail, notes, and set table.
- Print styling: hides controls, removes shadows (including exercise cards), keeps details open for PDF.
- Added top clock widget showing current time, day, and time zone; shared `globalClock` powers ETA pills.
- README added with overview, features, quick start, customization, printing notes.
- AGENTS guidance added: keep everything in `index.html`, use vanilla JS, Tailwind CDN, minimal edits, preserve print behavior, keep markdown in `rawMarkdown`, prefer localStorage if persisting.
- Added `workout-yaml-package` subfolder with Zod/YAML-based schema, CLI (`convert`, `validate`), and placeholder-backed thumbnail defaults.
- Converter pulls `rawMarkdown` from `index.html`, maps heading levels to group → workout → subsection → exercise hierarchy, parses prescriptions/sets/reps, captures video URLs, and writes `data/upper-lower.yaml`.
- Validator reports detailed path errors and summary counts; current YAML: 2 groups, 6 workouts, 21 subsections, 85 exercises.
- Added `workout-renderer` SolidJS package with types, default config auto-generated from YAML, and esbuild bundle (`dist/workout-renderer.js`).
- Solid renderer is now the primary/only view (legacy markdown hidden), with collapsible subsections (default closed), linear semantic layout (no cards/grid), stage pills (neural/stability/mechanical/metabolic), `at_home` display, notes before tables, and page breaks before each sub workout for print; set tables keep borders/backgrounds, containers are borderless/transparent.
- YAML schema adds `stage` per exercise, with converter classifying from notes/prescriptions and dropping old “focus order” lines; `at_home` continues to populate from `_At-home (DB/BB):` notes.
- Added Cypress E2E harness in `workout-renderer` (`npm test`) that builds, serves the static site, and verifies set-table rendering plus subsection/workout rollups.
- Page retitled to emphasize config-driven Solid/YAML rendering.

