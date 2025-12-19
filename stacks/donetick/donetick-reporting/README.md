# DoneTick Reporting

A TypeScript library for interacting with the DoneTick API and generating chore reports.

## Overview

This package provides a type-safe API client for DoneTick with:

- Full TypeScript support with exported types
- Comprehensive error handling
- Configurable logging
- CLI tools for quick reporting
- ES Modules support
- Room health scoring utilities with configurable penalty profiles

## Installation

```bash
npm install
npm run build
```

## Quick Start

### Environment Setup

Create a `.env` file or set environment variables:

```bash
DONETICK_URL=http://localhost:2021
DONETICK_ACCESS_TOKEN=your-api-token-here
```

### Generate API Token

1. Log into your DoneTick instance
2. Navigate to Settings → API
3. Generate a new access token
4. Copy the token to use in `DONETICK_ACCESS_TOKEN`

### Run CLI

```bash
npm run all-chores
```

This prints each room with its live health score inline before listing the chores assigned to that space. Example:

```
Kitchen - 67 (Needs attention) | overdue -5 | priority -2 | completion +10
  - [42] Dishes | freq: daily | next: -3hrs
  - [105] Mop floor | freq: weekly | next: 12hrs
```

### Filtered CLI (next 24h or overdue)

```bash
npm run get-all-filtered
```

This command fetches all chores, strips the `Skincare` label (so it never appears as a room), and only shows chores that are overdue or due within the next 24 hours. Use it when you want a focused view of imminent work.

## API Usage

### Importing the Client

```typescript
import { DoneTickClient } from 'donetick-reporting';
```

### Initialize Client

```typescript
const client = new DoneTickClient({
  url: 'http://localhost:2021',
  accessToken: 'your-api-token',
});
```

### Fetch All Chores

```typescript
try {
  const chores = await client.getAllChores();
  console.log(`Found ${chores.length} chores`);
  chores.forEach(chore => {
    console.log(`- ${chore.name} (due: ${chore.nextDueDate})`);
  });
} catch (error) {
  if (error instanceof DoneTickError) {
    console.error(`API Error: ${error.message}`);
    console.error(`Status: ${error.statusCode}`);
  }
}
```

### Fetch Single Chore

```typescript
try {
  const chore = await client.getChore(123);
  console.log(`Chore: ${chore.name}`);
  console.log(`Frequency: ${chore.frequencyType}`);
  console.log(`Next due: ${chore.nextDueDate}`);
} catch (error) {
  console.error('Failed to fetch chore:', error);
}
```

## TypeScript Types

All types are exported from the package:

```typescript
import {
  Chore,
  Label,
  Assignee,
  FrequencyType,
  AssignStrategy,
  DoneTickConfig,
  DoneTickError,
} from 'donetick-reporting';
```

### Key Types

#### Chore

```typescript
interface Chore {
  id: number;
  name: string;
  frequencyType: FrequencyType;
  frequency: number;
  nextDueDate: string | null;
  isActive: boolean;
  assignees: Assignee[];
  labelsV2: Label[];
  priority: number;
  description?: string;
  // ... and more
}
```

#### FrequencyType

```typescript
type FrequencyType = 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'interval';
```

#### DoneTickError

Custom error class for API errors:

```typescript
class DoneTickError extends Error {
  statusCode?: number;
  cause?: unknown;
}
```

## Room Health Scoring

The `health` module powers chore health reporting that combines overdue penalties, priority pressure, and completion performance.

```typescript
import {
  calculateRoomHealth,
  calculateRoomHealthScores,
  DEFAULT_OVERDUE_CONFIG,
  DEFAULT_PRIORITY_CONFIG,
  DEFAULT_COMPLETION_CONFIG,
} from 'donetick-reporting/health';

const choresByRoom = new Map<string, Chore[]>([
  ['Kitchen', kitchenChores],
  ['Bathroom', bathroomChores],
]);

const scores = calculateRoomHealthScores(choresByRoom, {
  now: new Date(),
  config: {
    overdue: DEFAULT_OVERDUE_CONFIG,
    priority: DEFAULT_PRIORITY_CONFIG,
    completion: DEFAULT_COMPLETION_CONFIG,
  },
});

scores.forEach(score => {
  console.log(`${score.roomName}: ${score.score} (${score.label})`, score.breakdown);
});
```

- Empty rooms automatically return a pristine score of 100.
- Overdue and priority penalties are capped per room, ensuring extreme cases don’t skew the results.
- Completion scores are positive contributions that can be customized once historical completion data is available.
- Dedicated Vitest suites cover overdue, priority, completion, and combined health behavior to prevent regressions.

