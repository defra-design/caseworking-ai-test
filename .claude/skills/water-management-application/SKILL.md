---
name: water-management-application
description: Build, extend or regenerate realistic but made-up Water management (Water Management Grant, "Scoring and ranking") case applications in the caseworking prototype — the 12-section application page at /WaterManagement/application?id=<case id>, the 200-case caselist data behind it, the scoring rules, the kick-out rules and the made-up-answer generators. Use whenever the user wants to add or change an application question/section for the Water management scheme, change scoring tables or rates, regenerate or vary the made-up answers, add a case, or make the application agree with the caselist (score, grant value, cumulative value, budget line).
---

# Water management applications — how to build realistic made-up cases

Prototype area for the Water Management Grant ("Scoring and ranking" feature). Everything lives in the main tree `C:\Users\chasl\Documents\ai-driven-main\app` (edit there, not a worktree).

| Piece | File |
|---|---|
| Caselist page (200 cases, no paging, no assignment, budget reporting, Yes/No filter) | `views/WaterManagement/caselist.html` |
| Application page (accordion, one section per question group) | `views/WaterManagement/application.html` |
| Case data: id, sbi, score, value, date | `data/water-management-cases.js` |
| **Made-up answers + scoring (single source of truth)** | `data/water-management-answers.js` — `waterApplication(c)` returns every answer, the section scores and the total; holds the scoring tables, `OVERRIDES` (hand-set cases) and the generators (`waterLocation`, `waterConsents`, `waterWorkStart`, `waterItems`, …) |
| Routes | `routes.js` — `waterView` (caselist) and `router.get('/WaterManagement/application'` (passes `waterApplication(c)` straight to the template) |
| Index entry | `views/index.html` — section "Scoring and Ranking", link "Water 1st draft" |

Case ID links on the caselist open `application?id=<id>`; an unknown id redirects to the list.

## The application page pattern

