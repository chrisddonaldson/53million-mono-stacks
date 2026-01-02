# Body Dimensions Stack (MongoDB + Koa + SolidJS)

## Executive Summary

This repository implements a **private, single-user body measurement tracking system**. It is designed to run as a self-contained stack in a homelab environment.

The system allows you to:
- Track core metrics: **Height**, **Body Weight**, and **Body Fat %**.
- Log detailed **Skinfold Measurements** (mm) across multiple sites.
- View progress via historical lists and trend overviews.
- Maintain full ownership of your data in a local MongoDB database.

The system is intentionally:
- **Single-user**: No complex authentication or multi-tenancy.
- **Self-hosted**: Entirely containerized via Docker Compose.
- **Private**: Network isolation is the security boundary.

---

## High-Level Architecture

```
[ Web Browser ]
      |
      | HTTP / JSON
      v
[ Node.js API (Koa) ]
      |
      | Document Store (Mongoose / MongoDB)
      v
[ MongoDB Database ]
```

### Network Scope
- Everything runs **inside a private LAN or VPN**.
- The **Web UI** and **API** are accessible on their respective ports.
- The **Database** is internal to the Docker network.
- **No authentication** is implemented at the application layer; access is controlled via network security.

---

## Core Components

### 1. Web Frontend (SolidJS + Vite)
- **Role**: Premium user interface for data entry and visualization.
- **Features**:
  - **Dashboard**: "Latest stats" at a glance and quick-add entry point.
  - **Entry Form**: Specialized inputs for weights, percentages, skinfold rows, and limb circumferences.
  - **History**: Sortable table of all past measurements.
  - **Reports**: Dedicated views for daily and weekly trend analysis, providing a breakdown of progress over time.
  - **Trends**: Visual indicators of changes over 7 and 30 days.

### 2. Node.js API (Koa + TypeScript)
- **Role**: Handles business logic and serves as the gateway to the database.
- **Responsibilities**:
  - Validates incoming measurement data using **Zod**.
  - Provides trend calculations (deltas) for the frontend.
  - Manages CRUD operations for entries and nested skinfold records.
  - Centralized error handling and standardized JSON responses.

### 3. Database (MongoDB)
- **Role**: Flexible document storage.
- **Schema**:
  - `Entries`: A single collection where each document contains all measurements (core, skinfolds, and circumferences) for a specific point in time.

---

## Product Scope

### Core Measurements
- **Height** (cm)
- **Body Weight** (kg)
- **Body Fat %** (percent)
- **Skinfolds** (mm) — Multiple sites (e.g., Abdomen, Thigh, Chest, Suprailiac)
- **Circumferences** (cm) — Multiple sites (e.g., Neck, Shoulders, Chest, Upper Arm, Forearm, Waist, Hips, Thigh, Calf)

### Key User Flows
- **Log Entry**: Add a new snapshot with any subset of fields.
- **Trend Snapshot**: See "Latest stats" with automatic deltas (e.g., -0.8kg in 7 days).
- **Daily/Weekly Reports**: Review detailed progress reports segmented by day and week to identify cycles and long-term trends.
- **Review History**: Scroll through past entries to see progress.
- **Manage Data**: Edit or delete incorrect entries.

---

## API Contract

### Measurements
- `GET /entries?from=...&to=...&limit=...` - List historical entries.
- `GET /entries/latest` - Returns the most recent entry + calculated trends.
- `GET /reports/trends?period=daily|weekly` - Specific reporting data for trend analysis.
- `POST /entries` - Create a new entry.
- `PATCH /entries/:id` - Update existing entry data.
- `DELETE /entries/:id` - Remove an entry.

### Request Shape (Example `POST /entries`)
```json
{
  "measuredAt": "2026-01-02T08:00:00.000Z",
  "heightCm": 190.5,
  "weightKg": 108.0,
  "bodyFatPercent": 16.3,
  "skinfolds": [
    { "site": "abdomen", "mm": 29 },
    { "site": "thigh", "mm": 25 }
  ],
  "circumferences": [
    { "site": "neck", "cm": 42.5 },
    { "site": "chest", "cm": 115.0 },
    { "site": "upper_arm_left", "cm": 40.0 }
  ],
  "notes": "Fasted AM"
}
```

---

## Data Model (MongoDB Schema)

### `Entries` collection
```json
{
  "_id": "ObjectId",
  "measuredAt": "ISODate",
  "heightCm": "Number",
  "weightKg": "Number",
  "bodyFatPercent": "Number",
  "skinfolds": [
    { "site": "String", "mm": "Number" }
  ],
  "circumferences": [
    { "site": "String", "cm": "Number" }
  ],
  "notes": "String",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

## Configuration Model

All configuration is environment-variable driven.

### API
- `DATABASE_URL`: Connection string for MongoDB (e.g., `mongodb://db:27107/body-dimensions`).
- `PORT`: API binding port (default 3000).
- `CORS_ORIGIN`: Allowed frontend origin.

### Web
- `VITE_API_URL`: Backend API endpoint.

---

## Deployment Model (Docker Compose)

The entire stack is managed as a single unit via Docker Compose.

### Quick Start
```bash
docker compose up -d --build
```

### Included Services
- `api`: Node.js backend.
- `web`: SolidJS frontend (served via Nginx).
- `db`: MongoDB 7.0 instance.

---

## Design Philosophy

This project optimizes for **Data Autonomy** and **Simplicity**.

- **No Placeholders**: Every feature in the scope is intended for real use.
- **Flexible Schema**: Document-oriented storage allowing for easy addition of new measurement sites without migrations.
- **Single Command**: One `docker compose up` should result in a fully functional, production-ready private service.

---

## Future Evolution (Post-MVP)
- **Calculated BF%**: Automated formulas based on skinfold entries.
- **Data Portability**: Export/Import via CSV.
- **Visuals**: Charts for weight and body fat trends.
- **Photos**: Progress picture attachments per entry.
