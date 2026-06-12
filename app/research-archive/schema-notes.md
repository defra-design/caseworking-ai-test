# manifest.json — field reference (contract v2)

Plain-English schema for `manifest.json`. Not machine-enforced; a guide so every
report is recorded the same way and the change-history renders consistently.

**v2 in one line:** ordering and per-screen version numbers are now **derived at
render time** from `reports[].fieldworkDate`, never stored. This makes the
archive **order-independent** — reports arriving *backwards in time* are pure
appends, with zero edits to existing records.

## Top level

| Field | Meaning |
|-------|---------|
| `contractVersion` | `2`. Bump only on a breaking schema change. |
| `imageBase` | URL prefix for served images. Join with a capture image `src` to get the `<img src>`. Currently `/public/images/research`. |
| `repoImageBase` | Where those images physically live in the repo (`app/assets/images/research`). |
| `screens` | Object keyed by `screenId` — the registry of screen identities tracked over time. |
| `reports` | Array of report objects, one per study. Order in the file does not matter — `fieldworkDate` orders them. |
| `captures` | Array of capture objects — the report×screen join carrying images + findings. Append-only. |

## The render rule (implement once, use everywhere)

```js
// For a given screenId, order its captures and derive version + neighbours:
const history = captures
  .filter(c => c.screenId === screenId)
  .sort((a, b) => date(report(a).fieldworkDate) - date(report(b).fieldworkDate));
// version          = index + 1            (1 = chronologically first / baseline)
// previous capture = history[index - 1]   (undefined for the baseline)
// live now         = screens[screenId].currentScreen
```

Everything chronological (version label, "baseline" marker, the "why it changed"
gap, the before/after diff, the Live-now terminal node) is computed from this —
never authored on the capture.

## screens[screenId]

| Field | Meaning |
|-------|---------|
| `title` | Human label for the screen. |
| `area` | The journey/feature it belongs to (e.g. "Amend application pre-agreement"). |
| `summary` | One or two sentences: what the screen is and does. |
| `currentScreen` | Live prototype URL for the screen as it stands today, or `null` if the screen was retired. The thing every recommendation is judged against; renders as the **Live now** node. |
| `relatedPatterns` | Array of pattern-library URLs this screen exercises. Used for the two-way cross-link. |

A `screenId` is **stable**: when a later report captures the evolved version of
the same screen, reuse the same id so the history threads. Only mint a new id
for a genuinely new screen.

## reports[]

| Field | Meaning |
|-------|---------|
| `id` | `YYYY-MM-<slug>`. Also the image subfolder and digest folder name. |
| `title`, `author`, `role` | As stated on the deliverable. |
| `fieldworkDate` | **The authoritative sort key.** Full ISO date (`YYYY-MM-DD`) of when the research happened. If the exact day is unknown, approximate and set `datePrecision`. |
| `datePrecision` | Optional: `"day"` (default) or `"month"` — flags that `fieldworkDate`'s day is approximate. |
| `date` | `YYYY-MM`, **display only**. Cannot order two reports in the same month — that's what `fieldworkDate` is for. |
| `system`, `stage` | Which product/prototype and what delivery stage. |
| `method`, `sampleSize`, `participants` | How the research was run and with whom. |
| `confidence` | The study's own caveat about how far the findings generalise. Always carry through to the UI. |
| `digest` | Path (relative to this folder) to the `report.md` long-form digest. |
| `sourceFile` | Original deliverable filename, for provenance. |
| `headline` | One-sentence main conclusion. |

## captures[]

| Field | Meaning |
|-------|---------|
| `reportId` | FK to `reports[].id`. |
| `screenId` | FK to `screens` key. |
| `version` | **Derived — do not author.** The Nth time this screen has been captured across all reports (1 = baseline). Computed via the render rule. |
| `images` | Array of `{ src, state }`. `src` is relative to `imageBase`/`repoImageBase`. `state` describes the variant (e.g. selected option, empty vs filled). |
| `verdict` | Short tag for the screen's reception this round: `worked` · `mostly-worked` · `mixed` · `problem`. Drives the verdict tag colour (green / yellow / orange / red). |
| `noteKind` | `first-capture` · `what-changed` · `re-tested`. For `first-capture`, omit `note`. The renderer places a `what-changed` note **in the gap before this capture**, relative to whatever turns out to be chronologically previous. |
| `note` | Self-contained "why it changed since the prior capture" string. Omit for `first-capture`. Never points at a specific other capture by index — order is derived. |
| `noteDrivenBy` | Optional `screenId@fieldworkDate` (or finding) that drove the change. Provenance only. |
| `findings` | Bullet array (`string[]`) — what the research observed about this screen. Include participant quotes where they exist. |
| `recommendedChanges` | Array of **tracked objects** (see below) — the design proposals and their status against the live design. |

### captures[].recommendedChanges[] — tracked objects

| Field | Meaning |
|-------|---------|
| `text` | The proposal. |
| `status` | `addressed` (green) · `partial` (yellow) · `outstanding` (red) · `rejected` (grey). |
| `evidence` | Live design URL where the change now lives. **Required for `addressed`.** Also useful on `partial`/`outstanding` to point at the screen that was checked. |
| `resolvedNote` | One line on what was found in the live design (what changed, or why it's still open). |
| `resolvedDate` | `YYYY-MM` the change shipped. Required for `addressed`; empty otherwise. |

`status` defaults to `outstanding` on ingest; triage to real values against the
live `currentScreen`. **`addressed` is a judgement — no `evidence` + no
`resolvedDate` means it is not `addressed`.** These statuses roll up per screen,
per report, and archive-wide (all derived, never hand-written).

## Conventions (now literally enforceable)

- **Never store chronological position.** No `changedFromPrevious` back-pointer,
  no authored `version`. Order comes from `fieldworkDate` only.
- **Never delete or edit a capture** — superseded versions are the point of a
  history. Record change via the *new* capture's `note` + the prior
  recommendation's `status`.
- **Append-only.** Adding a report = appending to `reports` + `captures`. If a
  task seems to require editing an existing record, the schema is wrong.
- **Carry the confidence caveat** into every rendered item; small-sample
  findings render as indicative, not settled fact.
