// Data reference file: the WMP (Woodland Management Plan, PA3) caselist case set.
// Read by the WMP caselist routes in routes.js (via loadWmpCases(), reloaded per
// request so edits show live) to search / filter / sort / paginate, then passed
// to the template through a `view` object. Modelled on data/grasslands-cases.js.
//
// DATA RULES (enforce when editing):
//  1. type is always "Woodland Management Plan (PA3)" for this grant.
//  2. status + tag come from the WMP set ONLY (from the Figma FC-review journey):
//       Application received -> grey     | Awaiting FC review -> yellow
//       FC approved          -> green    | Rejected by FC     -> red
//       Agreement accepted   -> green    | Awaiting claim     -> purple
//  3. id is a WMP-XXX-XXX code (hex-ish, unique). sbi is a unique 9-digit string
//     per distinct business.
//  4. submitted date is GOV.UK style "D Month YYYY" (e.g. "16 March 2026") and is
//     appropriate to the status (advanced statuses are older).
//  5. EVERY case has a team (A/B/C) from data/grasslands-teams.js. If assignee is
//     a caseworker it MUST be one of that team's caseworkers; a case may sit with
//     a team but be "Not assigned".
//  6. Mellor & Sons (WMP-6A8-DXE) is the LIVE journey case: status "live"; its
//     tag/text come from the session (defaults to "Awaiting FC review") so
//     clicking through the case-detail flow updates its caselist status.
module.exports = {
  cases: [
    // --- The four cases shown in the Figma case list ---
    { id: 'WMP-461-A13', type: 'Woodland Management Plan (PA3)', business: 'Plumpton Farms Ltd', sbi: '274918305', submitted: '21 February 2026', status: 'FC approved', tag: 'green', team: 'A', assignee: 'Not assigned' },
    { id: 'WMP-522-D5E', type: 'Woodland Management Plan (PA3)', business: 'Birch Hollow Farm', sbi: '347051386', submitted: '16 March 2026', status: 'Agreement accepted', tag: 'green', team: 'B', assignee: 'Not assigned' },
    { id: 'WMP-49F-49F', type: 'Woodland Management Plan (PA3)', business: 'Foxleigh Farm', sbi: '195827640', submitted: '10 March 2026', status: 'Application received', tag: 'grey', team: 'C', assignee: 'Not assigned' },
    // Live journey case — status driven by the session (see DATA RULES #6).
    { id: 'WMP-6A8-DXE', type: 'Woodland Management Plan (PA3)', business: 'Mellor & Sons', sbi: '113593357', submitted: '10 March 2026', status: 'live', tag: '', team: 'A', assignee: 'Not assigned' },

    // --- Additional woodland cases so search / sort / pagination feel real ---
    { id: 'WMP-73C-2B9', type: 'Woodland Management Plan (PA3)', business: 'Ashcombe Estate', sbi: '408216739', submitted: '4 February 2026', status: 'Awaiting FC review', tag: 'yellow', team: 'B', assignee: 'E Carter' },
    { id: 'WMP-8D1-5F0', type: 'Woodland Management Plan (PA3)', business: 'Hazelmere Woodlands Ltd', sbi: '561203984', submitted: '27 January 2026', status: 'FC approved', tag: 'green', team: 'A', assignee: 'M Walker' },
    { id: 'WMP-2E7-C44', type: 'Woodland Management Plan (PA3)', business: 'Thornbury Forestry', sbi: '739105628', submitted: '9 December 2025', status: 'Awaiting claim', tag: 'purple', team: 'C', assignee: 'K Reed' },
    { id: 'WMP-9B3-A18', type: 'Woodland Management Plan (PA3)', business: 'Oakmoor Farms Ltd', sbi: '284617093', submitted: '18 December 2025', status: 'Agreement accepted', tag: 'green', team: 'B', assignee: 'Not assigned' },
    { id: 'WMP-1F6-77D', type: 'Woodland Management Plan (PA3)', business: 'Greywood Holdings', sbi: '650391827', submitted: '2 March 2026', status: 'Rejected by FC', tag: 'red', team: 'C', assignee: 'Not assigned' },
    { id: 'WMP-5A0-3E2', type: 'Woodland Management Plan (PA3)', business: 'Fernleigh Estate', sbi: '917402568', submitted: '13 February 2026', status: 'Awaiting FC review', tag: 'yellow', team: 'A', assignee: 'R Singh' },
    { id: 'WMP-6C9-B41', type: 'Woodland Management Plan (PA3)', business: 'Beckwith Woods Ltd', sbi: '302598147', submitted: '20 March 2026', status: 'Application received', tag: 'grey', team: 'B', assignee: 'P Shah' }
  ]
}
