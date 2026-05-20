---
name: case-from-fg-cw-export
description: Build a complete prototype case folder for the FRPS-D2 prototype from a matching pair of raw fg-cw-frontend HTML exports (one application page export + one calculations page export for the same case). Generates the case folder, application/calculations files with three run versions, includes, routes, index link, and caselist row. Use whenever the user wants to add a new "real" case from a pair of HTML exports, mentions building a case from fg-cw-frontend exports, says "do the caseReal process again" or similar. Pattern was established in caseReal (Golden Grange, May 2026); use `views/FRPS-D2/caseReal/_BUILD_NOTES.md` as the reference implementation.
---

# Build a prototype case from a fg-cw-frontend export pair

## What this skill does

Takes two raw HTML exports from the live `fg-cw-frontend` service for a
single application — one of the **Application** page, one of the
**Calculations** page — and produces a fully-wired prototype case in the
FRPS-D2 prototype:

- A new `views/FRPS-D2/case<Name>/` folder cloned from `case2/` with all
  data keys and route paths rescoped to the new case.
- An `application.html` rebuilt in the prototype's `application-new`
  template from parcel/customer data extracted from the application export.
- Three versioned calculations files (`calculations-old.html`,
  `calculations-mid.html`, `calculations-new.html`) representing Run 1
  (baseline), Run 2, Run 3 of the rules check, with per-check filter
  wrappers, value-changed highlighting, and version-history cross-links.
- Two new include files: `_case<Name>-context-strip.html` (branded banner)
  and `_case<Name>-nav.html` (case-scoped tab nav).
- Routes in `app/routes.js`: a launcher `/`+caseName+`Application` URL, a
  stage-progression `/tasklistStage`+CaseName URL, all 36 case-action
  routes, plus `calcPageKeys` and `largeCalcFilter` targets so the per-page
  filter and version-switching dropdowns work.
- An "X application" link on the index page.
- A row in the caselist linking to the new case's tasklist.

The reference implementation is **caseReal / Golden Grange**, built in
May 2026 from `views/FRPS-D2/app-real.html` +
`views/FRPS-D2/calculation-response.html`. Read
[`views/FRPS-D2/caseReal/_BUILD_NOTES.md`](../../../app/views/FRPS-D2/caseReal/_BUILD_NOTES.md)
before starting — it documents every transformation in the pipeline plus
the gotchas you will otherwise re-derive painfully.

## Inputs to ask the user for

Before generating anything, use `AskUserQuestion` to collect (in one batch
where possible):

1. **Application HTML path** — relative or absolute, e.g.
   `views/FRPS-D2/app-bramble.html`.
2. **Calculations HTML path** — relative or absolute, e.g.
   `views/FRPS-D2/calc-bramble-response.html`.
3. **Case folder name (camelCase suffix)** — e.g. `Bramble` → produces
   `caseBramble/`, `_caseBramble-nav.html`, `data.caseStageBramble`,
   `/bramble Application` route etc.
4. **Index link label** — usually a short noun phrase, e.g.
   `"Bramble Farm application"`.
5. **Case ID for the caselist row** — a 6-digit integer that is not already
   present in `views/FRPS-D2/caselist.html`. If the user has not specified,
   pick the smallest unused 6-digit number close to the existing case range
   (currently 100280–100310) and tell them which you used. Use the same
   number as the Application ID shown in the context strip — extract it
   from the export if it is already a 6-digit number, otherwise replace
   any non-numeric ID in the export with the chosen number across all
   references.
6. **Three-run history?** Default yes. If yes, also ask:
   - Number of diffs in Run 2 (default 5, one of them a fail)
   - Additional diffs Run 3 adds on top of Run 2 (default 2, one new fail)
   - Run timestamps for old / mid / new (default ones from caseReal).
   - Which check types to use for the fails — **must** be from
     `{Available area, Moorland}`. **HEFER and SSSI cannot fail.** Reject
     and re-ask if the user proposes either.

If the user just says "do the same as caseReal", proceed with all the
defaults from the reference build.

## Pipeline

