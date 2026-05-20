# caseReal build notes — 19 May 2026

How the Golden Grange case was built from two raw exports of the live
`fg-cw-frontend` service.

## Starting point

Two HTML files exported from the running production service for case
`100287` (Golden Grange, SBI 300000100):

| File | Role | Lines |
|---|---|---|
| [`views/FRPS-D2/app-real.html`](../app-real.html) | Application detail page export | 7,231 |
| [`views/FRPS-D2/calculation-response.html`](../calculation-response.html) | Calculations page export | 9,870 |

Both files are full standalone pages — they include the production app's own
header, nav, layout chrome, and CSS. They are kept untouched as the source of
truth and not served directly.

## What was built

The two exports drove the creation of a complete `caseReal/` folder mirroring
the case2 structure, plus three versioned calculation pages and full route
wiring through the prototype kit.

### New files
- [`views/FRPS-D2/caseReal/application.html`](application.html) — Application page in the prototype's `application-new` format, with all 15 parcels and Golden Grange customer data extracted from `app-real.html`.
- [`views/FRPS-D2/caseReal/calculations-new.html`](calculations-new.html) — Run 3 calculations (10:30am 19 May 2026, 7 diffs, 2 fails).
- [`views/FRPS-D2/caseReal/calculations-mid.html`](calculations-mid.html) — Run 2 (3:14pm 18 May 2026, 5 diffs, 1 fail).
- [`views/FRPS-D2/caseReal/calculations-old.html`](calculations-old.html) — Run 1 baseline (9:08am 13 May 2026, all pass).
- [`views/FRPS-D2/caseReal/`](.) (the rest) — 36 supporting pages cloned from `case2/`: tasklist-stage, agreement, timeline, notes, task-* (review/agreement/amendment/transfer/5-month variants), terminate flow, return/amend confirmations.
- [`views/FRPS-D2/includes/_caseReal-context-strip.html`](../includes/_caseReal-context-strip.html) — Golden Grange banner: heading, Scheme: SFI, Application ID: 100287, SBI: 300000100, status from `data.caseStatusReal`.
- [`views/FRPS-D2/includes/_caseReal-nav.html`](../includes/_caseReal-nav.html) — Real-only nav (no application-size switch); Calculations link resolves to `calculations-new`.

### Routes added in [`routes.js`](../../../routes.js)
- `/realApplication` — sets `data.largeCase = 'real'`, redirects to `/tasklistStageReal`.
- `/tasklistStageReal` — `makeStageRoute` lifecycle: first hit → caselist, subsequent hits → caseReal tasklist with stage progression.
- 36 case-action routes mirroring case2 with `Real` suffix instead of `C2`: `/app-approve2Real`, `/aggSent2Real`, `/amend1Real`, `/amend2Real`, `/terminate1Real`, `/task1T2Real` … `/task6T2Real`, `/task1T2AmReal` … `/task3T2AmReal`, `/task1AgT2Real`, `/task2AgT2Real`, `/setAgreeSign2Real`, `/setUserFo2Real`, `/5month1Real`, `/task5m1Real` … `/task5m6Real`, `/endTerminateReal`, `/agreementStage2Real`, `/startReal`, `/resume2Real`, `/amendReturn1Real`, `/returnConf1Real`, `/terminateConf1Real`, `/amendConf1Real`, `/terminatePrepReal`, `/task1TrT2Real`, `/task2TrT2Real`, `/caselistTeam2Real`. Each writes to Real-scoped session keys and redirects to the caseReal tasklist.
- `calcPageKeys` entries for `/FRPS-D2/caseReal/calculations-new`, `-mid`, `-old` so the per-page filter state is isolated.
- `largeCalcFilter` `targets` map entries for `caseReal`, `caseRealMid`, `caseRealOld` so the Run-date dropdown can switch versions while carrying the chosen filter.
- Index link "Real application" → `/realApplication`.
- Caselist row: 100287 / Golden Grange / 300000100 / 13 May 2026 → `caseReal/tasklist-stage`.

