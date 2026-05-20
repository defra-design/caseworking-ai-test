---
name: check-pattern-library-on-commit
description: Before any `git commit` (with or without push), scan the staged + unstaged changes for new or significantly modified UI patterns and ask the user whether to document them in the pattern library first. Triggers whenever the user asks to commit, commit and push, or run a git commit — e.g. "commit and push", "git commit", "push these changes", "make a commit". Runs the check, surfaces candidate patterns, asks once, and then either proceeds with the commit or pauses while the library page is added.
---

# Pattern-library check on commit

## When this skill fires

Whenever the user asks to commit (any of):
- "commit", "make a commit", "commit this"
- "commit and push", "push", "push these changes"
- "git commit", "git push"
- a custom commit message phrasing like *"commit with note 'X'"*

Run the check **before** invoking the commit. Don't intercept commits the
user explicitly says are tiny / WIP / hot-fix.

## What the check does

1. **Collect the diff.** `git status` + `git diff` (staged and unstaged) for
   the project. Skip the worktrees directory and anything under
   `node_modules`.

2. **Heuristically identify candidate patterns** by scanning the diff for:
   - New rules in `app/assets/sass/application.scss` — especially anything
     that defines a new selector (not just tweaking an existing one), and
     definitely anything that defines a new class with `--<modifier>` or
     `_<state>` naming convention.
   - New nunjucks **includes** (`app/views/.../includes/_*.html`) or new
     reusable HTML structures appearing in more than one template.
   - New `<script>` blocks or any new `app/assets/javascripts/*.js` /
     vendor script being referenced.
   - New third-party packages added to `package.json` that ship a UI
     component (e.g. `accessible-autocomplete`, `chart.js`).
   - New custom HTML structures (a wrapper class with internal layout
     that's unique to the prototype, e.g. `.parcel-search__row`,
     `.app-case-banner`).
   - Significantly modified existing patterns: new variants of an existing
     tag colour, new states, a different layout configuration of an
     existing component.

3. **De-duplicate against the existing library.** Read the directory
   listings under `app/views/pattern-library/custom/`,
   `app/views/pattern-library/gds/`, `app/views/pattern-library/moj/` and
   check whether the candidate looks like it's already documented (e.g.
   if SCSS class `.govuk-tag--red-new` already has a pattern-library
   reference, don't flag it again unless the new diff materially changes
   how it's used).

4. **Suppress noise.** Don't surface:
   - Pure data changes (parcel IDs, dates, customer names, area values).
   - Content text edits.
   - Per-case template duplications that just clone an existing pattern
     (e.g. when the `case-from-fg-cw-export` skill spins up a new
     `case<Name>/` folder, none of those files are new patterns).
   - Generator scripts (`_gen_*.js`, `_inject_*.js`, `_rebuild_*.js`) —
     these are throwaway tooling.
   - The skill files themselves.

5. **Decide whether to ask.** If zero candidates survived steps 2–4, go
   straight to the commit. If one or more, use `AskUserQuestion` (one
   question, with options) to confirm.

## How to ask

Use a single `AskUserQuestion`. Phrase it so the user can answer in one
click. Format:

> *"This change looks like it introduces / changes UI pattern(s) that
> aren't fully documented in the pattern library: <short summary of each
> candidate>. Document in the pattern library before committing?"*
>
> Options (max 4):
> 1. **Add to library, then commit** *(Recommended)* — pause the commit,
>    write the pattern-library page(s) (calling the same approach used in
>    `pattern-library/custom/check-result-tags.html` /
>    `pattern-library/gds/accessible-autocomplete.html` as a model),
>    update the relevant subnav and the index count, then come back and
>    do the commit.
> 2. **Note it, commit now** — proceed with the commit immediately, but
>    drop a follow-up `mcp__ccd_session__spawn_task` chip so the user can
>    spin off the documentation work later.
> 3. **Skip — not a new pattern** — proceed with the commit, don't flag
>    again on the next commit unless the diff materially changes.

Show 2-4 of these as needed. If only one candidate, the question can be
phrased as a simple Y/N for that one pattern.

## When to add a library page (option 1)

Follow the established conventions:

- **Which section?**
  - **GDS** — components from the GOV.UK Design System or alphagov-
    maintained packages (`accessible-autocomplete`, etc).
  - **MOJ** — components from the Ministry of Justice Design System.
  - **Custom** — everything else: our SCSS overrides, our compound
    layouts, our extensions or variants of GDS/MOJ components.
  - If a custom variant of a GDS/MOJ component is being documented, put
    it under **Custom** and add a one-line cross-link from the canonical
    GDS/MOJ page back to the variant (and vice versa).

- **Page structure** (copy from
  [`pattern-library/custom/check-result-tags.html`](../../../app/views/pattern-library/custom/check-result-tags.html)
  as a reference):
  - `{% set plSection = "custom"|"gds"|"moj" %}`,
    `{% set activePage = "<page-slug>" %}`
  - The standard `_pl-header` block + breadcrumbs + `app-split-pane`
    layout with the relevant `_pl-subnav-<section>` include
  - `<h1 class="govuk-heading-xl">` — the pattern's name
  - `<p class="govuk-body-l">` — one-sentence elevator pitch
  - `<p class="govuk-body">` — paragraph with the longer context
  - One `app-example-wrapper` per variant, each with a live example
    plus the Show HTML / Copy code toolbar
  - `<h2>When to use</h2>` bullet list
  - `<h2>When not to use</h2>` bullet list
  - Optional: `<h2>Customisation in this prototype</h2>` if SCSS
    overrides are involved
  - `<h2>Where does this occur</h2>` with a `<ul class="govuk-list">`
    pointing at every live page that uses the pattern

- **Subnav update.** Add the new item alphabetically into
  `pattern-library/includes/_pl-subnav-<section>.html` using the same
  `<li class="app-subnav__section-item{% if activePage == '<slug>' %} app-subnav__section-item--current{% endif %}">`
  pattern.

- **Index update.** In `pattern-library/index.html`, bump the section's
  count (`<p class="app-pl-count">N components|patterns</p>`) and
  optionally append the new pattern to that section's masthead description.

- **No SCSS changes** are required for the library page itself — it just
  documents the rules that already exist in `app/assets/sass/application.scss`.

## When to spawn a task (option 2)

If the user picks "Note it, commit now", call `mcp__ccd_session__spawn_task`
with a self-contained prompt that:
- Names the candidate pattern.
- Notes which section it belongs in (custom/gds/moj) and why.
- Lists the live pages that use it (so the spawned session can quickly
  scaffold the "Where does this occur" list).
- Points to `pattern-library/custom/check-result-tags.html` and
  `pattern-library/gds/accessible-autocomplete.html` as model pages.

Then proceed with the commit as normal.

## When to skip (option 3)

Proceed with the commit immediately. Don't record any state — re-run
the check fresh on the next commit. If the user picks Skip repeatedly
for the same diff, treat that as a signal that the heuristic is
over-firing and tighten the criteria in your future runs.

## After the prompt

Whatever the user picks, finish by carrying out the commit they
originally asked for (assuming option 1 was completed or option 2/3 was
chosen). Follow the standard project commit conventions:

- Stage only the files the user named or that are clearly part of this
  change — don't `git add -A`.
- Use the commit message the user supplied verbatim. If they didn't
  supply one, suggest one based on the diff and confirm.
- Push only if the user asked for it (push, push these changes, commit
  and push, etc.).

## Don't bother checking when

- The diff is empty / no changes to commit.
- The user explicitly says "skip the pattern check" or "just commit"
  or "WIP commit" or anything similar.
- The only files staged are inside `app/.claude/worktrees/` or
  `node_modules/`.

## Examples

- *"commit and push with note 'add SSSI body simplification'"* →
  diff touches `caseReal/calculations-*.html` only with SSSI body text
  changes. No new pattern. Commit straight away.
- *"commit and push 'pattern library — autocomplete page'"* → diff
  adds `pattern-library/gds/accessible-autocomplete.html`. That **is**
  the pattern library work being done — no need to ask again. Commit.
- *"commit and push 'fix tag alignment'"* → diff edits the
  `.govuk-details__summary` / `.govuk-details__summary-text` block in
  `application.scss` and introduces `flex; justify-content: space-between`
  layout for `<summary>` rows that wasn't there before. Significant new
  CSS pattern. Ask: *"This change introduces a reusable summary-row
  layout for Pass/Fail tags. Add to the library before committing?"*.
- *"commit"* → diff adds a brand-new third-party library
  (`vis-timeline`) via npm and wires it into one page. Ask whether to
  document this as a GDS-section pattern before committing.
