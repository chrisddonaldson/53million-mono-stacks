## Ticket 3: Cleanup & Reschedule Overdue Chores

### Description

The current chore report shows that many chores are **extremely overdue** (hundreds or thousands of hours). This creates several issues:

- Error and warning output becomes overwhelming
- Urgency signals lose meaning
- Chores can feel “lost” rather than actionable

To fix this, we want to introduce a **maintenance script** that:

- Prevents chores from being excessively overdue
- Automatically reschedules long-overdue chores back into a realistic plan
- Increases priority based on how overdue a chore has become

This script should **reset overdue chores intelligently**, not simply ignore or delete them.

---

### New Script

Add a new CLI command:

```bash
npm run cleanup-chores-next-dates
```

This script will:

- Fetch all chores from DoneTick
- Identify overdue chores
- Apply rescheduling and priority adjustments
- Patch the updated values back to DoneTick via the API

---

### Behavior & Rules

#### 1. Identify overdue chores

- A chore is considered **overdue** if `next_due_date < now`
- Calculate how overdue it is in **hours**

---

#### 2. Overdue threshold (skip-forward logic)

- Define a hard limit:
  **No chore should ever be more than 72 hours (3 days) overdue**

If a chore is overdue by more than 72 hours:

- It should be **skipped forward** to the current cycle
- Its `next_due_date` should be recalculated from **today**, not from the old due date

This prevents chores from dangling forever.

---

#### 3. Priority escalation based on overdue severity

For overdue chores:

- Increase their priority relative to how overdue they are
- The more overdue the chore, the higher the priority

Exact priority mapping should be:

- Clearly documented
- Deterministic
- Easy to tweak in the future

Example (illustrative only):

| Overdue (hrs) | Priority Adjustment |
| ------------- | ------------------- |
| 0–24          | +0                  |
| 24–72         | +1                  |
| >72           | +2 (or max)         |

---

#### 4. Recalculate next due date

For each overdue chore:

- Use the chore’s **ideal frequency** (daily, weekly, monthly, etc.)
- Calculate a new `next_due_date` starting from **now**
- Ensure the new date is always in the future (or at most slightly overdue)

This keeps chores **in the plan**, rather than permanently failing.

---

#### 5. Patch updated chores back to DoneTick

- Use the DoneTick API to update:

  - `next_due_date`
  - `priority` (if changed)

- Only patch chores that actually need changes
- Log all updates clearly

Reference:
[https://docs.donetick.com/advance-settings/api/](https://docs.donetick.com/advance-settings/api/)

---

### Implementation Notes

- Reuse existing chore-fetching logic from previous tickets
- Keep logic modular:

  - Overdue detection
  - Priority calculation
  - Next-date calculation
  - API patching

- Avoid hard-coding thresholds; define them as constants or config
- Fail gracefully if individual chore updates fail (do not stop entire run)

---

### Logging & Output

The script should:

- Log how many chores were processed
- Log how many were:

  - Overdue
  - Rescheduled
  - Had priority upgraded

- Provide a dry, readable summary at the end

Example:

```
Cleanup complete
- Total chores scanned: 53
- Overdue chores: 41
- Rescheduled: 29
- Priority upgraded: 18
```

---

### Testing

Add Vitest coverage for:

- Overdue detection logic
- Priority escalation rules
- Next due date recalculation
- Edge cases:

  - Missing frequency
  - Missing due date
  - Extremely overdue chores
  - Already-up-to-date chores

API calls should be mocked.

---

### Acceptance Criteria

- [ ] `npm run cleanup-chores-next-dates` exists and runs successfully
- [ ] Overdue chores are detected correctly
- [ ] Chores overdue by more than 72 hours are rescheduled from today
- [ ] Priority increases with overdue severity
- [ ] Chores are patched back to DoneTick correctly
- [ ] Logic is modular and configurable
- [ ] Robust logging and error handling
- [ ] Tests added and passing