Execute the steps in order. Most of the work is one or two Node scripts
generated on the fly, written next to the artifacts they produce and
deleted after they run. Match the patterns from the reference build's
`_BUILD_NOTES.md` and the existing caseReal source.

### 1. Extract data from the two exports

Parse the **application** export for:
- Customer block (Name, Business name, Address, SBI, Contact email +
  phone).
- Application metadata (Scheme, Application ID, Submitted date).
- SSSI consent block — every (Land parcel, Action code, Overlap %,
  Overlap area) entry.
- Every "Land parcel selected : `<id>`" accordion with the action rows
  inside: action code, total available area, quantity, payment rate,
  yearly payment.

Parse the **calculations** export for:
- Per-parcel: area (from `Maximum available area for CMOR1: X ha`), land
  cover line, moorland %, SSSI % (where present), historic_features %.
- The run timestamp at the top of the calculations page.
- The version-history entries (if you want to mirror them in the
  prototype).

Cross-check that every parcel ID in the calculations export appears in the
application export with matching applied areas. If not, stop and warn the
user.

### 2. Set up nav + context-strip includes

Copy [`views/FRPS-D2/includes/_caseReal-context-strip.html`](../../../app/views/FRPS-D2/includes/_caseReal-context-strip.html)
and [`_caseReal-nav.html`](../../../app/views/FRPS-D2/includes/_caseReal-nav.html)
to `_case<Name>-context-strip.html` and `_case<Name>-nav.html`.
Replace:
- "Golden Grange" → new business name
- "100287" → new case ID
- "SFI" → scheme (usually unchanged)
- "300000100" → new SBI
- `caseStatusReal` → `caseStatus<Name>` (also `caseStatusTagReal`,
  `agreementStageReal` for the nav file)

### 3. Clone case2 → case<Name>

Mirror the caseReal clone script in `_BUILD_NOTES.md` step "Clone case2
→ caseReal". For each `.html` in `views/FRPS-D2/case2/` (skipping the
variants `application-new*`, `calculations-new*`, `calculations-mid*`,
`calculations-old*`, `application-real`, `calculations-real`, etc.):
- Copy to `views/FRPS-D2/case<Name>/`.
- Replace include paths: `_case2-context-strip` → `_case<Name>-context-strip`,
  `_case2-nav` → `_case<Name>-nav`.
- Replace data keys: `caseStageC2` → `caseStage<Name>`,
  `caseStatusC2` → `caseStatus<Name>`, `caseStatusTagC2` → `caseStatusTag<Name>`,
  `agreementStageC2` → `agreementStage<Name>`,
  `dataNewC2` → `dataNew<Name>`.
- Then do a generic data-key bulk rewrite for any remaining `\wC2\b` →
  `\1<Name>` (e.g. `decisionTask1C2` → `decisionTask1<Name>`,
  `task1NoteC2` → `task1Note<Name>` and so on).
- Then rewrite URL fragments: `(\/[A-Za-z][A-Za-z0-9]*)C2\b` →
  `$1<Name>`. (Anchored on `/` so this only touches route URLs in
  `href=`/`action=`, not data-key references.)
- Watch out for one pre-existing corrupt key in case2's `task-2Tr.html`
  ("noteActiondecisionTerminateTask2C2Task2C2"). After the rewrite,
  collapse it to the clean form `noteActionTerminateTask2<Name>` so the
  duplicated-suffix nonsense doesn't propagate.

### 4. Generate routes block

Read the case2 routes block from `app/routes.js` (the area between the
`// --- Approval/rejection ---` comment that introduces `/app-approve2C2`
and the `// FRPS-D2/case3 routes` banner). Apply `s/C2/<Name>/g` plus
`s|/case2/|/case<Name>/|g`. Strip the duplicates that don't carry C2 in
their original name (notably `/caselistResults1`) since they're shared
utility routes; also strip the auto-generated `/tasklistStage2<Name>`
because the lifecycle route is named `/tasklistStage<Name>` and added
separately. Then fix two original quirks while you're there:

- `req.session.data.agreementStage = 'yes'` → `req.session.data.agreementStage<Name> = 'yes'`
  in `/agreementStage2<Name>` so the case-nav Agreement tab actually
  unlocks.
