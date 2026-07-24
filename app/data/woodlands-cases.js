// Data reference file: the Woodlands grant caselist.
// Read by the Woodlands routes in routes.js (via wdLoad()) each request, so edits
// here show live.
//
// Claim amounts are priced by the threshold bands in wdClaimAmount() (routes.js),
// not a per-hectare rate:
//    up to and including 50ha  -> flat £1,500
//    over 50ha up to 100ha     -> £1,500 + £30 per hectare above 50
//    over 100ha                -> £3,000 + £15 per hectare above 100
//
// DATA MODEL
//  - each case:
//      id            Application ID (unique)
//      business      applicant business name (farm / woodland / land-management)
//      sbi           unique 9-digit Single Business Identifier
//      appDate       Application date ("D Mon YYYY")
//      stage         Application | Agreement | Payments  (pipeline order)
//      status        one of the standard statuses (drives the tag colour)
//      tag           govuk-tag colour: grey | blue | yellow | green | red | orange
//      appliedAreaHa area applied for, in hectares (the calc ceiling)
//      fcAreaHa      confirmed Forestry Commission available area, or null when no
//                    entitlement has been set yet (the default position). A session
//                    override (woodlandsEntitlements[id]) takes precedence at runtime.
//      entDate       date the entitlement was created ("D Mon YYYY"); present only
//                    on cases that ship with an entitlement. Entitlements created
//                    through the flow get today's date, held in the session
//                    (woodlandsEntitlementDates[id]).
//
// DERIVED (in routes.js, not stored):
//   Value       = wdClaimAmount(appliedAreaHa)    (the most the award could be)
//   Entitlement = wdClaimAmount(fcAreaHa)         (blank until an area is confirmed)

module.exports = {
  cases: [
    { id: 'WMP-6A8-DXE', business: 'Blackthorn Woodland Ltd',      sbi: '205110293', appDate: '5 Jan 2026',  stage: 'Application', status: 'Application received', tag: 'grey',   appliedAreaHa: 24, fcAreaHa: null },
    { id: 'WMP-3K1-QWZ', business: 'Fellside Forestry',            sbi: '210442087', appDate: '12 Jan 2026', stage: 'Application', status: 'In review',            tag: 'blue',   appliedAreaHa: 40, fcAreaHa: null },
    { id: 'WMP-9B4-HMT', business: 'Oakridge Estate',              sbi: '208773451', appDate: '19 Jan 2026', stage: 'Application', status: 'On hold',              tag: 'yellow', appliedAreaHa: 15, fcAreaHa: null },
    { id: 'WMP-2F7-LPR', business: 'Greenacre Land Management',    sbi: '212095668', appDate: '2 Feb 2026',  stage: 'Application', status: 'In review',            tag: 'blue',   appliedAreaHa: 62, fcAreaHa: null },
    { id: 'WMP-8D5-CVN', business: 'Willowbank Farm',              sbi: '206338712', appDate: '9 Feb 2026',  stage: 'Application', status: 'Application received', tag: 'grey',   appliedAreaHa: 8,  fcAreaHa: null },
    { id: 'WMP-4H9-XKB', business: 'Thornwood Forestry Ltd',       sbi: '214870025', appDate: '16 Feb 2026', stage: 'Agreement',   status: 'Agreement drafted',    tag: 'blue',   appliedAreaHa: 33, fcAreaHa: null },
    { id: 'WMP-1G6-JRT', business: 'Hazelcombe Estate',            sbi: '209516640', appDate: '23 Feb 2026', stage: 'Agreement',   status: 'Agreement offered',    tag: 'blue',   appliedAreaHa: 27, fcAreaHa: null },
    { id: 'WMP-7M2-PDW', business: 'Silverbirch Woodlands',        sbi: '213204889', appDate: '2 Mar 2026',  stage: 'Agreement',   status: 'Agreement drafted',    tag: 'blue',   appliedAreaHa: 51, fcAreaHa: null },
    { id: 'WMP-5C8-NQL', business: 'Meadowfoot Farm',              sbi: '207661930', appDate: '9 Mar 2026',  stage: 'Application', status: 'In review',            tag: 'blue',   appliedAreaHa: 19, fcAreaHa: null },
    { id: 'WMP-3J4-VHK', business: 'Ravenscroft Land Management',  sbi: '211948357', appDate: '16 Mar 2026', stage: 'Payments',    status: 'Agreement accepted',   tag: 'green',  appliedAreaHa: 45, fcAreaHa: 42, entDate: '2 Jun 2026' },
    { id: 'WMP-9F1-BTX', business: 'Pinewood Estates Ltd',         sbi: '205827104', appDate: '23 Mar 2026', stage: 'Payments',    status: 'Agreement accepted',   tag: 'green',  appliedAreaHa: 30, fcAreaHa: 30, entDate: '9 Jun 2026' },
    { id: 'WMP-6R7-MCP', business: 'Ashdale Farm',                 sbi: '216073298', appDate: '30 Mar 2026', stage: 'Payments',    status: 'Agreement accepted',   tag: 'green',  appliedAreaHa: 58, fcAreaHa: 50, entDate: '16 Jun 2026' },
    { id: 'WMP-2N5-KDG', business: 'Beechwood Holdings',           sbi: '208140576', appDate: '6 Apr 2026',  stage: 'Application', status: 'Application received', tag: 'grey',   appliedAreaHa: 12, fcAreaHa: null },
    { id: 'WMP-8L3-WQF', business: 'Cedarvale Forestry',           sbi: '212659013', appDate: '13 Apr 2026', stage: 'Agreement',   status: 'Agreement offered',    tag: 'blue',   appliedAreaHa: 22, fcAreaHa: null },
    { id: 'WMP-4B6-HJV', business: 'Mossgill Farm',                sbi: '210386742', appDate: '20 Apr 2026', stage: 'Payments',    status: 'Agreement accepted',   tag: 'green',  appliedAreaHa: 16, fcAreaHa: 16, entDate: '26 Jun 2026' },
    { id: 'WMP-1T9-RXN', business: 'Elmwood Land Co',              sbi: '215902461', appDate: '27 Apr 2026', stage: 'Application', status: 'On hold',              tag: 'yellow', appliedAreaHa: 37, fcAreaHa: null },
    { id: 'WMP-7P2-CLM', business: 'Foxglen Woodland Ltd',         sbi: '207419835', appDate: '4 May 2026',  stage: 'Application', status: 'In review',            tag: 'blue',   appliedAreaHa: 9,  fcAreaHa: null },
    { id: 'WMP-5K4-DGB', business: 'Highfell Estate',              sbi: '213567190', appDate: '11 May 2026', stage: 'Payments',    status: 'Agreement accepted',   tag: 'green',  appliedAreaHa: 70, fcAreaHa: 64, entDate: '6 Jul 2026' }
  ]
}
