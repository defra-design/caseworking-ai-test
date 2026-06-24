---
name: data-driven-caselist
description: Build a data-file-driven caseworker caselist for a prototype area — My cases / team-context / Completed tabs, a "Switch team" selector (Team A/B/C + All cases) that drives both the context tab and the Completed tab, MOJ pagination, search + filters, and multi-assign checkboxes — backed by a generated cases data file and a teams data file. Use whenever the user wants to add a Grasslands-style caselist to a new/different case area, generate a new cases data file to drive a caselist, replicate the team-context + Completed-tab caselist pattern, or "do the Grasslands caselist again" for another grant type. Reference implementation: the Grasslands caselist (views/Grasslands/ + data/grasslands-*.js + the "Grasslands caselist data + routes" block in routes.js).
---

# Build a data-driven caselist (teams · context selector · Completed tab)

## What this builds

A caseworker caselist surface for one prototype **area**, driven entirely by data
files so it can be regenerated/extended without touching templates:

- **Three tabs** (sibling pages with tab-style nav). My and the Open-cases tab show
  **active cases only** — completed cases are excluded from them and surface only
  on the Completed tab:
  - **My cases** — the current user's active cases (one named caseworker), context-independent.
  - **Open cases** (the context tab) — the selected team's active cases, or *all*
    active cases when the context is "All cases". Includes team-allocated cases that
    are not yet owned (assignee "Not assigned"). The tab is always labelled
    **"Open cases"** whatever the team context.
  - **Completed cases** — cases whose status is a completed outcome
    (Agreement accepted / Rejected / Withdrawn), filtered by the same context.
- A **"Switch team" selector** (dropdown: Team A / Team B / Team C / **All cases**
  + a Switch button) sitting **above the tabs**. It sets a context that is
  **persisted in the session** so it carries across tab clicks, and it drives
  both the context tab and the Completed tab.
- **MOJ pagination** (default 20/page) on the context and Completed tabs.
- A **"Find an application"** details with search + Assignee/Status checkbox
  filters (decorative, GET-to-self) and per-row **Select** checkboxes + a
  "Reassign selected cases" button.

It is **route-driven**: the routes read the cases data file, filter (by tab +
context) and paginate, then pass a `view` object to the templates. Templates are
thin; the macros render. Adding/regenerating cases = editing the data file only.

**Reference implementation (copy + adapt this):**
- `app/data/grasslands-teams.js` — teams + caseworkers.
- `app/data/grasslands-cases.js` — the case records (DATA RULES at the top).
- `app/views/Grasslands/includes/_caselist-macros.html` — `filters()`,
  `contextSelector(ctx)`, `tabsAndTable(active, ctx, view)`.
- `app/views/Grasslands/caselist.html` / `caselist-team.html` /
  `caselist-completed.html` — the three thin tab pages.
- `app/routes.js` — the **"Grasslands caselist data + routes"** block and the
  `res.locals.grasslandsTeams` middleware near the top.
- `app/views/Grasslands/_BUILD_NOTES.md` — the prose write-up.

## Case & tab structure rules

How every case maps to a team and to the three tabs. These are the rules of the
model — enforce them in the data and the routes.

1. **Every case has a team.** A case is always allocated to one team (A/B/C);
   there is no team-less case. `team` is never empty.
2. **Owner is optional.** `assignee` is either a caseworker **who belongs to the
   case's team**, or `"Not assigned"` — a case allocated to a team but not yet
   owned by a person.
3. **Assigning to a person sets the team.** Assigning/reassigning a case to a
   caseworker moves it into **that person's** team context: the case adopts the
   assignee's team. (Implemented in `grassApplyAssign` via the caseworker→team
   map built from the teams data file.)
4. **Tabs:**
   - **My cases** — cases whose `assignee` is the current user (e.g. M Walker),
     active only. Independent of the selected team context.
   - **Open cases** (context tab) — the selected team's **active** cases
     (completed excluded), **including** the team's unowned ("Not assigned")
     cases. Context **"All cases"** = every team's active cases. Always labelled
     "Open cases".
   - **Completed cases** — `Agreement accepted` / `Rejected` / `Withdrawn` within
     the selected context.
5. **Active vs completed.** Completed = `Agreement accepted` / `Rejected` /
   `Withdrawn`; everything else is active. My and Open show active only.
