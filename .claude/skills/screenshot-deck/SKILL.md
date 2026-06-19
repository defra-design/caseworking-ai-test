---
name: screenshot-deck
description: Build a PowerPoint (.pptx) that documents prototype screens/changes with REAL screenshots, plus a "why" line and feature bullets per slide, grouped into the sections the user names. Captures the screenshots from the running Prototype Kit (headless Chrome, Windows-safe isolated profile), generates the deck with python-pptx in a clean GOV.UK-green theme, and QAs it by rendering slides to PNG via PowerPoint COM (LibreOffice/PyMuPDF are NOT installed here). Use whenever the user asks to "make a powerpoint / deck / slides documenting" caselist / user-management / any prototype changes or screens, organised by theme, with screenshots + reasons + features. Reference: produced grasslands-caselist-and-user-management.pptx (see build_deck.py beside this file).
---

# Build a screenshot documentation deck (.pptx)

Produces a 16:9 PowerPoint documenting prototype screens: a title slide, one
content slide per topic (green section label + bold title + a "why" line +
feature bullets + the real screenshot(s)), and a summary slide. The reference run
documented the Grasslands caselist + user-management changes in five sections:
Search and filtering / Multiple assignment / Tab structure and teams / Context
persistence across tabs / User management.

**Reference implementation (copy + adapt):** `build_deck.py` beside this file —
the full generator with the theme, layout helpers, and the slide content list.

## Environment facts (this machine)

- **Python**: `C:/Users/chasl/AppData/Local/Programs/Python/Python312/python.exe`
  (the bare `py`/`python` are NOT on PATH in the persistent Bash shell — use the
  full path). `python-pptx` and `Pillow` are installed.
- **No LibreOffice / no PyMuPDF / no poppler** → the pptx skill's standard
  pptx→PDF→image QA path does NOT work. QA renders slides with **PowerPoint via
  COM** instead (PowerPoint IS installed). See §4.
- **Chrome** for screenshots: the user keeps many interactive Chrome windows
  open. Headless Chrome with the default profile collides with them (singleton
  lock) and HANGS. Always use an **isolated `--user-data-dir`** per shot. When
  cleaning up stuck Chrome, only kill processes whose command line contains
  `--headless` — never the user's interactive windows.

## Inputs to confirm with the user

1. **Sections** — the grouping headings (the user usually lists them). One or
   more content slides per section.
2. **Which screens** go under each section, and the **route/URL** for each
   (on the running kit, default `http://localhost:3000/...`). Reuse the
   `data-driven-caselist` routes for caselist screens.
3. **Output path** — default `C:\Users\chasl\Downloads\<name>.pptx`.
4. **Title / subtitle / footer** (org + date). Reference used "DEFRA — Manage
   rural grant applications".

## Pipeline

### 1. Make sure the kit is serving the screens

The prototype must be running (default port 3000). Don't start a new server if
one is up; don't kill the one on 3000. Confirm each URL renders before capturing.

### 2. Capture screenshots (headless Chrome, isolated profile)

One shot per screen, into a scratch folder (e.g. `_ppt_shots/`). Use an
**absolute** `--screenshot` path (the path is relative to Chrome's CWD
otherwise), a **2× scale** for crisp images, and a **per-shot isolated profile**.
Bash loop template:

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"   # adjust if needed
SHOTS="C:/Users/chasl/Documents/ai-driven-main/_ppt_shots"
TMP="$TEMP/ppt_chrome"
mkdir -p "$SHOTS"
shoot () {  # shoot <name> <url> <width> <height>
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=2 --window-size="$3,$4" \
    --user-data-dir="$TMP/$1" --virtual-time-budget=3000 \
    --screenshot="$SHOTS/$1.png" "$2"
}
shoot filters_open "http://localhost:3000/Grasslands/caselist?..." 1280 1500
# ...one shoot per screen...
```

- **Window height controls how much page is captured** (new headless captures the
  viewport, not the full page). Size each shot so the content ends at a sensible
  point. A list longer than the viewport will be cut **mid-row** — either pick a
  taller window that shows the whole bounded page (+ footer), or accept a clean
  "list continues" cut and rely on the deck's bottom margin (§3) so it doesn't
  touch the slide edge.
- To open a `<details>` panel (e.g. "Find an application") for the shot, you can
  temporarily add `open` to the `<details>` in the template, capture, then
  **revert** the template. (Or drive it via the preview MCP.)
- If a `shoot` hangs (empty/locked profile), kill stale `--headless` chrome PIDs
  and the background shell, then re-run **foreground** with `timeout 40` per shot.

### 3. Generate the deck — `build_deck.py`

Copy `build_deck.py` from beside this file and edit:
- `SHOTS`, `OUT`.
- The **title slide** text (title / subtitle / footer).
- The `content_slide(...)` calls — one per topic: `section` (label), `title`,
  `why` (one muted sentence), `bullets` (4–5), `images` (1 or 2 paths),
  `image_side` ("left"/"right" for single image), and `captions` (for two
  images). Alternate `image_side` across slides for rhythm.
- The summary slide bullets.

Run it:
```bash
"C:/Users/chasl/AppData/Local/Programs/Python/Python312/python.exe" build_deck.py
```

**Layout facts baked into `build_deck.py`:**
- 13.333×7.5" (16:9). GOV.UK green `#00703c` accent; dark-green title + light
  content slides ("sandwich"). Motif: a small green square beside each section
  label (NO accent underlines — those read as AI slop).
