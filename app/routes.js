const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// ============================================================
// Naming conventions
// ============================================================
//
// Route suffix  Meaning
// -----------   -------
// T1            FRPS-D1_target task route
// T2            FRPS-D2 main case task route
// T2C2          FRPS-D2 linked case (case2) task route
//
// Session key suffix  Meaning
// ------------------  -------
// (none)              Main case (FRPS-D2 application 100300 / D1)
// C2                  Linked case (FRPS-D2 case2, application 100297)

// ============================================================
// Helpers
// ============================================================

function stripEmptyAndNulls(input) {
  if (Array.isArray(input)) {
    return input.filter(value => value !== null && value !== '');
  }
  if (input === null || input === '') {
    return '';
  }
  throw new Error("Input must be an array or an empty/null value.");
}

// Outcome lookup tables — map decision strings to tag CSS class + display status
const REVIEW_OUTCOMES = {
  'Accepted':               { tag: '',                                             status: 'Accepted' },
  'Information requested':  { tag: 'govuk-tag govuk-tag--yellow custom-width-220', status: 'Information requested' },
  'Internal investigation': { tag: 'govuk-tag govuk-tag--yellow custom-width-220', status: 'Internal investigation' },
  'Cannot accept':          { tag: 'govuk-tag govuk-tag--red-status',              status: 'Not accepted' },
};

const AGREEMENT_OUTCOMES = {
  'Confirm':           { tag: '',                                 status: 'Confirmed' },
  "There's a problem": { tag: 'govuk-tag govuk-tag--red-status',  status: "There's a problem" },
};

const MONTH5_OUTCOMES = {
  'No action needed':       { tag: '',                                 status: 'No action needed' },
  'Escalate':               { tag: 'govuk-tag govuk-tag--red-status',  status: 'Escalate' },
  'Information requested':  { tag: 'govuk-tag govuk-tag--yellow',      status: 'Information requested' },
  'Cannot accept':          { tag: 'govuk-tag govuk-tag--red-status',  status: 'Cannot accept' },
};

const AMEND_OUTCOMES = {
  'Amendment sent':     { stage: 'amendment_sent', status: 'Amendment sent', tag: 'govuk-tag govuk-tag--blue' },
  'Amendment recinded': { stage: 'review',          status: 'In review',      tag: 'govuk-tag govuk-tag--blue' },
  'Reject':             { stage: 'reject',           status: 'Rejected',       tag: 'govuk-tag govuk-tag--red' },
  'Withdraw':           { stage: 'withdraw',         status: 'Withdrawn',      tag: 'govuk-tag govuk-tag--orange' },
};

const APPROVE_DECISIONS = {
  'Reject':      { stage: 'reject',    status: 'Rejected',             tag: 'govuk-tag govuk-tag--red' },
  'Amend':       { stage: 'amend',     status: 'Amending',             tag: 'govuk-tag govuk-tag--orange' },
  'Return':      { stage: 'return',    status: 'Returned to customer', tag: 'govuk-tag govuk-tag--orange' },
  'Withdraw':    { stage: 'withdraw',  status: 'Withdrawn',            tag: 'govuk-tag govuk-tag--orange' },
  'Put on hold': { stage: 'on-hold',   status: 'On hold',              tag: 'govuk-tag govuk-tag--yellow' },
};

const DEFAULT_OUTCOME = { tag: 'govuk-tag', status: 'Incomplete' };

// Stage progression sequence — index 0 = count 1
const STAGE_SEQUENCE = [
  { stage: 'start',  status: 'Application received', tag: 'govuk-tag govuk-tag--grey' },
  { stage: 'review', status: 'In review',             tag: 'govuk-tag govuk-tag--blue' },
  { stage: 'agree',  status: 'Agreement drafted',     tag: 'govuk-tag govuk-tag--blue' },
  { stage: 'agree2', status: 'Agreement offered',     tag: 'govuk-tag govuk-tag--blue', extras: { AgreeSChecked: 'yes' } },
  { stage: 'pay',    status: 'Agreement accepted',    tag: 'govuk-tag govuk-tag--green' },
];

function setTaskStatus(data, tagKey, statusKey, decision, outcomes) {
  const outcome = outcomes[decision] || DEFAULT_OUTCOME;
  data[tagKey]    = outcome.tag;
  data[statusKey] = outcome.status;
}

// On first visit: saves noteAction + filteredNote.
// On revisit (noteActionKey already set + revisit keys provided): saves filteredNoteKey2 instead.
function handleTaskNote(data, noteActionKey, decisionKey, filteredNoteKey, rawNoteKey, filteredNoteKey2, rawNoteKey2) {
  if (filteredNoteKey2 && data[noteActionKey]) {
    data[filteredNoteKey2] = stripEmptyAndNulls(data[rawNoteKey2]);
  } else {
    data[noteActionKey] = data[decisionKey];
    if (filteredNoteKey) data[filteredNoteKey] = stripEmptyAndNulls(data[rawNoteKey]);
  }
}

// ============================================================
// Route factories
// ============================================================

// opts: { checkedKey?, decisionKey, noteActionKey, tagKey, statusKey,
//         rawNoteKey, filteredNoteKey, rawNoteKey2?, filteredNoteKey2?,
//         outcomes, redirectTo }
function makeTaskRoute(path, opts) {
  router.get(path, function (req, res) {
    const d = req.session.data;
    if (opts.checkedKey) d[opts.checkedKey] = 'yes';
    handleTaskNote(d,
      opts.noteActionKey, opts.decisionKey,
      opts.filteredNoteKey, opts.rawNoteKey,
      opts.filteredNoteKey2 || null, opts.rawNoteKey2 || null
    );
    setTaskStatus(d, opts.tagKey, opts.statusKey, d[opts.decisionKey], opts.outcomes);
    res.redirect(opts.redirectTo);
  });
}