6. **Completed cases are always unassigned.** A completed case has no owner —
   `assignee` is always `"Not assigned"` (it keeps its team, so it still appears
   under the right team on the Completed tab, but never under a caseworker). Only
   active cases can have a caseworker; reaching a completed status clears the
   owner. As a corollary, a completed case never appears in **My cases**.
7. **Default order = by age.** Every tab loads sorted by `submitted`, oldest
   first. Column headers re-sort the **whole** filtered set server-side (across
   all pages), then re-paginate — see the pattern library "Full-list column
   sorting".

## Inputs to confirm with the user (one AskUserQuestion batch)

1. **Area name** — the new folder + URL segment, e.g. `Woodlands` → pages at
   `views/Woodlands/caselist*.html`, routes `/Woodlands/caselist*`.
2. **Data-file prefix** — lowercase, e.g. `woodlands` → `data/woodlands-cases.js`,
   `data/woodlands-teams.js`.
3. **Scope token** — a short suffix for the session ctx key and the decorative
   input names so this area's session state never collides with others, e.g.
   `Wood` → `woodCtx`, `filterAssigneeWood`. (Grasslands used `Grass`.)
4. **Teams & caseworkers** — three teams, three caseworkers each (9 distinct
   names). The "current user" (My cases) is one of them — by default the first
   caseworker of Team A.
5. **Total case count** and **status spread** — how many cases, and the
   per-status distribution (keep "Agreement accepted" dominant unless told
   otherwise). Default to a spread like the Grasslands one.
6. **Page size** (default 20) and **default context** (default `A`).
7. Whether one case is a **live working case** (like Golden Grange) whose status
   is session-driven — if so it gets `status: "live"`.

If the user says "same as Grasslands", reuse the Grasslands teams and the same
distribution shape, just new business names + a new area/prefix/token.

## Data rules (enforce in the cases data file)

1. **status + tag come ONLY from the FRPS-D2 caselist set** (see
   `views/FRPS-D2/caselist.html`):

   | status | tag |
   |---|---|
   | Application received | `grey` |
   | In review | `blue` |
   | On hold | `yellow` |
   | Agreement drafted | `blue` |
   | Agreement offered | `blue` |
   | Agreement accepted | `green` |
   | Rejected | `red` |
   | Withdrawn | `orange` |

   The live working case uses `status: "live"`, `tag: ""` (its tag/text come from
   the session at render).
2. **SBI is a unique 9-digit string per distinct business.** Same business
   repeated across rows shares one SBI; two different businesses never share one.
3. **Submitted date is appropriate to the status** — advanced statuses
   (accepted/rejected/withdrawn) are older; Application received is newest.