## Logging

The library includes a configurable logger. Set the log level via environment variable:

```bash
LOG_LEVEL=debug npm run all-chores
```

Available levels: `debug`, `info`, `warn`, `error`

### In Code

```typescript
import { logger } from 'donetick-reporting';

logger.setLogLevel('debug');
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

## Development

### Project Structure

```
src/
├── client.ts      # DoneTick API client
├── logger.ts      # Logging utility
├── types.ts       # TypeScript types and interfaces
├── cli.ts         # Command-line interface
└── index.ts       # Main exports
```

### Available Scripts

```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Run CLI
npm run all-chores
```

### Testing

Tests are written using Vitest:

```bash
npm test
```

Generate coverage report:

```bash
npm run test:coverage
open coverage/index.html
```

### Code Quality

The project uses:

- **ESLint** for linting
- **Prettier** for code formatting
- **TypeScript** for type safety

Run checks:

```bash
npm run lint
npm run format:check
```

Auto-fix issues:

```bash
npm run lint:fix
npm run format
```

## Error Handling

The library provides comprehensive error handling:

```typescript
import { DoneTickClient, DoneTickError } from 'donetick-reporting';

const client = new DoneTickClient({ url, accessToken });

try {
  const chores = await client.getAllChores();
} catch (error) {
  if (error instanceof DoneTickError) {
    // API-specific errors
    console.error(`API Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`HTTP Status: ${error.statusCode}`);
    }
    if (error.cause) {
      console.error('Underlying cause:', error.cause);
    }
  } else {
    // Unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

### Common Error Scenarios

#### Missing Configuration

```typescript
// Throws: "DoneTick URL is required"
new DoneTickClient({ url: '', accessToken: 'token' });

// Throws: "Access token is required"
new DoneTickClient({ url: 'http://localhost:2021', accessToken: '' });
```

#### API Errors

```typescript
// 401 Unauthorized - invalid token
// 404 Not Found - chore doesn't exist
// 500 Server Error - server issues
```

## CLI Output

The `all-chores` command displays:

```
=== ALL CHORES ===

1. Clean Kitchen
   ID: 42
   Status: Active
   Frequency: daily (1)
   Next Due: 2024-12-20T10:00:00Z
   Priority: 1
   Assignees: 1, 2
   Labels: kitchen, cleaning
   Description: Wipe counters, sweep floor, wash dishes

2. Vacuum Living Room
   ID: 43
   Status: Active
   Frequency: weekly (7)
   Next Due: 2024-12-22T14:00:00Z
   Priority: 2
   Assignees: 1
   Labels: living-room, cleaning

Total chores: 2
```

## Roadmap

See [ticket-2.md](../ticket-2.md) for planned enhancements:

- Group chores by room/label
- Human-readable relative time display (e.g., "3hrs", "-12hrs")
- Sort chores by frequency
- Enhanced reporting formats
- Export capabilities

## API Reference

### DoneTickClient

#### Constructor

```typescript
new DoneTickClient(config: DoneTickConfig)
```

**Parameters:**
- `config.url` - DoneTick server URL (trailing slash will be removed)
- `config.accessToken` - API access token

**Throws:**
- `DoneTickError` if URL or accessToken is missing

#### Methods

##### getAllChores()

```typescript
async getAllChores(): Promise<Chore[]>
```

Fetches all chores from the DoneTick API.

**Returns:** Promise resolving to an array of Chore objects

**Throws:** `DoneTickError` if the request fails

##### getChore(choreId)

```typescript
async getChore(choreId: number): Promise<Chore>
```

Fetches a specific chore by ID.

**Parameters:**
- `choreId` - The ID of the chore to fetch

**Returns:** Promise resolving to a Chore object

**Throws:** `DoneTickError` if the request fails

## Requirements

- Node.js 18+ (ES Modules support)
- npm 9+

## License

ISC

## Resources

- [DoneTick Official Docs](https://docs.donetick.com/)
- [DoneTick API Reference](https://docs.donetick.com/advance-settings/api/)
- [Docker Setup](../donetick/README.md)
- [Project Overview](../README.md)

## Contributing

This is a private household management project. For development:

1. Make changes in `src/`
2. Run tests: `npm test`
3. Run linting: `npm run lint`
4. Build: `npm run build`
5. Test CLI: `npm run all-chores`

Ensure all tests pass and code is properly formatted before committing.
