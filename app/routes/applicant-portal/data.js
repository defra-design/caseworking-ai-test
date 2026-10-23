// Applicant portal prototype: one entry per phase, for both grants.
// Every landing page has the same five sections, in this order:
//   1 Action needed        action[] (+ next[] for end-of-case next steps)
//   2 Your application / Your agreement   record { title, tag, rows, links, change }
//   3 Payments and claims  pay { rows, links, tag }   (hidden when null)
//   4 Messages             msgs[] { t, s, tag, links }  (hidden when null)
//   5 History              hist [[date, event]], related[] (links)
// Link and button labels match the keys in journeys.js ACTIONS.

const TRK = {
  water: ['Draft', 'Submitted', 'Assessed', 'Offer', 'Delivery', 'Claims', 'Closed'],
  grass: ['Draft', 'Submitted', 'In review', 'Offer', 'Live', 'Ended']
}
const HEAD = {
  water: { cap: 'Application WM-2026-0412', h: 'Your Water management application', meta: 'Manor Farm (SBI 105874236) · Water management grant' },
  grass: { cap: 'Application GR-2026-0287', h: 'Your Grasslands application', meta: 'Manor Farm (SBI 105874236) · Grasslands' }
}

const WATER_CHANGE = ['Request a variation', 'Report exceptional circumstances']
const GRASS_CHANGE = ['Report a change to your land or business', 'Request a change to your agreement']

