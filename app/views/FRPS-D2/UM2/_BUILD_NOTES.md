# UM2 — iterated user management (team structure)

A visualisation of Claude Design's *Team structure in user management* brief, as
an iteration of the existing `FRPS-D2/UM/` screens. Static prototype pages
(auto-served, cross-linked). **Entry: `/FRPS-D2/UM2/users-and-roles`.**

Sample data is tied to the Grasslands caselist (Teams A/B/C, the nine
caseworkers, open-case counts ≈ the live active per-team totals, 13 unallocated).

## Screens → brief

| Screen | Visualises |
|---|---|
| `users-and-roles.html` | New IA: landing → **Users · Teams · Scheme roles** (Roles relabelled "Scheme roles"). |
| `users.html` | Users list extended with **Teams · Access role · Specialisms · Status** columns; multi-team (P Shah), Manager/Caseworker tags, a Leaver. |
| `create-user.html` | Create/edit user with **Teams** (multi-select), **Access role** radios (Caseworker default / Manager + scope), **Specialisms** (Finance officer, Quality control); scheme roles kept separate. |
| `martin.html` | User detail with **Teams / Access role / Specialisms** rows above scheme roles; **Reassign cases** action on open work. |
| `teams.html` | New **Teams list** — Team · Lead · Members · Open cases · Unallocated; Create team; an Unallocated-work callout. |
| `team.html` | New **Team detail** — summary (lead, scheme scope, open) + members with **workload** (open / oldest) + add/remove; remove-with-open-cases → reassign; delete-team guardrail. |
| `scheme-roles.html` | Existing RBAC, relabelled, with a note distinguishing it from access role / specialisms. |
| `allocate-reassign.html` | The single **allocate/reassign** pattern — Team → Caseworker (team-filtered, with load, specialism note) → reason → confirm; bulk; audit + Timeline note. |

## Not built here (live elsewhere / out of UM scope)
- Caselist context controls + an **Unallocated tab** for managers, and
  **specialist-task queues** — these belong in the Grasslands caselist
  (`views/Grasslands/caselist*.html`), not user management.

## Notes
- These are flat visual prototypes (no routes, no real data model yet) for review
  against the brief — the agreed model would be built per the brief's MVP phasing.
- Access-role tag colours: Manager = purple, Caseworker = blue; Status: Active =
  green, Leaver = red (GDS tag palette).
