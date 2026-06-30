---
name: digest-research
description: Digest a user-research deliverable (PPTX, PDF, DOCX, or similar) about the caseworking system into the research archive — extract and semantically rename the screen images, write a long-form report digest, and append the report plus per-screen captures to the archive manifest so the pattern library can render a visual change-history per screen over time. Use whenever the user shares a research report / readout / usability study and asks to record findings, build an image archive, "digest" or "package" research, add it to the research archive, or feed it to Claude Design for the pattern library. Reuse existing screenIds when the same screen reappears across reports so the change-history threads together.
---

# Digest research into the change-history archive

## What this skill does

Turns a user-research deliverable into a structured, append-only contribution
to the **research archive** at `app/research-archive/`, which exists so the
pattern library can show a **visual change-history per screen** — the same
caseworking screen captured across ~10 reports over ~18 months, each version
tagged with the findings and the reason it changed.

For one report it produces:

1. **An image archive** — every meaningful screen capture, extracted from the
   deliverable and saved with a **semantic, screen-keyed name** under
   `app/assets/images/research/<report-id>/` (servable at
   `/public/images/research/<report-id>/...`).
2. **A long-form digest** — `app/research-archive/<report-id>/report.md`.
3. **Manifest entries (v2)** — the report appended to `reports[]` and one
   `capture` per screen appended to `captures[]` in
   `app/research-archive/manifest.json`.

The change-history **surface is already built** — `/pattern-library/research`
and the per-screen pages render from `manifest.json` via the loader in
`app/routes.js`, deriving order, version, diffs, rollups and the backlog. So a
correct append is all that's needed; the pages update themselves. This skill
produces that single-source data. Read
[`app/research-archive/README.md`](../../../app/research-archive/README.md) and
[`schema-notes.md`](../../../app/research-archive/schema-notes.md) before
starting; the first report (`2026-01-amendments-pre-agreement`) is the
reference implementation.

## Inputs to confirm with the user

Ask (one `AskUserQuestion` batch) only for what you cannot read off the file:

1. **Deliverable path** — the PPTX/PDF/DOCX, usually in `~/Downloads`.
2. **Report id** — propose `YYYY-MM-<slug>` from the title/date and confirm.
3. **System / journey area** the screens belong to (used for `screens[].area`),
   if not obvious from the content.
4. Whether any screens are **the same screen as an earlier report** (so they
   reuse an existing `screenId` and extend its history rather than starting a
   new one). When in doubt, read the existing `screens` registry and match by
   what the screen *is*, not by exact pixels.

## Pipeline

### 1. Read the deliverable

Office files (`.pptx`, `.docx`, `.xlsx`) and `.pdf` are ZIP/structured
containers. **Python 3.12 is installed** (since 2026-06) — `python` and `py` are
on PATH in any freshly opened shell (a long-running shell session may still need
the full path `C:\Users\chasl\AppData\Local\Programs\Python\Python312\python.exe`).
So the `anthropic-skills:pptx` / `docx` / `pdf` / `xlsx` Python scripts (e.g.
`unpack.py`, `extract-text`) now work and are the preferred path. **ImageMagick
(`identify`/`convert`) and poppler (`pdftoppm`) are still NOT installed**, so keep
viewing images with the **Read tool**, not an image CLI.

The pure-PowerShell fallback below still works if you prefer it (no dependency
on the skill scripts) and is what built the reference report:

- **PPTX:** copy to a temp `.zip`, `Expand-Archive`, then:
  - Text per slide: regex `<a:t>(.*?)</a:t>` over `ppt/slides/slideN.xml`
    (decode `&amp; &lt; &gt;`). Slides are not zero-padded.
  - Images: `ppt/media/*.png|jpg|emf`.
  - Image→slide mapping: parse `ppt/slides/_rels/slideN.xml.rels` for
    `imageN.(png|jpg)` references — this tells you which screenshot sits on
    which (titled) slide, which is how you name them.
- **DOCX:** `word/document.xml` (text in `<w:t>`), images in `word/media/`.
- **PDF:** prefer the `anthropic-skills:pdf` skill / `Read` tool with `pages`
  to read text and view pages; export embedded images if present.

