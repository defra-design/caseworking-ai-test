# Screen change-history index

One section per tracked screen, newest capture last. This is the human-readable
mirror of the `captures` in `manifest.json` — the source Claude Design turns
into the visual timeline. As more reports land, each screen grows more
versions, and the "→ why it changed" connectors fill in.

Image paths are relative to `/public/images/research/` (served) /
`app/assets/images/research/` (repo).

---

## tasklist-decision — Task list, decision panel
Related patterns: [Task](/pattern-library/patterns/task) · [Caselist](/pattern-library/patterns/caselist) · [Radios](/pattern-library/gds/radios)

### v1 — 2026-01 · Amendments to grant applications pre agreement · verdict: mostly-worked
Images: `tasklist-decision--default.png`, `tasklist-decision--amend-selected.png`, `tasklist-decision--return-selected.png`

- All participants found and used **"Return to customer"** and **"Amend"** with minimal prompting and understood their purpose.
- The decision radio set (put on hold / amend / return / reject / withdraw) was generally intuitive.
- **Mental-model mismatch:** participants expected to amend from the Application view or land/mapping tasks (as in Siti Agri), not a generic decision radio. One went to the Application tab first; the other two found the right option after exploring the task list.

Recommended: reconcile the decision-button model with the "amend from the application/land view" expectation; make clearer which decisions a caseworker owns vs escalates.

---

## confirm-amend — Confirm, amend application
Related patterns: [Warning text](/pattern-library/gds/warning-text) · [Radios](/pattern-library/gds/radios)

### v1 — 2026-01 · Amendments to grant applications pre agreement · verdict: problem
Image: `confirm-amend.png`

- Confusion and anxiety about the current application being **"withdrawn"** and the amendment being a separate **"duplicate application"**.
- "Withdraw" read as the same as "reject"; fear of irreversible / "ghost" applications blocking land parcels.
- Unclear whether the duplicate is pre-populated, and whether the original stays visible/editable.
- "Grants-UI" not understood.
- > "I see withdraw and reject as same thing" (P1)
- > "Is there a process for withdrawing that, or is the system doing it automatically...?" (P1)

Recommended: replace "withdraw" with clearer language; state what happens to the withdrawn record and the caseworker's work; say whether forms are pre-populated; simplify "Grants-UI".

---

## confirm-return — Confirm, return to customer
Related patterns: [Warning text](/pattern-library/gds/warning-text) · [Radios](/pattern-library/gds/radios)

### v1 — 2026-01 · Amendments to grant applications pre agreement · verdict: problem
Image: `confirm-return.png`

- Same withdraw + duplicate model as confirm-amend, with the same confusion.
- Felt that making the applicant redo an entire application would be frustrating — completing one can take several days.

Recommended: clarify data retention for the customer-facing resubmission; reframe so a return-for-amendment does not read as a full restart.

---

## confirmation-amend — Confirmation, amending application
Related patterns: [Task](/pattern-library/patterns/task)

### v1 — 2026-01 · Amendments to grant applications pre agreement · verdict: problem
Image: `confirmation-amend.png`

- No understanding of the Grants-UI content; page felt confusing, though the link to Grants-UI was spotted.
- Wanted a way to see the **differences between new and old** versions of the application.
- Worried repeated amendments would create stacking application/case numbers that confuse applicants and staff.
- > "this doesn't make a huge amount of sense, so it'll automatically be submitted when I've done my mapping change?" (P2)
- > "Changing case numbers will make this real confusing... they are just going to stack up" (P1)

Recommended: add a diff view (essential for large multi-parcel cases); clarify the Grants-UI handoff and submission/mapping sequence; rethink case-number proliferation.

---

## confirmation-return — Confirmation, returned to customer
Related patterns: [Task](/pattern-library/patterns/task)

### v1 — 2026-01 · Amendments to grant applications pre agreement · verdict: problem
Image: `confirmation-return.png`

- Restates that the application is withdrawn and all review tasks restart once the amended application is submitted.
- Restart-all-tasks messaging raised workload concerns, especially for complex applications (80+ checks).

Recommended: clear task-restart logic (what re-does vs what is preserved); change-history / reuse of prior work to cut re-work.
