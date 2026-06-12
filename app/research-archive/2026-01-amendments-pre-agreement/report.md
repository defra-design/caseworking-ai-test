# Amendments to grant applications pre agreement

- **Author:** Janice Hannaway, User Researcher
- **Date:** January 2026
- **System:** SFI Reform — *Manage rural grant applications* (caseworker prototype)
- **Stage:** Private Beta
- **Method:** Qualitative in-depth interviews + moderated prototype usability testing
- **Sample:** 3 RPA caseworkers (all AO grade)
- **Source:** `Amendments to grant appliations pre agreement.pptx`
- **Confidence:** Indicative, not definitive — small qualitative sample. Treat as hypotheses and design directions, not a representative view.

## Headline

Caseworkers could generally navigate the prototype, **but the "withdraw +
duplicate application" model for making amendments causes real anxiety and
confusion and needs redesigning.** The prototype mirrors existing real-world
pain points: no single formal source of amendment guidance, fragmented systems,
and no notification when mapping work completes.

## Background

The SFI Reform Initiative is in Private Beta. A feature to amend applications
*before* they reach the agreement stage is assumed necessary, and a decision
has been taken that **both grant applicants and RPA caseworkers** can make
amendments. The study interviewed three RPA caseworkers familiar with the
post-submission case-working process.

## Goal & objectives

- **Goal:** understand the current process for amending grant applications
  before agreement and identify pain points; evaluate how effectively
  caseworkers can navigate a prototype for processing a pre-agreement amendment.
- **Objectives:** assess prototype usability/navigation; evaluate content
  clarity; map the as-is journey and its pain points; identify the scenarios
  that trigger an amendment.

## Participants

| | Role | Grade | Digital inclusion | Access needs |
|---|---|---|---|---|
| P1 | RPA caseworker | AO | Basic | Dyslexia |
| P2 | RPA caseworker | AO | Basic | None |
| P3 | RPA caseworker | AO | Confident | Physical needs around posture |

## Scope & limitations

Based on in-depth interviews with **three** RPA caseworkers, so the as-is
journey and findings are a small qualitative sample, not a comprehensive view
of all teams or schemes. Treat as indicative; validate with a larger, more
diverse group (other RPA roles and the Customer Service Centre). Usability
testing covered a **limited prototype** used by caseworkers, not the full
service, and **Grants-UI was not available for testing**. Future testing should
cover the end-to-end journey: applicant submission → amendments by applicants
and caseworkers → agreement.

## Amendment scenarios & triggers

- Most pre-agreement amendments are **initiated by the caseworker**, not the
  applicant.
- Common triggers: system flags/checks (e.g. SSSI, ineligibility); mapping /
  land-use issues (parcel size changes, wrong parcel or land-use codes);
  customers realising they cannot comply or needing to adjust cropping/timing
  (e.g. temporary grassland not eligible for a chosen action).
- Typical changes: reducing areas or options, removing actions, correcting
  parcel sizes.
- Applicants are usually only formally notified of amendments at the offer
  stage, via an annex/amendment letter.
- Complex, high-value or multi-parcel cases often involve multiple contacts and
  can take several days to resolve even when customers respond quickly.
- Participants couldn't quantify pre-agreement amendments but indicated it is
  not one of their most common tasks.

## Current as-is journey

The journey is split across multiple teams, channels and systems (CSC, CRM,
mapping, Siti Agri, email, annexes). Terminology is inconsistent — "applicant"
vs "customer", "case processor" vs "caseworker".

- Applicants contact the RPA Customer Service Centre (CSC) with amendment
  details, or the caseworker identifies the need.
- Some amendments (contact details, simple admin) are handled by the CSC. The
  request is logged; if not minor, the CSC records it in a shared CRM for the
  caseworker to action.
- **Land-parcel amendments** require mapping updates and a specific form
  submitted by the applicant. Caseworkers monitor Siti Agri and/or CRM to see
  if changes have been actioned (can take weeks). They are **not notified** when
  mapping completes — only the applicant is — so must keep checking.
- Applicants must request amendments by email before any change is made.
- Caseworkers log the request (CRM, shared trackers, Siti Agri holding cases).
- If the amendment is eligible and **reduces value** (or removes/reduces
  actions/areas), the caseworker updates the application directly, often with a
  quick sense-check from a team leader.