- Read-only summary of what the applicant submitted (caseworker view). Layout `app-caselist-wide`, header service name "Water management", two-thirds column, back link, caption `Case <id> · SBI <sbi>`, `Application` h1, `Application submitted: <case date>`.
- One GOV.UK accordion (`id="accordion-application"`), one `govuk-accordion__section` per question group; section button ids `accordion-application-heading-N` / `-content-N`. Sections start collapsed.
- Answers are `govuk-summary-list` rows via the `row(key, value)` macro (value is `| safe`, so use `<br>` for lists and escape nothing you don't want rendered). Question wording is the row key.
- **Scored questions** get a final row `Section score` (bold %, plus a `govuk-hint` explaining the basis).
- Append new sections just before the closing of the accordion (`</div>` before `</div></div></main>`); then bump the section number.
- Per-case data comes from `waterApplication(c)` (module above), spread into `res.render(...)`: `c`, `loc`, `sector`, `businesses`, `bizScore`, `consents`, `consentScore`, `orgType`, `waterSources`, `workStart`, `items`, `scores`. The template holds **no scoring tables** — never re-add them there.
- Under the submitted date the page shows `Score: N% (sector + water scarcity + businesses + planning and licence)`, which must equal the sum of the four `Section score` rows and the caselist Score.
- The map (section 3) uses Leaflet 1.9.4 from cdnjs + OpenStreetMap tiles, initialised only once its accordion section is expanded (MutationObserver) so it sizes correctly.

## KICK-OUTS NEVER APPEAR

Applicants who hit a kick-out are stopped in the applicant journey, so no application reaching caseworking ever carries one. Never record or display these answers, and never show a kick-out check/tag:
- Sector: **Something else**
- Work already started: **Yes, we have begun project work** (kick-out). Only "No, we have not done any work on this project yet" is recorded (the preparatory-work option is allowed in the journey but not generated).
- Public body: only **No** (National Parks authority / government department / executive agency / NDPB).
- Water source: **Something else**
- Organisation type: **Tenant** route is out of scope for now — never generate it.

## The 12 sections (in order) and their rules

1. **Confirm your details** — Business contact details (name, address, phones, email), Business details (legal status, company number), Reference numbers (SBI = the case's own SBI, VAT number), Personal details (name, customer reference, address, phone, email), then "Are these details correct?" = **Yes**. Same example answers for every case (North Sussex Weald Dairy Farm Ltd / Sally Wiston) except the SBI.
2. **Sector** (scored) — "What crops will be irrigated using the water from this project?" (select all that apply, self-declared). Score = the **highest-scoring crop selected**. Table (TBC with Policy): Soft & Cane Fruit 25%, Protected edible crops 25%, Ornamentals 20%, Forest Nursery 20%, Top & Stone Fruit 15%, Vineyards 15%, Field scale vegetables 15%, Arable 5%, Grass (feeding livestock, commercial turf) 2%. Currently a fixed example selection (Soft & Cane Fruit, Top & Stone Fruit, Arable = 25%); scored in-template with a `sectorScores` map and `sort`.
3. **Project location** — Easting / Northing (British National Grid) of the project centre, plus a map marker. Per case (see section 4).
4. **Water scarcity** (scored, derived — not asked of the applicant) — priority area from the location: Red = level 1, **60%**; Amber = level 2, **40%**; Green = level 3, **20%**. Real map data is TBC with Geospatial, so `waterLocation(id)` invents it: the case id hashes to one of `WATER_REGIONS` plus a ±8 km offset. User's brief: rural Kent / rural south = Red; East Anglia, rural Wales, Cumbria = Green; rural middle of the country = Amber. Shows Easting, Northing, a coloured tag (Red `govuk-tag--red`, Amber `govuk-tag--orange`, Green `govuk-tag--green`), "Score level N · area name", Section score. Sections 3 and 4 must use the same `loc`.
5. **Work already started** — answer is always "No, we have not done any work on this project yet". Not scored.
6. **Public body** — "Are you a National Parks authority or a government department, executive agency or non-departmental public body?" = **No**. Not scored.
7. **Type of organisation** — "What type of organisation are you applying on behalf of?" Options: Landowner/landlord, Landowner/owner occupier, Tenant, Water Management Company. Made up per case from the three non-Tenant options (`orgType`). Not scored.
8. **Businesses using the water** (scored) — "How many businesses will use the water from this project for irrigation?" One = **0%**, Two to four = **5%**, Five or more = **10%**. Made up per case (`businesses`). (The scoring table has an unexplained asterisk on "Two to four" — footnote not supplied; ignored.)
9. **Water source** — "Where will the water come from to fill your reservoir or transfer via the distribution main?" (select all that apply): Surface water abstraction for storage, Rainwater harvesting, Borehole / aquifer (+ Something else = kick-out, never recorded). Per case a non-empty subset (`waterSources`, 3-bit mask). Not scored.
10. **Planning permission and abstraction licence** (scored, combined) — two linked journeys, each Yes / No / Not needed:
    - *Planning*: "Do you already have planning permission for this project confirmed by your Local Planning Authority?" **Yes** → planning permission reference number (e.g. `DC/26/59577`); **No** → info only (permission needed before construction; evidence at the next stage) — shown as a "Next stage" row; **Not needed** → reasons (select all: Exemption under General Permitted Development Order 2015, Reason 2, Reason 3, Something else) and, if Something else, a free-text detail.
    - *EA abstraction licence*: "Does the project need an abstraction licence or a variation of one?" **Licence already secured** (= Yes) → licence consent number (e.g. `39/79/10/2084`); **Licence needed but not yet secured** (= No) → info only (licence needed from the Environment Agency before construction; evidence next stage); **Licence not needed** (= NN, not needed) → reasons (placeholder "Reason 1/2 (list to be confirmed)", Something else) and detail.
    - *Score* (EA consent × Planning): Yes/Yes 5%, No/No 0%, Yes/No 0%, No/Yes 0%, Yes/NN 5%, NN/Yes 5%, NN/NN 5%. The table omits No/NN and NN/No — **assumed 0%** (rule: any No scores 0). One combined `Section score` row with hint "EA consent: X · Planning: Y".
    - `waterConsents(id)` makes both up (each ~½ Yes, ¼ No, ¼ Not needed).
11. **Expected start** — "When do you expect the project work to start?" month + year (e.g. "March 2027"): 3–12 months after the case's application date (`waterWorkStart`). Not scored.
12. **Items and estimated cost** — "What type of items are you planning to install?" (select all that apply): Clay lined reservoir, Synthetic lined reservoir, Water storage tank(s) above ground, Underground water distribution main. Follow-ups only for items chosen: reservoir volume when full (m³), tank total capacity (m³, amended from litres), distribution network length (m). Summary lines like `Reservoir - clay-lined: 50,000m³ at £2.50 per m³ = £125,000`, `Water distribution network: 1,000m at £5.00 per m = £5,000`; `Total estimated cost`; `Grant available (up to 40%, maximum £300,000)`. Rates (`WATER_RATES`): clay £2.50/m³, **synthetic £3.50/m³ (ASSUMED — no rate supplied)**, tanks £1,500/m³ (= £1.50/litre), main £5.00/m. "Read from correct ref costs" — swap in real rates when given. A case gets **at most one reservoir type** (journey has one volume question for "clay and/or synthetic"; mixed pricing undefined) and at least one item. **Grant = min(40% of total, £300,000)** — the scheme maximum award is £300,000 even if the project is larger; when capped, show the 40% figure and the cap reason in a hint. Made-up quantities: reservoir 5,000–80,000 m³ (500 steps), tanks 20–120 m³ (5 steps), main 200–5,000 m (50 steps) — so the cap isn't hit by default; add a few big projects if the cap needs demonstrating.

## Making answers realistic but made up

- **Deterministic**: every generator derives from the case id (`parseInt(id,10) * <odd multiplier> >>> 0`, then shift/modulo — see `waterHash`). Same case → same application on every load, no storage. Use a *different multiplier/shift per question* so answers don't correlate. Beware multipliers that are multiples of the modulus (40503 is a multiple of 3 → always the same pick); verify spread by running the generator over all 200 ids in node.
- Keep distributions plausible (e.g. Yes ~50%, No/Not needed ~25% each) and make sure every branch is reachable across the 200 cases.
- **Scores are derived, never typed.** The caselist `score` of every case = sector + water scarcity + businesses + planning/licence from `waterApplication`, so only earnable totals exist (sector {25,20,15,5,2} + scarcity {60,40,20} + businesses {0,5,10} + consents {0,5}: 28 possible values between 22 and 100; 100 and 95 are the only totals above 90). After changing any answer, scoring table, override or case list, **regenerate the Score column**: run a node script from `app/` that loops `require('./data/water-management-cases.js').cases`, calls `waterApplication(c).scores.total`, and rewrites each row's `score:` in the data file (keep id, sbi, value, date). Then verify all 200 pages: the top `Score: N%` equals the caselist score and the four section scores (`Section score N%` in page order) sum to it.
- **Hand-set cases** (`OVERRIDES` in the module; 301085 and 300348 are TWINS and copy their partner) carry the user's earlier requests, with answers chosen to hit exact earnable scores: 301246 = 95 (top case of SBI 244666513), 301236 = 90 (same SBI, just below), 300245 and 301085 = 85 with an identical £56,300 grant value (same SBI), 301305 and 300348 = 85 with an identical £24,200 grant value (SBI 824231248, within the budget line), 300819 = 65. The user's original 94% and 83% were not earnable, so they became 90% and 85% (nearest earnable). All other cases are capped at 90 (`NATURAL_MAX`) so 301246 stays the single top case (so about 30 cases sit exactly on 90).
- SBI and application date are the caselist row's. Grant value (`value`) on the caselist is still its own made-up figure; the application's section-12 grant is separate. If the user wants them tied, set `value` = that grant (min(40% of cost, £300,000)) and keep the identical-value pairs above identical.
- Don't let a case reuse the 4+3 multi-case SBIs by accident: SBIs are unique per business except the deliberate multi-case SBIs (244666513 ×4; 824231248 ×3; 286559022, 900962676 ×3; 552347606, 713334260 ×2), which power the "Show SBIs with multiple cases" filter. Business-details section is the same example for all cases, so those SBIs don't yet get distinct business names.

## Multi-case SBIs: business profiles, twins, grant agreement

The six SBIs that appear when the caselist "Show SBIs with multiple cases" switch is Yes (17 cases) have richer data than the rest:
- **`BUSINESS_PROFILES`** (module, keyed by SBI): one invented business per SBI with its own contact details, legal status (Limited company / Partnership / Sole trader — "Company number: Not applicable" when not a company), company number, VAT, contact person, personal address and org type. Section 1 reads `profile` and every case of an SBI shows the same business. Any other SBI uses `defaultProfile` (North Sussex Weald Dairy Farm Ltd / Sally Wiston) — i.e. the same example business still appears on the ~183 single-case SBIs, which is unrealistic; give them profiles if the user asks.
- **Region per business**: `profile.region` pins `waterLocation` to one `WATER_REGIONS` area, so all of a business's projects are in the same part of the country (offset up to ~8 km per case) and share a water scarcity colour. Hand-set `OVERRIDES` colours must agree with the region colour.
- **`TWINS`**: `{ '301085': '300245', '300348': '301305' }` — the same business submitted the SAME application twice; the twin returns exactly its partner's application (only case ID / application date differ). Equal list score and Grant value on each pair.
- **Grant agreement**: for SBIs with a profile, `waterItems(id, c.value)` sizes the items so 40% of the estimated cost equals the case's caselist Grant value exactly (whole-number quantities; at most one reservoir type; ~⅓ get a tank when cost ≥ £60,000; the main takes the remainder). Single-case SBIs still get unrelated made-up quantities (list Grant value ≠ application grant) — extend `targetGrant` to every case if the user wants full agreement.
- After editing profiles, regions, overrides or twins: rerun the Score rescore, then verify (all 200 scores; the 17 grants equal the list values; twins' page text identical apart from caption/date).

## Cases for the 17 multi-case applications (Tasks / Application / Timeline / Notes)

Only the 17 cases on SBIs with a `BUSINESS_PROFILES` entry open as a **case** (`/WaterManagement/case/tasks?id=`); the other 183 still open the standalone `/WaterManagement/application?id=`. Case pages: `views/WaterManagement/case/{tasks,application,timeline,notes,add-note,remove}.html`, chrome in `includes/_case-header.html` (the Grasslands `lg-div` strip) and `includes/_case-nav.html` (Tasks, Application, Timeline, Notes — Grasslands order, no Calculations). The Application tab and the standalone page share `includes/_application-sections.html` and `_application-map-script.html` — edit sections there, once.
- **Tasks**: "Check for duplication" + wording that duplicates may exist in the system, a table of every application on the SBI (each linking to its own Application tab), and a red **Remove application** button.
- **Remove**: confirmation page with a **mandatory note** (server-side; GOV.UK error summary + field error; blank/whitespace rejected). On confirm: session records `data.waterRemoved[id]` and `data.waterNotes[id]`, redirect to Tasks, which reloads as **"Case removed"** with a success banner (once; the title persists) and no duplicate check. Removal can't be repeated.
- **Timeline** (newest first): `Application received` (by the applicant, case date at a made-up working-hours time) then `Application removed` (by A Jones, with "View note"); added notes show as `Note added`. **Notes** (Notes | Add a note tabs): Date, Reason ("Application removed"/"Note added"), Note, Added by (A Jones). Add a note is also mandatory.
- **Caselist**: removed cases score 0%, sort to the bottom, show `–` for cumulative value (they add nothing to the running total), carry a red `Removed` tag in the new last **Status** column, and are excluded from the budget tiers (so stats say "of 199 applications" after one removal).
- State lives in the kit session (resets when the server restarts or "Clear data" is used).
- End-to-end check used: a cookie-jar script that loads all pages of the 17 cases, rejects blank notes (3 variants), removes a case, checks the banner/title/timeline/notes/caselist row/budget tiers, adds notes, removes a second case, then loads all 200 applications.

## Caselist rules the data must keep working

- 200 cases, unpaged. Columns Case ID, SBI, Score (%), Grant value, Cumulative value, Date.
- Ranking = score desc, then earliest date. **Cumulative value** = running total of grant value down that ranking; fixed per case when searched/sorted.
- Budget panel (default £5,000,000; localStorage key `waterTotalBudget`; Reset budget button restores £5m): funded count, minimum score to be successful, budget unspent, budget needed to include the next score, allocation bar and a "Budget line" row. **A score tier is funded only if every case at that score fits** (tiers never split). Stats are always over all 200 cases.
- Data file rules: unique 6-digit ids, 9-digit SBIs, score integer 1–100, value whole £ (max award £300,000), date `"D Mon YYYY"` (May–Aug 2026). Two cases share score 85 / value £56,300 on SBI 244666513; 83% / £24,200 appears on two cases of SBI 824231248 — both deliberate (user requests).

## Adding or changing a question

1. Add/alter the section in `application.html` (new section number, comment block recording the question, options, scoring, kick-outs).
2. If the answer varies per case, add the generator to `data/water-management-answers.js` and return it from `waterApplication`; if it is scored, add the score to `scores` and the total.
3. Scored? Put the scoring table in the module (not the template), include it in `scores.total`, show a `Section score` row, then rescore the caselist data (see above). Record any gaps in the table and the assumption you made (and tell the user).
4. Never display a kick-out; drop kick-out options from the generator instead.
5. Verify: start `kit-verify` (port 3456 from `.claude/launch.json`; **never touch port 3000**, that is the user's review server), wait until the page returns 200, fetch several case pages and read the rendered text (strip tags, `<br>` → ` | `), check arithmetic, and check the distribution across all 200 ids in node. Then `preview_stop`. If the kit shows an `ENOTEMPTY ... backup-nunjucks` error it is a Windows file-lock in the shared `.tmp`; stop and restart only the verify server.
6. Commit only the Water management files (`routes.js`, `application.html`, `caselist.html`, `data/water-management-cases.js`, `data/water-management-answers.js`, `views/index.html`, `assets/sass/application.scss`). Run the pattern-library check first (pending items: the Yes/No filter switch `.app-yn--filter`, the budget line row).

## Open questions to confirm with the user

- Real rate for synthetic-lined reservoirs, and the "correct ref costs" for tanks/main.
- Priced behaviour for a case with both clay and synthetic reservoirs.
- Score for planning/EA combinations No/NN and NN/No (assumed 0%).
- Footnote on "Two to four businesses using the water*".
- Real water-scarcity map data (Geospatial) and the real licence "not needed" reason list.
- Whether East Anglia should really be Green (user said so; it is normally a dry area).
- Whether the caselist Grant value should also be derived from the application's section-12 grant (score already is).
