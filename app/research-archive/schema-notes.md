# manifest.json — field reference

Plain-English schema for `manifest.json`. Not enforced; a guide so every
report is recorded the same way and the change-history renders consistently.

## Top level

| Field | Meaning |
|-------|---------|
| `imageBase` | URL prefix for served images. Join with a capture image `src` to get the `<img src>`. Currently `/public/images/research`. |
| `repoImageBase` | Where those images physically live in the repo (`app/assets/images/research`). |
| `screens` | Object keyed by `screenId` — the registry of screen identities tracked over time. |
| `reports` | Array of report objects, one per study. Keep in chronological order. |
| `captures` | Array of capture objects — the report×screen join carrying images + findings. |

## screens[screenId]

| Field | Meaning |
|-------|---------|
| `title` | Human label for the screen. |
| `area` | The journey/feature it belongs to (e.g. "Amend application pre-agreement"). |
| `summary` | One or two sentences: what the screen is and does. |
| `relatedPatterns` | Array of pattern-library URLs this screen exercises. Used for cross-linking. |

A `screenId` is **stable**: when a later report captures the evolved version of
the same screen, reuse the same id so the history threads. Only mint a new id
for a genuinely new screen.

## reports[]

| Field | Meaning |
|-------|---------|
| `id` | `YYYY-MM-<slug>`. Date-sortable; also the image subfolder name and digest folder name. |
| `title`, `author`, `role`, `date` | As stated on the deliverable. `date` is `YYYY-MM`. |
| `system`, `stage` | Which product/prototype and what delivery stage. |
| `method`, `sampleSize`, `participants` | How the research was run and with whom. |
| `confidence` | The study's own caveat about how far the findings generalise. Always carry this through to the UI. |
| `digest` | Path (relative to this folder) to the `report.md` long-form digest. |
| `sourceFile` | Original deliverable filename, for provenance. |
| `headline` | One-sentence main conclusion. |

## captures[]

| Field | Meaning |
|-------|---------|
| `reportId` | FK to `reports[].id`. |
| `screenId` | FK to `screens` key. |
| `version` | Integer, per-screen. The Nth time this screen has been captured across all reports (1 = baseline). |
| `images` | Array of `{ src, state }`. `src` is relative to `imageBase`/`repoImageBase`. `state` describes the variant (e.g. selected option, empty vs filled). |
| `verdict` | Short tag for the screen's reception this round: `worked` · `mostly-worked` · `mixed` · `problem`. Drives at-a-glance colour in the timeline. |
| `findings` | Bullet array — what the research observed about this screen. Verbatim-ish, include participant quotes where they exist. |
| `recommendedChanges` | Bullet array — design opportunities the report proposed for this screen. |
| `changedFromPrevious` | For version > 1: a short string (or `{summary, drivenBy}` object) describing what changed since the previous capture and which finding/report drove it. `null` for the baseline. This is the "why it changed" connector in the history. |

## Conventions

- Never delete a capture — superseded versions are the point of a history.
- Keep `reports` and `captures` append-only where possible; edits should be
  corrections, not rewrites.
- When the same screen reappears with changes, set the new capture's
  `changedFromPrevious` rather than editing the old capture.