// opts: { decisionKey, approvedKey, agreementStageKey, reviewNoteKey, filteredReviewNoteKey,
//         stageKey, statusKey, tagKey,
//         onApproveRedirect, defaultRedirect, amendRedirect?, returnRedirect? }
function makeApproveRoute(path, opts) {
  router.get(path, function (req, res) {
    const d = req.session.data;
    const decision = d[opts.decisionKey];

    if (decision === 'Approve') {
      d[opts.approvedKey]           = 'yes';
      d[opts.agreementStageKey]     = 'yes';
      d[opts.filteredReviewNoteKey] = stripEmptyAndNulls(d[opts.reviewNoteKey]);
      return res.redirect(opts.onApproveRedirect);
    }

    const outcome = APPROVE_DECISIONS[decision];
    if (outcome) {
      d[opts.stageKey]  = outcome.stage;
      d[opts.statusKey] = outcome.status;
      d[opts.tagKey]    = outcome.tag;
      if (decision === 'Amend' && opts.amendRedirect) {
        d[opts.filteredReviewNoteKey] = stripEmptyAndNulls(d[opts.reviewNoteKey]);
        return res.redirect(opts.amendRedirect);
      }
      if (decision === 'Return' && opts.returnRedirect) {
        d[opts.filteredReviewNoteKey] = stripEmptyAndNulls(d[opts.reviewNoteKey]);
        return res.redirect(opts.returnRedirect);
      }
    }

    res.redirect(opts.defaultRedirect);
  });
}

// opts: { decisionKey, stageKey, statusKey, tagKey, redirectTo }
function makeAmendRoute(path, opts) {
  router.get(path, function (req, res) {
    const d = req.session.data;
    const outcome = AMEND_OUTCOMES[d[opts.decisionKey]];
    if (outcome) {
      d[opts.stageKey]  = outcome.stage;
      d[opts.statusKey] = outcome.status;
      d[opts.tagKey]    = outcome.tag;
    }
    res.redirect(opts.redirectTo);
  });
}

// opts: { decisionKey, rawNoteKey, filteredNoteKey, stageKey, statusKey, tagKey,
//         onSentRedirect, defaultRedirect }
function makeAgreementSentRoute(path, opts) {
  router.get(path, function (req, res) {
    const d = req.session.data;
    switch (d[opts.decisionKey]) {
    case 'Agreement sent':
      d[opts.filteredNoteKey] = stripEmptyAndNulls(d[opts.rawNoteKey]);
      return res.redirect(opts.onSentRedirect);
    case 'Reject':
      d[opts.stageKey]  = 'reject';
      d[opts.statusKey] = 'Rejected';
      d[opts.tagKey]    = 'govuk-tag govuk-tag--red';
      break;
    case 'Withdraw':
      d[opts.stageKey]  = 'withdraw';
      d[opts.statusKey] = 'Withdrawn';
      d[opts.tagKey]    = 'govuk-tag govuk-tag--orange';
      break;
    }
    res.redirect(opts.defaultRedirect);
  });
}

// opts: { stageCountKey, stageKey, statusKey, tagKey, firstRedirect, tasklistRedirect }
// firstRedirect is used on count==1 (e.g. back to caselist); defaults to tasklistRedirect.
function makeStageRoute(path, opts) {
  router.get(path, function (req, res) {
    const d = req.session.data;
    d[opts.stageCountKey] = (d[opts.stageCountKey] || 0) + 1;
    const s = STAGE_SEQUENCE[d[opts.stageCountKey] - 1] || STAGE_SEQUENCE[0];

    d[opts.stageKey]  = s.stage;
    d[opts.statusKey] = s.status;
    d[opts.tagKey]    = s.tag;
    if (s.extras) Object.assign(d, s.extras);

    const isFirst = d[opts.stageCountKey] === 1;
    res.redirect(isFirst ? (opts.firstRedirect || opts.tasklistRedirect) : opts.tasklistRedirect);
  });
}


// ============================================================
// FRPS-D1_target routes
// ============================================================

// --- Approval/rejection ---

makeApproveRoute('/app-approve1', {
  decisionKey:           'decision1',
  approvedKey:           'caseApproved',
  agreementStageKey:     'agreementStage',
  reviewNoteKey:         'reviewNote',
  filteredReviewNoteKey: 'filteredReviewNote',
  stageKey:              'caseStage',
  statusKey:             'caseStatus',
  tagKey:                'caseStatusTag',
  onApproveRedirect:     '/tasklistStage1',
  defaultRedirect:       '/FRPS-D1_target/tasklist-stage',
});

// --- State reset ---

router.get('/resume1', function (req, res) {
  // Returns case to 'In review' after a pause or rejection reopen
  req.session.data.caseStage     = 'review';
  req.session.data.caseStatus    = 'In review';
  req.session.data.caseStatusTag = 'govuk-tag govuk-tag--blue';
  res.redirect('/FRPS-D1_target/tasklist-stage');
});

// --- Agreement sent ---

makeAgreementSentRoute('/aggSent1', {
  decisionKey:     'decisionAg',
  rawNoteKey:      'moreDetail2',
  filteredNoteKey: 'filteredAggNote',
  stageKey:        'caseStage',
  statusKey:       'caseStatus',
  tagKey:          'caseStatusTag',
  onSentRedirect:  '/tasklistStage1',
  defaultRedirect: '/FRPS-D1_target/tasklist-stage',
});

// --- Task review routes ---

const D1T = '/FRPS-D1_target/tasklist-stage';

