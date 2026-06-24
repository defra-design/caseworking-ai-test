---
name: data-driven-caselist
description: Build a data-file-driven caseworker caselist for a prototype area — three tabs that each switch their own subject: "<person>'s cases" (a Change-assignee autocomplete), "<team> cases" (a Change-team autocomplete), and "All cases" (every case incl. closed/unassigned) with a permanent SBI search and a collapsible Status filter whose selections show as removable MOJ filter tags. Full-list server-side sorting, MOJ pagination, multi-assign checkboxes — backed by a generated cases data file and a teams data file. Use whenever the user wants to add a Grasslands-style caselist to a new/different case area, generate a new cases data file to drive a caselist, replicate the tab-switcher + All-cases-filter caselist pattern, or "do the Grasslands caselist again" for another grant type. Reference implementation: the Grasslands caselist (views/Grasslands/ + data/grasslands-*.js + the Grasslands caselist routes in routes.js).
---

# Build a data-driven caselist (tab switchers · All-cases search + filter)

## What this builds

A caseworker caselist surface for one prototype **area**, driven entirely by data
files so it can be regenerated/extended without touching templates:

- **Three tabs** (sibling pages with tab-style nav). The first two show **active
  cases only**; the third shows everything. Each tab owns the control at the top of
  its panel — there is **no global filter/search bar above the tabs**:
  - **"&lt;assignee&gt;'s cases"** — one caseworker's active cases. A **"Change
    assignee"** control (a single-select autocomplete over every user with cases)
    switches whose cases are shown and re-labels the tab. Default = the current user
    (e.g. M Walker). Context-independent.
  - **"&lt;team&gt; cases"** — one team's active cases (incl. that team's unowned
    "Not assigned" cases). A **"Change team"** control (single-select autocomplete:
    Team A / B / C / All teams) switches the team and re-labels the tab.
  - **"All cases"** — **every** case: all teams, all statuses, **including closed
    cases (Agreement accepted / Rejected / Withdrawn), which are unassigned**. This
    tab carries a **permanent SBI search** and a **"filter list"** details
    (collapsed by default, even after Apply) holding the **Status** filter + Apply.
    Active filters show above the list as removable **MOJ filter tags** (the MOJ
    filter "selected filters" style); clicking the × drops just that filter.
- **Tab-scoped controls.** The two switchers are the **list switcher** pattern; the
  All-cases filter is the **MOJ filter** pattern. Search/Status filter apply to the
  **All cases tab only** — they never narrow the person/team tabs.
- **Full-list server-side sorting** — every tab loads sorted by age (`submitted`,
  oldest first). Column headers re-sort the **whole** set across all pages (the
  "Full-list column sorting" custom pattern), then re-paginate — not just the
  visible 20.
- **MOJ pagination** (default 20/page).
- Per-row **Select** checkboxes + an **Assign** button → the assign/reassign screen
  (whose title adapts: Assign vs Reassign, singular/plural, with per-row Remove).

It is **route-driven**: the routes read the cases data file, (on the All tab)
filter, then sort + paginate, and pass a `view` object to thin templates; the
macros render. Adding/regenerating cases = editing the data file only.

**Reference implementation (copy + adapt this):**
- `app/data/grasslands-teams.js` — teams + caseworkers.
- `app/data/grasslands-cases.js` — the case records (DATA RULES at the top).
- `app/views/Grasslands/includes/_caselist-macros.html` — `tabsAndTable(active,
  ctx, view, myAssignee, usersWithCases, f)` and `sortHeader(...)`. (There is no
  longer a `filters()` or `contextSelector()` macro — the controls are per-tab,
  inside `tabsAndTable`.)
- `app/views/Grasslands/caselist.html` / `caselist-team.html` /
  `caselist-completed.html` — the three thin tab pages (My / Open / All). The
  `caselist-completed` path is now the **All cases** tab.
- `app/routes.js` — the Grasslands caselist routes + the
  `res.locals.grasslandsTeams` middleware near the top.
- `app/views/Grasslands/_BUILD_NOTES.md` — the prose write-up.

**Related pattern-library pages:** custom/list-switcher, custom/full-list-sort,
moj/filter, gds/accessible-autocomplete.

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
4. **Tabs (each switches its own subject):**
   - **"&lt;assignee&gt;'s cases"** — cases whose current `assignee` is the chosen
     person (default the current user). Active only, context-independent. The
     "Change assignee" switcher picks the person; its range is everyone with ≥1 case.
   - **"&lt;team&gt; cases"** — the chosen team's **active** cases (completed
     excluded), **including** the team's unowned ("Not assigned") cases. "All teams"
     = every team's active cases. The "Change team" switcher picks the team.
   - **"All cases"** — **every** case: all teams, all statuses, **including closed
     and unassigned**. This is the only tab with a filter (SBI search + Status);
     nothing else narrows it.
