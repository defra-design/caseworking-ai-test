---
name: large-case-parcels
description: Generate or regenerate the land-parcel data behind the "Large case MVP Grasslands" and "Medium case MVP Grasslands" prototype screens (GrassMVP application-large/-medium + calculations-large/-medium) — any number of land parcels with a chosen range of Grasslands actions each, with areas, payments and totals computed so the Application and Calculations tabs always agree. Use whenever the user wants to change how many land parcels or actions the large case has ("make it 60 parcels", "3-5 actions each", "more/fewer actions per parcel", "reshuffle the parcels", "regenerate the large case"), change how many checks fail ("make five fails", "no fails in the first run"), or needs a consistent multi-parcel Grasslands dataset for a new calculations/application screen.
---

# Large case parcels

Generates the parcel data file a case's two screens share, so the Application and
Calculations tabs can't drift apart. Two cases use it:

| Case | Data file | Screens |
|---|---|---|
| Large (40 parcels) | `_large-case-data.html` | `application-large.html`, `calculations-large.html` (parcel search + "Filter calculations" panel) |
| Medium (5 parcels) | `_medium-case-data.html` | `application-medium.html`, `calculations-medium.html` (no search or filters) |

All live under `app/views/GrassMVP/`. Each page does
`{% import "GrassMVP/includes/_<case>-case-data.html" as lc %}` and loops over
`lc.parcels`, so the pages don't need editing when the data changes.
`GrassMVP/includes/_case-task-parcels.html` reads the same files, so the
conditional review tasks (SSSI, buildings, ponds) list exactly the parcels whose
checks carry a Task tag.

## Run it

From the repo root (`ai-driven-main`):

```bash
python .claude/skills/large-case-parcels/gen_large_case.py --parcels 40 --fails 5 --ponds 12 --sssi 8
```

The medium case is the same script with different options:

```bash
python .claude/skills/large-case-parcels/gen_large_case.py --parcels 5 --seed 5 --fails 2 --ponds 3 --sssi 2 --label "Medium case MVP Grasslands" --out app/views/GrassMVP/includes/_medium-case-data.html
```

| Option | Default | Meaning |
|---|---|---|
| `--parcels N` | 40 | Number of land parcels |
| `--min-actions A` / `--max-actions B` | 4 / 5 | Actions per parcel (1–6; there are 6 Grasslands actions) |
| `--ponds N` | about half | How many parcels claim ponds (WBD1) — drives the ponds task's LP list |
| `--sssi N` | about a quarter | How many parcels sit in an SSSI — drives the SSSI tasks' LP lists |
| `--fails N` | 1 | How many available-area checks fail in the latest run (one per parcel) |
| `--label TEXT` | Large case MVP Grasslands | Case name used in the generated file's header comment |
| `--seed S` | 26 | Random seed. Same settings + seed = same file, so changing the seed reshuffles |
| `--out PATH` | the includes file above | Write somewhere else (e.g. scratchpad) to preview |

Those two commands reproduce the current files exactly (the bare defaults no
longer do — the large case is now generated with the options above). The script prints the parcel,
action and manual-check counts plus the payment totals, so you can quote them
back to the user.

## What it generates (rules to keep)

- **Parcel IDs:** the first 15 are the real Grasslands / Golden Grange case's
  (`REAL` in the script). Any extra IDs are invented in the same format and OS
  grid areas (SD / NY / NT / NU), with no duplicates.
- **Feature quotas:** `--ponds` / `--sssi` fix how many parcels carry those
  features, so the conditional tasks' LP lists can be set to a given size.
- **Grasslands actions only:** CLIG3, CNUM2, CSAM3, SCR2 (area, in ha), HEF1
  (buildings, sqm) and WBD1 (ponds). Never moorland actions (CMOR1 / UPL*).
- **Area actions fit the parcel:** together they use about 60–85% of the
  parcel's permanent grassland. HEF1 adds a claimed building, and WBD1 adds a
  Pond land cover plus 1–4 ponds.
- **Payments** = quantity × rate (CLIG3 £151/ha, CNUM2 £102/ha, CSAM3 £224/ha,
  SCR2 £350/ha, HEF1 £5/sqm, WBD1 £257/pond). The yearly and 3-year agreement
  totals are summed in the script. **Don't hand-edit the data file**, because
  the totals won't update. Change the script and re-run it instead.
- **Fails (`--fails N`):** N parcels have their grassland reduced to between their
  largest area action and their next largest, so exactly one available-area check
  on each fails in the latest run and its figures get the changed-value
  highlight. The parcels are spread evenly through the list. This is what the
  Fails and Changed filters show.
- **Current state:** large = 40 parcels, 12 with ponds, 8 in an SSSI, 5 fails;
  medium = 5 parcels, 3 with ponds, 2 in an SSSI, 2 fails. Note an SSSI parcel
  only raises an SSSI Task check when it has a CLIG3 or CNUM2 action, so the
  SSSI task can list fewer parcels than `--sssi`.
- **Two runs per case:** the calculations pages render run 1 (as at submission,
  3:14pm 2 September 2026 — everything passes) or run 2 (latest, 9:15am
  14 September 2026 — the fails), switched by `?calcRun=1` / `?calcRun=2` from
  the "Rules check runs" line. Run 1 uses each area action's `available` and
  `reasonOriginal`; run 2 uses `availableNow`, `reason`, `fail` and `changed`.
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
- Index rows: "Large case MVP Grasslands" and "Medium case MVP Grasslands" in
  `app/views/index.html`. The medium case's route is `/grassmvpMediumApplication`
  (`data.mvpCalcVariant = 'medium'`).
