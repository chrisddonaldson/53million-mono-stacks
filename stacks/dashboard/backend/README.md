# Dashboard Backend API Requirements

This document outlines the API endpoints required to support the Dashboard Frontend.

## Overview
The frontend expects a RESTful API serving JSON data. All timestamps should be returned in ISO 8601 format (e.g., `2023-10-27T10:00:00Z`).

## Architecture & Infrastructure
- **Containerization**: The backend will run as a standalone Docker container (Node.js API).
- **Frontend Serving**: The frontend will be served via Nginx in its own Docker container.

## Service Requirements

### Calendar Aggregation
The backend must aggregate events from multiple sources:
1.  **Google Calendar (Personal 1)**: OAuth/API integration.
2.  **Google Calendar (Work)**: OAuth/API integration.
3.  **Hotmail/Outlook (Personal 2)**: Microsoft Graph API integration.

### RSS Feeds
- **Provider**: Tiny Tiny RSS (TT-RSS).
- **Authentication**: Must authenticate with the user's self-hosted TT-RSS instance.

### External APIs (Free Tier Preference)
- **Weather**: Must use a free weather API (e.g., OpenMeteo, OpenWeatherMap Free Tier).
- **Trains**: Must use a free transport API (e.g., TfL Unified API for Elizabeth Line).

## Endpoints

### 1. Weather Data
Returns current weather conditions and a short-term forecast for the active location.

- **Endpoint:** `GET /api/weather`
- **Query Params:**
    - `lat` (optional): Latitude for specific location.
    - `lng` (optional): Longitude for specific location.
- **Response:** `200 OK`

```json
{
  "temp": 15,
  "condition": "Partly Cloudy",
  "high": 18,
  "low": 12,
  "location": "London, UK",
  "forecast": [
    {
      "time": "Now",
      "temp": 15,
      "condition": "Partly Cloudy" // 'Sunny' | 'Cloudy' | 'Rain' | 'Partly Cloudy'
    },
    {
      "time": "+1h",
      "temp": 16,
      "condition": "Sunny"
    },
    {
      "time": "+2h",
      "temp": 16,
      "condition": "Cloudy"
    },
    {
      "time": "+3h",
      "temp": 14,
      "condition": "Rain"
    }
  ]
}
```

### 2. Calendar Events
Returns a list of upcoming calendar events for the day.

- **Endpoint:** `GET /api/calendar`
- **Response:** `200 OK`

```json
[
  {
    "id": "1",
    "title": "Team Standup",
    "startTime": "2023-10-27T10:00:00Z",
    "endTime": "2023-10-27T10:30:00Z",
    "isAllDay": false
  },
  {
    "id": "2",
    "title": "Lunch with Sarah",
    "startTime": "2023-10-27T12:30:00Z",
    "endTime": "2023-10-27T13:30:00Z",
    "isAllDay": false
  }
]
```

### 3. RSS Headlines
Returns the latest headlines from configured RSS feeds.

- **Endpoint:** `GET /api/rss`
- **Response:** `200 OK`

```json
[
  {
    "id": "1",
    "title": "SolidJS 2.0 Announced",
    "source": "Hacker News",
    "publishedAt": "2023-10-27T09:15:00Z"
  },
  {
    "id": "2",
    "title": "SpaceX Launch Successful",
    "source": "TechCrunch",
    "publishedAt": "2023-10-27T08:00:00Z"
  }
]
```

### 4. Train Departures
Returns upcoming train departures (specifically configured for West Ealing -> Stratford / Elizabeth Line).

- **Endpoint:** `GET /api/trains`
- **Response:** `200 OK`

```json
[
  {
    "id": "1",
    "destination": "Stratford",
    "dueInMinutes": 2,
    "status": "On Time", // 'On Time' | 'Delayed' | 'Cancelled'
    "platform": "4"
  },
  {
    "id": "2",
    "destination": "Shenfield",
    "dueInMinutes": 16,
    "status": "Delayed",
    "platform": "4"
  }
]
```

## Error Handling
In case of errors, the API should return standard HTTP error codes (4xx for client errors, 5xx for server errors) with a JSON body:

```json
{
  "error": "Description of the error"
}
```
