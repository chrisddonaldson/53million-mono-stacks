## Ticket 2: Improve Chore Output Readability & Structure

### Description

Now that we can successfully fetch a list of all chores from DoneTick, we want to transform this raw data into a more human-readable and insightful report.

The goal is to make it easy to quickly understand:

- Which **rooms** are clean or neglected
- Which chores are **urgent**
- Which chores are **frequent vs infrequent**

This ticket focuses on restructuring, formatting, and sorting the chore output while keeping the implementation modular and future-proof.

---

### Requirements

#### 1. Group chores by room (label-based)

- Use the **labels** field on each chore to determine which room it belongs to (e.g. `bedroom`, `bathroom`, `kitchen`)
- Output chores grouped by room
- Rooms with no chores should not be shown
- A chore may belong to **multiple rooms**; if so, it should appear under each relevant group

Example (conceptual):

```
Bedroom
  - Make bed
  - Change sheets

Bathroom
  - Clean toilet
  - Replace towels
```

---

#### 2. Human-readable “next due” time

- Convert the `next_due_date` into a **relative hour-based format**
- Display as:

  - `3hrs` → due in 3 hours
  - `-43hrs` → overdue by 43 hours

- Always round to whole hours
- Avoid dates/timestamps in the CLI output

This keeps the output compact and visually scannable.

---

#### 3. Sort chores by frequency within each room

Within each room grouping:

- Sort chores by how **frequently** they occur
- Most frequent chores should appear at the top

Expected order (example):

1. Daily
2. Every few days
3. Weekly
4. Monthly
5. Less frequent / ad-hoc

If DoneTick provides an interval or frequency field, use that directly.
If not, derive it in a consistent and documented way.

---

#### 4. Modular & extensible design

This transformation logic should be implemented in a way that allows easy future changes.

Specifically:

- Data fetching should remain separate from data transformation
- Grouping, sorting, and formatting should be isolated into small, composable functions
- Avoid hard-coding labels, room names, or output formats where possible

---

### CLI Output Expectations

- `npm run all-chores` should now output the **formatted, grouped, and sorted** chore list
- Output should be deterministic and stable (important for tests)
- Errors should remain clearly logged without crashing the process unnecessarily

---

### Testing

- Update existing tests and add new **Vitest** coverage for:

  - Room grouping logic
  - Frequency sorting
  - Relative time formatting

- Include edge cases:

  - Overdue chores
  - Chores without labels
  - Chores with multiple labels
  - Missing or malformed date fields

---

### Acceptance Criteria

- [ ] Chores are grouped by room using labels
- [ ] “Next due” times are displayed as relative hours (e.g. `3hrs`, `-12hrs`)
- [ ] Chores within each room are sorted by frequency
- [ ] Output is modular and easy to extend
- [ ] CLI output updated accordingly
- [ ] Tests updated and passing