makeTaskRoute('/task1T1', {
  checkedKey:       'detailsChecked',
  decisionKey:      'decisionTask1',
  noteActionKey:    'noteActionTask1',
  tagKey:           'detailsTag',
  statusKey:        'detailsStatus',
  rawNoteKey:       'task1Note',
  filteredNoteKey:  'filteredNote1',
  outcomes:         REVIEW_OUTCOMES,
  redirectTo:       D1T,
});

makeTaskRoute('/task2T1', {
  checkedKey:       'detailsChecked',
  decisionKey:      'decisionTask2',
  noteActionKey:    'noteActionTask2',
  tagKey:           'calcsTag',
  statusKey:        'calcsStatus',
  rawNoteKey:       'task2Note',
  filteredNoteKey:  'filteredNote2',
  outcomes:         REVIEW_OUTCOMES,
  redirectTo:       D1T,
});

makeTaskRoute('/task2fT1', {
  checkedKey:       'detailsChecked',
  decisionKey:      'decisionTask2f',
  noteActionKey:    'noteActionTask2f',
  tagKey:           'calcsTag',
  statusKey:        'calcsStatus',
  rawNoteKey:       'task2Note',
  filteredNoteKey:  'filteredNote2',
  outcomes:         REVIEW_OUTCOMES,
  redirectTo:       D1T,
});

makeTaskRoute('/task3T1', {
  checkedKey:       'detailsChecked',
  decisionKey:      'decisionTask3',
  noteActionKey:    'noteActionTask3',
  tagKey:           'sssiTag',
  statusKey:        'sssiStatus',
  rawNoteKey:       'task3Note',
  filteredNoteKey:  'filteredNote3',
  outcomes:         REVIEW_OUTCOMES,
  redirectTo:       D1T,
});

makeTaskRoute('/task4T1', {
  checkedKey:       'detailsChecked',
  decisionKey:      'decisionTask4',
  noteActionKey:    'noteActionTask4',
  tagKey:           'samTag',
  statusKey:        'samStatus',
  rawNoteKey:       'task4Note',
  filteredNoteKey:  'filteredNote4',
  outcomes:         REVIEW_OUTCOMES,
  redirectTo:       D1T,
});

makeTaskRoute('/task5T1', {
  checkedKey:       'detailsChecked',
  decisionKey:      'decisionTask5',
  noteActionKey:    'noteActionTask5',
  tagKey:           'paymentTag',
  statusKey:        'paymentStatus',
  rawNoteKey:       'task5Note',
  filteredNoteKey:  'filteredNote5',
  outcomes:         REVIEW_OUTCOMES,
  redirectTo:       D1T,
});

makeTaskRoute('/task6T1', {
  checkedKey:       'detailsChecked',
  decisionKey:      'decisionTask6',
  noteActionKey:    'noteActionTask6',
  tagKey:           'budgetTag',
  statusKey:        'budgetStatus',
  rawNoteKey:       'task6Note',
  filteredNoteKey:  'filteredNote6',
  outcomes:         REVIEW_OUTCOMES,
  redirectTo:       D1T,
});

// --- Case assignment ---

router.get('/caselistTeam1', function (req, res) {
  // Marks case as assigned and returns to caselist
  req.session.data.caseAssigned = 'yes';
  res.redirect('/FRPS-D1_target/caselist');
});

router.get('/setUserFo1', function (req, res) {
  // Assigns finance officer role for D1 case
  req.session.data.financeOfficer = 'yes';
  res.redirect('/FRPS-D1_target/tasklist-stage');
});

router.get('/agreementStage1', function (req, res) {
  // Unlocks the agreement tab in the D1 navigation
  req.session.data.agreementStage = 'yes';
  res.redirect('/FRPS-D1_target/caselist');
});

// --- Agreement task routes ---

// Note: original task1AgT1 had a bug — noteActionAgreeTask1 was set from decisionTask1 (wrong key). Fixed here.
makeTaskRoute('/task1AgT1', {
  checkedKey:       'AgreeChecked',
  decisionKey:      'decisionAgreeTask1',
  noteActionKey:    'noteActionAgreeTask1',
  tagKey:           'agreeTag',
  statusKey:        'agreeStatus',
  rawNoteKey:       'task1ANote',
  filteredNoteKey:  'filteredNote1A',
  outcomes:         AGREEMENT_OUTCOMES,
  redirectTo:       D1T,
});

makeTaskRoute('/task2AgT1', {
  decisionKey:      'decisionAgreeTask2',
  noteActionKey:    'noteActionAgreeTask2',
  tagKey:           'agreeSTag',
  statusKey:        'agreeSStatus',
  rawNoteKey:       'task2ANote',
  filteredNoteKey:  'filteredNote2A',
  outcomes:         AGREEMENT_OUTCOMES,
  redirectTo:       D1T,
});

// --- Agreement signing ---

router.get('/setAgreeSign1', function (req, res) {
  // Records customer signature and advances D1 case status
  req.session.data.caseStatus = 'Agreement accepted';
  res.redirect('/tasklistStage1');
});

// --- Stage progression ---

makeStageRoute('/tasklistStage1', {
  stageCountKey:    'stageCount',
  stageKey:         'caseStage',
  statusKey:        'caseStatus',
  tagKey:           'caseStatusTag',
  firstRedirect:    '/FRPS-D1_target/caselist',
  tasklistRedirect: '/FRPS-D1_target/tasklist-stage',
});


// ============================================================
// FRPS-D2 routes
// ============================================================

// --- Approval/rejection ---

makeApproveRoute('/app-approve2', {
  decisionKey:           'decision1',
  approvedKey:           'caseApproved',
  agreementStageKey:     'agreementStage',
  reviewNoteKey:         'reviewNote',
  filteredReviewNoteKey: 'filteredReviewNote',
  stageKey:              'caseStage',
  statusKey:             'caseStatus',
  tagKey:                'caseStatusTag',
  onApproveRedirect:     '/tasklistStage2',
  amendRedirect:         '/FRPS-D2/amend-confirm',
  returnRedirect:        '/FRPS-D2/return-confirm',
  defaultRedirect:       '/FRPS-D2/tasklist-stage',
});

