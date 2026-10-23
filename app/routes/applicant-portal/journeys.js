// Applicant portal prototype: the in-portal mini journeys and which button or link opens each.
// `next` moves the case to another phase once the journey is done and no other to-do remains
// in the current phase. `force` moves it straight away (withdraw, reject, amend).

const GENERIC_UPLOAD = { type: 'file', name: 'file', label: 'Upload a file', hint: 'PDF, JPG or PNG, up to 10MB' }

const JOURNEYS = {
  reply: {
    title: 'Reply to our query', button: 'Send reply', banner: 'Your reply has been sent.',
    intro: 'Answer the question in our message. You can add a file if it helps.',
    fields: [{ type: 'textarea', name: 'reply', label: 'Your reply' }, Object.assign({}, GENERIC_UPLOAD, { label: 'Add a file (optional)' })],
    next: { w2: 'w1', g2: 'g1', g7: 'g6' }
  },
  upload: {
    title: 'Upload evidence', button: 'Upload', banner: 'Your evidence has been uploaded.',
    intro: 'Upload the evidence we asked for.',
    fields: [{ type: 'radios', name: 'evType', label: 'What are you uploading?', options: ['Supplier quote', 'Invoice or receipt', 'Photographs', 'Map or land document', 'Other'] }, GENERIC_UPLOAD],
    next: { w2: 'w1', w6b: 'w7' }
  },
  land: {
    title: 'Update your land details', button: 'I have updated my land details', banner: 'Thanks. We will re-run the land checks.',
    kind: 'linkout', out: 'Farm and Land Service',
    intro: 'Changes to land parcels and maps are made in the Farm and Land Service. In the real service this opens in a new tab and brings you back here when you finish.',
    next: { g2: 'g1' }
  },
  resubmit: {
    title: 'Amend and resubmit your application', button: 'Resubmit application', banner: 'Your amended application has been submitted.',
    kind: 'linkout', out: 'the application',
    intro: 'This opens the new draft in the application. Make the changes we asked for, then resubmit. Prototype shortcut: this page stands in for that flow.',
    next: { w3: 'w1', g3: 'g1' }
  },
  accept: {
    title: 'Review and accept your agreement', button: 'Confirm', banner: 'You accepted your agreement.',
    intro: 'Read your agreement before you decide. You have until the offer expires.',
    fields: [{ type: 'radios', name: 'decision', label: 'Do you accept this agreement?', options: ['Yes, I accept the agreement', 'No, I reject the agreement'] }],
    rejectOn: 'No, I reject',
    next: { w5: 'w6', g4: 'g5' }
  },
  start: {
    title: 'Tell us your project has started', button: 'Confirm', banner: 'Thanks. We have recorded your project start date.',
    fields: [{ type: 'text', name: 'startDate', label: 'Date the project started', hint: 'For example, 14 9 2026', width: 'govuk-input--width-10' }],
    next: { w6: 'w6b' }
  },
  claim: {
    title: 'Submit your claim', button: 'Submit claim', banner: 'Your claim has been submitted. We aim to pay complete claims within 60 working days.',
    intro: 'Minimum claim £2,000. You cannot claim more than 85% of the grant before the final claim.',
    fields: [{ type: 'text', name: 'amount', label: 'Amount you are claiming (£)', width: 'govuk-input--width-10' }, Object.assign({}, GENERIC_UPLOAD, { label: 'Upload invoices and redacted bank statements' }),
      { type: 'checkboxes', name: 'conf', label: 'Declaration', options: ['I confirm the costs were paid from my business account after the agreement start date'] }],
    next: { w7: 'w8' }
  },
  report: {
    title: 'Submit your progress report', button: 'Submit report', banner: 'Your progress report has been submitted.',
    fields: [{ type: 'textarea', name: 'progress', label: 'Describe progress against your agreed outputs' }, GENERIC_UPLOAD],
    next: { w7: 'w8' }
  },
  monitor: {
    title: 'Post-payment monitoring report', button: 'Submit report', banner: 'Your monitoring report has been submitted.',
    fields: [{ type: 'textarea', name: 'monitoring', label: 'Report on your outputs and conditions' }]
  },
  declare: {
    title: 'Make your annual declaration', button: 'Submit declaration', banner: 'Your annual declaration has been submitted. Your held payment will be released.',
    fields: [{ type: 'checkboxes', name: 'dec', label: 'I declare that', options: ['I have carried out the actions in my agreement', 'I have kept the records the agreement requires', 'My land and business details are up to date'] }]
  },
  variation: {
    title: 'Request a change to your agreement', button: 'Send request', banner: 'Your request has been sent. We will reply by email. Do not make the change until we confirm.',
    fields: [{ type: 'select', name: 'what', label: 'What do you want to change?', options: ['A different supplier', 'A different item or design', 'The claim schedule', 'Ownership of the business', 'Something else'] }, { type: 'textarea', name: 'why', label: 'Why do you need the change?' }]
  },
  exceptional: {
    title: 'Report exceptional circumstances', button: 'Send report', banner: 'Your report has been sent.',
    intro: 'Tell us within 8 weeks of the event.',
    fields: [{ type: 'text', name: 'eventDate', label: 'When did it happen?', width: 'govuk-input--width-10' }, { type: 'textarea', name: 'what', label: 'What happened?' }, GENERIC_UPLOAD]
  },
  change: {
    title: 'Report a change to your land or business', button: 'Send', banner: 'Your change has been reported.',
    fields: [{ type: 'radios', name: 'chg', label: 'What has changed?', options: ['I am selling or leasing out land in this agreement', 'I have taken on more land', 'My business details have changed', 'Something else'] }, { type: 'textarea', name: 'detail', label: 'Give details' }],
    warning: 'If you transfer land out of an agreement we may need to recover some or all of the payments made for it.'
  },
  withdraw: {
    title: 'Withdraw your application', button: 'Confirm', banner: null, forceTo: { water: 'w9', grass: 'g10' }, reason: 'Withdrawn by you',
    intro: 'Withdrawing closes this application. You cannot undo this.',
    fields: [{ type: 'radios', name: 'sure', label: 'Are you sure you want to withdraw?', options: ['Yes, withdraw my application', 'No, keep my application'] }],
    yesOn: 'Yes'
  },
  amend: {
    title: 'Amend your application', button: 'Confirm', banner: null, forceTo: { grass: 'g3' },
    intro: 'Amending withdraws this application and opens a copy for you to change and resubmit. Checks will start again once you resubmit.',
    fields: [{ type: 'radios', name: 'sure', label: 'Do you want to amend this application?', options: ['Yes, amend this application', 'No, keep it as it is'] }],
    yesOn: 'Yes'
  },
  reject: {
    title: 'Reject this offer', button: 'Confirm', banner: null, forceTo: { water: 'w9', grass: 'g10' }, reason: 'You rejected the offer',
    intro: 'Rejecting the offer ends this application. You cannot undo this.',
    fields: [{ type: 'radios', name: 'sure', label: 'Are you sure you want to reject this offer?', options: ['Yes, reject the offer', 'No, go back'] }],
    yesOn: 'Yes'
  },
  successor: {
    title: 'Start a successor application', button: 'Back to your agreement', banner: null,
    kind: 'linkout', out: 'the application', intro: 'In the real service this opens the Grasslands application, with your agreement details carried across. This prototype stops here.'
  }
}

// label on a button or link -> journey key. Anything not listed opens the "not in this prototype" page.
const ACTIONS = {
  'Reply to query': 'reply', 'Read the full message': null,
  'Upload evidence': 'upload', 'Upload evidence for an action': 'upload',
  'Update land details': 'land',
  'Continue your application': 'resubmit', 'Continue amended application': 'resubmit',
  'Review and sign your agreement': 'accept', 'Accept your proposed agreement': 'accept',
  'Tell us your project has started': 'start',
  'Submit claim 1': 'claim', 'Start progress report': 'report', 'Start monitoring report': 'monitor',
  'Make your annual declaration': 'declare',
  'Request a variation': 'variation', 'Request a change to your agreement': 'variation',
  'Report exceptional circumstances': 'exceptional', 'Report a change to your land or business': 'change',
  'Withdraw your application': 'withdraw', 'Amend your application': 'amend', 'Reject this offer': 'reject',
  'Start your application': 'successor'
}

module.exports = { JOURNEYS, ACTIONS }
