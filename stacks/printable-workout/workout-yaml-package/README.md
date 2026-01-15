# workout-yaml-package

Mini toolchain to convert the printable workout markdown in `../index.html` into structured YAML and validate it.

## Usage

```bash
cd workout-yaml-package
npm install
npm run convert   # extracts rawMarkdown from ../index.html → data/upper-lower.yaml
npm run validate  # validates YAML against schema with detailed error paths
```

## Schema shape

- `workout_groups[]` → `workouts[]` (each tagged with its parent group) → `subsections[]` → `exercises[]`.
- Workouts without subsections should use a single `default` subsection; the UI can hide that label.
- Exercises support `thumbnail`, optional `video`, `sets`, `reps`, `work_seconds`, `rest_seconds`, free-text `prescription`, and `notes`.
- Missing thumbnails fall back to a `placehold.co/200x200` placeholder labeled with the exercise name.

## Converter notes

- Pulls `rawMarkdown` from `../index.html` automatically.
- Heading levels map to the hierarchy: `#` group, `##` workout, `###` subsection, `####` exercise.
- Blockquote lines tagged `Focus:` or `Role:` populate subsection metadata.
- First bullet under an exercise becomes the `prescription` (sets/reps parsed when possible); additional bullets become `notes`.
- URLs in bullets are captured as `video` references.
