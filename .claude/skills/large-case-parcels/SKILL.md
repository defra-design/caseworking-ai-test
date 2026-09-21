---
name: large-case-parcels
description: Generate or regenerate the land-parcel data behind the "Large case MVP Grasslands" prototype screens (GrassMVP application-large + calculations-large) — any number of land parcels with a chosen range of Grasslands actions each, with areas, payments and totals computed so the Application and Calculations tabs always agree. Use whenever the user wants to change how many land parcels or actions the large case has ("make it 60 parcels", "3-5 actions each", "more/fewer actions per parcel", "reshuffle the parcels", "regenerate the large case"), or needs a big, consistent multi-parcel Grasslands dataset for a new calculations/application screen.
---

# Large case parcels

Generates `app/views/GrassMVP/includes/_large-case-data.html`: the single data
file that **both** Large screens import, so the two tabs can't drift apart:

- `app/views/GrassMVP/caseMVP/application-large.html` — one "Land parcel
  selected" accordion section per parcel, and payment totals.
- `app/views/GrassMVP/caseMVP/calculations-large.html` — per-parcel checks, plus
  the parcel search and "Filter calculations" panel.

Both do `{% import "GrassMVP/includes/_large-case-data.html" as lc %}` and loop
over `lc.parcels`. The pages don't need editing when the data changes.

## Run it

From the repo root (`ai-driven-main`):

```bash
python .claude/skills/large-case-parcels/gen_large_case.py
```

| Option | Default | Meaning |
|---|---|---|
| `--parcels N` | 40 | Number of land parcels |
| `--min-actions A` / `--max-actions B` | 4 / 5 | Actions per parcel (1–6; there are 6 Grasslands actions) |
| `--seed S` | 26 | Random seed. Same settings + seed = same file, so changing the seed reshuffles |
| `--out PATH` | the includes file above | Write somewhere else (e.g. scratchpad) to preview |

Defaults reproduce the current file exactly. The script prints the parcel,
action and manual-check counts plus the payment totals, so you can quote them
back to the user.

## What it generates (rules to keep)

- **Parcel IDs:** the first 15 are the real Grasslands / Golden Grange case's
  (`REAL` in the script). Any extra IDs are invented in the same format and OS
  grid areas (SD / NY / NT / NU), with no duplicates.
- **Grasslands actions only:** CLIG3, CNUM2, CSAM3, SCR2 (area, in ha), HEF1
  (buildings, sqm) and WBD1 (ponds). Never moorland actions (CMOR1 / UPL*).
- **Area actions fit the parcel:** together they use about 60–85% of the
  parcel's permanent grassland. HEF1 adds a claimed building, and WBD1 adds a
  Pond land cover plus 1–4 ponds.
- **Payments** = quantity × rate (CLIG3 £151/ha, CNUM2 £102/ha, CSAM3 £224/ha,
  SCR2 £350/ha, HEF1 £5/sqm, WBD1 £257/pond). The yearly and 3-year agreement
  totals are summed in the script. **Don't hand-edit the data file**, because
  the totals won't update. Change the script and re-run it instead.
- **One deliberate fail:** NY1118 1031 (`FAIL_PARCEL`). Its land data was updated
  after submission (grassland 6.2150 → 5.4200 ha), so its CSAM3 available-area
  check fails and its area figures get the changed-value highlight. It's
  included whenever `--parcels` ≥ 8. This keeps the Fails and Changed
  filters non-empty.
- **Manual (Task) checks** are raised for CLIG3/CNUM2 on SSSI parcels, and for
  every HEF1 (buildings) and WBD1 (ponds) action. They show the stateless blue
  **Task** tag. The page's "Manual checks" filter shows only those checks, and
  detects them by the tag, not by the text.

## After regenerating

1. Check the review server has picked it up. The data file is a template, so no
   restart is needed. Load `/grassmvpLargeApplication`, then check that the
   Application and Calculations tabs show the same parcel count and totals.
2. Tell the user the new counts and totals the script printed.
3. If you changed a rule in the script (rates, actions, the fail case), say so.
   Also update the header comments in `calculations-large.html` /
   `application-large.html` if they no longer describe the data.

## Wiring (already in place — for reference)

- Route `/grassmvpLargeApplication` in `app/routes.js` sets
  `data.mvpCalcVariant = 'large'` and redirects to `/tasklistStageMVP`.
- `GrassMVP/includes/_caseMVP-nav.html` switches the Application and Calculations
  links to the `-large` pages when that variant is set. Tasks 1, 3, 4Am and 5 do
  the same for their links to the application.
- Index row: "Large case MVP Grasslands" in `app/views/index.html`.
