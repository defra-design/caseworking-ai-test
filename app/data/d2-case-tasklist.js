//
// FRPS-D2 main case tasklist — data model
//
// Captures the stages, tasks, decision points, link text and conditional copy
// extracted from app/views/FRPS-D2/tasklist-stage.html so the same content can
// be driven from a single source.
//
// Shape:
//   tasks                 — task definitions (link text, href, status/decision fields)
//   decisionOptions.<key> — radio options + conditional text + visibility rules
//   stages.<caseStage>    — what to render when data.caseStage === <key>
//

module.exports = {

  // ----------------------------------------------------------------------
  // Reusable task definitions
  // ----------------------------------------------------------------------
  tasks: {

    // Application review tasks (used in: start, review, on-hold)
    'check-customer-details': {
      linkText: 'Check customer details',
      href: 'task-1',
      decisionField: 'decisionTask1',
      acceptedValue: 'Accepted',
      statusField: 'detailsStatus',
      tagField: 'detailsTag'
    },
    'review-land-parcel-calculations': {
      linkText: 'Review land parcel rule calculations',
      // Note: in the on-hold stage this label is "Review land parcel rule checks"
      altLinkText: { onHold: 'Review land parcel rule checks' },
      href: 'task-2',
      decisionField: 'decisionTask2',
      acceptedValue: 'Accepted',
      statusField: 'calcsStatus',
      tagField: 'calcsTag'
    },
    'sssi-check': {
      linkText: 'Check for requests of planned activity on a SSSI',
      // Note: in the on-hold stage this label is "Check if SSSI consent has been requested"
      altLinkText: { onHold: 'Check if SSSI consent has been requested' },
      href: 'task-3',
      decisionField: 'decisionTask3',
      acceptedValue: 'Accepted',
      statusField: 'sssiStatus',
      tagField: 'sssiTag'
    },
    'check-payment-amount': {
      linkText: 'Check payment amount',
      href: 'task-5',
      decisionField: 'decisionTask5',
      acceptedValue: 'Accepted',
      statusField: 'paymentStatus',
      tagField: 'paymentTag'
    },
    'finance-officer-review': {
      linkText: 'Review scheme budget as a finance officer',
      // href is conditional: task-6-fo if data.financeOfficer === 'yes', else task-6
      hrefIfFinanceOfficer: 'task-6-fo',
      href: 'task-6',
      decisionField: 'decisionTask6',
      acceptedValue: 'Accepted',
      statusField: 'budgetStatus',
      tagField: 'budgetTag'
    },

    // Agreement stage tasks
    'check-draft-agreement': {
      linkText: 'Check draft funding agreement',
      href: 'task-1Ag',
      decisionField: 'decisionAgreeTask1',
      acceptedValue: 'Confirm',
      statusField: 'agreeStatus',
      tagField: 'agreeTag'
    },
    'notify-customer-draft-agreement': {
      linkText: 'Notify customer that draft agreement is ready',
      href: 'task-2Ag',
      decisionField: 'decisionAgreeTask2',
      acceptedValue: 'Confirm',
      statusField: 'agreeSStatus',
      tagField: 'agreeSTag'
    },

    // 5-month payment control tasks
    'month5-failed-parcels': {
      linkText: 'Check failed land parcel calculations',
      href: 'task-5m1',
      decisionField: 'decisionTask1m',
      acceptedValue: 'No action needed',
      statusField: 'month5_1Status',
      tagField: 'month5_1Tag'
    },
    'month5-parcels-linked': {
      linkText: 'Confirm land parcels are linked to customer',
      href: 'task-5m2',
      decisionField: 'decisionTask2m',
      acceptedValue: 'No action needed',
      statusField: 'month5_2Status',
      tagField: 'month5_2Tag'
    },
    'month5-no-overlap': {
      linkText: 'Confirm no overlapping agreements',
      href: 'task-5m3',
      decisionField: 'decisionTask3m',
      acceptedValue: 'No action needed',
      statusField: 'month5_3Status',
      tagField: 'month5_3Tag'
    },
    'month5-ite-required': {
      linkText: 'Check if ITE assessment is required',
      href: 'task-5m4',
      decisionField: 'decisionTask4m',
      acceptedValue: 'No action needed',
      statusField: 'month5_4Status',
      tagField: 'month5_4Tag'
    },
    'month5-hedge-tolerance': {
      linkText: 'Confirm action is within hedge tolerance',
      href: 'task-5m5',
      decisionField: 'decisionTask5m',
      acceptedValue: 'No action needed',
      statusField: 'month5_5Status',
      tagField: 'month5_5Tag'
    },
    'month5-hedgerow-cs-conflict': {
      linkText: 'Confirm no CS conflict with hedgerows',
      href: 'task-5m6',
      decisionField: 'decisionTask6m',
      acceptedValue: 'No action needed',
      statusField: 'month5_6Status',
      tagField: 'month5_6Tag'
    }
  },

  // ----------------------------------------------------------------------
  // Reusable decision option groups
  // ----------------------------------------------------------------------
  // Each option may declare a `showWhen` predicate string referencing data.* —
  // mirrors the conditional rendering in the original template.
  decisionOptions: {

    // Application-stage decision (review)
    appReview: {
      legend: 'Decision',
      formField: 'decision1',
      conditionalNoteField: 'reviewNote',
      conditionalHint: 'You must include an explanation for auditing purposes.',
      returnConditionalHint: 'You must include a reason for returning to customer.',
      options: [
        {
          value: 'Approve',
          label: 'Approve',
          showWhen: "data.decisionTask1 === 'Accepted' && data.decisionTask2 === 'Accepted' && data.decisionTask3 === 'Accepted' && data.decisionTask5 === 'Accepted' && data.decisionTask6 === 'Accepted'"
        },
        { value: 'Put on hold', label: 'Put on hold' },
        { value: 'Return', label: 'Return to customer', conditionalHintOverride: 'returnConditionalHint' },
        { value: 'Reject', label: 'Reject' },
        { value: 'Withdraw', label: 'Withdraw' }
      ]
    },

    // Draft agreement decision
    agreement: {
      legend: 'Decision',
      formField: 'decisionAg',
      conditionalNoteField: 'agreeNote',
      conditionalHint: 'You must include an explanation for auditing purposes.',
      options: [
        {
          value: 'Agreement sent',
          label: 'Agreement sent',
          // Only rendered once both agreement tasks have been actioned
          showWhen: 'data.decisionAgreeTask2'
        },
        { value: 'Reject', label: 'Reject' },
        { value: 'Withdraw', label: 'Withdraw' }
      ]
    },

    // Decision shown after amendment has been sent to customer
    amendmentSent: {
      legend: 'Decision',
      formField: 'decisionAm',
      conditionalNoteField: 'moreDetail2',
      conditionalHint: 'You must include an explanation for auditing purposes.',
      options: [
        { value: 'Amendment recinded', label: 'Remove from Amendment state' },
        { value: 'Reject', label: 'Reject' },
        { value: 'Withdraw', label: 'Withdraw' }
      ]
    },

    // 5-month payment control decision
    fiveMonth: {
      legend: 'Decision',
      legendHint: 'You can pause and reschedule payments when putting a case on hold.',
      formField: 'decision5m',
      conditionalNoteField: 'moreDetail3',
      conditionalHint: 'You must include an explanation for auditing purposes.',
      options: [
        { value: 'No action', label: 'No action needed' },
        { value: 'On hold', label: 'Put on hold' },
        { value: 'Withdraw', label: 'Withdraw agreement' }
      ]
    }
  },

  // ----------------------------------------------------------------------
  // Stages — keyed by the value of data.caseStage
  // ----------------------------------------------------------------------
  stages: {

    // Pre-start: case has been received but caseworker has not yet pressed Start
    start: {
      heading: 'Tasks',
      intro: 'You cannot complete any tasks until you start the case.',
      taskListHeading: null,
      tasks: [
        'check-customer-details',
        'review-land-parcel-calculations',
        'sssi-check',
        'check-payment-amount',
        'finance-officer-review'
      ],
      defaultStatusTag: { class: 'govuk-tag govuk-tag--grey', text: 'Ready to start' },
      decision: null,
      action: { type: 'link-button', text: 'Start', href: '/tasklistStage2' }
    },

    // Application review — caseworker is reviewing tasks and making a final decision
    review: {
      heading: 'Tasks',
      intro: 'You cannot approve the application until all tasks have been accepted.',
      taskListHeading: 'Application review tasks',
      tasks: [
        'check-customer-details',
        'review-land-parcel-calculations',
        'sssi-check',
        'check-payment-amount',
        'finance-officer-review'
      ],
      defaultStatusTag: { class: 'govuk-tag govuk-tag--blue', text: 'Incomplete' },
      decision: 'appReview',
      form: { action: '/app-approve2', method: 'post' },
      action: { type: 'submit-button', text: 'Confirm' }
    },

    // Application on hold — same task list, no decision form
    'on-hold': {
      heading: 'Tasks',
      intro: 'You cannot do any work on tasks whilst the case is on hold.',
      taskListHeading: 'Application review tasks',
      tasks: [
        'check-customer-details',
        // task labels differ in this stage — see altLinkText.onHold above
        'review-land-parcel-calculations',
        'sssi-check',
        'check-payment-amount',
        'finance-officer-review'
      ],
      taskLabelVariant: 'onHold',
      defaultStatusTag: { class: 'govuk-tag govuk-tag--blue', text: 'Incomplete' },
      decision: null,
      form: { action: '/resume2', method: 'post' },
      action: { type: 'submit-button', text: 'Resume' }
    },

    // Draft agreement — agreement tasks + agreement decision
    agree: {
      heading: 'Tasks',
      intro: 'Draft agreement is live and can be accepted by the customer.',
      taskListHeading: 'Draft agreement review tasks',
      tasks: [
        'check-draft-agreement',
        'notify-customer-draft-agreement'
      ],
      defaultStatusTag: { class: 'govuk-tag govuk-tag--blue', text: 'Incomplete' },
      decision: 'agreement',
      form: { action: '/aggSent2', method: 'post' },
      action: { type: 'submit-button', text: 'Confirm' }
    },

    // Application is being amended in Grants-UI (no tasks)
    amend: {
      heading: 'Amending application',
      paragraphs: [
        'Application 100300 has now been withdrawn.',
        'A new application will be submitted after amendments have been made in Grants-UI'
      ],
      links: [
        { text: 'Amend this application in Grants-UI (opens in new tab)', href: '#' }
      ],
      tasks: [],
      decision: null,
      action: null
    },

    // Application returned to customer (no tasks)
    return: {
      heading: 'Application returned to customer for amending',
      paragraphs: [
        'Application 100300 has been closed and returned to the customer. However, you can still review the notes and timeline for this application.',
        'A new, linked application will be submitted after amendments have been made by the customer.'
      ],
      tasks: [],
      decision: null,
      action: null
    },

    // Amendment has been sent to customer; only rescind / reject / withdraw decisions remain
    amendment_sent: {
      heading: 'Amended application with customer for review',
      banner: {
        type: 'success',
        title: 'Amendment sent',
        body: 'There is nothing more you need to do.'
      },
      intro: 'You can still make a decision on this case until the customer has submitted their amended application.',
      paragraphs: [ 'There are no tasks to complete.' ],
      tasks: [],
      decision: 'amendmentSent',
      form: { action: 'confirmation', method: 'post' },
      action: { type: 'submit-button', text: 'Confirm' }
    },

    // Agreement sent and waiting for customer; only withdraw is available
    agree2: {
      heading: 'Agreement with customer for review',
      banner: {
        type: 'success',
        title: 'Agreement sent',
        body: 'There is nothing more you need to do.'
      },
      intro: 'You can still withdraw the agreement until the customer has accepted or rejected.',
      paragraphs: [ 'There are no tasks to complete.' ],
      tasks: [],
      withdrawSection: {
        heading: 'You can still withdraw this agreement',
        leadingText: 'You may want to withdraw this agreement if:',
        bullets: [
          'the customer needs to update their application',
          'the customer has not responded to the agreement offer within 10 working days',
          'there is an error in the agreement'
        ],
        reasonHeading: 'Reason for withdrawal',
        reasonHint: 'You must include an explanation for auditing purposes.',
        reasonField: 'case4Note',
        action: { type: 'submit-button', text: 'Withdraw', variant: 'secondary' }
      },
      form: { action: 'confirmation', method: 'post' },
      decision: null
    },

    // 5-month payment control tasks
    '5month': {
      heading: 'Payment control tasks (5 months)',
      intro: 'Agreement is live. However, you need to check the land parcel calculations have not changed.',
      taskListHeading: 'Payment control tasks (5 months)',
      tasks: [
        'month5-failed-parcels',
        'month5-parcels-linked',
        'month5-no-overlap',
        'month5-ite-required',
        'month5-hedge-tolerance',
        'month5-hedgerow-cs-conflict'
      ],
      defaultStatusTag: { class: 'govuk-tag govuk-tag--blue', text: 'Incomplete' },
      decision: 'fiveMonth',
      form: { action: '/month5_1', method: 'post' },
      action: { type: 'submit-button', text: 'Confirm' }
    },

    // Post-agreement monitoring (no tasks defined yet)
    pay: {
      heading: 'Post-agreement monitoring and compliance tasks',
      paragraphs: [ 'There are no tasks to complete yet.' ],
      tasks: [],
      decision: null,
      action: null
    },

    // Application withdrawn (no tasks)
    withdraw: {
      heading: 'Application withdrawn',
      paragraphs: [ 'There are no tasks to complete.' ],
      tasks: [],
      decision: null,
      action: null
    },

    // Application rejected (no tasks)
    reject: {
      heading: 'Application rejected',
      paragraphs: [ 'There are no tasks to complete.' ],
      tasks: [],
      decision: null,
      action: null
    },

    // Original case closed because amendment was submitted
    amendment_submitted: {
      heading: 'This case was closed due to an amendment being submitted',
      paragraphs: [ 'There are no tasks to complete.' ],
      tasks: [],
      decision: null,
      action: null
    }
  },

  // ----------------------------------------------------------------------
  // Helpers — describe how status / tag fields are interpreted at render time
  // ----------------------------------------------------------------------
  // For each task: if data[task.decisionField] is set:
  //   if it equals task.acceptedValue          → render plain data[task.statusField]
  //   else                                     → wrap data[task.statusField] in <strong class="data[task.tagField]">
  // otherwise                                  → render the stage's defaultStatusTag.
  //
  // For finance-officer-review the link href is data.financeOfficer === 'yes'
  //   ? task.hrefIfFinanceOfficer : task.href.
}