// --- State resets ---

router.get('/resume2', function (req, res) {
  // Returns D2 case to 'In review' after a pause or rejection reopen
  req.session.data.caseStage     = 'review';
  req.session.data.caseStatus    = 'In review';
  req.session.data.caseStatusTag = 'govuk-tag govuk-tag--blue';
  res.redirect('/FRPS-D2/tasklist-stage');
});

router.get('/amendReturn1', function (req, res) {
  // Cancels amend/return flow and restores D2 case to 'In review'
  req.session.data.caseStage     = 'review';
  req.session.data.caseStatus    = 'In review';
  req.session.data.caseStatusTag = 'govuk-tag govuk-tag--blue';
  res.redirect('/FRPS-D2/tasklist-stage');
});

// --- Confirmation gates ---

router.get('/returnConf1', function (req, res) {
  // Proceeds with return if confirmed, otherwise cancels back to tasklist
  if (req.session.data.rConf === 'yes') {
    res.redirect('/FRPS-D2/tasklist-stage');
  } else {
    res.redirect('/amendReturn1');
  }
});

router.get('/amendConf1', function (req, res) {
  // Proceeds with amendment if confirmed, otherwise cancels back to tasklist
  if (req.session.data.aConf === 'yes') {
    res.redirect('/FRPS-D2/tasklist-stage');
  } else {
    res.redirect('/amendReturn1');
  }
});

// --- Amendment flow ---

makeAmendRoute('/amend1', {
  decisionKey: 'decisionAm',
  stageKey:    'caseStage',
  statusKey:   'caseStatus',
  tagKey:      'caseStatusTag',
  redirectTo:  '/FRPS-D2/tasklist-stage',
});

router.get('/amend2', function (req, res) {
  // Closes D2 case via amendment submission
  req.session.data.caseStage     = 'amendment_submitted';
  req.session.data.caseStatus    = 'Case close by amendment';
  req.session.data.caseStatusTag = 'govuk-tag govuk-tag--orange';
  res.redirect('/FRPS-D2/tasklist-stage');
});

// --- Agreement sent ---

makeAgreementSentRoute('/aggSent2', {
  decisionKey:     'decisionAg',
  rawNoteKey:      'agreeNote',
  filteredNoteKey: 'filteredAggNote',
  stageKey:        'caseStage',
  statusKey:       'caseStatus',
  tagKey:          'caseStatusTag',
  onSentRedirect:  '/tasklistStage2',
  defaultRedirect: '/FRPS-D2/tasklist-stage',
});

// --- Task review routes ---

const D2T = '/FRPS-D2/tasklist-stage';

makeTaskRoute('/task1T2', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask1',
  noteActionKey:     'noteActionTask1',
  tagKey:            'detailsTag',
  statusKey:         'detailsStatus',
  rawNoteKey:        'task1Note',
  filteredNoteKey:   'filteredNote1',
  rawNoteKey2:       'task1Note2',
  filteredNoteKey2:  'filteredNote1_2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task2T2', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask2',
  noteActionKey:     'noteActionTask2',
  tagKey:            'calcsTag',
  statusKey:         'calcsStatus',
  rawNoteKey:        'task2Note',
  filteredNoteKey:   'filteredNote2',
  rawNoteKey2:       'task2Note2',
  filteredNoteKey2:  'filteredNote2_2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task2fT2', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask2f',
  noteActionKey:     'noteActionTask2f',
  tagKey:            'calcsTag',
  statusKey:         'calcsStatus',
  rawNoteKey:        'task2fNote',
  filteredNoteKey:   'filteredNote2f',
  rawNoteKey2:       'task2fNote2',
  filteredNoteKey2:  'filteredNote2f_2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task3T2', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask3',
  noteActionKey:     'noteActionTask3',
  tagKey:            'sssiTag',
  statusKey:         'sssiStatus',
  rawNoteKey:        'task3Note',
  filteredNoteKey:   'filteredNote3',
  rawNoteKey2:       'task3Note2',
  filteredNoteKey2:  'filteredNote3_2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task4T2', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask4',
  noteActionKey:     'noteActionTask4',
  tagKey:            'samTag',
  statusKey:         'samStatus',
  rawNoteKey:        'task4Note',
  filteredNoteKey:   'filteredNote4',
  rawNoteKey2:       'task4Note2',
  filteredNoteKey2:  'filteredNote4_2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task5T2', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask5',
  noteActionKey:     'noteActionTask5',
  tagKey:            'paymentTag',
  statusKey:         'paymentStatus',
  rawNoteKey:        'task5Note',
  filteredNoteKey:   'filteredNote5',
  rawNoteKey2:       'task5Note2',
  filteredNoteKey2:  'filteredNote5_2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task6T2', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask6',
  noteActionKey:     'noteActionTask6',
  tagKey:            'budgetTag',
  statusKey:         'budgetStatus',
  rawNoteKey:        'task6Note',
  filteredNoteKey:   'filteredNote6',
  rawNoteKey2:       'task6Note2',
  filteredNoteKey2:  'filteredNote6_2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2T,
});

// --- Case assignment ---

router.get('/caselistTeam2', function (req, res) {
  // Marks D2 case as assigned and returns to caselist
  req.session.data.caseAssigned = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/setUserFo2', function (req, res) {
  // Assigns finance officer role for D2 case
  req.session.data.financeOfficer = 'yes';
  res.redirect('/FRPS-D2/tasklist-stage');
});

// --- Amendment task routes ---

