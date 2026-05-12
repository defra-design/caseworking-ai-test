# Builder rules

Rules for the `/builder/new` guided flow that produces a tasklist data file.

## 1. Task page content captured in the form

The task metadata form must capture the content of the task page, including:

- The task **page title**
- The **content shown before the Outcomes** section

This becomes part of the data file so the same task page can be rendered from a single source.

## 2. Pre-outcomes content is an HTML block

The "content before outcomes" field is an HTML block that allows GDS text styles (headings, paragraphs, lists, inset text) and links. The form input must accept HTML, and the renderer must output it without escaping.

## 3. Show auto-generated task data on the task capture screen

On the task data capture screen, any data that has been **automatically generated** for the task (and for the parent stage where relevant — href, outcome input name, status/tag field names, stage prefix etc.) must be displayed in a **GDS summary list** with a **Change link** for each row, so the user can override an auto-generated value if needed.

## 4. Auto-assigned URLs, input names and variable names

The user does **not** enter:

- Stage URLs
- Task URLs (hrefs)
- Form input `name` attributes (decision/outcome fields)
- Variable names referenced in `routes.js` and page conditionality

These are derived automatically from the **stage number** and **task number**, not from the stage or task name.

## 5. Naming convention for auto-assigned data

Use `S` + stage number for stage-scoped values, and `S<n>T<m>` for task-scoped values, followed by the purpose. Names are stable, short, and independent of any text the user types — picking S1/T1 keeps everything readable and avoids prefix collisions when stages have similar names.

Examples — for **Stage 1** (whatever its display name) and its **Task 1**:

| Item | Generated value |
|---|---|
| Stage href / key | `S1` |
| Stage decision input name | `S1Decision` |
| Stage status field | `S1Status` |
| Stage tag field | `S1Tag` |
| Task 1 href | `S1T1` |
| Task 1 outcome input name | `S1T1Outcome` |
| Task 1 status field | `S1T1Status` |
| Task 1 tag field | `S1T1Tag` |

Stage 2 would yield `S2`, `S2Decision`, `S2T1`, `S2T1Outcome`, and so on. The display name entered by the user is preserved separately as `heading` / `name` in the data model — it is never used to derive identifiers.

## 6. Outcomes are captured at stage level

All tasks within a stage share the same outcome options. Capture once at the **Stage** form:

- A **comma-separated list** of outcome labels (e.g. `Accepted, Information requested, Cannot accept`)
- The **"accepted" / positive option** — selected from the list above to mark which value advances the task

Do not collect outcomes per-task.

## 7. Stage description and conditional stage text

The Stage form must capture:

- **Stage description** — the content used for the `tasklist-stage` page for this stage
- A **checkbox**: "Stage text varies by case status"
- When the checkbox is ticked, **conditionally reveal** two fields:
  - The **logical condition** (e.g. `caseStatus === 'on-hold'`)
  - The **conditional text** to show when that condition is true

Use the GDS conditional-reveal radio/checkbox pattern.

## 8. Stage decisions captured at stage description

Stage-level decisions (the action(s) the caseworker can take to move the case forward, e.g. "Approve", "Reject", "Put on hold") are captured on the **Stage** form alongside the stage description — not on a separate screen.

## 9. Dependencies for each stage decision

For each stage decision, also capture:

- **Stage change?** — yes/no, and if yes, the target stage
- **Status change?** — yes/no, and if yes, the new status text and tag class

This produces the lookup table the route handler uses (equivalent to `APPROVE_DECISIONS` / `AMEND_OUTCOMES` in `routes.js`).

## 10. Add another stage decision

The Stage form must support **adding more than one decision** using the GDS / HMRC "add another" pattern within the page — repeat the decision sub-form with a button to append another empty decision row.

## 11. Show auto-generated stage data on the stage capture screen

On the stage data capture screen, any data that has been **automatically generated** for the stage (stage key/href, three-letter prefix, decision input name, derived status/tag field names) must be displayed in a **GDS summary list** with a **Change link** for each row, so the user can override an auto-generated value if needed.

## 12. Stage variants by task count and decision count

The stage data model and the rendered stage page must handle three variants. The form must allow zero tasks and zero or one decision in addition to the standard "n tasks, 2+ decisions" case.

### 12a. Zero tasks, zero decisions — terminal state

End / termination states such as "Rejected" or "Withdrawn".

- No tasks list rendered.
- No decision radios, no submit button.
- Only the **stage description** is shown.
- The description **may vary by case status** using the conditional-text rule (see rule 7).
- Builder form: must accept `taskCount = 0` and an empty decisions list.

### 12b. Zero tasks, one decision — note-and-button state

States such as "On hold" where the caseworker only needs to record a reason and click a labelled action button.

- No tasks list rendered.
- No radio group rendered.
- Render: stage description, then a **reason** textarea, then a **single button**.
- The decision's **label becomes the button label** (e.g. "Put on hold").
- The reason textarea uses the conditional note field associated with the decision.
- Builder form: when there are 0 tasks and exactly 1 decision, the renderer must collapse the radios into the button label.

### 12c. n tasks, 2 decisions where 1 is hidden — gated-progress state

States such as "Return to customer" where the primary onward action only appears once tasks are accepted, and the alternative action is always available.

- Render the tasks list as normal.
- Decisions are evaluated against any `showWhen` predicate (or "tasks accepted" gate).
- **If only one decision option is currently visible**, render as the note-and-button pattern from 12b: hide the radios, show a reason textarea, and use that decision's label as the button label.
- **If two or more decision options are visible**, render as the standard radio group with a generic submit button.
- Builder form: must allow capturing 2+ decisions per stage where one or more carry a visibility condition (gating). The "show only when all tasks accepted" gate is the default for any decision that targets a forward stage change.
