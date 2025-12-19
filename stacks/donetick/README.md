# DoneTick Stack

A self-hosted DoneTick instance with TypeScript reporting tools for managing and analyzing household chores.

## Overview

This stack provides a complete household chore management solution with:

- **donetick/** - Self-hosted DoneTick server deployed via Docker Compose
- **donetick-reporting/** - TypeScript API client and CLI tools for reporting and automation

## Quick Start

### 1. Start DoneTick Server

```bash
cd donetick
docker compose up -d
```

**Important**: Before starting, ensure you've set `DT_JWT_SECRET` in the docker-compose.yaml file to a secure random string.

Access DoneTick at http://localhost:2021

### 2. Generate API Access Token

1. Log into the DoneTick web UI at http://localhost:2021
2. Navigate to Settings → API
3. Generate a new access token
4. Copy the token for use with the reporting tools

### 3. Use Reporting Tools

```bash
cd donetick-reporting
npm install
npm run build

# Set your credentials
export DONETICK_URL="http://localhost:2021"
export DONETICK_ACCESS_TOKEN="your-api-token-from-step-2"

# Fetch all chores
npm run all-chores
```

## Project Structure

```
donetick/
├── donetick/              # Docker Compose setup for DoneTick server
│   ├── docker-compose.yaml
│   └── README.md         # Docker deployment guide
├── donetick-reporting/    # TypeScript API client and CLI tools
│   ├── src/
│   │   ├── client.ts     # DoneTick API client implementation
│   │   ├── logger.ts     # Configurable logging utility
│   │   ├── types.ts      # TypeScript type definitions & exports
│   │   ├── cli.ts        # CLI for listing chores
│   │   └── index.ts      # Main package exports
│   ├── coverage/         # Vitest coverage reports
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md         # API client documentation
├── ticket-1.md           # Initial project requirements
├── ticket-2.md           # Planned enhancements
└── README.md             # This file
```

## Features

### DoneTick Server
- Self-hosted chore management application
- SQLite database for data persistence
- Docker-based deployment
- Configurable JWT authentication

### DoneTick Reporting Library
- TypeScript API client for DoneTick
- Full type safety with exported TypeScript definitions
- Methods for fetching all chores and individual chore details
- Comprehensive error handling with custom DoneTickError class
- Configurable logging with debug, info, and error levels
- CLI tool for listing all chores
- Test coverage with Vitest
- ESLint + Prettier for code quality
- ES Modules support

## Requirements

### DoneTick Server
- Docker and Docker Compose
- Port 2021 available (or configure reverse proxy)

### DoneTick Reporting
- Node.js 18+ (ES Modules support)
- npm 9+

## Documentation

- [DoneTick Server Setup](./donetick/README.md) - Docker deployment guide
- [Reporting Library](./donetick-reporting/README.md) - API client usage and development
- [DoneTick Official Docs](https://docs.donetick.com/) - Application documentation
- [DoneTick API Reference](https://docs.donetick.com/advance-settings/api/) - API endpoints

## Development

### Running Tests

```bash
cd donetick-reporting
npm test                  # Run tests
npm run test:coverage     # Generate coverage report
```

### Code Quality

```bash
npm run lint              # Check for linting errors
npm run lint:fix          # Auto-fix linting issues
npm run format            # Format code with Prettier
npm run format:check      # Check formatting
```

### Building

```bash
npm run build             # Compile TypeScript to dist/
```

## Environment Variables

### DoneTick Server
- `DT_ENV` - Environment (selfhosted, production)
- `DT_SQLITE_PATH` - SQLite database path
- `DT_JWT_SECRET` - JWT signing secret (REQUIRED - set to random string)
- `DT_ROOT_URL` - Base URL when behind reverse proxy

### DoneTick Reporting
- `DONETICK_URL` - DoneTick server URL
- `DONETICK_ACCESS_TOKEN` - API authentication token

## License

ISC

## Contributing

This is a private project for household chore management. See individual README files for development guidelines.
