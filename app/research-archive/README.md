# Research archive

A growing, structured record of user-research reports on the caseworking
system, built so the **pattern library** can render a *visual change-history
per screen* — the same screen captured across multiple studies over ~18
months, with the reasoning for every change attached.

This folder is the **knowledge base** (digests + metadata). The **images**
live under `app/assets/images/research/<report-id>/` so they are servable at
`/public/images/research/<report-id>/...` and can be embedded straight into
pattern-library pages.

## Layout

```
app/research-archive/
  README.md                       ← this file
  schema-notes.md                 ← manifest.json field reference
  manifest.json                   ← master index: screens · reports · captures
  screens.md                      ← human-readable change-history, one section per screen
  <report-id>/
    report.md                     ← full digest of one research report

app/assets/images/research/
  <report-id>/
    <screen-id>[--<state>].png    ← the captured screens, semantically named
```

`<report-id>` is date-sortable: `YYYY-MM-<slug>` (e.g.
`2026-01-amendments-pre-agreement`). Sorting report IDs ascending gives the
chronological order a change-history needs.

## The three core objects (in `manifest.json`)

- **screens** — a registry of stable screen *identities*. A `screenId` (e.g.
  `confirm-amend`) is the thing whose history we track. It persists across
  reports even as the design changes. Each entry links to the pattern-library
  patterns it relates to.
- **reports** — one entry per study: who, when, method, sample size, the
  confidence caveat, and the one-line headline. Points at its `report.md`
  digest.
- **captures** — the join between a report and a screen: the image(s) taken in
  that report, the findings, the tracked recommendations (each with a `status`
  against the live design), and a `note`/`noteKind` (what changed vs whatever is
  chronologically prior). Order and per-screen `version` are **derived at
  render** from `reports[].fieldworkDate` — never stored. The first capture of a
  screen is `noteKind: "first-capture"` (the baseline).

A **change-history for a screen** = all `captures` with that `screenId`, sorted
by their report's `fieldworkDate`. Each step shows the image, the date/report,
the findings, the recommendation statuses, and — in the gap before it — the
`note` explaining what changed. The chain ends on the live `currentScreen`.

This is the **contract v2** shape; see [`schema-notes.md`](schema-notes.md) for
the field reference and the render rule. v2 makes ingestion order-independent:
a report older or newer than existing ones is a pure append, with zero edits to
existing records.

## The rendered surface (already built)

The change-history is live in the pattern library — no page-building needed per
report:

- `/pattern-library/research` — archive index: coverage rollup, filterable
  screen grid, and the archive-wide "Outstanding research" backlog.
- `/pattern-library/research/screens/<screenId>` — one screen's history on the
  `moj-timeline` (oldest→newest), verdict + confidence tags, before/after diff,
  recommendations as a `govuk-task-list` with status, and a green "Current
  design — Live now" terminal node.

Both routes live in [`app/routes.js`](../routes.js) (`buildResearchArchive()`),
read `manifest.json` fresh per request, and **derive** order, version, diffs,
rollups and the backlog. Pattern pages named in any `relatedPatterns` carry a
reciprocal "Research history" block back into the archive.

**So the rule for everyone (including Claude Design): edit `manifest.json`, not
the templates.** Findings, verdicts and statuses are never hard-coded into
pages. Honour the confidence caveats — every report carries a `confidence` note
and small-sample studies render as `Indicative · n=N`, not settled fact.

## Adding the next report

Use the **Digest research** skill (`.claude/skills/digest-research/`). It takes
a research deliverable (PPTX, PDF, DOCX, …), extracts and renames the screen
images, reuses existing `screenId`s where the same screen reappears (so the
history threads together), writes the `report.md` digest, and appends the new
report + captures to `manifest.json`.

## Screen-first structure (v2.1)

The archive is now organised **screen-first**: the unit of history is a design
**version** of a screen (`versions[]`); research **captures** attach to a version
(matched at render by `screenId@<report date>`); and **personas + needs** sit
alongside as the "why". A screen has a history even with no research — a `versions`
entry with no matching capture renders with a "No research findings" note.

The rendered surface has four areas under **Research history**:
`/pattern-library/research/background` · `/screens` (+ `/screens/<id>`) ·
`/personas` (+ `/personas/<id>`) · `/coverage`.

New top-level manifest keys: `versions[]`, `personas{}`, `needs[]`,
`grasslandsChanges[]`; screens carry a `deployed` boolean.

## Index

- **Reports:** 8 (5 discovery, 3 usability/design)
- **Screens tracked:** 13 (11 deployed, 2 not yet deployed — Land details, Messages)
- **Versions:** 12 · **Personas:** 3 · **Needs:** 5 (seeded)
- **Latest:** 2026-01 — *Amendments to grant applications pre agreement* (Janice Hannaway)
- **Earliest:** 2024-08 — *Future Grants — RPA internal user problems* (Nick Buckland; discovery, no screens)
- **Deepest history:** `tasklist` (case view Tasks) — Jan 2025 baseline → Jun 2025 Application review + decision → Jan 2026 amend decision panel → live
