# Cypress E2E Tests for Workout Coach

This directory contains end-to-end tests for the Workout Coach application, covering all user stories from the requirements document.

## Test Coverage

### System Navigation (`system-navigation.cy.ts`)
- **SYS-1**: Start Menu with "Start Workout"
- **SYS-2**: Workout Selection Menu
- **SYS-3**: Start Selected Workout Immediately

### Guided Coaching Flow (`guided-coaching.cy.ts`)
- **GC-1**: Launch a Guided Session
- **GC-2**: View Current Exercise Information
- **GC-3**: See Upcoming Exercise
- **GC-4**: Wizard-Style Step Flow
- **GC-5**: Pause / Resume / Skip Controls

### Timer Engine (`timer-engine.cy.ts`)
- **TE-1**: Timed Intervals (Tabata Style)
- **TE-2**: Tempo-Synced Rep Counting
- **TE-3**: Adjustable Rest Times
- **TE-4**: Overall Workout Progress

### Quick Start Mode (`quick-start.cy.ts`)
- **QS-1**: Quick-Start Entry Point
- **QS-2**: Auto-Generated Quick-Start Workout
- **QS-3**: One-Tap Repeat of Last Quick-Start

### Summary Modal (`summary-modal.cy.ts`)
- **UI-4**: Meta UI Summary with stats, achievements, and actions

## Running Tests

### Interactive Mode (Cypress GUI)
```bash
pnpm cypress:open
# or
pnpm test:e2e:dev
```

### Headless Mode (CI/CD)
```bash
pnpm cypress:run
# or
pnpm test:e2e
```

### Run Specific Test File
```bash
pnpm cypress run --spec "cypress/e2e/system-navigation.cy.ts"
```

### Run Tests in Specific Browser
```bash
pnpm cypress run --browser chrome
pnpm cypress run --browser firefox
pnpm cypress run --browser edge
```

## Test Structure

Each test file follows this pattern:

1. **Setup** (`beforeEach`): 
   - Visit the application
   - Disable audio (to prevent TTS from running during tests)
   - Stub WebGPU if needed

2. **Helper Functions**:
   - Common actions like `startWorkout()` to reduce code duplication

3. **Test Suites**:
   - Organized by user story
   - Descriptive test names that match acceptance criteria

## Custom Commands

Located in `cypress/support/commands.ts`:

- `cy.waitForWebGPU()` - Wait for WebGPU canvas to be ready
- `cy.stubWebGPU()` - Stub WebGPU for faster testing
- `cy.disableAudio()` - Disable TTS/audio during tests

## Data Test IDs

The tests rely on `data-testid` attributes in the application. Here are the key selectors:

### Navigation
- `workout-card` - Workout cards in library
- `workout-detail` - Workout detail view
- `start-button` - Start workout button

### Guided Session
- `hud-overlay` - HUD overlay during workout
- `current-exercise-name` - Current exercise name
- `next-exercise` - Next exercise preview
- `pause-button`, `resume-button` - Pause/resume controls
- `skip-button`, `previous-step-button` - Step navigation
- `toolbar` - Bottom toolbar
- `step-minimap` - Step completion indicator

### Timer & Progress
- `interval-type` - Work/rest indicator
- `interval-timer` - Timer display
- `elapsed-time`, `remaining-time` - Time displays
- `progress-bar` - Overall progress
- `tempo-display`, `tempo-phase` - Tempo information
- `rep-count` - Rep counter

### Quick Start
- `quick-start-modal` - Quick start configuration modal
- `duration-slider`, `duration-value` - Duration controls
- `goal-*` - Goal selection buttons
- `equipment-*` - Equipment checkboxes
- `start-now-button` - Start quick workout
- `repeat-last-quick-start` - Repeat button

### Summary
- `summary-modal` - Summary modal
- `summary-total-time`, `summary-total-reps`, `summary-total-sets` - Stats
- `summary-xp`, `summary-calories` - Achievements
- `summary-save-button`, `summary-favorite-button`, `summary-share-button` - Actions
- `summary-cooldown-button` - Cooldown option

## Configuration

### Viewport
- Default: 375x667 (mobile-first, iPhone SE size)
- Tests are designed for mobile viewport but should work on larger screens

### Base URL
- Default: `http://localhost:5173`
- Make sure dev server is running before tests

### Timeouts
- Default command timeout: 10 seconds
- Interval transitions: 30 seconds (to account for timer waits)

## Best Practices

1. **Start dev server first**: `pnpm dev`
2. **Use data-testid**: Always prefer `data-testid` over class names or text content
3. **Disable audio**: Always call `cy.disableAudio()` in beforeEach
4. **Wait appropriately**: Use `{ timeout: X }` for operations that may take time
5. **Stub WebGPU**: For faster tests, stub WebGPU when visuals aren't being tested
6. **Clean up**: Tests should be independent and not rely on previous test state

## Fixtures

Sample data is available in `cypress/fixtures/`:
- `workouts.json` - Sample workout configurations and session data

## Debugging

### Screenshots
- Automatically captured on test failure
- Located in `cypress/screenshots/`

### Videos
- Currently disabled (see `cypress.config.ts`)
- Enable by setting `video: true` in config

### Console Logs
Tests can access `cy.window()` and `cy.log()` for debugging.

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run E2E Tests
  run: |
    pnpm install
    pnpm dev &
    sleep 5
    pnpm test:e2e
```

## Coverage Map

| User Story | Test File | Status |
|------------|-----------|--------|
| SYS-1 | system-navigation.cy.ts | ✅ |
| SYS-2 | system-navigation.cy.ts | ✅ |
| SYS-3 | system-navigation.cy.ts | ✅ |
| GC-1 | guided-coaching.cy.ts | ✅ |
| GC-2 | guided-coaching.cy.ts | ✅ |
| GC-3 | guided-coaching.cy.ts | ✅ |
| GC-4 | guided-coaching.cy.ts | ✅ |
| GC-5 | guided-coaching.cy.ts | ✅ |
| TE-1 | timer-engine.cy.ts | ✅ |
| TE-2 | timer-engine.cy.ts | ✅ |
| TE-3 | timer-engine.cy.ts | ✅ |
| TE-4 | timer-engine.cy.ts | ✅ |
| QS-1 | quick-start.cy.ts | ✅ |
| QS-2 | quick-start.cy.ts | ✅ |
| QS-3 | quick-start.cy.ts | ✅ |
| UI-4 | summary-modal.cy.ts | ✅ |

## Next Steps

As you implement features, update the components to include the required `data-testid` attributes. The tests are designed to guide development and ensure all acceptance criteria are met.
