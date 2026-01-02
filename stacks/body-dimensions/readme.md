# Body Dimensions Stack (MongoDB + Koa + SolidJS)

## Executive Summary

This repository implements a **private, single-user body measurement tracking system**. It is designed to run as a self-contained stack in a homelab environment.

The system allows you to:
- Track core metrics: **Height**, **Body Weight**, and **Body Fat %**.
- Log detailed **Skinfold Measurements** (mm) across multiple sites.
- Support **high-frequency logging** (multiple entries per day) with **partial data** (e.g., logging only weight in the morning).
- View progress via historical lists, trend overviews, and **range-based area charts** that show intra-day variance.
- Access data via an **MCP Server**, allowing AI agents to query stats and log new measurements directly.
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
  - **Visual Entry Form**: Intuitive, spatial data entry using an interactive anatomical body diagram. Inputs for circumferences and skinfolds are positioned directly over the corresponding body parts.
  - **History Management**: Sortable table with full **Edit/Delete** capabilities.
  - **D3 Charts**: Real-time trend visualization with **Goal Projections**.
  - **Multi-Tab Analytics**: Specialized calculators for Body Fat (JP 3-Site, Navy) and Macros (Bodybuilder/LBM-based).

### 2. Node.js API (Koa + TypeScript)
- **Role**: Handles business logic and serves as the gateway to the database.
- **Responsibilities**:
  - Validates data using **Zod**.
  - CRUD operations for entries with nested site-specific data.
  - Standardized JSON responses for both the UI and AI agents.

### 3. MCP Server (Node.js)
- **Role**: Model Context Protocol interface for AI interaction.

### 4. Database (MongoDB)
- **Role**: Flexible document storage.

---

## 🚀 Current Feature Set (The "Peak Physique" Vision)

We have moved beyond simple tracking into a clinical-grade bodybuilding companion.

### 1. Advanced Analytics Suite
- **Body Fat Multi-Formula Analyzer**: Real-time calculation using both **Jackson-Pollock 3-Site Skinfolds** and **U.S. Navy Circumference** methods. Includes instructional tooltips for precision measurement sites.
- **Macro Blueprint Builder**: Specific for bodybuilders using the **Katch-McArdle (LBM-based)** formula. Supports Training Intensity profiling and phase-specific (Bulk/Cut/Maintenance) targets.
- **Goal Projection Engine**: Forecasts your target date for hitting a body fat percentage goal based on a lean-mass preservation model and caloric deficit.

### 2. High-Fidelity Visualization
- **Dynamic D3.js Workspace**: Interactive weight trend chart with **Future Goal Projections** visualized as dashed trend lines, integrated directly with your profile metrics.
- **Technical Typography**: Global use of `font-mono` for all numeric data ensuring a technical, high-precision aesthetic.

### 3. Data Integrity & Management
- **Full History CRUD**: Ability to view, edit, and delete any historical entry. Editing mode intelligently rehydrates the anatomical silhouette with past state.
- **Temporal Stability**: Powered by **Luxon** for robust date arithmetic and local-sensitive formatting across all analytics.

---

## 🛠️ Refactoring & Consolidation Roadmap (Next Steps)

The application has grown rapidly. To maintain long-term stability and performance, the following refactoring steps are recommended:

### 1. Component Decomposition (Priority: High)
`App.tsx` is currently exceeding 700 lines. It should be split into functional modules:
- `/src/components/tabs/`: Extract `Dashboard`, `LogEntry`, `History`, `Calculator`, `Macros`, and `Projections` into dedicated files.
- `/src/components/ui/`: Create reusable `Card`, `MetricDisplay`, and `InfoTip` components.

### 2. Mathematical Utility Core
The complex logic for Jackson-Pollock, Navy Method, Katch-McArdle, and Goal Projections should be moved from inline component functions into a `/src/lib/formulas.ts` utility file.
- **Benefit**: Allows for unit testing of the math logic and keeps the UI logic clean.

### 3. State Management Refinement
Currently, state is handled via dozens of independent signals. 
- **Recommendation**: Create a central `MeasurementStore` or use a structured object for form state to reduce the boilerplate of deep signal updates.

### 4. API & Schema Synchronization
- **Zod Sharing**: Export the Zod schemas from the API and use them in the frontend for client-side validation before submission.
- **Trend Aggregation**: Move the "stabilizing trend" and delta calculations from the frontend to a specialized backend reporter to keep the UI layer "thin".

---

## Product Scope

### Core Measurements
- **Height** (cm)
- **Body Weight** (kg)
- **Body Fat %** (percent)
- **Skinfolds** (mm) — Abdomen, Thigh, Chest, Suprailiac, Triceps, Subscapular.
- **Circumferences** (cm) — Neck, Waist, Hips, Chest, etc.

---

## API Contract

### Measurements
- `GET /entries` - List historical entries.
- `GET /entries/latest` - Returns the most recent entry.
- `POST /entries` - Create a new entry.
- `PATCH /entries/:id` - Update existing entry data.
- `DELETE /entries/:id` - Remove an entry.

---

## Deployment Model (Docker Compose)

```bash
docker compose up -d --build
```

### Included Services
- `api`: Node.js backend.
- `web`: SolidJS frontend.
- `mcp`: MCP server.
- `db`: MongoDB 7.0.

---

## Design Philosophy

- **No Placeholders**: Real tools for real athletes.
- **Visualization First**: D3 charts that show the truth of the data.
- **Programmatic First**: AI-ready from day one via MCP and structured JSON.
