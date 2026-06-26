# RPA case management — design history (Jan–June 2025) + SFI processor research

|  |  |
|---|---|
| **Report** | RPA Case Management — Design History |
| **Authors** | Naomi Wilcock, Nick Buckland, Chas Linn |
| **Date** | June 2025 |
| **System** | DEFRA Future Grants — reusable, generic RPA case management (FTF + SFI), heading into SFI private beta Day 1 (Sept 2025) |
| **Stage** | Alpha → MVP (HTML prototype on GOV.UK + MOJ Design System) |
| **Method** | Design-history synthesis across four phases, plus new SFI processor research: 8 in-depth interviews + a survey of 84 SFI respondents |
| **Sample size** | 8 interviews + 84 survey (SFI processors) |
| **Participants** | SFI: AO Appraisers, Workflow Managers (interviews); AOs, EOs, senior management (survey). Earlier phases: RPA grant appraisers |
| **Source file** | `Case Management Design History 170625.pptx` |
| **Confidence** | Mixed. The design-history narrative is a factual record of the team's own work. The SFI processor findings are indicative — 8 interviews plus an 84-person survey across a stressed, SitiAgri-dependent team; directional priorities, not precise measures. OFFICIAL-SENSITIVE. |

## Context

The Future Grants team was originally tasked with replacing **GILES** (the case
management system for non-land-based grants) by mid-2025. In early 2025 the scope
expanded to **a reusable, generic case-management system**, needed for the
**Sustainable Farming Incentive (SFI) private beta Day 1 in September 2025** — then
to scale along the farming roadmap (replacing GILES by mid-2026) and explore wider
Defra/ALB use.

## Design history timeline

| Phase | When | What happened |
|---|---|---|
| **Test new system** | Jan 2025 | Built a Figma case-management journey (case list + case view) from earlier FRPS concepts and government patterns; tested with 7 RPA grant appraisers. |
| **Co-design** | May 2025 | Co-design sessions with appraisers on search/filter, flags and notifications; annotate low-fi concepts, rank case information; plus a parallel survey of 37 appraisers. |
| **Iterate** | June 2025 | Built an **HTML prototype** (GOV.UK + MOJ Design System): new case-list columns, a Team applications tab, clearer priority/stage/status labels and RFI flags, new search & filter, clearer guidance, and a way to record a decision on a case/task. |
| **Align with SFI** | June 2025 | Research with SFI processors (8 interviews + 84 survey); critique of case list / case view / land details; Day 1 journey mapping and a new SFI Day 1 HTML prototype. |

## What changed in the June 2025 iteration

The HTML prototype evolved the Jan 2025 Figma concepts:

- **Case list** — Your applications / **Team applications** / All applications tabs;
  separate **Priority**, **Stage** and **Status** columns with a **Flag** column
  (RFI sent / RFI overdue, etc.); a **Reassign case** action; and a new
  **search** (project ID, business name, status or assignee) and **filter**
  (Grant / Stage / Status / Assignee) panel.
