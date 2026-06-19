# Grasslands prototype area — build notes

Created 15 Jun 2026 as a **blank canvas for prototyping the Grasslands grant
type**, independent of FRPS-D2. It replicates the Golden Grange journey
(FRPS-D2 `caseReal`) end to end so there's a working baseline to build new
functionality on.

## Structure

```
views/Grasslands/
  caselist.html              ← minimal single-case caselist (Golden Grange / 100287)
  caseGrass/                 ← the case journey (45 pages cloned from caseReal)
    tasklist-stage.html, application.html, calculations-{new,new2,mid,old}.html,
    timeline.html, notes.html, agreement.html, task-*.html, amend/return/terminate…
  includes/
    _caseGrass-context-strip.html   ← Golden Grange banner (Status from caseStatusGrass)
    _caseGrass-nav.html             ← case tab nav (reads grassCalcVariant / agreementStageGrass)
```

The shared Defra header (`FRPS-D2/includes/_defra-header.html`) is referenced,
not copied — it's generic chrome.

## How it was cloned

Mechanical rescope of `FRPS-D2/caseReal`, mirroring the case2→Real rename in
[`../FRPS-D2/caseReal/_BUILD_NOTES.md`](../FRPS-D2/caseReal/_BUILD_NOTES.md):

- `FRPS-D2/caseReal` → `Grasslands/caseGrass` (folder paths)
- case-specific include paths → `Grasslands/includes/_caseGrass-*`
- `realCalcVariant` → `grassCalcVariant`
- `Real` → `Grass` (data keys, route fragments, e.g. `caseStageReal` →
  `caseStageGrass`, `/app-approve2Real` → `/app-approve2Grass`)
- `/FRPS-D2/caselist` → `/Grasslands/caselist` (in the routes block)

New session-state keys (`caseStageGrass`, `decision1Grass`, …) mean the
Grasslands case is **fully independent** of the FRPS-D2 Golden Grange case —
clicking through one does not affect the other.

## Routes (in `app/routes.js`, "Grasslands grant type" block)

- `/grasslandsApplication` — launcher (index link); sets `largeCase='grass'`,
  `grassCalcVariant='new'`, redirects to `/tasklistStageGrass`.
- `/tasklistStageGrass` — `makeStageRoute` lifecycle; first hit sets the review
  stage and redirects to `/Grasslands/caselist`, later hits walk the stages.
- The full caseReal action set with a `Grass` suffix (approve/amend/return/
  terminate/agreement/task-review/5-month/etc.), all redirecting into
  `/Grasslands/caseGrass/`.
- `calcPageKeys` + `largeCalcFilter` targets for the four caseGrass calc pages
  (per-page filter isolation + Run-date version switching).

## Entry point

Index → **Grasslands case** → `/grasslandsApplication` → caselist → click
100287 → tasklist (review tasks) → tabs, decisions, calculations filter,
amend/return/terminate flows.

## Verified (15 Jun 2026, preview MCP)

- Launcher → caselist → tasklist chain (200s), Golden Grange banner, "In review"
  with 5 review tasks after the staged entry.
- All tabs render (Application, Calculations, Timeline, Notes, Agreement).
- Calc filter / Run-date switching resolves to the caseGrass calc pages.
- Action-route parity with caseReal (302/500/404 behave identically; the
  `makeTaskRoute` task pages 500 on a bare GET for both — they need the journey
  context, this is not a clone defect).
- FRPS-D2 `caseReal` still works untouched.

## Input isolation (16 Jun 2026)

The initial clone left a handful of input `name=` attributes unscoped because
caseReal itself never scoped them (they're shared across FRPS-D2). Since the
prototype kit's `autoStoreData` persists every submitted field into the shared
`session.data`, those were renamed to `*Grass` so the Grasslands case writes its
own keys and never collides with FRPS-D2:

- Inputs renamed: `aConf`, `terminateDecision`, `moreDetail` / `moreDetail2` /
  `moreDetail3`, `type` / `type1` / `type2` / `type3`, `decisionTask5m`,
  `case4Note`, `taskAm21Note` → all `…Grass` (50 attrs across 9 files).
- Base form actions repointed to Grass routes: `/amendConf1`→`/amendConf1Grass`,
  `/resume2`→`/resume2Grass`, `/month5_1`→`/month5_1Grass`,
  `/task4T2`→`/task4T2AmGrass`, `/../caselistTeam1`→`../caselist`.
- Routes: `/endTerminateGrass` now reads `terminateDecisionGrass`; added
  `/month5_1Grass` (6-month completion → caseGrass tasklist) and
  `/task4T2AmGrass` (amendment task 4, modelled on `/task3T2AmGrass`).

Every input in `caseGrass/` now writes a `Grass`-scoped session key — the case
is fully independent of FRPS-D2. (`filter`/`sort`/`from` on the calc pages stay
generically named but are isolated by their unique per-page keys.)

## Caselist — data file, context selector, Completed tab (19 Jun 2026)

The caselist is **route-driven**. Case data lives in the data file
`app/data/grasslands-cases.js` (**72 cases**); the routes filter + paginate and
pass a `view` object to the templates. Teams are defined in
`app/data/grasslands-teams.js` (3 teams × 3 caseworkers, exposed to templates as
`grasslandsTeams` / `grasslandsTeamNames` via a `res.locals` middleware).

**Tabs** (sibling pages, tab-style nav). My and the context tab show **active
cases only** — completed cases (Agreement accepted / Rejected / Withdrawn) are
excluded from them and appear only on the Completed tab (`grassActive()` in
routes.js):
- `caselist.html` → **My cases** = M Walker's active cases, context-independent.
- `caselist-team.html` → **context tab**: the selected team's active cases, or
  *all* active cases when context = All. Tab label is the context (Team A/B/C or
  "All cases").
- `caselist-completed.html` → **Completed cases**: status ∈ {Agreement accepted,
  Rejected, Withdrawn}, filtered by the same context (all completed when
  context = All, else the team's completed). Replaces the old All-cases tab.

**Context selector** ("Switch team" dropdown: Team A / B / C / **All cases** +
Switch button) sits **above the tabs** on every page. It posts `?ctx=…`; the
route persists it in `session.data.grassCtx` (default `A`) so the context carries
across tab clicks. Pagination (MOJ, 20/page) links carry `?page=N`; ctx comes
from session.

Routes in `app/routes.js` ("Grasslands caselist data + routes"):
`loadGrassCases`, `grassCtx`, `grassPaginate`, `grassCtxFilter`, and
`/Grasslands/caselist` (My), `/caselist-team` (context), `/caselist-completed`
(Completed). `/caselist-all` is a back-compat redirect to `caselist-team?ctx=all`.

**Data shape (72 cases):** statuses/tags from the FRPS-D2 set only; SBI unique
per distinct business; **submitted date appropriate to status** (advanced =
older); a spread of statuses with Agreement accepted dominant (accepted 21,
in review 13, on hold 9, drafted 8, offered 8, app received 7 incl. GG live,
rejected 3, withdrawn 3). Teams balanced 24/24/24; each of the 9 caseworkers has
8 cases. Golden Grange (100287) stays `status: "live"` (session-driven). 27 cases
are Completed.

To add cases: edit `app/data/grasslands-cases.js` (honour the DATA RULES comment
at the top). To add columns/tabs: edit `includes/_caselist-macros.html` and the
tab templates. Keep the `Grass` scope suffix for any new session keys.
