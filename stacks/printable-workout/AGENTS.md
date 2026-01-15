# Agent Notes for Printable Workout

Scope: applies to all files in this directory (single-page app).

## Conventions
- Keep everything self-contained in `index.html` unless explicitly requested otherwise.
- Favor concise, readable vanilla JS; avoid unnecessary dependencies.
- Preserve existing Tailwind CDN usage and inline styles unless changing is required.
- For workout content, keep Markdown in `rawMarkdown`; avoid external data files unless asked.

## Working guidelines
- Prefer minimal edits and avoid restructuring without user direction.
- When adding features, keep print behavior intact (all details open on print).
- If adding persistence, default to localStorage and guard against errors in older browsers.