5. **Active vs completed.** Completed = `Agreement accepted` / `Rejected` /
   `Withdrawn`; everything else is active. The person and team tabs show active only.
6. **Completed cases are always unassigned.** A completed case has no owner —
   `assignee` is always `"Not assigned"` (it keeps its team). It never appears in a
   person's tab and isn't owned in a team's tab; it surfaces on **All cases**. Only
   active cases carry a caseworker; reaching a completed status clears the owner.
7. **Default order = by age.** Every tab loads sorted by `submitted`, oldest
   first. Column headers re-sort the **whole** set server-side (across all pages),
   then re-paginate — see the pattern library "Full-list column sorting".

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
   with a real team (so it still appears in that team's tab).
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

Copy from `views/Grasslands/includes/_caselist-macros.html`. Two macros (no
separate `filters()` / `contextSelector()` — the controls live per-tab inside
`tabsAndTable`):
- `tabsAndTable(active, ctx, view, myAssignee, usersWithCases, f)` — the govuk-tabs
  nav with the three labels (`<myAssignee>'s cases` | `<team> cases` | `All cases`)
  and, inside the active tab's panel, its control:
  - `active == 'my'` → a **Change assignee** `<select name="myAssignee">` over
    `usersWithCases`, enhanced to a single-select autocomplete + a Change button.
  - `active == 'team'` → a **Change team** `<select name="ctx">` (teams + All teams),
    enhanced to autocomplete + a Change button.
  - `active == 'all'` → a **permanent SBI search** (`name="search<Token>"`), the
    selected-filter tags (removable `moj-filter__tag` links built from `f`), and a
    **"filter list"** `<details>` (no `open` attribute) with the Status checkboxes
    (`name="filterStatus<Token>"` + an `_unchecked` sentinel hidden input) and Apply.
  Then the table over `view.rows`, an empty-state row, and MOJ pagination from `view`
  (`page/totalPages/total/startIdx/endIdx`; **pagination + sort links carry the
  current `sort`/`dir`**). The live case row renders its status from the session;
  other rows render `c.status` + `c.tag`.
- `sortHeader(key, label, view, cls)` — a column-header link that sets
  `?sort=<key>&dir=<asc|desc>` (toggles on the active column) with `aria-sort`; the
  route sorts the whole set then re-paginates.

The switchers and search use `<select>`/autocomplete from
**accessible-autocomplete**, loaded per page (see §4). Defer the enhancement to
`DOMContentLoaded` so the lib (in `pageScripts`) is ready.

### 4. Templates — three thin pages

Copy `caselist.html` (My), `caselist-team.html` (Open), `caselist-completed.html`
(All) from `views/<Area-of-Grasslands>`. Each: extends `layouts/main.html`,
includes the Defra header, loads the **accessible-autocomplete** CSS in
`{% block head %}` and JS in `{% block pageScripts %}`, an `<h1>`, then a single
`tabsAndTable` call. Import the macros `with context`:
- `caselist.html` → `{{ caselist.tabsAndTable("my", ctx, view, myAssignee, usersWithCases) }}`
- `caselist-team.html` → `{{ caselist.tabsAndTable("team", ctx, view, myAssignee) }}`
- `caselist-completed.html` → `{{ caselist.tabsAndTable("all", ctx, view, myAssignee, none, grassFilters) }}`

### 5. Routes + middleware — `app/routes.js`

Mirror the Grasslands caselist routes block:
- A `res.locals` middleware (near the top, beside the teams one) exposing the
  teams data (`<area>Teams` / `<area>TeamNames`), reloaded per request.
- `load<Area>Cases()` (fresh require per request), `COMPLETED` set, and helpers:
  - `ctx(req)` — team context (set by **Change team** via `?ctx`); validate on
    **read and write**, default `A`, persist in `req.session.data.<token>Ctx`.
  - `myAssignee(req)` — the chosen person (set by **Change assignee** via
    `?myAssignee`); validate against the caseworker list, persist, default the
    current user.
  - `usersWithCases(req)` — distinct current owners (`assignee !== 'Not assigned'`).
  - `filter(rows, req)` — **SBI search + Status only** (read from session); used by
    the **All** route only. (Search is SBI-only.)
  - `paginate`, `active()` (drops completed), `ctxFilter()` (`ctx==='all' ? all :
    team===ctx`), `sortRows`/`buildView` (full-list sort by `submitted` etc. then
    paginate), and `applyAssign(req)` (session `id → assignee` overrides **and sets
    the case's team to the assignee's team**, so assigning moves a case into that
    person's team).
- Three routes (each `res.render`s the matching template):
  - `/<Area>/caselist` (My) — `active(applyAssign(...).filter(assignee === myAssignee))`,
    **no filter**; pass `myAssignee` + `usersWithCases`.
  - `/<Area>/caselist-team` (Open) — `active(ctxFilter(applyAssign(...), ctx))`,
    **no filter**; pass `myAssignee`.
  - `/<Area>/caselist-completed` (All) — `applyAssign(loadCases())` (**every** case)
    + `filter(req)` (SBI search + Status); pass the selected-filter state
    (`grassFilters`) for the tags.
- Point the area's launcher / `makeStageRoute` `firstRedirect` at `/<Area>/caselist`.

### 6. Verify (preview MCP, `kit` server)

Walk and confirm:
- **Person tab** — labelled "&lt;person&gt;'s cases"; the **Change assignee**
  switcher (range = users with cases) switches the person, relabels the tab and
  shows only their active cases. Context-independent.
- **Team tab** — labelled "&lt;team&gt; cases"; the **Change team** switcher
  switches the team, relabels the tab and shows that team's active cases (incl. its
  unowned "Not assigned" cases). "All teams" = every team's active cases.
- **All cases** — shows **every** case incl. closed/unassigned (total = full count).
  The SBI search and Status filter work, show as removable tags, and the "filter
  list" details stays **collapsed** (even after Apply). Removing a tag drops just
  that filter. The filter does **not** leak into the person/team tabs.
- **Sorting** — clicking a column header re-sorts the **whole** set across pages
  (not just the visible page); default load is by age (oldest first).
- **Assign** — assigning a case to a person moves it into **that person's** team;
  completed cases are always "Not assigned".
- Switchers/`?ctx`/`?myAssignee` **persist across tab clicks** (session); invalid
  values fall back to the default (not a blank tab). Teams balanced; SBIs unique;
  no team-less cases (`team` never empty).

## Gotchas (learned building Grasslands)

- **Validate ctx on read, not just write** — a stored out-of-set value would
  otherwise blank the context tab (empty label + 0 rows). Fall back to default.
- **Explicit routes beat the kit auto-render** — the three caselist pages need
  routes (to pass `view`/`ctx`); don't rely on the kit auto-rendering them.
- **Context persistence** uses `req.session.data` — switching ctx (`?ctx=`)
  resets pagination to page 1 (no `?page`); pagination links carry `?page` and
  read ctx from the session.
- **Filters are functional and tab-scoped** — the SBI search and Status filter are
  real (read from the session in the route) and apply to the **All cases** tab
  **only**. Do **not** call the filter in the person/team routes, or a filter set on
  All cases would silently narrow them too. Keep filter input names scoped with the
  area token so they don't collide in `session.data` (the kit's autoStoreData
  stores every field globally). Use an `_unchecked` hidden sentinel on the Status
  group so unticking everything clears the facet.
- **"filter list" details stays closed** — don't add `open` based on active filters;
  the selected-filter tags above the list already show what's active.
- **Autocomplete enhancement ordering** — the switchers/search `<select>`s are
  enhanced by accessible-autocomplete, loaded in `pageScripts` at the end of the
  body; run the enhancement on `DOMContentLoaded` so the global is defined first.
  After enhancement, `getElementById(theId)` returns the *input*, not the original
  `<select>` — read/write the `<select>`'s `.value` for the chosen option.
- **Live working case** — if one row is the interactive journey, give it
  `status: "live"`; it renders its status from the session. It shows on the All
  cases tab and (when active + owned) on the person/team tabs.
- **Status/tag set is fixed** — only the eight FRPS-D2 statuses; never invent
  new ones (e.g. no "In progress"/"In QA").
- **Worktree memory** — edit the main `ai-driven-main/app/...` tree, not an agent
  worktree copy, or the running prototype won't see the files.

## When done

Write a short `views/<Area>/_BUILD_NOTES.md` (model on
`views/Grasslands/_BUILD_NOTES.md`) capturing the data shape (totals, status
spread, teams, caseworker counts), the routes, and the entry point.