- **Case view** — the Tasks tab became an **"Application review"** with a review
  checklist, a conflict-of-interest warning, in-context **guidance** ("Application
  review checklist guide"), a **Customer contact** tab, and a **Decision** radio
  (Pass / Request more information / Recommend rejection) — the first
  decision-recording design. The SFI variant surfaced case-management **issues**
  (eligibility check, available-area calculation, SSSI consent) each with a
  "Take action" button.
- **Land details** *(new screen)* — a parcel **map** with highlighted land
  parcels and a "Parcel and area" table (area, intersections such as SSSI /
  historic features, percentage holding).

## Earlier insights carried forward

- **Jan 2025 (n=7):** positive on consolidation, clearer timelines, automated
  checks (HMRC/Companies House); wanted role-tailored case-list views, an
  **'Actions' column** and refined status terminology; needed clarity on
  'notes' vs 'messages' and applicant-vs-agent communication.
- **May 2025 co-design (n=8):** managers rely on filters (KPI risk, scheme type,
  stage) to allocate and monitor; appraisers prefer minimal filters; users want
  standardised statuses, project-reference-led search, and **workflow flags** (new
  info, RFI response, QC status) and **issue flags** (fraud, vulnerable applicants).
- **May 2025 survey (n=37):** top features — applicant uploads evidence (68%),
  automated third-party checks (46%), direct messaging & history (43%); top filters
  — project reference (89%), SBI & appraiser (62%), grant name (57%).

## SFI processor research (June 2025)

### What processors need from the case list
Quick access to **SBI, application reference, business name, case status and
priority**, plus application start date, key business contacts, dates of key
actions/milestones, and who the case is assigned to. *"Especially useful if there's
more than one application for an SBI."*

### What they need from the case view
**SBI, application reference, scheme name**; the ability to **flag checks or issues**
("case managements"); a clear list of what needs checking; **visual identification
of which land parcels need review** (SSSI, Inheritance Tax Exemption); a **timeline**
of how/when each issue was resolved; a view of application options/actions that
cause conflicts; a **case history log**; and **full message history** with the
applicant.

### Land & mapping
Existing mapping (SitiAgri, Defra Magic Maps) is broadly adequate but should be
**integrated into a single case-management system**. Desired layers: land use, land
cover, recent customer-submitted changes, dual-funding evidence; parcel-level
intersections with SSSI, historic features, flood risk, scheduled monuments, SHINE,
Inheritance Tax Exemption, moorland line, GIXX.

### SFI survey (n=84)
- **Most valuable features (pick 3):** having all information in one place **88%**,
  track progress application→payment 45%, see full history of messages & actions
  43%, direct messaging 25%, clear deadlines/reminders 22%, assign/reassign 12%.
- **Most helpful filters (pick 5):** SBI **87%**, case status **78%**, application
  reference **72%**, who it's assigned to 46%, applicant name 46%, submission date
  40%, business name 38%, due date 28%, applicant location 4%.

### SFI processor thematic analysis (open survey responses)
1. **System failures & technical barriers** — SitiAgri unreliable, fragmented,
   crashes/locks out. *"SITI Agri freezes regularly and locks us out."*
2. **Unclear, outdated or unusable guidance** — vague, contradictory, based on
   SFI23. *"The guidance is never accurate."*
3. **Inefficient, overly complex processes** — manual, spreadsheet-heavy, no audit
   trail. *"A complete lack of any clear audit trail that easily tracks a claim's
   progress."*
4. **Overload, poor allocation & lack of visibility** — uneven distribution,
   "feast or famine". *"Too many priorities, which means there ends up being no
   priority."*
5. **Training & capability gaps** — limited training, rotations without upskilling.
6. **Poor communication & leadership gaps** — slow/missing decisions and updates.
7. **Strategic & coordination gaps** — cases split between teams, not linked.
   *"Would be better if an SBI would be worked from A to Z by one processor."*

### Summary of SFI processor needs
Reliable systems ready at launch · one system that shows everything · guidance that
matches the system and stays current · own and complete a case end-to-end · easy-to-
follow case history and status · search/filter/mapping that help (SBI, parcel,
status) · permission info and customer view to hand · tools to record changes, notes
and decisions for audit.

## Next steps (from the deck)

Language refinement with SMEs; a realistic Day 1 scenario; evaluative testing of the
HTML designs in July; confirm in-scope actions, land data and customer-contact
approach; fact-checking with SFI caseworking SMEs; observation of cases processed
from Day 1.

## Why it matters for caseworking

This is the spine of the archive's screen history. It records the **June 2025 HTML
iteration** of the **case list** (team tab, priority/stage/status + RFI flags,
search & filter) and the **case view** (Application review + decision recording,
guidance, customer contact), and introduces **Land details**. These sit between the
Jan 2025 Figma concepts and the Jan 2026 amendments study on the same screens, and
quantify (n=84) the search/filter and "everything in one place" priorities that
shape the live caselist.