- `checkedKey: 'detailsChecked'` → `checkedKey: 'detailsChecked<Name>'`
  in the task5/task6 review routes so the check state is isolated.

Inject the transformed block into `routes.js` just before the
`// ============================================================` banner
that introduces the case3 routes.

Also add (or update) the existing entries:
- `/<name>Application` route — sets `data.largeCase = '<name>'`
  (for logging only; the nav is not size-switched for new cases),
  redirects to `/tasklistStage<Name>`.
- `makeStageRoute('/tasklistStage<Name>', { stageCountKey, stageKey,
  statusKey, tagKey, firstRedirect: '/FRPS-D2/caselist', tasklistRedirect:
  '/FRPS-D2/case<Name>/tasklist-stage' })`.
- `calcPageKeys`: `/FRPS-D2/case<Name>/calculations-new` → `case<Name>`,
  same for `-mid` and `-old`.
- `largeCalcFilter` `targets` map: `case<Name>` →
  `/FRPS-D2/case<Name>/calculations-new`, same for `case<Name>Mid` and
  `case<Name>Old`.

### 5. Generate the application page

Rebuild from the application export in the prototype's
`application-new` template format (see
[`views/FRPS-D2/case2/application-new.html`](../../../app/views/FRPS-D2/case2/application-new.html)
for shape). Sections required, in order:
- Top-level fieldset + accordion id `accordion-default`.
- Statutory Consent Requirements section listing each SSSI entry
  pulled from the export.
- Customer details section — populate from the parsed customer block.
- Confirm eligibility, Land details (both can stay boilerplate as in
  the reference).
- One accordion section per parcel: `accordion-default-heading-p1`
  through `pN` and matching `-content-pN`, with the action rows
  rendered using the actions found for that parcel in the export.
- Agreement level actions + Duration + Payment summary at the end,
  with totals computed from the parcel action data: per-action-code
  yearly = `sum(qty) × rate`; total yearly = sum across all actions;
  agreement total = `total yearly × 3`.

Write the result to `views/FRPS-D2/case<Name>/application.html`.

### 6. Generate the three calculations files

This is the most involved step. Follow the **"Calculations transformation
pipeline"** section of `caseReal/_BUILD_NOTES.md` — it lists the eight
layered transformations exactly. Implementation hints:

- Use a single Node generator that renders each parcel section from
  scratch using the parsed per-parcel data (don't try to splice-and-patch
  the raw export — that's how the previous build got bit by a regex
  spanning multiple `<details>` blocks).
- For each parcel build, in order: parcel `<h2>`, then for each action
  group `<h3>`, then the four or five checks for that action:
  - `Available area check` (always; combined Pass/Fail with calc detail)
  - `Is this parcel on the moorland?` (always)
  - `Is the site of special scientific interest?` — **UPL only**, body is
    the single static sentence about checking for a Natural England notice
  - `Does the site require a HEFER?` — only on the one chosen
    "HEFER parcel" (default: the parcel with the highest historic-features
    intersection % in the export, or override per user input). Body is a
    single sentence stating the historic-features %.
- HEFER and SSSI green tags read **"Yes"**, not **"Passed"**.
- For each diff: wrap the changed display value(s) in
  `<span class="value-changed">` so the existing `.value-changed` CSS rule
  paints them yellow.
- For fails: replace the green tag with the red Failed tag and replace
  the body's Pass reason with a Fail reason paragraph + a "What to do"
  section modelled on `views/FRPS-D2/case2/calculations-new.html`
  (numbered remediation steps + "Date application submitted" /
  "Latest land parcel update" / restated applied/available values).
- Wrap each `<details>` plus each parcel/action header in the right
  filter conditional:
  - Fail → no wrapper
  - Change → `{% if not data.showFailsOnly %}…{% endif %}`
  - Unchanged → `{% if not data.showFailsOnly and not data.showChangesOnly %}…{% endif %}`
  - Header wrapper takes the strongest status of its children.