makeTaskRoute('/task1T2Am', {
  decisionKey:      'decisionTaskAm1',
  noteActionKey:    'noteActionTaskAm1',
  tagKey:           'amend1Tag',
  statusKey:        'amend1Status',
  rawNoteKey:       'task1AmNote',
  filteredNoteKey:  'filteredNoteAm1',
  outcomes:         AGREEMENT_OUTCOMES,
  redirectTo:       D2T,
});

makeTaskRoute('/task2T2Am', {
  decisionKey:      'decisionTaskAm2',
  noteActionKey:    'noteActionTaskAm2',
  tagKey:           'amend2Tag',
  statusKey:        'amend2Status',
  rawNoteKey:       'taskAm2Note',
  filteredNoteKey:  'filteredNoteAm2',
  outcomes:         AGREEMENT_OUTCOMES,
  redirectTo:       D2T,
});

makeTaskRoute('/task3T2Am', {
  decisionKey:      'decisionTaskAm3',
  noteActionKey:    'noteActionTaskAm3',
  tagKey:           'amend3Tag',
  statusKey:        'amend3Status',
  rawNoteKey:       'task3AmNote',
  filteredNoteKey:  'filteredNoteAm3',
  outcomes:         AGREEMENT_OUTCOMES,
  redirectTo:       D2T,
});

// --- Agreement progression ---

