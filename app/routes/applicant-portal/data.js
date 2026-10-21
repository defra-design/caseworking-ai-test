var TRK = {
    water: ['Submitted', 'Assessed', 'Offer', 'Delivery', 'Claims', 'Closed'],
    grass: ['Submitted', 'In review', 'Offer', 'Live', 'Ended']
  };
  var HEAD = {
    water: { cap: 'Application WM-2026-0412', h: 'Your Water management application', meta: 'Manor Farm (SBI 105874236) · Water management grant' },
    grass: { cap: 'Application GR-2026-0287', h: 'Your Grasslands application', meta: 'Manor Farm (SBI 105874236) · Grasslands' }
  };
  
  var PHASES = [
    // ================= WATER =================
    { g:'water', id:'w1', n:'Submitted and in assessment', stage:0, tag:['Under assessment','blue'], ref:'Submitted 14 Mar 2026 · Last updated 2 Apr 2026',
      todo: null,
      cards:[
        { t:'Your application', tag:['Submitted','green'], rows:[['Reference','WM-2026-0412'],['Submitted','14 Mar 2026'],['Funding decision','Expected by 30 Jun 2026'],['Score and ranking','Shared when assessment closes']], links:['View your application','Withdraw your application'] },
        { t:'Messages', rows:[['Messages','None. We will email the SBI contact if we need anything.']] }
      ],
      hidden:['Amend your application','Agreement, claims, evidence, variations','Score (not released until decision)'],
      why:'Nothing is waiting on the applicant, so the page says so plainly rather than listing disabled rows. Withdraw stays because it is permitted any time before acceptance.',
      src:'Application status; submitted date; decision window; withdraw permitted flag (needs Submit).',
      vars:['Duplicate found by caseworker (the Water duplicate-check task): moves to w2 with a "which application do you want us to keep" query.'] },

    { g:'water', id:'w2', n:'Information or evidence requested', stage:1, tag:['Information needed','yellow'], ref:'Submitted 14 Mar 2026 · Query raised 2 Apr 2026',
      todo:[
        { t:'Reply to our query about your application', s:'Due 16 Apr 2026. Assessment is paused until you reply.', b:'Reply to query', due:true },
        { t:'Upload the evidence we asked for', s:'Supplier quote for item 2. Due 16 Apr 2026.', b:'Upload evidence', sec:true }
      ],
      cards:[
        { t:'Your query', tag:['1 open','yellow'], rows:[['From','Case officer, Water management team'],['About','Your application, item 2'],['Raised','2 Apr 2026'],['Reply by','16 Apr 2026']], links:['Read the full message'] },
        { t:'Your application', tag:['Submitted','green'], rows:[['Reference','WM-2026-0412'],['Status','Under assessment (paused)']], links:['View your application','Withdraw your application'] }
      ],
      hidden:['Agreement, claims, variations','Funding decision date (paused)'],
      why:'Two tasks sit in the "What you need to do" card, most urgent first, because both are time-bound. Each opens the matching in-portal mini journey (query response, evidence upload) and returns here.',
      src:'Next actions (label, due date, primary flag); open query; evidence request linked to the application.',
      vars:['Duplicate application: query text reads "We found another application from your business (WM-2026-0399). Tell us which to keep." with actions Keep this one / Withdraw this one.','Paused for internal checks: status "On hold", no actions, no reason shown beyond "We are carrying out extra checks".'] },

    { g:'water', id:'w3', n:'Returned to you to amend', stage:1, tag:['Returned','orange'], ref:'Returned 8 Apr 2026 · New draft WM-2026-0412-2',
      todo:[ { t:'Amend and resubmit your application', s:'We created a copy for you to change. Start from the draft. Resubmit by 30 Apr 2026 to stay in this window.', b:'Continue your application', due:true } ],
      cards:[
        { t:'Why we returned it', rows:[['Reason','Item 3 cost does not match the quote provided'],['Returned by','Water management team, 8 Apr 2026']], links:['Read the full message'] },
        { t:'Original application WM-2026-0412', tag:['Closed','grey'], rows:[['Status','View only'],['Replaced by','WM-2026-0412-2 (draft)']], links:['View original application'] }
      ],
      hidden:['Withdraw original (already closed)','Agreement, claims','Score and ranking'],
      why:'Grasslands return creates a new identical application and closes the original as view only (see the prototype\'s "return to customer" confirmation). The applicant needs the link to the new draft, the reason, and a clear sense the old one is finished.',
      src:'Return reason; linked case reference (the prototype timeline shows two linked cases); link-out to the application flow.',
      vars:['Applicant-initiated amendment (Grasslands "amend" flow): original shows "Closed by your amendment, replaced by WM-2026-0412-2" and a copy is opened in the application flow.'] },

    { g:'water', id:'w4', n:'Not successful or rejected', stage:1, tag:['Unsuccessful','red'], ref:'Decision made 30 Jun 2026',
      todo:null,
      cards:[
        { t:'Our decision', tag:['Unsuccessful','red'], rows:[['Outcome','Not funded in this round'],['Reason','Funding allocated to higher-ranked applications'],['Your score','62 out of 100'],['Cut-off score','71']], links:['View decision letter','Ask us a question about this decision'] },
        { t:'What you can do next', rows:[['Review or appeal','Follow the steps in your decision letter (within 60 days)'],['Other funding','Check grants you may be eligible for']], links:['Find other grants'] }
      ],
      hidden:['Everything agreement-related','Withdraw (decision made)'],
      why:'A closing page: the decision and the reason come first, then what is still open (query, review outside the portal, other grants). Score and cut-off show only if the scheme releases them.',
      src:'Decision, reason and score from the ranking outcome; review-and-appeal handled outside the portal (the document\'s assumption).',
      vars:['"Cannot accept" at a task, or "remove" at the scoring outcome: same page, different reason text.','Withdrawn by applicant: "Withdrawn on 20 Apr 2026", view only.'] },

    { g:'water', id:'w5', n:'Offer issued: review and sign', stage:2, tag:['Offer issued','yellow'], ref:'Offer issued 30 Jun 2026 · Expires 30 Jul 2026',
      todo:[ { t:'Review and sign your grant funding agreement', s:'24 days left to accept. If you do not respond by 30 Jul 2026 the offer lapses.', b:'Review and sign your agreement', due:true } ],
      cards:[
        { t:'Your offer', tag:['Offer issued','yellow'], rows:[['Reference','GFA-WM-0412'],['Grant offered','£62,400 (60% of £104,000)'],['Grant you applied for','£68,000'],['Why it changed','Reference costs applied to item 2'],['Project start deadline','3 months after your agreement start date']], links:['View your offer','Download your offer','Reject this offer'] },
        { t:'Your application', tag:['Accepted into funding','green'], rows:[['Reference','WM-2026-0412']], links:['View your application'] }
      ],
      hidden:['Withdraw application (now "Reject offer")','Claims, variations, evidence'],
      why:'One primary action with a countdown. The "applied for vs offered" row matters: the prototype\'s payment-amount check can change the value and the applicant should not discover it inside the agreement.',
      src:'Offer expiry; signature method; agreement terms version; value applied vs offered.',
      vars:['Agreement drafted but not yet issued: card reads "We are preparing your agreement", no action.','Corrected offer (a "problem" found at the agreement check): older version listed under "Earlier versions: Withdrawn".'] },

    { g:'water', id:'w6', n:'Agreement live: getting started', stage:3, tag:['Live','green'], ref:'Agreement starts 1 Aug 2026 · Year 1',
      todo:[ { t:'Start your project by 1 Nov 2026', s:'Do not spend before 1 Aug 2026. Spend before the start date is not eligible.', b:'Tell us your project has started', sec:true } ],
      cards:[
        { t:'Your agreement', tag:['Live','green'], rows:[['Reference','GFA-WM-0412'],['Grant value','£62,400'],['Start to end','1 Aug 2026 to 31 Jul 2028'],['Claimed to date','£0 of £53,040 (85% before final claim)']], links:['View your agreement','Download'] },
        { t:'Your claim schedule', rows:[['Claim 1','Due 31 Jan 2027, about £15,000'],['Claim 2','Due 30 Jun 2027, about £22,000'],['Final claim','Due 31 Jul 2028']], links:['See what evidence each claim needs'] },
        { t:'Changing your project', links:['Request a variation','Report exceptional circumstances'] }
      ],
      hidden:['Submit a claim (opens when a claim is due)','Progress report (not yet due)','Accept or reject offer','Withdraw application'],
      why:'Delivery starts quietly. The 3-month start deadline is the one hard date. The claim schedule is shown for planning, but no claim button appears until one is due.',
      src:'GFA start and end; start deadline; claim schedule with amounts; 85% cap.',
      vars:[] },

    { g:'water', id:'w7', n:'Agreement live: claim or report due', stage:4, tag:['Action needed','yellow'], ref:'Year 1 of 2',
      todo:[
        { t:'Submit claim 1', s:'Due 31 Jan 2027. Minimum claim £2,000. Invoices and redacted bank statements needed.', b:'Submit claim 1', due:true },
        { t:'Submit your progress report', s:'Due 31 Jan 2027.', b:'Start progress report', sec:true }
      ],
      cards:[
        { t:'Claims and payments', rows:[['Claimed to date','£0 of £53,040 cap'],['Next payment','After claim 1 is approved (we aim for 60 working days)'],['Payments held','None']], links:['View claim schedule','View payments'] },
        { t:'Your agreement', tag:['Live','green'], rows:[['Reference','GFA-WM-0412'],['Open requests','None']], links:['View your agreement','Request a variation','Report exceptional circumstances','Upload evidence'] }
      ],
      hidden:['Claim 2 and final claim (not yet due)','Start your project','Offer actions'],
      why:'The claim and progress report are the only items competing for attention, so they lead. Cap and minimum value rules are shown at the point of claiming, not as errors afterwards.',
      src:'Next actions with due date and penalty; claims-to-date; claim type, minimum and cap from grant configuration.',
      vars:['Variation pending: agreement card shows "Variation request submitted 3 Feb, we will reply by ..." and the variation link is replaced by "View request".','Payment held: card gains a row with the reason and the action that fixes it.'] },

    { g:'water', id:'w8', n:'Completed: records and retention', stage:5, tag:['Completed','grey'], ref:'Final payment 14 Oct 2028',
      todo:[ { t:'Complete your post-payment monitoring report', s:'Requested 1 Nov 2028. Due 1 Dec 2028.', b:'Start monitoring report', due:true } ],
      cards:[
        { t:'Final statement', rows:[['Total paid','£62,400'],['Final payment','14 Oct 2028']], links:['View final statement','Download all records'] },
        { t:'What you must keep', rows:[['Asset register','Keep and notify changes until 14 Oct 2033'],['Project records','Keep until 14 Oct 2035'],['Publicity','Plaque or poster displayed (done)']], links:['View asset register'] },
        { t:'What next', links:['Find other grants'] }
      ],
      hidden:['Claims, variations, progress reports','Withdraw, offer actions'],
      why:'The "ended" state is a records page, not an empty page: retention end dates and the optional monitoring report are the only live obligations.',
      src:'Retention dates; monitoring report request; asset register status.',
      vars:[] },

    // ================= GRASSLANDS =================
    { g:'grass', id:'g1', n:'Submitted and under review', stage:0, tag:['Submitted','blue'], ref:'Submitted 14 Feb 2026 · Checks started 20 Feb 2026',
      todo:null,
      cards:[
        { t:'Your application', tag:['In review','blue'], rows:[['Reference','GR-2026-0287'],['Submitted','14 Feb 2026'],['Annual payment applied for','£406.60']], links:['View your application','Amend your application','Withdraw your application'] },
        { t:'Recent activity', rows:[['20 Feb 2026','We started checking your application'],['14 Feb 2026','You submitted your application']] }
      ],
      hidden:['Agreement, claims, declaration','Evidence upload (nothing requested)'],
      why:'"Amend" stays because the Grasslands prototype lets the applicant withdraw and amend a copy before a decision; it must carry the warning that review restarts. (The lifecycle document says SFI cannot be amended, so this is configurable per grant.)',
      src:'Application status; amend and withdraw permitted flags; activity timeline.',
      vars:['After the case officer has started tasks the amend link text changes to "Amend (checks will restart)".'] },

    { g:'grass', id:'g2', n:'We need something from you', stage:1, tag:['Information needed','yellow'], ref:'Query raised 24 Feb 2026',
      todo:[
        { t:'Confirm you sent your notice of planned activity to Natural England', s:'Parcels SD7146 5820 and SD7146 6431 are in a site of special scientific interest. Reply by 10 Mar 2026.', b:'Reply to query', due:true },
        { t:'Fix 2 land parcels that failed our checks', s:'Land is not linked to your business, or overlaps another agreement. Update your land details, then tell us.', b:'Update land details', sec:true }
      ],
      cards:[
        { t:'Land checks', tag:['2 parcels need attention','yellow'], rows:[['SD7146 5820','Not linked to your business'],['SD7146 6431','Overlaps another live agreement'],['Passed','38 parcels']], links:['See all parcel results'] },
        { t:'Your application', tag:['In review (paused)','blue'], rows:[['Reference','GR-2026-0287']], links:['View your application','Withdraw your application'] }
      ],
      hidden:['Amend (a query is the lighter route)','Agreement and later stages'],
      why:'Review tasks in the prototype end in "Request information from customer" for different reasons (customer details versus Rural Payments records, parcel calculations, SSSI notice, stacking with the Less Favoured Area, ponds, payment amount). Each reason needs its own plain-language ask and the right fix route: land fixes link out to the Farm and Land Service.',
      src:'Open queries with the checked-rule name; failed parcels from the calculations; link-out to Farm and Land Service with return URL.',
      vars:['"Pause for internal investigation": status "On hold", no actions, neutral wording.','Customer details mismatch: single action "Check your business details" linking out.'] },

    { g:'grass', id:'g3', n:'Returned or closed by amendment', stage:1, tag:['Returned','orange'], ref:'Returned 3 Mar 2026 · New draft GR-2026-0301',
      todo:[ { t:'Amend and resubmit your application', s:'We copied your application into a new draft. Review the changes we asked for and resubmit.', b:'Continue your application', due:true } ],
      cards:[
        { t:'Why we returned it', rows:[['Reason','Ditch on parcel SD7146 5820 is in a SSSI. Choose a different action or remove it.']], links:['Read the full message'] },
        { t:'Original application GR-2026-0287', tag:['Closed','grey'], rows:[['Status','View only'],['Replaced by','GR-2026-0301 (draft)']], links:['View original application'] }
      ],
      hidden:['Withdraw original','Review progress','Agreement'],
      why:'The prototype\'s return confirmation says it closes the application as view only, creates an identical new application and restarts casework from scratch. The page makes the two-case relationship obvious (the caseworker timeline calls this "multiple cases").',
      src:'Return reason; linked case reference; link-out to the application flow.',
      vars:['Closed by applicant amendment: heading "You amended this application", reason row replaced by "You chose to amend on 3 Mar 2026".'] },

    { g:'grass', id:'g4', n:'Agreement offered', stage:2, tag:['Offer issued','yellow'], ref:'Offer issued 14 Apr 2026 · Expires 14 May 2026',
      todo:[ { t:'Accept your proposed agreement', s:'30 days to accept. No agreement is formed until you accept.', b:'Accept your proposed agreement', due:true } ],
      cards:[
        { t:'Your agreement offer', tag:['Action needed','yellow'], rows:[['Reference','AD2456781 (version 3)'],['Annual payment','£406.60'],['Length','3 years'],['Actions','6 actions on 4 parcels'],['Payments','Quarterly, no claims needed']], links:['View your proposed agreement','Reject this offer','Earlier versions (2)'] },
        { t:'Your application', tag:['Accepted into funding','green'], rows:[['Reference','GR-2026-0287']], links:['View your application'] }
      ],
      hidden:['Amend application (decision made)','Withdraw application (now "Reject offer")','Claims, declaration'],
      why:'Matches the screenshot you shared, minus the rows that were "Not available". The agreement tab in the prototype keeps version history (rejected, withdrawn, drafted), so earlier versions are one link, not a table.',
      src:'Offer expiry; terms version; version history; accept permitted (Submit).',
      vars:['Agreement drafted, not yet issued: "We are preparing your agreement", no action.','Signature by someone without Submit: button hidden, "Ask [name] to accept".'] },

    { g:'grass', id:'g5', n:'Agreement accepted, not yet started', stage:3, tag:['Agreement accepted','green'], ref:'Accepted 28 Apr 2026 · Starts 1 Jan 2027',
      todo:null,
      cards:[
        { t:'Your agreement', tag:['Accepted','green'], rows:[['Reference','AD2456781'],['Starts','1 Jan 2027'],['Annual payment','£406.60'],['First payment','From April 2027, then quarterly']], links:['View your agreement','Download'] },
        { t:'Your actions', rows:[['6 actions on 4 parcels','Hedgerow, ditch, pond, grassland actions'],['Records to keep','Photos, input and stocking records per action']], links:['See actions and records you need to keep'] }
      ],
      hidden:['Annual declaration (not due until the final 2 months of year 1)','Quarterly payments (none yet)','Submit a claim (never: Grasslands pays automatically)'],
      why:'The prototype separates "accepted" from "started" (the agreement tab shows "Date accepted" and "Start date: Not started"), so there is a quiet phase where the useful thing is knowing what you will have to do.',
      src:'Agreement start date; action list per parcel; record-keeping requirement per action.',
      vars:[] },

    { g:'grass', id:'g6', n:'Agreement live: declaration due', stage:3, tag:['Action needed','yellow'], ref:'Year 1 of 3',
      todo:[ { t:'Make your annual declaration', s:'Due by 31 Oct 2027. Your final payment for year 1 is held until you submit it.', b:'Make your annual declaration', due:true } ],
      cards:[
        { t:'Your payments', tag:['1 held','orange'], rows:[['Quarter 1','£101.65, paid 1 Apr'],['Quarter 2','£101.65, paid 1 Jul'],['Quarter 3','£101.65, due 1 Oct'],['Quarter 4','£101.65, held until you make your declaration']], links:['View payments and statements'] },
        { t:'Your agreement', tag:['Live','green'], rows:[['Reference','AD2456781'],['Actions','6 actions on 4 parcels']], links:['View your agreement','Upload evidence for an action','Report a change to your land or business','Request a change to your agreement'] }
      ],
      hidden:['Submit a claim','Accept or reject offer','Amend application'],
      why:'The only task carries its money consequence (final quarter held). Change options are grouped, because land transfer, exceptional circumstances and amendments all begin from "something changed".',
      src:'Declaration window per agreement start date; held payment with reason; transfer-out repayment warning.',
      vars:['Land transfer: "Report a change" shows a warning that payments may need repaying before continuing.'] },

    { g:'grass', id:'g7', n:'Agreement live: land check in progress', stage:3, tag:['Checks in progress','blue'], ref:'6-month check started 2 Jul 2027',
      todo:[ { t:'Tell us about parcel SD7146 5820', s:'It no longer appears to be linked to your business. Update your land details or reply to our query. Reply by 16 Jul 2027.', b:'Reply to query', due:true } ],
      cards:[
        { t:'We are checking your land', tag:['In progress','blue'], rows:[['What we check','Land parcel calculations, management control, land records'],['Result so far','1 parcel needs attention'],['Payment','Next quarter may be held if this is not resolved']], links:['See parcel results'] },
        { t:'Your agreement', tag:['Live','green'], rows:[['Reference','AD2456781']], links:['View your agreement','Report a change to your land or business','Request a change to your agreement'] }
      ],
      hidden:['Annual declaration (not in window)','Submit a claim'],
      why:'The prototype has 5- and 6-month "payment control" tasks, run by the caseworker, that re-run calculations and check management control, tenure and mapping. They can raise requests to the applicant mid-agreement, a case the document does not mention.',
      src:'Agreement checks status; open query; payment held flag and reason; link-out to Farm and Land Service.',
      vars:['No problems found: no notice at all (silent), only a line in the activity timeline.','Escalated to an internal investigation: status "Checks in progress", no applicant actions.'] },

    { g:'grass', id:'g8', n:'Agreement terminated', stage:3, tag:['Terminated','red'], ref:'Terminated 10 Aug 2027',
      todo:[ { t:'Check the repayment we have asked for', s:'We found payments to recover. Repayment due by 10 Oct 2027.', b:'View repayment', due:true } ],
      cards:[
        { t:'Our decision', tag:['Terminated','red'], rows:[['Effective','10 Aug 2027'],['Reason','Management control of the land is no longer with your business'],['Future payments','Stopped'],['Amount to repay','£203.30']], links:['View decision letter','Ask us a question about this decision'] },
        { t:'What you can do next', rows:[['Review or appeal','Follow the steps in your decision letter (within 60 days)']], links:['View final statement','Find other grants'] }
      ],
      hidden:['Everything delivery-related (actions, declaration, evidence, changes)','Reinstatement (a caseworker can end the termination process)'],
      why:'The prototype\'s "Preparing to terminate" stage runs a payment-recovery check, can be ended (returning the agreement to accepted) and is irreversible once confirmed. The applicant sees the outcome and the repayment, not the internal stage.',
      src:'Termination decision, effective date, repayment amount from the recovery check; review/appeal outside the portal.',
      vars:['Notice stage ("Preparing to terminate"): decide whether the applicant is told. Suggested: "We are considering ending your agreement", a reply route, and nothing else. If the process is ended, a message "Your agreement continues".'] },

    { g:'grass', id:'g9', n:'Ending soon, then ended', stage:4, tag:['Ending soon','orange'], ref:'Agreement ends 31 Dec 2029',
      todo:[
        { t:'Apply for a successor agreement', s:'You can start early. Your agreement ends in 5 months.', b:'Start your application', due:true },
        { t:'Check your final declaration is in', s:'Final declaration due by 31 Oct 2029.', b:'View declaration', sec:true }
      ],
      cards:[
        { t:'Your agreement', tag:['Ending soon','orange'], rows:[['Reference','AD2456781'],['Ends','31 Dec 2029'],['Year','3 of 3']], links:['View your agreement','View payments and statements'] },
        { t:'After it ends', rows:[['Records','Keep records until 31 Dec 2036']], links:['Download your records'] }
      ],
      hidden:['Report change and amend (limited in last months, configurable)','Submit a claim'],
      why:'The last phase mixes one forward action (successor) with one housekeeping action (final declaration). After it ends the page becomes a records page like Water w8.',
      src:'Ending-soon flag; successor eligibility; retention end date.',
      vars:['Ended: tag "Ended", todo card removed, only records, final statement and "Find other grants".'] }
  ];

  

// ---- prototype additions: the closed phase reached by withdrawing or rejecting an offer ----
PHASES.push(
  { g:'water', id:'w9', n:'Withdrawn or offer rejected', stage:-1, tag:['Closed','grey'], ref:'Closed 21 Oct 2026',
    todo:null,
    cards:[
      { t:'Your application', tag:['Closed','grey'], rows:[['Reference','WM-2026-0412'],['Outcome','__REASON__']], links:['View your application','Find other grants'] }
    ],
    hidden:[], why:'Closed state reached by withdrawing, or by rejecting an offer.', src:'Outcome and date.', vars:[] },
  { g:'grass', id:'g10', n:'Withdrawn or offer rejected', stage:-1, tag:['Closed','grey'], ref:'Closed 21 Oct 2026',
    todo:null,
    cards:[
      { t:'Your application', tag:['Closed','grey'], rows:[['Reference','GR-2026-0287'],['Outcome','__REASON__']], links:['View your application','Find other grants'] }
    ],
    hidden:[], why:'Closed state reached by withdrawing, or by rejecting an offer.', src:'Outcome and date.', vars:[] }
);

module.exports = { TRK, HEAD, PHASES };