Powershell extraction sketch (adjust paths):

```powershell
Copy-Item $deliverable "$tmp\d.zip" -Force
Expand-Archive "$tmp\d.zip" "$tmp\un" -Force
# text:
1..$n | % { [regex]::Matches((Get-Content "$tmp\un\ppt\slides\slide$_.xml" -Raw), '<a:t>(.*?)</a:t>') }
# media + rels live under $tmp\un\ppt\media and $tmp\un\ppt\slides\_rels
```

### 2. View every image and recognise the screen

Use the **Read tool** on each extracted PNG/JPG to view it (the only reliable
way here — no image CLI). For each, decide:

- Is it a **real screen** of the caseworking system, or decorative (logos,
  section dividers, photos)? Skip decorative images.
- **Which screen identity** is it? Match against the existing `screens`
  registry in `manifest.json`. Reuse a `screenId` if it is the same screen
  evolved; mint a new kebab-case `screenId` only for a genuinely new screen.
- What **state/variant** does it show (empty vs filled, which option selected,
  which scenario)? Multiple images can belong to one `screenId` as different
  `state`s.

Use the slide titles (from step 1) and surrounding slide text to label screens
correctly — the deck usually names each screen on its slide.

### 3. Save the image archive with semantic names

Create `app/assets/images/research/<report-id>/` and copy each kept image as:

```
<screenId>.png                 # single-state screen
<screenId>--<state-slug>.png   # one of several states of the same screen
```

e.g. `confirm-amend.png`, `tasklist-decision--amend-selected.png`. Never keep
the raw `imageN.png` names — the semantic name is what threads the history and
what Claude Design embeds. **Delete the temp extraction folder afterwards.**

> Path mapping: `app/assets/images/X` is served at `/public/images/X` by the
> GOV.UK Prototype Kit. `imageBase` in the manifest is `/public/images/research`.

### 4. Write the report digest

Create `app/research-archive/<report-id>/report.md` following the structure of
the reference digest
([`2026-01-amendments-pre-agreement/report.md`](../../../app/research-archive/2026-01-amendments-pre-agreement/report.md)):
metadata header (author, date, system, stage, method, sample size, source
file, **confidence caveat**), headline, background, goal/objectives,
participants table, scope & limitations, the as-is journey, pain points, the
prototype/usability findings, a "screens captured" table, design opportunities,
and next steps. Capture participant **quotes verbatim** where the report gives
them. Preserve the report's own confidence/limitation language — small-sample
studies are indicative, not definitive.

### 5. Append to the manifest (v2 contract — append-only)

Write [`app/research-archive/manifest.json`](../../../app/research-archive/manifest.json)
in the **v2 shape** (see [`schema-notes.md`](../../../app/research-archive/schema-notes.md)).
The whole point of v2 is that a report — **older or newer** than existing ones —
is a **pure append**: never renumber, edit, or delete an existing record.

- Add any **new** `screenId`s to `screens` (title, area, summary,
  `currentScreen` = the live prototype URL for that screen today or `null`,
  `relatedPatterns` = real pattern-library page URLs — check
  `views/pattern-library/` for the right ones). Reuse an existing `screenId`
  when the same screen reappears — that is what threads the history.
- Append the report to `reports[]` with:
  - `id` (`YYYY-MM-<slug>`), full metadata, `digest` path, one-line `headline`.
  - **`fieldworkDate`** — full ISO date of when the research happened. **This is
    the authoritative sort key** (`date` is `YYYY-MM`, display only). If the day
    is unknown, approximate and add `"datePrecision": "month"`.
