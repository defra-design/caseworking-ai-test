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
3. **Manifest entries** — the report appended to `reports[]` and one `capture`
   per screen appended to `captures[]` in `app/research-archive/manifest.json`,
   plus a matching section in `app/research-archive/screens.md`.

It does **not** build the pattern-library pages themselves — that is Claude
Design's job. This skill produces the single-source data Claude Design reads.
Read [`app/research-archive/README.md`](../../../app/research-archive/README.md)
and [`schema-notes.md`](../../../app/research-archive/schema-notes.md) before
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
containers. **Python is not installed on this machine and ImageMagick
(`identify`) is not available** — do not rely on the pptx/pdf skill's Python
scripts here. Instead:

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

### 5. Append to the manifest and screens index

In [`app/research-archive/manifest.json`](../../../app/research-archive/manifest.json):

- Add any **new** `screenId`s to `screens` (title, area, summary,
  `relatedPatterns` — link to the real pattern-library pages the screen uses;
  check `views/pattern-library/` for the right URLs).
- Append the report to `reports[]` (date-sortable id, full metadata, `digest`
  path, one-line `headline`).
- Append one `capture` per screen to `captures[]`:
  - `reportId`, `screenId`, `version` (per-screen: 1 for a screen's first
    appearance, N+1 when extending an existing screen's history).
  - `images[]` of `{ src, state }` (src relative to `imageBase`).
  - `verdict` (`worked` / `mostly-worked` / `mixed` / `problem`).
  - `findings[]` and `recommendedChanges[]` bullets.
  - `changedFromPrevious`: `null` for a screen's baseline; for a later version,
    a short string (or `{summary, drivenBy}`) saying what changed since the last
    capture and which finding/report drove it. **This is the connector that
    makes the change-history meaningful** — always set it when extending a
    screen.

Mirror the same content as a human-readable section in
[`app/research-archive/screens.md`](../../../app/research-archive/screens.md),
appending a `### vN — <date> · <report> · verdict` block under the screen's
heading (newest last). Update the index counts at the bottom of `README.md`.

### 6. Hand off to Claude Design

Tell the user the archive is updated and summarise: report id, screens captured
(noting which extended an existing history vs new baselines), and where the
images and digest live. Claude Design reads `manifest.json` as the source of
truth to build/refresh the per-screen change-history timelines in the pattern
library and cross-link them to `relatedPatterns`.

## Things to remember

- **No Python, no ImageMagick** on this machine. ZIP-extract Office files with
  `Expand-Archive`; **view images with the Read tool**; never shell out to
  `identify`/`convert`/`pdftoppm` expecting them to exist.
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
