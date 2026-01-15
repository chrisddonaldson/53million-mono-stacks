# Printable Workout Log

A single-page, printable-and-collapsible workout log, now driven by YAML + SolidJS. Tailwind (CDN) for styling; vanilla JS remains for legacy markdown parsing, but the Solid renderer is the primary view.

## Features
- Config-driven Solid renderer (default): collapsible groups/workouts/subsections, linear semantic layout, completion rollups, stage/at-home pills, bordered set tables with timers/ETA. Subsections start collapsed; page breaks before each sub workout on print.
- Print-ready: Auto-expands for print; shadows/backgrounds removed except set tables for clarity; narrower horizontal padding.
- Live reload helper: Polls `Last-Modified` and reloads when the file changes.

## Packages
- `workout-yaml-package`: Zod/YAML schema + converter (`npm run convert`, `npm run validate`) pulling `rawMarkdown` from `index.html`.
- `workout-renderer`: Solid renderer + Cypress E2E (`npm run build`, `npm test`), bundle at `workout-renderer/dist/workout-renderer.js`.

## Quick start (Solid view)
1) `cd workout-renderer && npm install`
2) `npm run build`
3) Serve repo root (e.g., `python -m http.server 8000`) and open `index.html`.

## Customization tips
- Update YAML via `workout-yaml-package` then rebuild the renderer.
- Stage/at_home pills render per-exercise; set tables keep borders for print legibility.
- Legacy markdown view is hidden; keep `rawMarkdown` in `index.html` as the YAML source of truth.

## Printing
- Page breaks before each sub workout; all sections open; controls hidden; minimal background noise for a clean PDF.