const PHASES = [
  // ================= WATER =================
  // ---- before submission: started on GOV.UK, resumed here ----
  { g: 'water', id: 'w0', n: 'Draft: resume your application', stage: 0, cap: 'Draft application', tag: ['Draft', 'blue'], ref: 'Started on GOV.UK 2 Mar 2026 · Last saved 9 Mar 2026',
    action: [{ t: 'Finish and submit your application', s: 'Applications close on 14 Mar 2026. Drafts not submitted by then are lost.', b: 'Resume your application' }],
    record: { title: 'Your application', tag: ['Draft', 'blue'], rows: [['Started', 'On GOV.UK, 2 Mar 2026'], ['Last saved', '9 Mar 2026'], ['Sections completed', '8 of 12']], links: ['Delete your draft'] },
    pay: null, msgs: null,
    hist: [['9 Mar 2026', 'You saved your draft'], ['2 Mar 2026', 'You started your application on GOV.UK']] },

  { g: 'water', id: 'w1', n: 'Submitted and in assessment', stage: 0, tag: ['Under assessment', 'blue'], ref: 'Submitted 14 Mar 2026 · Last updated 2 Apr 2026',
    action: null,
    record: { title: 'Your application', tag: ['Submitted', 'blue'], rows: [['Reference', 'WM-2026-0412'], ['Submitted', '14 Mar 2026'], ['Funding decision', 'Expected by 30 Jun 2026'], ['Score and ranking', 'Shared when assessment closes']], links: ['View your application', 'Withdraw your application'] },
    pay: null, msgs: null,
    hist: [['2 Apr 2026', 'We started checking your application'], ['14 Mar 2026', 'You submitted your application']] },

  { g: 'water', id: 'w2', n: 'Information or evidence requested', stage: 1, tag: ['Information needed', 'yellow'], ref: 'Submitted 14 Mar 2026 · Query raised 2 Apr 2026',
    action: [
      { t: 'Reply to our query about your application', s: 'Due 16 Apr 2026. Assessment is paused until you reply.', b: 'Reply to query' },
      { t: 'Upload the evidence we asked for', s: 'Supplier quote for item 2. Due 16 Apr 2026.', b: 'Upload evidence', sec: true }
    ],
    record: { title: 'Your application', tag: ['Under assessment (paused)', 'yellow'], rows: [['Reference', 'WM-2026-0412'], ['Status', 'Under assessment (paused)']], links: ['View your application', 'Withdraw your application'] },
    pay: null,
    msgs: [{ t: 'Query about item 2', s: 'Case officer, Water management team · 2 Apr 2026 · Reply by 16 Apr 2026', tag: ['Reply needed', 'yellow'], links: ['Read the full message'] }],
    hist: [['2 Apr 2026', 'We raised a query'], ['14 Mar 2026', 'You submitted your application']] },

  { g: 'water', id: 'w3', n: 'Returned to you to amend', stage: 1, tag: ['Returned', 'yellow'], ref: 'Returned 8 Apr 2026 · New draft WM-2026-0412-2',
    action: [{ t: 'Amend and resubmit your application', s: 'Resubmit by 30 Apr 2026 to stay in this window.', warn: true, key: 'resubmit' }],
    record: { title: 'Your application', tag: ['Draft', 'blue'], rows: [['Reference', 'WM-2026-0412-2 (new draft)'], ['Based on', 'WM-2026-0412'], ['Resubmit by', '30 Apr 2026']], button: 'Continue amended application', links: ['View original application'] },
    pay: null,
    msgs: [{ t: 'Why we returned your application', s: 'Item 3 cost does not match the quote provided. Water management team · 8 Apr 2026', tag: ['Returned', 'yellow'], links: ['Read the full message'] }],
    hist: [['8 Apr 2026', 'We returned your application'], ['14 Mar 2026', 'You submitted your application']] },

  { g: 'water', id: 'w4', n: 'Not successful or rejected', stage: 1, tag: ['Unsuccessful', 'orange'], ref: 'Decision made 30 Jun 2026',
    action: null,
    record: { title: 'Your application', tag: ['Unsuccessful', 'orange'], rows: [['Reference', 'WM-2026-0412'], ['Outcome', 'Not funded in this round'], ['Your score', '62 out of 100'], ['Cut-off score', '71']], links: ['View your application'] },
    pay: null,
    msgs: [{ t: 'Our decision', s: 'Funding was allocated to higher-ranked applications. To ask for a review, follow the steps in your decision letter within 60 days. 30 Jun 2026', tag: ['Decision', 'orange'], links: ['View decision letter', 'Ask us a question about this decision'] }],
    hist: [['30 Jun 2026', 'We made our decision'], ['2 Apr 2026', 'We started checking your application'], ['14 Mar 2026', 'You submitted your application']] },

  { g: 'water', id: 'w5', n: 'Offer issued: review and sign', stage: 2, tag: ['Offer issued', 'yellow'], ref: 'Offer issued 30 Jun 2026 · Expires 30 Jul 2026',
    action: [{ t: 'Review and sign your grant funding agreement', s: '24 days left to accept. If you do not respond by 30 Jul 2026 the offer lapses.', b: 'Review and sign your agreement' }],
    record: { title: 'Your agreement', tag: ['Offer issued', 'yellow'], rows: [['Reference', 'GFA-WM-0412'], ['Grant offered', '£62,400 (60% of £104,000)'], ['Grant you applied for', '£68,000'], ['Why it changed', 'Reference costs applied to item 2'], ['Project start deadline', '3 months after your agreement start date']], links: ['View your offer', 'Download your offer', 'Reject this offer', 'View your application'] },
    pay: null, msgs: null,
    hist: [['30 Jun 2026', 'We offered you a grant funding agreement'], ['30 Jun 2026', 'Your application was funded'], ['14 Mar 2026', 'You submitted your application']] },

  { g: 'water', id: 'w6', n: 'Agreement live: getting started', stage: 3, tag: ['Live', 'green'], ref: 'Agreement starts 1 Aug 2026 · Year 1',
    action: [{ t: 'Start your project by 1 Nov 2026', s: 'Do not spend before 1 Aug 2026. Spend before the start date is not eligible.', b: 'Tell us your project has started', sec: true }],
    record: { title: 'Your agreement', tag: ['Live', 'green'], rows: [['Reference', 'GFA-WM-0412'], ['Grant value', '£62,400'], ['Start to end', '1 Aug 2026 to 31 Jul 2028'], ['Records', 'Keep for 7 years after your final payment']], links: ['View your agreement', 'Download your agreement'], change: WATER_CHANGE },
    pay: { rows: [['Claimed to date', '£0 of £53,040 (85% before the final claim)'], ['Claim 1', 'Due 31 Jan 2027, about £15,000'], ['Claim 2', 'Due 30 Jun 2027, about £22,000'], ['Final claim', 'Due 31 Jul 2028']], links: ['See what evidence each claim needs'] },
    msgs: null,
    hist: [['1 Aug 2026', 'Your agreement started'], ['20 Jul 2026', 'You signed your agreement']] },

  { g: 'water', id: 'w6b', n: 'Agreement live: project started', stage: 3, tag: ['Live', 'green'], ref: 'Agreement started 1 Aug 2026 · Project started 14 Sep 2026',
    action: [{ t: 'Upload evidence for your project', s: 'Photos, invoices and other records that show your project is under way. You will need them for your first claim.', b: 'Upload evidence' }],
    record: { title: 'Your agreement', tag: ['Live', 'green'], rows: [['Reference', 'GFA-WM-0412'], ['Grant value', '£62,400'], ['Start to end', '1 Aug 2026 to 31 Jul 2028'], ['Project started', '14 Sep 2026'], ['Records', 'Keep for 7 years after your final payment']], links: ['View your agreement', 'Download your agreement'], change: WATER_CHANGE },
    pay: { rows: [['Claimed to date', '£0 of £53,040 (85% before the final claim)'], ['Claim 1', 'Due 31 Jan 2027, about £15,000'], ['Claim 2', 'Due 30 Jun 2027, about £22,000'], ['Final claim', 'Due 31 Jul 2028']], links: ['See what evidence each claim needs'] },
    msgs: null,
    hist: [['14 Sep 2026', 'You told us your project had started'], ['1 Aug 2026', 'Your agreement started'], ['20 Jul 2026', 'You signed your agreement']] },

  { g: 'water', id: 'w7', n: 'Agreement live: claim or report due', stage: 4, tag: ['Action needed', 'yellow'], ref: 'Year 1 of 2',
    action: [
      { t: 'Submit claim 1', s: 'Due 31 Jan 2027. Minimum claim £2,000. Invoices and redacted bank statements needed.', b: 'Submit claim 1' },
      { t: 'Submit your progress report', s: 'Due 31 Jan 2027.', b: 'Start progress report', sec: true }
    ],
    record: { title: 'Your agreement', tag: ['Live', 'green'], rows: [['Reference', 'GFA-WM-0412'], ['Grant value', '£62,400'], ['Open requests', 'None']], links: ['View your agreement', 'Download your agreement'], change: WATER_CHANGE },
    evidence: [['Photographs of the project site', 'Uploaded 14 Sep 2026'], ['Supplier invoice', 'Uploaded 21 Sep 2026']],
    pay: { rows: [['Claimed to date', '£0 of £53,040 cap'], ['Next payment', 'After claim 1 is approved (we aim for 60 working days)'], ['Payments held', 'None']], links: ['View claim schedule', 'View payments'] },
    msgs: null,
    hist: [['14 Sep 2026', 'You told us your project had started'], ['1 Aug 2026', 'Your agreement started'], ['20 Jul 2026', 'You signed your agreement']] },

  { g: 'water', id: 'w8', n: 'Completed: records and retention', stage: 5, tag: ['Completed', 'green'], ref: 'Final payment 14 Oct 2028',
    action: [{ t: 'Complete your post-payment monitoring report', s: 'Requested 1 Nov 2028. Due 1 Dec 2028.', b: 'Start monitoring report' }],
    record: { title: 'Your agreement', tag: ['Completed', 'green'], rows: [['Reference', 'GFA-WM-0412'], ['Asset register', 'Keep and notify changes until 14 Oct 2033'], ['Project records', 'Keep until 14 Oct 2035'], ['Publicity', 'Plaque or poster displayed']], links: ['View your agreement', 'View asset register', 'Download all records'] },
    evidence: [['Photographs of the project site', 'Uploaded 14 Sep 2026'], ['Supplier invoice', 'Uploaded 21 Sep 2026']],
    pay: { rows: [['Total paid', '£62,400'], ['Final payment', '14 Oct 2028']], links: ['View final statement'] },
    msgs: null,
    hist: [['1 Nov 2028', 'We asked for a monitoring report'], ['14 Oct 2028', 'Your final payment was made']] },

  { g: 'water', id: 'w9', n: 'Withdrawn or offer rejected', stage: -1, tag: ['Closed', 'orange'], ref: 'Closed 21 Oct 2026',
    action: null,
    record: { title: 'Your application', tag: ['Closed', 'orange'], rows: [['Reference', 'WM-2026-0412'], ['Outcome', '__REASON__']], links: ['View your application'] },
    pay: null, msgs: null,
    hist: [['21 Oct 2026', 'This application was closed'], ['14 Mar 2026', 'You submitted your application']] },

  // ================= GRASSLANDS =================
  { g: 'grass', id: 'g0', n: 'Draft: resume your application', stage: 0, cap: 'Draft application', tag: ['Draft', 'blue'], ref: 'Started on GOV.UK 10 Jan 2026 · Last saved 2 Feb 2026',
    action: [{ t: 'Finish and submit your application', s: 'Applications close on 14 Feb 2026. Drafts not submitted by then are lost.', b: 'Resume your application' }],
    record: { title: 'Your application', tag: ['Draft', 'blue'], rows: [['Started', 'On GOV.UK, 10 Jan 2026'], ['Last saved', '2 Feb 2026'], ['Land parcels added', '4'], ['Actions chosen', '6']], links: ['Delete your draft'] },
    pay: null, msgs: null,
    hist: [['2 Feb 2026', 'You saved your draft'], ['10 Jan 2026', 'You started your application on GOV.UK']] },

  { g: 'grass', id: 'g1', n: 'Submitted and under review', stage: 0, tag: ['Submitted', 'blue'], ref: 'Submitted 14 Feb 2026 · Checks started 20 Feb 2026',
    action: null,
    record: { title: 'Your application', tag: ['In review', 'blue'], rows: [['Reference', 'GR-2026-0287'], ['Submitted', '14 Feb 2026'], ['Annual payment applied for', '£406.60'], ['Funding decision', 'Expected by 31 Mar 2026']], links: ['View your application', 'Download your application', 'Amend your application', 'Withdraw your application'] },
    pay: null, msgs: null,
    hist: [['20 Feb 2026', 'We started checking your application'], ['14 Feb 2026', 'You submitted your application']] },

  { g: 'grass', id: 'g2', n: 'We need something from you', stage: 1, tag: ['Information needed', 'yellow'], ref: 'Query raised 24 Feb 2026',
    action: [
      { t: 'Confirm you sent your notice of planned activity to Natural England', s: 'Parcels SD7146 5820 and SD7146 6431 are in a site of special scientific interest. Reply by 10 Mar 2026.', b: 'Reply to query' },
      { t: 'Fix 2 land parcels that failed our checks', s: 'SD7146 5820 is not linked to your business. SD7146 6431 overlaps another agreement. Update your land details, then tell us.', b: 'Update land details', sec: true }
    ],
    record: { title: 'Your application', tag: ['In review (paused)', 'yellow'], rows: [['Reference', 'GR-2026-0287'], ['Funding decision', 'Expected by 31 Mar 2026 (paused until you reply)'], ['Land checks', '2 parcels need attention, 38 passed']], links: ['View your application', 'Download your application', 'See all parcel results', 'Withdraw your application'] },
    pay: null,
    msgs: [{ t: 'Query about your notice of planned activity', s: 'Case officer, Grasslands team · 24 Feb 2026 · Reply by 10 Mar 2026', tag: ['Reply needed', 'yellow'], links: ['Read the full message'] }],
    hist: [['24 Feb 2026', 'We raised a query'], ['20 Feb 2026', 'We started checking your application'], ['14 Feb 2026', 'You submitted your application']] },

  { g: 'grass', id: 'g3', n: 'Returned or closed by amendment', stage: 1, tag: ['Returned', 'yellow'], ref: 'Returned 3 Mar 2026 · New draft GR-2026-0301',
    action: [{ t: 'Amend and resubmit your application', s: 'Checks start again from the beginning once you resubmit.', warn: true, key: 'resubmit' }],
    record: { title: 'Your application', tag: ['Draft', 'blue'], rows: [['Reference', 'GR-2026-0301 (new draft)'], ['Based on', 'GR-2026-0287']], button: 'Continue amended application', links: ['View original application'] },
    pay: null,
    msgs: [{ t: 'Why we returned your application', s: 'The ditch on parcel SD7146 5820 is in a SSSI. Choose a different action or remove it. Grasslands team · 3 Mar 2026', tag: ['Returned', 'yellow'], links: ['Read the full message'] }],
    hist: [['3 Mar 2026', 'We returned your application'], ['14 Feb 2026', 'You submitted your application']] },

  { g: 'grass', id: 'g4', n: 'Agreement offered', stage: 2, tag: ['Offer issued', 'yellow'], ref: 'Offer issued 14 Apr 2026 · Expires 14 May 2026',
    action: [{ t: 'Accept your proposed agreement', s: '30 days to accept. No agreement is formed until you accept.', b: 'Accept your proposed agreement' }],
    record: { title: 'Your agreement', tag: ['Offer issued', 'yellow'], rows: [['Reference', 'AD2456781 (version 3)'], ['Annual payment', '£406.60'], ['Length', '3 years'], ['Actions', '6 actions on 4 parcels'], ['Payments', 'Quarterly, no claims needed']], links: ['View your proposed agreement', 'Reject this offer', 'View your application', 'Download your application'] },
    pay: null, msgs: null,
    hist: [['14 Apr 2026', 'We offered you an agreement (version 3)'], ['14 Feb 2026', 'You submitted your application']], related: ['Earlier versions (2)'] },

  { g: 'grass', id: 'g5', n: 'Agreement accepted, not yet started', stage: 3, tag: ['Agreement accepted', 'green'], ref: 'Accepted 28 Apr 2026 · Starts 1 Jan 2027',
    action: null,
    record: { title: 'Your agreement', tag: ['Accepted', 'green'], rows: [['Reference', 'AD2456781'], ['Starts', '1 Jan 2027'], ['Annual payment', '£406.60'], ['Actions', '6 actions on 4 parcels'], ['Records to keep', 'Photos, input and stocking records per action']], links: ['View your agreement', 'Download your agreement and terms', 'Download option specifications', 'See actions and records you need to keep'] },
    pay: { rows: [['Next payment', '£101.65 on 1 Apr 2027'], ['Schedule', 'Quarterly from April 2027, no claims needed']] },
    msgs: null,
    hist: [['28 Apr 2026', 'You accepted your agreement'], ['14 Apr 2026', 'We offered you an agreement']] },

  { g: 'grass', id: 'g6', n: 'Agreement live: declaration due', stage: 3, tag: ['Action needed', 'yellow'], ref: 'Year 1 of 3',
    action: [
      { t: 'Make your annual declaration', s: 'Due by 31 Oct 2027. Your final payment for year 1 is held until you submit it.', b: 'Make your annual declaration' },
      { t: 'Upload evidence for your actions', s: 'Photos and records for the actions in your agreement. You need to keep them for 7 years.', b: 'Upload evidence', sec: true }
    ],
    record: { title: 'Your agreement', tag: ['Live', 'green'], rows: [['Reference', 'AD2456781'], ['Actions', '6 actions on 4 parcels']], links: ['View your agreement', 'Download your agreement and terms', 'Download option specifications'], change: GRASS_CHANGE },
    evidence: [['Hedgerow photographs', 'Uploaded 12 Jun 2027']],
    pay: { tag: ['1 held', 'yellow'], rows: [['Next payment', '£101.65 on 1 Oct 2027'], ['Quarter 1', '£101.65, paid 1 Apr'], ['Quarter 2', '£101.65, paid 1 Jul'], ['Quarter 3', '£101.65, due 1 Oct'], ['Quarter 4', '£101.65, held until you make your declaration']], links: ['View payments and statements'] },
    msgs: null,
    hist: [['1 Jul 2027', 'Quarter 2 payment made'], ['1 Apr 2027', 'Quarter 1 payment made'], ['1 Jan 2027', 'Your agreement started']] },

  { g: 'grass', id: 'g7', n: 'Agreement live: land check in progress', stage: 3, tag: ['Checks in progress', 'blue'], ref: '6-month check started 2 Jul 2027',
    action: [{ t: 'Tell us about parcel SD7146 5820', s: 'It no longer appears to be linked to your business. Update your land details or reply to our query. Reply by 16 Jul 2027.', b: 'Reply to query' }],
    record: { title: 'Your agreement', tag: ['Live', 'green'], rows: [['Reference', 'AD2456781'], ['Land checks', '1 parcel needs attention']], links: ['View your agreement', 'Download your agreement and terms', 'See parcel results'], change: GRASS_CHANGE },
    evidence: [['Hedgerow photographs', 'Uploaded 12 Jun 2027']],
    pay: { rows: [['Next payment', 'May be held if this is not resolved']] },
    msgs: [{ t: 'Query about parcel SD7146 5820', s: 'Case officer, Grasslands team · 2 Jul 2027 · Reply by 16 Jul 2027', tag: ['Reply needed', 'yellow'], links: ['Read the full message'] }],
    hist: [['2 Jul 2027', 'We started your 6-month land check'], ['1 Jul 2027', 'Quarter 2 payment made']] },

  { g: 'grass', id: 'g8', n: 'Agreement terminated', stage: 3, tag: ['Terminated', 'orange'], ref: 'Terminated 10 Aug 2027',
    action: [{ t: 'Check the repayment we have asked for', s: 'We found payments to recover. Repayment due by 10 Oct 2027.', b: 'View repayment' }],
    record: { title: 'Your agreement', tag: ['Terminated', 'orange'], rows: [['Reference', 'AD2456781'], ['Effective', '10 Aug 2027'], ['Future payments', 'Stopped']], links: ['View your agreement'] },
    evidence: [['Hedgerow photographs', 'Uploaded 12 Jun 2027']],
    pay: { rows: [['Amount to repay', '£203.30'], ['Repay by', '10 Oct 2027']], links: ['View final statement'] },
    msgs: [{ t: 'Our decision', s: 'Management control of the land is no longer with your business. To ask for a review, follow the steps in your decision letter within 60 days. 10 Aug 2027', tag: ['Decision', 'orange'], links: ['View decision letter', 'Ask us a question about this decision'] }],
    hist: [['10 Aug 2027', 'We ended your agreement'], ['2 Jul 2027', 'We started your 6-month land check']] },

  { g: 'grass', id: 'g9', n: 'Ending soon, then ended', stage: 4, tag: ['Ending soon', 'yellow'], ref: 'Agreement ends 31 Dec 2029',
    action: [
      { t: 'Apply for a successor agreement', s: 'You can start early. Your agreement ends in 5 months.', b: 'Start your application' },
      { t: 'Check your final declaration is in', s: 'Final declaration due by 31 Oct 2029.', b: 'View declaration', sec: true }
    ],
    record: { title: 'Your agreement', tag: ['Ending soon', 'yellow'], rows: [['Reference', 'AD2456781'], ['Ends', '31 Dec 2029 (year 3 of 3)'], ['Records', 'Keep until 31 Dec 2036']], links: ['View your agreement', 'Download your records'] },
    evidence: [['Hedgerow photographs', 'Uploaded 12 Jun 2027'], ['Pond survey', 'Uploaded 3 Sep 2028']],
    pay: { links: ['View payments and statements'], rows: [] },
    msgs: null,
    hist: [['31 Oct 2028', 'Your year 2 declaration was submitted'], ['1 Jan 2027', 'Your agreement started']] },

  { g: 'grass', id: 'g10', n: 'Withdrawn or offer rejected', stage: -1, tag: ['Closed', 'orange'], ref: 'Closed 21 Oct 2026',
    action: null,
    record: { title: 'Your application', tag: ['Closed', 'orange'], rows: [['Reference', 'GR-2026-0287'], ['Outcome', '__REASON__']], links: ['View your application'] },
    pay: null, msgs: null,
    hist: [['21 Oct 2026', 'This application was closed'], ['14 Feb 2026', 'You submitted your application']] }
]

// the Draft step is the new first stage, so every later phase moves along one place
PHASES.forEach(function (p) { if (p.id !== 'w0' && p.id !== 'g0' && p.stage >= 0) p.stage += 1 })

module.exports = { TRK, HEAD, PHASES }