4. **Every case has a team** (A/B/C) — never empty; **teams balanced** (~equal
   counts) and **age-balanced** (each team spans the full date range — assign team
   via round-robin over the date-sorted list). An `assignee` that is a caseworker
   must belong to that case's `team`; an unowned case is `assignee: "Not assigned"`
   with a real team (so it still appears in that team's Open cases).
5. **Completed** = `Agreement accepted` / `Rejected` / `Withdrawn`. **Completed
   cases are always `assignee: "Not assigned"`** (they keep their team, but have no
   owner). Only active cases carry a caseworker.

## Pipeline

### 1. Teams data file — `data/<prefix>-teams.js`

Clone `data/grasslands-teams.js`. It exports `teams` (3 × `{ id, name,
caseworkers[] }`) and a derived `nameById` map. Update the names.

### 2. Cases data file — `data/<prefix>-cases.js` (generated)

Write a throwaway Node generator next to the repo root, run it, then delete it.
It builds the records following the data rules and writes
`module.exports = { cases: [...] }` with a DATA-RULES header comment. Template:

```js
// _gen.js  (run with: node _gen.js, then delete)
const fs = require('fs')
const teams = require('./data/<prefix>-teams.js').teams
const byId = { A: teams[0], B: teams[1], C: teams[2] }

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = d => d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear()
const tagOf = { 'Application received':'grey','In review':'blue','On hold':'yellow',
  'Agreement drafted':'blue','Agreement offered':'blue','Agreement accepted':'green',
  'Rejected':'red','Withdrawn':'orange' }
// status -> [oldest, newest] submitted-date range (advanced statuses are older)
const range = {
  'Agreement accepted':['2024-07-01','2025-03-01'], 'Rejected':['2024-10-01','2025-01-01'],
  'Withdrawn':['2024-11-01','2025-01-15'], 'Agreement offered':['2025-03-01','2025-06-15'],
  'Agreement drafted':['2025-06-20','2025-09-20'], 'On hold':['2025-09-25','2025-12-20'],
  'In review':['2025-12-25','2026-04-10'], 'Application received':['2026-04-20','2026-06-10'] }
// distribution — counts per status (sum = TOTAL, minus 1 if you add a live case)
const statusPlan = [['Agreement accepted',21],['In review',13],['On hold',9],
  ['Agreement drafted',8],['Agreement offered',8],['Application received',6],
  ['Rejected',3],['Withdrawn',3]]
const businesses = [ /* one UNIQUE name per case (sum of statusPlan counts) */ ]

function datesFor (status, n) {
  const s = Date.parse(range[status][0]), e = Date.parse(range[status][1]), out = []
  for (let i = 0; i < n; i++) out.push(fmt(new Date(n === 1 ? s : s + Math.round(i*(e-s)/(n-1)))))
  return out
}
let bi = 0, cases = []
statusPlan.forEach(([status, n]) => { datesFor(status, n).forEach(dt =>
  cases.push({ business: businesses[bi++], status, tag: tagOf[status], submitted: dt })) })
cases.sort((a,b)=>Date.parse(a.submitted+' UTC')-Date.parse(b.submitted+' UTC'))
const teamOrder = ['A','B','C'], cwIdx = { A:0,B:0,C:0 }
const COMPLETED = ['Agreement accepted','Rejected','Withdrawn']
cases.forEach((c,i)=>{ c.id=String(100001+i); c.sbi=String(300000001+i)
  c.team=teamOrder[i%3]  // EVERY case gets a team
  // Completed cases are always unassigned; active cases get a caseworker of their team.
  const cw=byId[c.team].caseworkers
  c.assignee = COMPLETED.includes(c.status) ? 'Not assigned' : cw[cwIdx[c.team]++%cw.length] })
// OPTIONAL: leave some active cases unowned too -> c.assignee = 'Not assigned' (keeps team)
// OPTIONAL live working case: pick one row -> c.status='live'; c.tag=''
const lines = cases.sort((a,b)=>(+a.id)-(+b.id)).map(c =>
  `  { id: "${c.id}", business: ${JSON.stringify(c.business)}, sbi: "${c.sbi}", submitted: "${c.submitted}", status: ${JSON.stringify(c.status)}, tag: "${c.tag}", team: "${c.team}", assignee: ${JSON.stringify(c.assignee)} }`)
fs.writeFileSync('data/<prefix>-cases.js',
  '// <header comment with DATA RULES>\nmodule.exports = {\n  cases: [\n' + lines.join(',\n') + '\n  ]\n}\n')
// print + sanity-check: total, per-status, per-team, per-caseworker counts; assert no
// SBI shared across different businesses.
```

Tune `statusPlan` + `businesses` to the requested total/spread. After running,
**confirm**: counts match the spread, teams ~balanced, each caseworker's count,
0 SBI clashes across businesses, completed = accepted+rejected+withdrawn.

### 3. Macros — `views/<Area>/includes/_caselist-macros.html`

Copy from `views/Grasslands/includes/_caselist-macros.html`. Three macros:
- `filters()` — search + Assignee/Status checkbox groups (decorative). Update the
  counts to match the data and rename input names with the new scope token
  (`filterAssignee<Token>`, `filterStatus<Token>`, `search<Token>`).
- `contextSelector(ctx)` — `<form method="get" action="">` with a `<select
  name="ctx">` listing `grasslandsTeams` (rename the res.locals var per §5) +
  an `<option value="all">All cases</option>`, and a **Switch** button.
- `tabsAndTable(active, ctx, view)` — the govuk-tabs nav (My cases | **Open cases**
  | Completed cases — the middle/context tab is always labelled "Open cases"
  regardless of the team context), the table over `view.rows`, an empty-state row, and the MOJ
  pagination from `view` (`page/totalPages/total/startIdx/endIdx`, links
  `?page=N`). The live case row renders its status from session
  (`data.caseStatus<Token>` etc.); other rows render `c.status` + `c.tag`.

### 4. Templates — three thin pages

Copy `caselist.html` (My), `caselist-team.html` (context), `caselist-completed.html`
(Completed) from `views/<Area-of-Grasslands>`. Each: extends `layouts/main.html`,
includes the Defra header, an `<h1>`, then
`{{ caselist.filters() }}` + `{{ caselist.contextSelector(ctx) }}` +
`{{ caselist.tabsAndTable("my"|"team"|"completed", ctx, view) }}`. Import the
macros `with context`.

### 5. Routes + middleware — `app/routes.js`

Mirror the **"Grasslands caselist data + routes"** block:
- A `res.locals` middleware (near the top, beside the teams one) exposing the
  teams data (`<area>Teams` / `<area>TeamNames`), reloaded per request.
- `load<Area>Cases()` (fresh require per request), `COMPLETED` set, and helpers
  `ctx(req)` (validate `?ctx` on **both** write and read, default `A`, persist in
  `req.session.data.<token>Ctx`), `paginate(rows, page)` (page size; clamp),
  `ctxFilter(cases, ctx)` (`ctx==='all' ? all : team===ctx`).
- A `grassActive()`-style helper that drops completed cases, applied to **My**
  and the **context** tab (so completed cases show only on the Completed tab).
- A reassignment helper (`grassApplyAssign`) that applies session `id → assignee`
  overrides on load **and sets the case's team to the assignee's team** (a
  caseworker→team map from the teams file), so assigning a case to a person moves
  it into that person's Open cases. Keep completed cases unassigned.
- Three routes: `/<Area>/caselist` (My = current user's **active** cases,
  ctx-independent), `/<Area>/caselist-team` (context filter, **active** only),
  `/<Area>/caselist-completed` (context filter + completed-status filter). Each
  `res.render`s the matching template with `{ ctx, view }`.
- A back-compat redirect for any old `/<Area>/caselist-all` →
  `caselist-team?ctx=all` (optional).
- Point the area's launcher / `makeStageRoute` `firstRedirect` at
  `/<Area>/caselist`.

### 6. Verify (preview MCP, `kit` server)

Walk and confirm:
- My = current user's cases, independent of context.
- Open cases tab (always labelled "Open cases"): default team → that team's active
  cases (incl. its unowned "Not assigned" cases); switch team → that team; switch
  to **All cases** → all teams' active cases. Paginates.
- Completed tab: shows only Agreement accepted/Rejected/Withdrawn; **all
  completed when ctx=all, else just the team's completed**. Every completed row's
  assignee is **"Not assigned"** (completed cases are never owned), but they keep
  their team so they land under the right team.
- Assigning a case to a person moves it into **that person's** Open cases (and out
  of the previous team's). Unowned active cases still appear in their team's Open cases.
- Context **persists across tab clicks** (session) and an invalid `?ctx` falls
  back to the default (not a blank tab).
- Filter/status counts reconcile to the data; teams balanced; SBIs unique; no
  team-less cases (`team` never empty).

## Gotchas (learned building Grasslands)

- **Validate ctx on read, not just write** — a stored out-of-set value would
  otherwise blank the context tab (empty label + 0 rows). Fall back to default.
- **Explicit routes beat the kit auto-render** — the three caselist pages need
  routes (to pass `view`/`ctx`); don't rely on the kit auto-rendering them.
- **Context persistence** uses `req.session.data` — switching ctx (`?ctx=`)
  resets pagination to page 1 (no `?page`); pagination links carry `?page` and
  read ctx from the session.
- **Decorative filters / `Select` checkboxes** — search, the Assignee/Status
  checkboxes and "Reassign" are visual only; keep their input names scoped with
  the area token so they don't collide in `session.data` (the kit's
  autoStoreData stores every field globally).
- **Live working case** — if one row is the interactive journey, give it
  `status: "live"`; it renders its status from the session and is excluded from
  Completed. Its default render (e.g. "Application received") may add +1 to a
  decorative filter count — document that, don't treat it as a bug.
- **Status/tag set is fixed** — only the eight FRPS-D2 statuses; never invent
  new ones (e.g. no "In progress"/"In QA").
- **Worktree memory** — edit the main `ai-driven-main/app/...` tree, not an agent
  worktree copy, or the running prototype won't see the files.

## When done

Write a short `views/<Area>/_BUILD_NOTES.md` (model on
`views/Grasslands/_BUILD_NOTES.md`) capturing the data shape (totals, status
spread, teams, caseworker counts), the routes, and the entry point.