## Calculations transformation pipeline

The raw `calculation-response.html` has its own per-action check layout:
nested `<details>` (one per action) containing four or five inner `<details>`
checks. The prototype's `calculations-new` (case2 medium) uses a flat
calculations2-style layout with `<h3>Funded action: …</h3>` headers followed
by un-nested `<details>` checks. The pipeline reshapes the export into that
flat form and adds the following transformations on top:

1. **Combine** the real export's "Available area calculation explanation"
   block and "Has the total available area been applied for?" check into a
   single **"Available area check"** that mirrors `calculations-new`'s
   "Required area check" (Result + Pass/Fail reason + "What to do" section
   for fails + the full Available area calculation breakdown).
2. **Rename** "Does the site require a Historic Environment Farm Environment
   Record?" → **"Does the site require a HEFER?"**.
3. **Tag relabelling** — for the two checks that aren't pass/fail in nature,
   the green tag reads **Yes** instead of **Passed** (HEFER and SSSI).
4. **SSSI body** simplified to a single static line:
   *"This land parcel is situated within a Site of Special Scientific
   Interest. Check if a notice of planned activity has been submitted to
   Natural England."*
5. **HEFER scoping** — HEFER check kept only on parcel `NY2119 1042` (1
   parcel × 3 actions = 3 instances per file). 42 other HEFER details
   removed per file. Body for the kept HEFERs is a single line about the
   50% historic-features intersection, with Result / Pass-reason headings
   stripped.
6. **Three versions** for the run history (each with its own
   `calculations-*.html`):

   | Run | File | Timestamp | Differences | Fails |
   |---|---|---|---|---|
   | 1 | `calculations-old.html` | 9:08am 13 May 2026 | 0 | 0 |
   | 2 | `calculations-mid.html` | 3:14pm 18 May 2026 | 5 | 1 |
   | 3 | `calculations-new.html` | 10:30am 19 May 2026 | 7 | 2 |

   The 5 Run 2 diffs are carried into Run 3; Run 3 adds 2 more (1 fail +
   1 change). The fails are constrained to **Available area** and
   **Moorland** (HEFER and SSSI cannot fail by design).

7. **Filter wrappers** — each parcel `<h2>`, each action `<h3>`, and each
   check `<details>` is wrapped individually:
   - Fail → no wrapper (always visible)
   - Change → `{% if not data.showFailsOnly %}` (visible in *All checks*
     and *Calculations with changes*)
   - Unchanged → `{% if not data.showFailsOnly and not data.showChangesOnly %}`
     (visible only in *All checks*)
   - Header wrappers cascade to the strongest status of the checks beneath
     them, so an entire parcel block disappears in *Changes* mode when none
     of its checks differ.
   - The all-pass `calculations-old.html` uses a single outer wrapper plus
     the *"There are no fails/changes to show"* fallback paragraphs.

8. **Changed-value highlighting** — every value that differs from the
   baseline is wrapped in `<span class="value-changed">` to pick up the
   yellow `#ffee80` background defined in `application.scss`.

## Page chrome changes

- **Title H1** runs the full row width and includes the run timestamp:
  *Land parcel calculations (10:30am 19 May 2026)*.
- **Pass / Fail tag alignment** — defined once in `application.scss`:
  ```scss
  .govuk-details__summary { width: 100%; box-sizing: border-box; }
  .govuk-details__summary-text {
    display: flex; align-items: center; justify-content: space-between;
  }
  .govuk-details__summary-text > .govuk-tag {
    margin-left: 0; margin-right: 10px; flex-shrink: 0;
  }
  ```
  All Pass / Fail / Yes tags float hard right with a 10px gap from the row
  edge. (`<summary>` defaults to `width: fit-content` in govuk-frontend, so
  width: 100% + border-box is required for the flex layout to span the row.)
