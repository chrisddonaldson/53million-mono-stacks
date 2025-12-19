## Ticket 4: Calculate Room Health Scores

### Description

Now that chores are grouped by room, cleaned up, and kept within reasonable overdue bounds, we want to compute a **health score for each section of the house**.

The goal is to answer one simple question:

> _“How much do I need to worry about this room right now?”_

A tidy, well-maintained room should have a **high health score**, while a neglected room should clearly stand out as unhealthy and demanding attention.

This score will later be used for:

- High-level summaries
- Trend tracking
- Visual dashboards
- Notifications or alerts

---

## Core Concept: Room Health

Each room receives a **health score from 0–100**, where:

- **100** → pristine, no attention needed
- **70–89** → healthy, minor issues
- **40–69** → degraded, needs attention
- **0–39** → unhealthy, urgent

Health is calculated from **three signals**:

1. **Overdueness**
2. **Completion performance**
3. **Priority pressure**

---

## Health Calculation Model

### 1. Overdueness Impact (Primary Signal)

Overdue chores are the strongest indicator of room health.

**Per-chore overdue penalty**:

| Overdue (hrs) | Penalty |
| ------------- | ------- |
| ≤ 0           | 0       |
| 1–24          | -1      |
| 24–72         | -3      |
| >72           | -5      |

- Apply penalties per chore
- Cap total overdue penalty per room (e.g. `-40`) to avoid infinite punishment

**Rationale**
A single late chore is fine. Many late chores = neglect.

---

### 2. Completion Performance (Stability Signal)

This reflects whether chores in a room are **actually being completed**, not just rescheduled.

Suggested approach:

- Track chores completed within their expected window
- Compare to how many _should_ have been completed

**Score contribution (per room):**

```
completion_ratio = completed_on_time / expected_completions
completion_score = clamp(completion_ratio * 30, 0, 30)
```

- Max contribution: **+30**
- If no completion data exists yet, use a neutral default (e.g. +15)

**Rationale**
Rooms that stay clean tend to stay clean.

---

### 3. Priority Pressure (Urgency Signal)

High-priority chores indicate cognitive and operational load.

**Per-chore priority penalty** (example):

| Priority | Penalty |
| -------- | ------- |
| Low      | 0       |
| Medium   | -1      |
| High     | -3      |
| Urgent   | -5      |

- Sum penalties per room
- Cap penalty (e.g. `-20`)

**Rationale**
Even if chores aren’t overdue yet, high urgency means stress is coming.

---

## Final Health Score Formula

Start with a perfect room:

```
health = 100
health -= overdue_penalty
health -= priority_penalty
health += completion_score
health = clamp(health, 0, 100)
```

---

## Output Expectations

Extend the existing chore report with a **Room Health Summary** section:

Example:

```
=== ROOM HEALTH ===

Bedroom   : 82 (Healthy)
Bathroom  : 54 (Needs attention)
Kitchen   : 38 (Unhealthy)
Garden    : 61 (Degraded)
```

Optionally:

- Sort rooms by health (worst → best)
- Include a short reason summary later (future ticket)

---

## Modularity & Extensibility

Health calculation must be:

- Independent of CLI formatting
- Configurable (weights, caps, thresholds)
- Easy to tweak without rewriting logic

Suggested modules:

- `health/overdueScore.ts`
- `health/completionScore.ts`
- `health/priorityScore.ts`
- `health/calculateRoomHealth.ts`

---

## Testing

Add Vitest coverage for:

- Individual scoring components
- Final health calculation
- Edge cases:

  - Rooms with no chores
  - Rooms with only completed chores
  - Rooms with extreme overdue counts

Mock chore data — no API calls.

---

## Acceptance Criteria

- [ ] Each room receives a deterministic health score (0–100)
- [ ] Health is based on overdueness, completion, and priority
- [ ] Scores feel intuitive and explainable
- [ ] Logic is modular and configurable
- [ ] Output includes a room health summary
- [ ] Tests added and passing