- Append one `capture` per screen to `captures[]`:
  - `reportId`, `screenId`.
  - **No `version`** — it is derived at render from `fieldworkDate`. Do not
    author it.
  - `images[]` of `{ src, state }` (src relative to `imageBase`).
  - `verdict` (`worked` / `mostly-worked` / `mixed` / `problem`).
  - `findings[]` — `string[]`, quotes verbatim.
  - **`noteKind`** — `first-capture` for a screen's baseline (omit `note`);
    `what-changed` when extending a screen, with a self-contained **`note`**
    saying what changed vs the chronologically-prior capture (optionally
    `noteDrivenBy`). Never write a back-pointer to a specific capture — order is
    derived.
  - **`recommendedChanges[]` as tracked objects**, not strings:
    `{ text, status, evidence, resolvedNote, resolvedDate }`. Default `status`
    to `"outstanding"`, then triage against the live `currentScreen`:
    `addressed` (green — **requires `evidence` URL + `resolvedDate`**) ·
    `partial` (yellow) · `outstanding` (red) · `rejected` (grey). Put what you
    found in the live design in `resolvedNote`.
- Append a **`versions`** entry for each screen state the report captured:
  `{ screenId, versionId: "<screenId>@<YYYY-MM>", date, sortDate (full ISO),
  image (primary capture src or null), changeReason, changeType
  ("research-driven" for tested changes), changeDriverRefs }`. A capture is
  matched to its version **at render** by `screenId@report.date` — so the
  version's `date` must equal the report's `date`. A design change made *without*
  research gets a `versions` entry with **no** matching capture (changeType
  `design`/`policy`/`tech`/`accessibility`); it still renders, with a
  "No research findings" note. The per-screen history is the versions list,
  sorted by `sortDate`.
- If the report surfaces a new **persona** or **need**, add to `personas{}` /
  `needs[]`: a need is `{ id, personaId, statement ("I need… so that…"), source
  ("research"|"added"), sourceRef (report id or null), status ("met"|"partial"|
  "unmet"), evidence (live URL — **required when `met`**), relatedScreens[] }`.
- Mark a screen `"deployed": false` when it is a pattern not yet in the live
  build (e.g. Land details, Messages); deployed screens omit the flag or set it
  `true`.

After writing, **validate it parses** (`node -e "require('./app/research-archive/manifest.json')"`)
and reconcile counts in `README.md`. The human-readable
[`screens.md`](../../../app/research-archive/screens.md) is an optional mirror —
the rendered pages and rollups now derive entirely from `manifest.json`, so
keeping `manifest.json` correct is what matters.

> The pattern-library surface (`/pattern-library/research` + per-screen pages)
> reads `manifest.json` fresh per request via the loader in `app/routes.js` and
> **derives order, version, the diff, rollups and the backlog** — so a correct
> append makes the new report appear, re-order and re-version automatically with
> no template edits.

### 6. Verify and hand off

Reach the running prototype via the Claude Preview MCP (`preview_start` on the
`kit` server). Check `/pattern-library/research` (the new report/screen appears,
rollups updated) and the affected `/pattern-library/research/screens/<id>`
pages. Then tell the user: report id, screens captured (which extended an
existing history vs new baselines), the resolution status you triaged, and where
images + digest live.

## Things to remember

- **Python 3.12 is available; ImageMagick/poppler are not.** The
  pptx/docx/pdf/xlsx skill scripts work (`python`/`py` on PATH in a fresh
  shell). You can still ZIP-extract Office files with `Expand-Archive` if
  preferred. Either way **view images with the Read tool** — there is no
  `identify`/`convert`/`pdftoppm` on this machine.
- **Servable path:** images must live under `app/assets/images/` to be reachable
  at `/public/images/`. A digest in `research-archive/` that points at images
  anywhere else won't render in the pattern library.
- **Stable screenIds are the whole point.** Reusing an id across reports is what
  turns separate captures into a history. Don't mint a new id for an evolved
  version of an existing screen.
- **Append, don't rewrite.** Superseded screen versions are the value of a
  change-history — keep every capture; record change via the *next* capture's
  `changedFromPrevious`.
- **Carry the confidence caveat through.** Every report states how far it
  generalises (sample size, prototype-only, etc.). Keep that in the digest and
  the manifest so the pattern library never presents a 3-person study as
  settled fact.
- **Worktrees:** per the project auto-memory, write to the main
  `ai-driven-main/app/...` tree, not an agent worktree copy, or the running
  prototype won't see the files.
