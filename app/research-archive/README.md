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
  that report, a `version` number for that screen, the findings, the
  recommended changes, and `changedFromPrevious` (what actually changed since
  the last capture of the same screen, and why). For the first capture of a
  screen, `changedFromPrevious` is `null` — it is the baseline (version 1).

A **change-history for a screen** = all `captures` with that `screenId`,
ordered by their report's date. Each step shows the image, the date/report it
came from, the findings that round, and — from the *next* capture's
`changedFromPrevious` — why it then changed.

## How Claude Design should use this

When building or updating the change-history in the pattern library:

1. Read `manifest.json` as the source of truth. Do not hard-code findings into
   pattern pages — read them from here so the archive stays single-source.
2. For each screen, build a vertical timeline: one block per `capture`, oldest
   to newest, each showing the image (`{imageBase}/{src}`), the report title +
   date, the verdict, and the bullet findings. Between consecutive blocks,
   surface the newer capture's `changedFromPrevious` as the "why it changed"
   connector.
3. Cross-link both ways: from each screen's history to its `relatedPatterns`
   pages, and from those pattern pages back to the screen history. This is the
   "current patterns and their development history over time" the archive
   exists to support.
4. Match existing pattern-library conventions — the GDS/MOJ layout, the
   `app-split-pane` + subnav shell, breadcrumbs, and the `Ready/Checked/Action`
   tag vocabulary already in `views/pattern-library/`.
5. Honour the confidence caveats. Every report carries a `confidence` note;
   small-sample studies (like the first one, n=3) should be presented as
   indicative, not definitive.

## Adding the next report

Use the **Digest research** skill (`.claude/skills/digest-research/`). It takes
a research deliverable (PPTX, PDF, DOCX, …), extracts and renames the screen
images, reuses existing `screenId`s where the same screen reappears (so the
history threads together), writes the `report.md` digest, and appends the new
report + captures to `manifest.json`.

## Index

- **Reports:** 1
- **Screens tracked:** 5
- **Latest:** 2026-01 — *Amendments to grant applications pre agreement* (Janice Hannaway)
