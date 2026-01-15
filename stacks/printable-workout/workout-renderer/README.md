# workout-renderer

SolidJS renderer for the workout YAML config.

## Usage

```bash
cd workout-renderer
npm install
npm run build   # regenerates default config from ../workout-yaml-package/data/upper-lower.yaml and outputs dist/workout-renderer.js
npm test        # build + serve static site + run Cypress e2e
```

In `index.html` we import the built bundle directly:

```html
<script type="module">
  import { renderWorkout, defaultConfig } from './workout-renderer/dist/workout-renderer.js'
  const root = document.getElementById('solid-render-root')
  renderWorkout(root, defaultConfig)
</script>
```

## Exports
- `renderWorkout(el, config)` – mounts the Solid view into `el`.
- `defaultConfig` – generated from the canonical YAML.
- Types: `WorkoutConfig`, `WorkoutGroup`, `Workout`, `SubSection`, `Exercise`.

## Features
- Collapsible groups/workouts/subsections (subsections default closed), linear semantic layout, page-break before each sub workout when printing.
- Set tables with checkboxes, timing/ETA pills, green states when done; thicker borders retained for print legibility.
- Exercise rows show prescription, sets/reps, stage pills (neural/stability/mechanical/metabolic), at-home variant, notes (above tables), video link, and placeholder thumbnail fallback.
- Rollups for exercises → subsections → workouts → groups; green completion states cascade.
