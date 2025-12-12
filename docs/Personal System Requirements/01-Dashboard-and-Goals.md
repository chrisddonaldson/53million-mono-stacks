# 1. Dashboard & Goals

## 1.1 General Functionality

### 1.1.1 Time & Date Display
> **As** Chris, **I want** to see the current time and date clearly, **so that** I can orient myself quickly.

#### Acceptance Criteria
- [ ] Display current local time (HH:MM format).
- [ ] Display current date (Day, Month Date).
- [ ] Update time at least every minute.

### 1.1.2 Calendar Events
> **As** Chris, **I want** to see upcoming calendar events, **so that** I know what my schedule looks like for the day.

#### Acceptance Criteria
- [ ] Fetch events from connected calendar(s).
- [ ] Display "Next up" event prominently.
- [ ] List events for the next 24-48 hours.

### 1.1.3 RSS Feed Aggregator
> **As** Chris, **I want** to see headlines from my favorite RSS feeds, **so that** I can stay updated without checking multiple sites.

#### Acceptance Criteria
- [ ] Fetch headlines from a configured list of RSS URLs.
- [ ] specific visual distinction between sources.
- [ ] Limit number of items displayed to avoid clutter.

### 1.1.4 Weather Display
> **As** Chris, **I want** to see current weather conditions, **so that** I can plan my attire and activities.

#### Acceptance Criteria
- [ ] Display current temperature and condition (e.g., Sunny, Rain).
- [ ] Show today's high/low forecast.
- [ ] Use icons for visual recognition.

### 1.1.5 Auto-Refresh Mechanism
> **As** Chris, **I want** the dashboard to refresh data automatically, **so that** the information is always current without manual intervention.

#### Acceptance Criteria
- [ ] Data refreshes in the background at appropriate intervals (e.g., Weather: 15m, Time: 1m).
- [ ] No full page reload (no white flash).

### 1.1.6 Secure Data Fetching
> **As** a Developer, **I want** to proxy external requests via a backend, **so that** API keys are not exposed to the client.

#### Acceptance Criteria
- [ ] Backend service handles external API calls (Calendar, Weather, RSS).
- [ ] Frontend only communicates with this backend service.
- [ ] No API keys in frontend code.

### 1.1.7 Fault Tolerance
> **As** a User, **I want** widgets to fail independently, **so that** one broken API doesn't crash the entire dashboard.

#### Acceptance Criteria
- [ ] If one widget fails (e.g., Weather API down), others continue to function.
- [ ] Display a subtle error state for the failed widget (e.g., "Data unavailable").

### 1.1.8 Wall Display Optimization
> **As** Chris, **I want** the UI optimized for a wall-mounted display, **so that** it is readable from a distance and suitable for always-on use.

#### Acceptance Criteria
- [ ] High contrast mode available.
- [ ] Large font sizes for key information.
- [ ] Dark mode default to reduce glare at night.

### 1.1.9 Glanceable Layout
> **As** Chris, **I want** a clean, readable layout, **so that** I can digest information in a few seconds.

#### Acceptance Criteria
- [ ] Grid or modular layout.
- [ ] Consistent spacing and typography.
- [ ] Visual hierarchy emphasizing most important info (Time, Next Event).

## 1.2 User Stories

### 1.2.1 Personal Goals Dashboard (IGNORE)
> **As** Chris, **I want** a personal goals dashboard, **so that** I can see all my major objectives and track my progress in one place.

#### Acceptance Criteria
- [ ] Dashboard displays a list of active personal goals.
- [ ] Each goal shows current progress status (e.g., percentage, milestones achieved).
- [ ] Goals can be categorized (e.g., Health, Career, Learning).
- [ ] Visual indicators for "on track", "at risk", or "completed".

### 1.2.2 Daily Fitness Checklist (IGNORE)
> **As** Chris, **I want** a daily fitness checklist, **so that** I never forget the habits required to reach my goals.

#### Acceptance Criteria
- [ ] Display a daily checklist of fitness-related tasks (e.g., "Drink 3L water", "30 mins cardio", "Stretching").
- [ ] Ability to mark items as complete directly from the dashboard view (or via a linked input method).
- [ ] Status resets automatically at the start of each day (e.g., midnight).
- [ ] Visual streak counter to encourage consistency.

### 1.2.3 Finance Overview (IGNORE)
> **As** Chris, **I want** to see an up-to-date view of my finances, **so that** I have clear awareness of my spending and budgets.

#### Acceptance Criteria
- [ ] Display current balance summaries from key accounts (securely).
- [ ] Show tracking against monthly budget categories.
- [ ] Alert indicators for overspending or unusual activity.
- [ ] Privacy mode: Ability to hide exact numbers when required (e.g., guest mode).

---
