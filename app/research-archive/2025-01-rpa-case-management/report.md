# Usability testing of RPA case management designs

|  |  |
|---|---|
| **Report** | DEFRA Future Grants — Usability Testing of RPA Case Management Designs |
| **Author** | Nick Buckland |
| **Contributors** | Chas Linn, Naomi Wilcock, Rebekah Broughton, Mark Stead, Garry Prior |
| **Date** | January 2025 (fieldwork 20–23 January 2025) |
| **System** | DEFRA Future Grants — RPA case management (caseworker prototype) for FETF / FTF grants |
| **Stage** | Alpha — early clickable Figma prototype |
| **Method** | 10 × 1-hour moderated usability tests on a clickable Figma prototype |
| **Sample size** | 10 |
| **Participants** | RPA staff directly involved in grant appraisal: EO Appraisers, HEO Workflow Managers, HEO Subject Matter Experts (SMEXs) |
| **Source file** | `Future Grants _ RPA Case Management _ Summary 280125.pptx` |
| **Confidence** | Indicative usability study — 10 moderated sessions on an early concept prototype. Qualitative and directional: reactions to early designs, not validated outcomes. Further research flagged for status terminology and messaging. OFFICIAL-SENSITIVE. |

## Headline

RPA staff were overwhelmingly positive about a consolidated **Case List** and
**Individual Case View** prototype — excited by automation, one-place information
and role-specific views — with refinements needed to status terminology, an
'actions' column, applicant details, and the notes/messages model. This is the
first usability test of the caseworking prototype these screens descend from.

## Background & purpose

Equal Experts is developing improved designs for the case-management systems RPA
uses to assess, administer and pay out **Farming Equipment & Technology Fund
(FETF)** and **Farming Transformation Fund (FTF)** grants (designs intended to be
adaptable to other grant types). This study tested early concepts with the staff
who use these systems day-to-day, to ensure they are intuitive, efficient and
effective. Participants explored a clickable Figma prototype of two screens: a
**Case List** and a **Case View**.

## The as-is problem (reaffirmed)

Participants described current tools and processes (Giles, shared mailbox,
SharePoint, spreadsheets) as outdated, error-prone and inefficient:

- Information dispersed across multiple systems and folders.
- Human errors from manual searches and constant copy-paste from emails and forms.
- Repetitive updates of various 'trackers'.
- Emails and applications going missing from a shared mailbox (one estimate: 10–15%
  of team capacity is spent managing the shared mailbox).
- Managers blind to progress and unable to spot who needs support.

> *"How spread out things are, having 3 different things open at once, mailbox,
> SharePoint, GILES. Plus looking at guidance. Back and forth updating things in
> multiple places."*

## Overall reaction

Overwhelmingly positive. Participants were excited by streamlined processes,
valued consolidating all information in one place, liked the look and feel
("user friendly"), and were keen on automating checks. Managers said it would be
much easier to support teams to meet KPIs. The designs were spontaneously compared
to **Universal Credit / DWP** ("this near enough reflects what DWP looks like —
messages, evidence, assigning etc. works really well").

## Screens captured

| Screen | Capture | What it shows |
|---|---|---|
| Case list | `case-list` (baseline) | "Your team's applications" — tabbed by status (New / Not started / In progress / Complete / All), Ref · Grant · Project · Received · Status · Priority · Assigned-to columns, select-and-Assign, status filter. |
| Individual case view | `tasklist-decision` (baseline) | Tabbed case page (Tasks, Timeline, Application, Documents, Notes, Messages, Assigned users). Tasks shows automated checks (Companies House / Spotlight / HMRC) + application/quality task list. |

> `tasklist-decision` is the **same screen identity** later captured in the Jan
> 2026 amendments study — this Jan 2025 capture is its baseline; by 2026 the
> Tasks page had evolved to centre the caseworker decision radio group.

## Case list — findings

- All participants understood the case-list view and every column heading.
- They felt able to organise cases by **priority and status**, and particularly
  liked the **priority column** (priority level + days left to hit KPI).
- Felt similar to other case-management systems they had used, especially
  Universal Credit.
- **Role-specific views are essential.** EO Appraisers want a view of their
  assigned cases and priorities; HEO Workflow Managers need a team overview with
  urgency against the 60-day KPI; HEO SMEXs need to filter by their specialism;
  SEOs want team-level performance and KPI analysis.
- An **'Actions' column** would help quickly see progress, outstanding actions or
  new messages — for both Appraisers and Workflow Managers.
- **Applicant details alongside project name** would add context and help spot
  clients with multiple applications.
- **Status terminology needs refinement** — statuses ('in progress', 'on hold',
  'ready for QC', 'approved', 'rejected', 'withdrawn') were important but a source
  of confusion; participants struggled to imagine future workflows. Some felt
  completed cases were redundant and preferred focusing on active cases.

## Individual case view — findings

- Appreciated the layout and look and feel; the main value is seeing **everything
  about a case in one place** without navigating folders.
- **Automated checks** (reconciling business info with HMRC / Companies House)
  seen as a significant improvement.
- The **timeline** feature was well received (contact history without trawling
  SharePoint).
- **Documents/evidence:** wanted to **categorise and relabel** evidence for
  consistency and scanning, and to **archive** older documents.
- **Notes vs messages:** the distinction was unclear — explore alternative labels.
  Frequent use of **template copy** in emails → build templates into the design.
- **Communication preferences:** the design assumed messages go to the applicant,
  but many are handled by an **agent** — allow sending to applicant or agent by
  preference.
- **'Assigned users'** was less useful, particularly for Appraisers.

## Additional / emerging themes

- **Telephone contact** — designs emphasise written comms, but several participants
  actively encourage phone contact; provide a way to record/track it.
- **Bulk communications** — need to message many applicants at once (e.g. inviting
  online applicants to the full-application stage).
- **Shared mailbox** — a major pain point (10–15% of capacity).
- **Flags & notifications** — surface outstanding/new actions (new messages, status
  changes) with clear visual cues.

## Summary of suggested design changes (from the deck)

Case-list status terminology · management (SEO) team-KPI view · SMEX
specialisation filters · a case 'actions' (last action) column · flags &
notifications · show applicant information in the list · differentiate notes vs
messages · communication preferences (applicant vs agent) · record telephone
contact · template copy for common comms · archive documents.

## Why it matters for caseworking

This is the **origin point** of the caseworking prototype in this archive. The
Case List is the ancestor of the live `/Grasslands/caselist`; the Case View is the
ancestor of the live `/FRPS-D2/caseReal/tasklist-stage`. Several of these
recommendations have since landed (applicant/business shown in the list;
role-based My cases / Open cases / All cases tabs; a defined status set), while
others — an actions column, KPI/priority indicators, evidence categorisation,
notes/messages clarity, communication preferences — remain open. The Jan 2026
amendments study revisits the same case view.