router.get('/agreementStage2', function (req, res) {
  // Unlocks the agreement tab in the D2 navigation
  req.session.data.agreementStage = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

// --- Agreement task routes ---

makeTaskRoute('/task1AgT2', {
  checkedKey:        'AgreeChecked',
  decisionKey:       'decisionAgreeTask1',
  noteActionKey:     'noteActionAgreeTask1',
  tagKey:            'agreeTag',
  statusKey:         'agreeStatus',
  rawNoteKey:        'task1ANote',
  filteredNoteKey:   'filteredNote1A',
  rawNoteKey2:       'task1ANote2',
  filteredNoteKey2:  'filteredNote1A_2',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task2AgT2', {
  decisionKey:       'decisionAgreeTask2',
  noteActionKey:     'noteActionAgreeTask2',
  tagKey:            'agreeSTag',
  statusKey:         'agreeSStatus',
  rawNoteKey:        'task2ANote',
  filteredNoteKey:   'filteredNote2A',
  rawNoteKey2:       'task2ANote2',
  filteredNoteKey2:  'filteredNote2A_2',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2T,
});

// --- Agreement signing ---

router.get('/setAgreeSign2', function (req, res) {
  // Records customer signature and advances D2 case status
  req.session.data.caseStatus = 'Agreement accepted';
  res.redirect('/tasklistStage2');
});

// --- Stage progression ---

// D2 does not redirect to caselist on count==1 — firstRedirect matches tasklistRedirect
makeStageRoute('/tasklistStage2', {
  stageCountKey:    'stageCount',
  stageKey:         'caseStage',
  statusKey:        'caseStatus',
  tagKey:           'caseStatusTag',
  firstRedirect:    '/FRPS-D2/tasklist-stage',
  tasklistRedirect: '/FRPS-D2/tasklist-stage',
});

// --- 5-month checks ---

router.get('/5month1', function (req, res) {
  // Transitions D2 case into the 5-month check phase
  req.session.data.caseStatus = '5 month checks';
  req.session.data.caseStage  = '5month';
  res.redirect('/FRPS-D2/tasklist-stage');
});

makeTaskRoute('/task5m1', {
  decisionKey:       'decisionTask1m',
  noteActionKey:     'noteActionTask1m',
  tagKey:            'month5_1Tag',
  statusKey:         'month5_1Status',
  rawNoteKey:        'task1mNote',
  filteredNoteKey:   'filteredNote1m',
  rawNoteKey2:       'task1mNote2',
  filteredNoteKey2:  'filteredNote1m_2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task5m2', {
  decisionKey:       'decisionTask2m',
  noteActionKey:     'noteActionTask2m',
  tagKey:            'month5_2Tag',
  statusKey:         'month5_2Status',
  rawNoteKey:        'task2mNote',
  filteredNoteKey:   'filteredNote2m',
  rawNoteKey2:       'task2mNote2',
  filteredNoteKey2:  'filteredNote2m_2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task5m3', {
  decisionKey:       'decisionTask3m',
  noteActionKey:     'noteActionTask3m',
  tagKey:            'month5_3Tag',
  statusKey:         'month5_3Status',
  rawNoteKey:        'task3mNote',
  filteredNoteKey:   'filteredNote3m',
  rawNoteKey2:       'task3mNote2',
  filteredNoteKey2:  'filteredNote3m_2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task5m4', {
  decisionKey:       'decisionTask4m',
  noteActionKey:     'noteActionTask4m',
  tagKey:            'month5_4Tag',
  statusKey:         'month5_4Status',
  rawNoteKey:        'task4mNote',
  filteredNoteKey:   'filteredNote4m',
  rawNoteKey2:       'task4mNote2',
  filteredNoteKey2:  'filteredNote4m_2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task5m5', {
  decisionKey:       'decisionTask5m',
  noteActionKey:     'noteActionTask5m',
  tagKey:            'month5_5Tag',
  statusKey:         'month5_5Status',
  rawNoteKey:        'task5mNote',
  filteredNoteKey:   'filteredNote5m',
  rawNoteKey2:       'task5mNote2',
  filteredNoteKey2:  'filteredNote5m_2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2T,
});

makeTaskRoute('/task5m6', {
  decisionKey:       'decisionTask6m',
  noteActionKey:     'noteActionTask6m',
  tagKey:            'month5_6Tag',
  statusKey:         'month5_6Status',
  rawNoteKey:        'task6mNote',
  filteredNoteKey:   'filteredNote6m',
  rawNoteKey2:       'task6mNote2',
  filteredNoteKey2:  'filteredNote6m_2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2T,
});

// --- Utility routes ---

router.get('/calcs1', function (req, res) {
  // Triggers recalculation flag and redirects to calculations page
  req.session.data.recalc = 'yes';
  res.redirect('/FRPS-D2/calculations2');
});

router.get('/caselink1', function (req, res) {
  // Reveals linked case panel on the D2 caselist
  req.session.data.showLinks = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/setLinked1', function (req, res) {
  // Marks the linked case as active, enabling case2 navigation
  req.session.data.linkedCase = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/setPay1', function (req, res) {
  // Advances linked case to payment stage from the main case
  req.session.data.caseStageC2 = 'pay';
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});


// ============================================================
// FRPS-D2/case2 routes
// ============================================================

// --- Case initialisation ---

router.get('/case2-1', function (req, res) {
  // Creates the linked case record and returns to caselist
  req.session.data.case297 = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/case100297', function (req, res) {
  // Opens the linked case in 'return' stage (initial entry point)
  req.session.data.caseStageC2 = 'return';
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});

// --- Approval/rejection ---

makeApproveRoute('/app-approve2C2', {
  decisionKey:           'decision1C2',
  approvedKey:           'caseApprovedC2',
  agreementStageKey:     'agreementStageC2',
  reviewNoteKey:         'reviewNoteC2',
  filteredReviewNoteKey: 'filteredReviewNoteC2',
  stageKey:              'caseStageC2',
  statusKey:             'caseStatusC2',
  tagKey:                'caseStatusTagC2',
  onApproveRedirect:     '/tasklistStage2C2',
  amendRedirect:         '/FRPS-D2/case2/amend-confirm',
  returnRedirect:        '/FRPS-D2/case2/return-confirm',
  defaultRedirect:       '/FRPS-D2/case2/tasklist-stage',
});

// --- State resets ---

router.get('/resume2C2', function (req, res) {
  // Returns case2 to 'In review' after a pause or rejection reopen
  req.session.data.caseStageC2     = 'review';
  req.session.data.caseStatusC2    = 'In review';
  req.session.data.caseStatusTagC2 = 'govuk-tag govuk-tag--blue';
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});

router.get('/amendReturn1C2', function (req, res) {
  // Cancels amend/return flow and restores case2 to 'In review'
  req.session.data.caseStageC2     = 'review';
  req.session.data.caseStatusC2    = 'In review';
  req.session.data.caseStatusTagC2 = 'govuk-tag govuk-tag--blue';
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});

// --- Confirmation gates ---

router.get('/returnConf1C2', function (req, res) {
  // Proceeds with return if confirmed, otherwise cancels back to tasklist
  if (req.session.data.rConfC2 === 'yes') {
    res.redirect('/FRPS-D2/case2/tasklist-stage');
  } else {
    res.redirect('/amendReturn1C2');
  }
});

router.get('/terminateConf1C2', function (req, res) {
  // Finalises termination if confirmed, otherwise leaves case2 stage unchanged
  if (req.session.data.tConfC2 === 'yes') {
    req.session.data.caseStageC2     = 'terminate';
    req.session.data.caseStatusC2    = 'Terminated';
    req.session.data.caseStatusTagC2 = 'govuk-tag govuk-tag--red';
  }
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});

router.get('/amendConf1C2', function (req, res) {
  // Proceeds with amendment if confirmed, otherwise cancels back to tasklist
  if (req.session.data.aConfC2 === 'yes') {
    res.redirect('/FRPS-D2/case2/tasklist-stage');
  } else {
    res.redirect('/amendReturn1C2');
  }
});

// --- Amendment flow ---

makeAmendRoute('/amend1C2', {
  decisionKey: 'decisionAmC2',
  stageKey:    'caseStageC2',
  statusKey:   'caseStatusC2',
  tagKey:      'caseStatusTagC2',
  redirectTo:  '/FRPS-D2/case2/tasklist-stage',
});

router.get('/amend2C2', function (req, res) {
  // Closes case2 via amendment submission
  req.session.data.caseStageC2     = 'amendment_submitted';
  req.session.data.caseStatusC2    = 'Case close by amendment';
  req.session.data.caseStatusTagC2 = 'govuk-tag govuk-tag--orange';
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});

// --- Agreement sent ---

makeAgreementSentRoute('/aggSent2C2', {
  decisionKey:     'decisionAgC2',
  rawNoteKey:      'agreeNoteC2',
  filteredNoteKey: 'filteredAggNoteC2',
  stageKey:        'caseStageC2',
  statusKey:       'caseStatusC2',
  tagKey:          'caseStatusTagC2',
  onSentRedirect:  '/tasklistStage2C2',
  defaultRedirect: '/FRPS-D2/case2/tasklist-stage',
});

// --- Termination flow ---

router.get('/terminate1C2', function (req, res) {
  // Begins termination process for case2
  req.session.data.caseStageC2     = 'pending-termination';
  req.session.data.caseStatusC2    = 'Preparing to terminate';
  req.session.data.caseStatusTagC2 = 'govuk-tag govuk-tag--orange';
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});

router.get('/terminatePrepC2', function (req, res) {
  // Routes termination preparation outcome: confirm page, end process, or default
  const d = req.session.data;
  switch (d.decisionTrC2) {
  case 'Terminate agreement':
    d.filteredTrNoteC2 = stripEmptyAndNulls(d.terminateNoteC2);
    return res.redirect('/FRPS-D2/case2/terminate-confirm');
  case 'End termination process':
    d.caseStageC2     = 'pay';
    d.caseStatusC2    = 'Agreement accepted';
    d.caseStatusTagC2 = 'govuk-tag govuk-tag--green';
    return res.redirect('/FRPS-D2/case2/tasklist-stage');
  }
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});

// --- Termination task routes ---

const D2C2T = '/FRPS-D2/case2/tasklist-stage';

// Note: original task1TrT2C2 default branch used wrong keys (terminateTagC2/terminateStatusC2). Fixed to terminate1TagC2/terminate1StatusC2.
makeTaskRoute('/task1TrT2C2', {
  checkedKey:        'terminateCheckedC2',
  decisionKey:       'decisionTerminateTask1C2',
  noteActionKey:     'noteActionTerminateTask1C2',
  tagKey:            'terminate1TagC2',
  statusKey:         'terminate1StatusC2',
  rawNoteKey:        'task1TrNoteC2',
  filteredNoteKey:   'filteredNote1TrC2',
  rawNoteKey2:       'task1TrNote2C2',
  filteredNoteKey2:  'filteredNote1Tr_2C2',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task2TrT2C2', {
  decisionKey:       'decisionTerminateTask2C2',
  noteActionKey:     'noteActionTerminateTask2C2',
  tagKey:            'terminate2TagC2',
  statusKey:         'terminate2StatusC2',
  rawNoteKey:        'task2TrNoteC2',
  filteredNoteKey:   'filteredNote2TrC2',
  rawNoteKey2:       'task2TrNote2C2',
  filteredNoteKey2:  'filteredNote2Tr_2C2',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C2T,
});

// --- Task review routes ---

// Note: task5T2C2 and task6T2C2 use 'detailsChecked' (not detailsCheckedC2) — preserved from original.
makeTaskRoute('/task1T2C2', {
  checkedKey:        'detailsCheckedC2',
  decisionKey:       'decisionTask1C2',
  noteActionKey:     'noteActionTask1C2',
  tagKey:            'detailsTagC2',
  statusKey:         'detailsStatusC2',
  rawNoteKey:        'task1NoteC2',
  filteredNoteKey:   'filteredNote1C2',
  rawNoteKey2:       'task1Note2C2',
  filteredNoteKey2:  'filteredNote1_2C2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task2T2C2', {
  checkedKey:        'detailsCheckedC2',
  decisionKey:       'decisionTask2C2',
  noteActionKey:     'noteActionTask2C2',
  tagKey:            'calcsTagC2',
  statusKey:         'calcsStatusC2',
  rawNoteKey:        'task2NoteC2',
  filteredNoteKey:   'filteredNote2C2',
  rawNoteKey2:       'task2Note2C2',
  filteredNoteKey2:  'filteredNote2_2C2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task3T2C2', {
  checkedKey:        'detailsCheckedC2',
  decisionKey:       'decisionTask3C2',
  noteActionKey:     'noteActionTask3C2',
  tagKey:            'sssiTagC2',
  statusKey:         'sssiStatusC2',
  rawNoteKey:        'task3NoteC2',
  filteredNoteKey:   'filteredNote3C2',
  rawNoteKey2:       'task3Note2C2',
  filteredNoteKey2:  'filteredNote3_2C2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task5T2C2', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask5C2',
  noteActionKey:     'noteActionTask5C2',
  tagKey:            'paymentTagC2',
  statusKey:         'paymentStatusC2',
  rawNoteKey:        'task5NoteC2',
  filteredNoteKey:   'filteredNote5C2',
  rawNoteKey2:       'task5Note2C2',
  filteredNoteKey2:  'filteredNote5_2C2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task6T2C2', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask6C2',
  noteActionKey:     'noteActionTask6C2',
  tagKey:            'budgetTagC2',
  statusKey:         'budgetStatusC2',
  rawNoteKey:        'task6NoteC2',
  filteredNoteKey:   'filteredNote6C2',
  rawNoteKey2:       'task6Note2C2',
  filteredNoteKey2:  'filteredNote6_2C2',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C2T,
});

// --- Case assignment ---

router.get('/caselistTeam2C2', function (req, res) {
  // Marks case2 as assigned and returns to caselist
  req.session.data.caseAssignedC2 = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/setUserFo2C2', function (req, res) {
  // Assigns finance officer role for case2
  req.session.data.financeOfficerC2 = 'yes';
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});

// --- Amendment task routes ---

makeTaskRoute('/task1T2AmC2', {
  decisionKey:       'decisionTaskAm1C2',
  noteActionKey:     'noteActionTaskAm1C2',
  tagKey:            'amend1TagC2',
  statusKey:         'amend1StatusC2',
  rawNoteKey:        'task1AmNoteC2',
  filteredNoteKey:   'filteredNoteAm1C2',
  rawNoteKey2:       'task1_2AmNoteC2',
  filteredNoteKey2:  'filteredNoteAm1_2C2',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task2T2AmC2', {
  decisionKey:       'decisionTaskAm2C2',
  noteActionKey:     'noteActionTaskAm2C2',
  tagKey:            'amend2TagC2',
  statusKey:         'amend2StatusC2',
  rawNoteKey:        'task2AmNoteC2',
  filteredNoteKey:   'filteredNoteAm2C2',
  rawNoteKey2:       'task2_2AmNoteC2',
  filteredNoteKey2:  'filteredNoteAm2_2C2',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task3T2AmC2', {
  decisionKey:       'decisionTaskAm3C2',
  noteActionKey:     'noteActionTaskAm3C2',
  tagKey:            'amend3TagC2',
  statusKey:         'amend3StatusC2',
  rawNoteKey:        'task3AmNoteC2',
  filteredNoteKey:   'filteredNoteAm3C2',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C2T,
});

// --- Agreement progression ---

router.get('/agreementStage2C2', function (req, res) {
  // Unlocks the agreement tab in the case2 navigation
  req.session.data.agreementStage = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

// --- Agreement task routes ---

makeTaskRoute('/task1AgT2C2', {
  checkedKey:        'AgreeCheckedC2',
  decisionKey:       'decisionAgreeTask1C2',
  noteActionKey:     'noteActionAgreeTask1C2',
  tagKey:            'agreeTagC2',
  statusKey:         'agreeStatusC2',
  rawNoteKey:        'task1ANoteC2',
  filteredNoteKey:   'filteredNote1AC2',
  rawNoteKey2:       'task1ANote2C2',
  filteredNoteKey2:  'filteredNote1A_2C2',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task2AgT2C2', {
  decisionKey:       'decisionAgreeTask2C2',
  noteActionKey:     'noteActionAgreeTask2C2',
  tagKey:            'agreeSTagC2',
  statusKey:         'agreeSStatusC2',
  rawNoteKey:        'task2ANoteC2',
  filteredNoteKey:   'filteredNoteA2C2',
  rawNoteKey2:       'task2ANote2C2',
  filteredNoteKey2:  'filteredNote2A_2C2',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C2T,
});

// --- Agreement signing ---

router.get('/setAgreeSign2C2', function (req, res) {
  // Records customer signature and advances case2 status
  req.session.data.caseStatusC2 = 'Agreement accepted';
  res.redirect('/tasklistStage2C2');
});

// --- Stage progression ---

router.get('/startC2', function (req, res) {
  // Resets case2 to the start stage (used when re-entering a completed case)
  req.session.data.caseStageC2     = 'start';
  req.session.data.caseStatusC2    = 'Application received';
  req.session.data.caseStatusTagC2 = 'govuk-tag govuk-tag--grey';
  req.session.data.stageCountC2    = 1;
  res.redirect('/FRPS-D2/caselist');
});

makeStageRoute('/tasklistStage2C2', {
  stageCountKey:    'stageCountC2',
  stageKey:         'caseStageC2',
  statusKey:        'caseStatusC2',
  tagKey:           'caseStatusTagC2',
  firstRedirect:    '/FRPS-D2/caselist',
  tasklistRedirect: '/FRPS-D2/case2/tasklist-stage',
});

// --- 5-month checks ---

router.get('/5month1C2', function (req, res) {
  // Transitions case2 into the 5-month check phase
  req.session.data.caseStatusC2 = '5 month checks';
  req.session.data.caseStageC2  = '5month';
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});

makeTaskRoute('/task5m1C2', {
  decisionKey:       'decisionTask1mC2',
  noteActionKey:     'noteActionTask1mC2',
  tagKey:            'month5_1TagC2',
  statusKey:         'month5_1StatusC2',
  rawNoteKey:        'task1mNoteC2',
  filteredNoteKey:   'filteredNote1mC2',
  rawNoteKey2:       'task1mNote2C2',
  filteredNoteKey2:  'filteredNote1m_2C2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task5m2C2', {
  decisionKey:       'decisionTask2mC2',
  noteActionKey:     'noteActionTask2mC2',
  tagKey:            'month5_2TagC2',
  statusKey:         'month5_2StatusC2',
  rawNoteKey:        'task2mNoteC2',
  filteredNoteKey:   'filteredNote2mC2',
  rawNoteKey2:       'task2mNote2C2',
  filteredNoteKey2:  'filteredNote2m_2C2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task5m3C2', {
  decisionKey:       'decisionTask3mC2',
  noteActionKey:     'noteActionTask3mC2',
  tagKey:            'month5_3TagC2',
  statusKey:         'month5_3StatusC2',
  rawNoteKey:        'task3mNoteC2',
  filteredNoteKey:   'filteredNote3mC2',
  rawNoteKey2:       'task3mNote2C2',
  filteredNoteKey2:  'filteredNote3m_2C2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task5m4C2', {
  decisionKey:       'decisionTask4mC2',
  noteActionKey:     'noteActionTask4mC2',
  tagKey:            'month5_4TagC2',
  statusKey:         'month5_4StatusC2',
  rawNoteKey:        'task4mNoteC2',
  filteredNoteKey:   'filteredNote4mC2',
  rawNoteKey2:       'task4mNote2C2',
  filteredNoteKey2:  'filteredNote4m_2C2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task5m5C2', {
  decisionKey:       'decisionTask5mC2',
  noteActionKey:     'noteActionTask5mC2',
  tagKey:            'month5_5TagC2',
  statusKey:         'month5_5StatusC2',
  rawNoteKey:        'task5mNoteC2',
  filteredNoteKey:   'filteredNote5mC2',
  rawNoteKey2:       'task5mNote2C2',
  filteredNoteKey2:  'filteredNote5m_2C2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C2T,
});

makeTaskRoute('/task5m6C2', {
  decisionKey:       'decisionTask6mC2',
  noteActionKey:     'noteActionTask6mC2',
  tagKey:            'month5_6TagC2',
  statusKey:         'month5_6StatusC2',
  rawNoteKey:        'task6mNoteC2',
  filteredNoteKey:   'filteredNote6mC2',
  rawNoteKey2:       'task6mNote2C2',
  filteredNoteKey2:  'filteredNote6m_2C2',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C2T,
});

// --- Utility routes ---

router.get('/caselistResults1', function (req, res) {
  // Marks linked case results as visible and returns to caselist
  req.session.data.linkedCase  = 'yes';
  req.session.data.caseResults = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/endTerminateC2', function (req, res) {
  // Ends termination process and restores case2 to 'Agreement accepted' if confirmed
  if (req.session.data.terminateDecision === 'yes') {
    req.session.data.caseStageC2     = 'pay';
    req.session.data.caseStatusC2    = 'Agreement accepted';
    req.session.data.caseStatusTagC2 = 'govuk-tag govuk-tag--green';
  }
  res.redirect('/FRPS-D2/case2/tasklist-stage');
});