- **Land-parcel search panel** above the parcel list — accessible-autocomplete
  input + Find button. Picking a parcel hides every other parcel section in
  place (no anchor jumping); "Show all land parcels" link restores them.
  GDS Transport font applied to the autocomplete dropdown.
- **Version-history table** in the *Show version history* details — three
  rows, cross-linked to the sibling files; the current page shows "Currently
  showing". The Run-date dropdown in the filter panel mirrors the same three
  options and lets the user switch version with the currently-selected filter
  carried through.

## Architectural decisions worth noting

- **Per-page filter state isolation** — the kit's `autoStoreData` middleware
  snapshots `req.session.data` onto `res.locals.data` *before* user routes
  run. The per-page filter middleware therefore writes to BOTH
  `req.session.data.*` (for persistence) AND `res.locals.data.*` (for the
  current render). Without the locals write, filter state from the
  previously visited calc page would render even when the URL had moved on.
- **caseReal nav is its own include** rather than another branch in the
  shared `_case2-nav` size switch. The Real flow lives in its own folder
  so there is no need for the runtime `largeCase` flag to influence the
  link resolution; the nav just hard-references the in-folder slugs.
- **C2 → Real rename was mechanical** — clone case2's html into caseReal,
  then `s/C2/Real/g` on data keys, session keys, route paths inside
  `href=`/`action=` attributes. Same on the routes.js case2 block to
  produce the 36 Real route definitions. Two pre-existing quirks were
  intentionally normalised: `/agreementStage2Real` writes to
  `agreementStageReal` (not the unsuffixed `agreementStage` the case2
  version wrote to), and the task5/task6 review routes use
  `detailsCheckedReal` instead of the unsuffixed `detailsChecked`.

## Lessons / gotchas

- **`express` is not a direct project dependency.** `routes.js` reaches it
  through the kit's bundle:
  ```js
  const express = require('govuk-prototype-kit/node_modules/express')
  ```
- **The user-router runs after `autoStoreData`** (registered in
  `kit/server.js` at line 130) but **before** the kit's template
  auto-renderer at line 158. So `router.use(...)` middleware can intercept
  template requests via `next()` cascade — but anything it writes to
  session data is invisible to the imminent template render unless it
  also writes to `res.locals.data`.
- **`<summary>` shrink-wraps by default.** govuk-frontend sets
  `width: fit-content` on `<summary>` so the focus outline tracks the
  title text. That makes float-right / flex-justify hit the *title's* edge
  rather than the row edge. Restore full width with
  `width: 100%; box-sizing: border-box`.
- **Non-greedy regex still spans `<details>` blocks if the anchor token
  appears further down.** A regex anchored on
  `<details>...<summary[\s\S]*?HEFER text[\s\S]*?</details>` can match a
  Moorland `<details>` and continue through to the next HEFER `</details>`,
  swallowing the intermediate blocks. Solve by anchoring the regex on the
  summary's immediate content (`<span class="govuk-details__summary-text">\s*HEFER text`)
  so the match cannot start outside the target block.
- **Worktree memory matters.** Per the auto-memory, all edits for the
  FRPS-D2 prototype go to `ai-driven-main/app/views/FRPS-D2/`, not the
  agent worktree copy. Generated files written to the wrong path are
  invisible to the running prototype.

## Quick verify

The live preview server (port 3000 in normal use, 51003 when launched via
the preview MCP) renders:

- Index → **Real application** link → `/realApplication` → caselist on
  first hit, caseReal tasklist on subsequent hits.
- Caselist → click **100287** → caseReal tasklist (Golden Grange banner).
- Calculations tab → `calculations-new`. Switch via Run-date dropdown to
  `calculations-mid` or `calculations-old`; filter via the radio
  ("All checks" / "Calculations with changes" / "Only fails").
- Search bar above the parcel list filters in place to a single parcel.