- The all-pass `calculations-old.html` uses a single outer wrapper
  (`{% if not data.showFailsOnly and not data.showChangesOnly %}…{% endif %}`)
  plus the "There are no fails / changes to show" fallback paragraphs;
  no per-check wrappers needed in that file.
- Version-history table: three rows (newest first), `Currently showing`
  on the current row, cross-linked to the sibling filenames.
- Run-date dropdown: three options whose values are the page keys
  `case<Name>` / `case<Name>Mid` / `case<Name>Old`.
- Hidden form input `name="from"` value = the same page-key (so per-page
  filter scoping works).

### 7. Wire the case-folder nav to the new calculations file

Edit `_case<Name>-nav.html` so the Calculations tab `href` resolves to
`calculations-new` (not `calculations`).

### 8. Add the caselist row + index link

- In [`views/FRPS-D2/caselist.html`](../../../app/views/FRPS-D2/caselist.html),
  add a new `<tr>` next to the existing 100287 / 100297 / 100310 rows.
  Link the case-ID cell to `case<Name>/tasklist-stage`. The status cell
  reads from `data.caseStage<Name>`/`data.caseStatus<Name>` (defaulting
  to "Application received").
- In [`views/FRPS-D2/../../views/index.html`](../../../app/views/index.html),
  add a `<li>` link under the "Application sizes" `<h2>`, pointing at
  `/<name>Application` with the user-chosen label.

### 9. Verify

Reach the running prototype via the Claude Preview MCP (`preview_start`
on the `kit` server name; the config in `.claude/launch.json` already
sets `autoPort: true`). Then:

1. Click the index "X application" link → should land on the caselist
   on first hit, the case tasklist on subsequent hits.
2. Click the caselist row for the new case → should land on the case
   tasklist with the right banner.
3. Click the Calculations tab → should load `calculations-new` with
   the configured fails + changes.
4. Try each filter (All / Calculations with changes / Only fails) —
   confirm the correct subset of checks renders. Per-page filter state
   should NOT leak between calc pages.
5. Try the Run-date dropdown to switch between -new / -mid / -old.
6. Try the parcel search — should hide every parcel except the matched
   one in place (no anchor jumping).

Use `preview_inspect` or `preview_eval` to confirm computed styles or
DOM counts when in doubt. Take a screenshot only as a last resort —
inspect calls are more reliable for precise checks.

## Things to remember

- **Worktrees**: per the auto-memory note, edits go to
  `ai-driven-main/app/views/FRPS-D2/`, not the agent worktree copy.
  Generated files written to the wrong path are invisible to the running
  prototype.
- **HEFER and SSSI cannot fail.** Only Available area and Moorland
  checks may have a Fail state. Reject any spec that tries to fail SSSI
  or HEFER.
- **`<summary>` shrink-wraps by default** in govuk-frontend. The
  application-level rule in `app/assets/sass/application.scss`
  (`.govuk-details__summary { width: 100%; box-sizing: border-box; }`
  combined with the flex layout on `.govuk-details__summary-text`) already
  handles the right-aligned Pass/Fail tags — don't reinvent it per page.
- **`autoStoreData` snapshots before user routes.** Any middleware that
  swaps in per-page filter state must write to **both**
  `req.session.data.*` and `res.locals.data.*` — Nunjucks reads
  `res.locals.data`, which is already a snapshot by the time the user
  router runs.
- **Regexes spanning `<details>` blocks** swallow neighbours if the
  anchor token appears further down. Anchor on the summary's immediate
  content (`<span class="govuk-details__summary-text">\s*<unique title>`)
  to keep matches inside a single block.
- **express** isn't a direct project dependency; if you need it,
  `require('govuk-prototype-kit/node_modules/express')`.

## When you're done

Write or update a short `_BUILD_NOTES.md` at the root of the new case
folder summarising what was generated (parcel count, the chosen fail
positions per run, customer/SBI/case-ID, etc.), modelled on
[`views/FRPS-D2/caseReal/_BUILD_NOTES.md`](../../../app/views/FRPS-D2/caseReal/_BUILD_NOTES.md).
This makes the next round (or any debugging) much easier.