- `fit()` aspect-fits every image into its box (never stretches) and adds a thin
  gray border.
- **Single-image slides**: image fills one half; the box stops at `img_bottom =
  6.85` so even a tall screenshot keeps a clean ~0.6" bottom margin and never
  touches the slide edge. Text on the other half.
- **Two-image slides**: images side-by-side across the top (`ih = 2.45`) with
  captions, bullets below. Keep these to **4 bullets** so they fit under the
  images.

### 4. QA — render with PowerPoint COM, inspect with a subagent

LibreOffice is unavailable, so export to PNG via PowerPoint COM (PowerShell):

```powershell
$src = "C:\...\<name>.pptx"; $dir = "C:\...\_deck_png"
if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
New-Item -ItemType Directory -Force $dir | Out-Null
$ppt  = New-Object -ComObject PowerPoint.Application
$pres = $ppt.Presentations.Open($src, $true, $false, $false)  # ReadOnly, no window
$pres.Export($dir, "PNG", 1400, 788)
$pres.Close(); $ppt.Quit()
```

Produces `Slide1.PNG … SlideN.PNG`. Then:
- **Visual QA**: spawn a subagent (`general-purpose`) with fresh eyes; have it
  Read each `SlideN.PNG` and report overflow / text touching edges / images
  cut off or stretched / overlap / two-image bullets running off the bottom.
- **Content QA**: extract text with python-pptx (write to a UTF-8 file — the
  Windows console cp1252 chokes on `→`/`—`/smart quotes; don't print to stdout):
  ```bash
  "C:/.../python.exe" -c "import io; from pptx import Presentation; \
  o=io.open('_deck_text.txt','w',encoding='utf-8'); \
  [ (o.write('=== Slide %d ===\n'%i), [o.write(sh.text_frame.text+'\n') \
  for sh in s.shapes if sh.has_text_frame and sh.text_frame.text.strip()]) \
  for i,s in enumerate(Presentation(r'C:\...\<name>.pptx').slides,1) ]; o.close()"
  ```
  Read the file; check order, typos, no placeholder text.

**Fix one cycle, then stop** (per the pptx skill). The most common defect is a
tall screenshot running to the slide edge — fixed by lowering `img_bottom` /
shrinking the image box, NOT by chasing sub-pixel nudges.

### 5. Deliver

Tell the user the path. Note any screenshot that ends on a deliberate
"list continues" cut, and offer to recapture full-page if wanted. The scratch
files (`build_deck.py` copy, `_ppt_shots/`, `_deck_png/`, `_deck_text.txt`, the
isolated chrome profiles in `%TEMP%/ppt_chrome`) are throwaway — leave them for
re-runs unless asked to clean up. Don't commit anything unless asked.

## Gotchas (learned building the reference deck)

- **Isolated Chrome profile is mandatory** here — shared profile hangs against the
  user's open browser. One `--user-data-dir` per shot.
- **Absolute `--screenshot` path** — relative paths land in Chrome's CWD / error.
- **Viewport vs full page** — new headless captures the window, so long lists cut
  mid-row; size the window or lean on the deck bottom margin.
- **No LibreOffice/poppler** — use PowerPoint COM for the PNG render, not the
  pptx skill's `soffice.py`/`pdftoppm` path.
- **Console encoding** — write extracted text to a UTF-8 file; don't print smart
  quotes/arrows to the cp1252 console.
- **Bottom margin is the usual fix** — single-image box ends well above the slide
  bottom so tall shots don't touch the edge.
- **Keep it on-brand, not generic** — green square motif, no underlines, no
  full-width colored bars, white content backgrounds.