- If the amendment **increases value**, a **10% threshold** is used in practice:
  up to ~10% may be processed by the caseworker; above that, and many complex or
  live-agreement cases, is escalated to team leaders and site support.
- There is **no clear, formal, central guidance** for pre-agreement amendments.
  Rules (10% threshold, cohort rules) are circulated by email from team leaders
  rather than codified.

## Pain points in the current process

- No single formal source of amendment guidance; fragmented info across emails
  and conversations creates uncertainty and anxiety about making the right call.
- Strong desire for clear, concrete rules and examples: what can be amended,
  when to escalate, what caseworkers can decide themselves.
- Re-doing work on complex multi-parcel applications is time-consuming and
  frustrating — earlier checks must be repeated and previous work can't easily
  be reused.
- System "glitches" and slow fixes leave cases blocked or lingering for weeks or
  months.
- Heavy reliance on personal discretion and frequent checks with team leaders /
  experts.
- Repeatedly checking Siti/CRM for weeks without notification when mapping
  completes delays decisions. **Note:** this directly affects data held in
  Grants-UI at amendment time — it may not hold the most up-to-date data.

## Prototype usability, navigation & content findings

Participants were tested on two scenarios: (1) returning a grant application to
the applicant for amendment; (2) the caseworker making the amendment themselves.
(Grants-UI was not available for testing.)

Overall: participants could generally navigate and understand the prototype, but
expressed anxiety and confusion about how amendments, withdrawals and
customer-initiated changes work — particularly around applications being
"withdrawn" and restarted.

**Strengths**
- All participants found and used "Return to customer" and "Amend" with minimal
  prompting, correctly understanding their purpose.
- Task list and decision radios (put on hold / amend / return / reject /
  withdraw) were generally intuitive.
- Confirmation screens read clearly as "points of no return".

**Navigation pain points**
- Mental-model mismatch: participants expected to amend via the Application view
  or land/mapping tasks (as in Siti Agri), not generic decision buttons.

**Content clarity issues**
- "Withdraw" caused anxiety about "ghost" applications blocking parcels.
- Mixed messaging: "Returned to customer" conflicts with "application
  withdrawn", creating confusion about data retention.
- "Grants-UI" unclear; participants wanted simpler terms like "duplicate
  application".
- No visibility of what changed between original and amended applications —
  essential for large multi-parcel cases.
- Unclear whether the application being amended stays visible and editable.
- "Withdraw the current application" triggered anxiety because, in the current
  system, rejection/withdrawal is hard to reverse; participants read "withdraw"
  and "reject" as effectively the same.
- "All of your tasks will need to be started again" is understood but raises
  concern about workload and about multiple new reference numbers for the same
  farmer.

**Workload concerns**
- Restarting all review tasks after amendments increases perceived effort,
  especially for complex applications (80+ checks).

## Screens captured

See the per-screen change-history in [`../screens.md`](../screens.md) and the
structured captures in [`../manifest.json`](../manifest.json). Images:
`/public/images/research/2026-01-amendments-pre-agreement/`.

| Screen | Image(s) | Verdict |
|---|---|---|
| Task list — decision panel | `tasklist-decision--default/-amend-selected/-return-selected.png` | mostly-worked |
| Confirm — amend application | `confirm-amend.png` | problem |
| Confirm — return to customer | `confirm-return.png` | problem |
| Confirmation — amending application | `confirmation-amend.png` | problem |
| Confirmation — returned to customer | `confirmation-return.png` | problem |

## Design opportunities (from the report)

- **Guidance & rules:** embed a specific link to guidance (10% threshold,
  escalation triggers) so caseworkers don't search emails or ask seniors;
  provide clear do's and don'ts for amend-vs-escalate.
- **Content & terminology:** replace "withdraw" with clearer language; clarify
  data retention (pre-populated vs from scratch, what happens to the withdrawn
  record and the caseworker's work); simplify "Grants-UI" to plain language.
- **Navigation & workflow:** show what changed — highlight differences between
  original and amended applications.
- **System integration:** ensure the rules engine is updated promptly with
  amended information so users can complete the amended application in Grants-UI
  without error handling.
- **Workload reduction:** change-history views to reduce re-work on complex /
  multi-parcel applications; clear task-restart logic.

## Next steps (from the report)

1. Iterate the prototype design based on participant feedback.
2. Usability-test the **full end-to-end** grant application journey with both
   applicants and caseworkers.
3. Consider further user research and data gathering on the as-is journey.
