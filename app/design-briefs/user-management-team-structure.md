# Brief — Team structure in user management

**For:** Claude Design · **From:** Claude Code · **Date:** 19 Jun 2026
**Status:** Discovery / recommendations — design input needed before build.

## TL;DR

The new **team caselist** (Grasslands) assumes a team structure — teams, team
membership, case assignment, and a "current user" — that **user management does
not model**. Today UM only knows about Users and Roles (scheme permissions).
Teams and assignees currently live as hardcoded UI options and a standalone data
file, disconnected from UM. We need design for a **Team** concept in user
management and the screens/flows to manage membership and case allocation.

## Why this matters now

The Grasslands caselist (live in the prototype) already ships:
- **My cases / context (Team A·B·C or All) / Completed** tabs,
- a **"Switch team"** context selector, and
- **assign / reassign** and **unallocated** cases.

All of that is driven by `data/grasslands-teams.js` (3 teams × 3 caseworkers) and
a per-case `team` + `assignee`. It works as a prototype, but the team structure
has **no home in user management**, so it can't be administered, and the
caselist's "caseworkers" aren't real users.

## What exists today (`/FRPS-D2/UM`)

- **Users** — flat list (Name, Email, Last login); Create user = name + email only.
- **Roles** — scheme permission codes (`PMF_READ`, `BN_TAG_CHECKER`, `DCA_FRV`…);
  assigned per user on the user detail page.
- Model: **User ↔ Role (RBAC)**. No team, no membership, no grade, no case
  assignment, no logged-in identity.

(The older FG-casework *assignment* screen offers "assign to a team / to a
person", but those teams and people are hardcoded — further evidence the team
concept is needed but unmodelled.)

## The gap

| Caselist needs | UM provides today |
|---|---|
| Teams (name, lead, members) | — |
| Users belong to a team + have a grade | Users have roles only |
| Cases assigned to a **user** | Assignee is free text, not a UM user |
| "My cases" = the current user | No logged-in identity (hardcoded "M Walker") |
| Who can switch team / see All / reassign / allocate | No org-role / permission for this |
| Allocate unallocated work to a team then a caseworker | — |

## Recommendations

1. **Add a `Team` entity to user management.** Fields: name, team lead (a user),
   members (users). This is the managed version of `grasslands-teams.js`. Surface
   it as a third thing on the "Users and roles" landing: **Users · Roles · Teams**.

2. **Give users a team and a grade.** Extend Create/Edit user and the user detail
   page with **Team** and an **org-role/grade** (e.g. Caseworker · Team leader ·
   Allocator). This is what turns a UM user into a caselist "caseworker".

3. **Make the assignee a real user, not free text.** `case.assignee` → a user;
   `case.team` is then **derived from that user's team**. Reserve an explicit
   *unallocated* state for work not yet given to a team/caseworker.

4. **Introduce organisational roles, separate from the scheme RBAC roles.** Today's
   roles are scheme permissions; the caselist needs roles that **gate the view**:
   Caseworker (My + own team), Team leader (reassign within team), Allocator/Manager
   (allocate unallocated, "All cases"). Permission the "Switch to All cases" and
   "Reassign" controls accordingly.

5. **Add a real current-user context** (user + team) to drive "My cases" and the
   default team, replacing the hardcoded user.

6. **Design the allocation flow** as two steps: *Unallocated → Team → Caseworker*,
   reachable from the caselist's reassign/allocate actions.

## Screens we'd like design for

- **Teams list** — name, lead, member count, open-case count; Create team.
- **Team detail** — members (add/remove users), set team lead, optional scheme/region scope.
- **Create / edit user** — add Team + grade/org-role fields.
- **User detail** — show team + grade alongside roles.
- **Allocate / reassign** — pick a team and/or caseworker (evolve the FG assignment
  screen); handle bulk reassign from the caselist's multi-select.
- (Consider) a **permissioned view** of the caselist context controls.

## Decisions for design to resolve

- **Are teams line-management units or work-allocation pools?** The caselist treats
  them as allocation pools; UM may also need line management. One model or two?
- **One team per user, or several?** The caselist currently assumes one.
- **Store `team` on the case, or always derive from the assignee?** Unallocated work
  forces this (you need "team without assignee").
- **Permission granularity** — who allocates unallocated work; who can view/cross
  other teams or "All cases".

## References (in this repo)

- User management: [users-and-roles](../views/FRPS-D2/UM/users-and-roles.html),
  [users](../views/FRPS-D2/UM/users.html), [create-user](../views/FRPS-D2/UM/create-user.html),
  [roles](../views/FRPS-D2/UM/roles.html), [user detail](../views/FRPS-D2/UM/martin.html).
- Team caselist (reference implementation): [Grasslands caselist](../views/Grasslands/caselist.html),
  [teams data](../data/grasslands-teams.js), [cases data](../data/grasslands-cases.js),
  and the pattern-library page [Team caselist](../views/pattern-library/custom/team-caselist.html).
- Prior art for assignment: [FG-casework assignment](../views/FG-casework/assignment.html).

## Suggested deliverables from Claude Design

- A recommended **data model** (Team ↔ User ↔ Case; how team is derived; org-roles).
- **Wireframes/mockups** for the screens above (or pattern-library entries).
- Answers to the decisions, and any phasing (what's needed for an MVP vs later).

Claude Code can then build the UM screens + reconcile the caselist assignees with
real users once the model is agreed.
