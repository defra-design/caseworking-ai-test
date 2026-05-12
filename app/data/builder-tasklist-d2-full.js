// D2 case journey, expressed in the builder's data format.
// Loadable via /builder/loader. Task page titles and pre-outcomes HTML
// mirror the live FRPS-D2 task pages (task-1, task-2, task-3, task-5, task-6,
// task-1Ag, task-2Ag, task-5m1..task-5m6).
module.exports = {
  tasks: {
    // ---------- S1 (Application received) — 5 tasks ----------
    S1T1: { pageTitle: "Customer details review", preOutcomesHtml: "<ol class=\"govuk-list govuk-list--number\"><li>Go to <a href=\"application\" class=\"govuk-link\">Application</a> to view submitted customer details.</li><li>Check the submitted details match the details and permissions on the <a href=\"#\" class=\"govuk-link\">Rural Payments service (RPS)</a>.</li><li>Come back to this page and confirm if the details match.</li></ol>", href: "S1T1", decisionField: "S1T1Outcome", acceptedValue: "Accepted", statusField: "S1T1Status", tagField: "S1T1Tag" },
    S1T2: { pageTitle: "Review land parcel calculations", preOutcomesHtml: "<ol class=\"govuk-list govuk-list--number\"><li>Go to <a href=\"calculations2\" class=\"govuk-link\">calculations</a> to view automated checks against the customer’s land parcels and actions.</li><li>Check for failures and resolve these by:<ul class=\"govuk-list govuk-list--bullet\"><li>requesting information from the customer</li><li>running the calculations again</li></ul></li></ol>", href: "S1T2", decisionField: "S1T2Outcome", acceptedValue: "Accepted", statusField: "S1T2Status", tagField: "S1T2Tag" },
    S1T3: { pageTitle: "Check notice of planned activity for site of special scientific interest (SSSI) has been requested", preOutcomesHtml: "<p class=\"govuk-body\">Land parcels within this application, intersect with at least one SSSI. You can see which land parcels in the <a href=\"application\" class=\"govuk-link\">application</a>.</p><p class=\"govuk-body\">Check if a notice of planned activity has been submitted to Natural England.</p><p class=\"govuk-body\">Consent does not have to be issued to accept. The notice of planned activity only has to have been received by Natural England.</p><p class=\"govuk-body\"><a href=\"#\" class=\"govuk-link\">View SSSI request spreadsheet</a></p>", href: "S1T3", decisionField: "S1T3Outcome", acceptedValue: "Accepted", statusField: "S1T3Status", tagField: "S1T3Tag" },
    S1T4: { pageTitle: "Check payment amount", preOutcomesHtml: "<p class=\"govuk-body\">To check payment amount:</p><ol class=\"govuk-list govuk-list--number\"><li>Check the payment section of the <a href=\"application\" class=\"govuk-link\">application</a> and make a note of the:<ul class=\"govuk-list govuk-list--bullet\"><li>hectares per funded action</li><li>annual payments per funded action</li><li>per hectare payment rate per funded action</li></ul></li><li>Search how much the funded action pays per hectare on <a href=\"https://www.gov.uk/find-funding-for-land-or-farms\" class=\"govuk-link\">Find funding for land or farms</a> — check it matches the rate in the application.</li><li>Multiply the total hectares for each funded action by the payment rate per hectare.</li><li>Check your figure matches the total yearly payment in the application.</li></ol>", href: "S1T4", decisionField: "S1T4Outcome", acceptedValue: "Accepted", statusField: "S1T4Status", tagField: "S1T4Tag" },
    S1T5: { pageTitle: "Review scheme budget as a finance officer", preOutcomesHtml: "<p class=\"govuk-body\">You cannot complete this task.</p><details class=\"govuk-details govuk-!-margin-top-0 govuk-!-margin-bottom-7\"><summary class=\"govuk-details__summary\"><span class=\"govuk-details__summary-text\">Who can complete this task</span></summary><div class=\"govuk-details__text\"><p class=\"govuk-body\">Someone who is a:</p><ul class=\"govuk-list govuk-list--bullet\"><li>FINANCE_OFFICER</li><li>SENIOR_ADMIN</li></ul></div></details><p class=\"govuk-body\">You must check there is enough budget left for the total yearly payment the customer has applied for.</p><table class=\"govuk-table\"><tbody class=\"govuk-table__body\"><tr class=\"govuk-table__row\"><th scope=\"row\" class=\"govuk-table__header\">Total yearly payment applied for</th><td class=\"govuk-table__cell\">£323.17</td></tr></tbody></table><p class=\"govuk-body\"><a href=\"#\" class=\"govuk-link\">View SFI budget spreadsheet</a></p>", href: "S1T5", decisionField: "S1T5Outcome", acceptedValue: "Accepted", statusField: "S1T5Status", tagField: "S1T5Tag" },

    // ---------- S2 (Application review) — same 5 tasks ----------
    S2T1: { pageTitle: "Customer details review", preOutcomesHtml: "<ol class=\"govuk-list govuk-list--number\"><li>Go to <a href=\"application\" class=\"govuk-link\">Application</a> to view submitted customer details.</li><li>Check the submitted details match the details and permissions on the <a href=\"#\" class=\"govuk-link\">Rural Payments service (RPS)</a>.</li><li>Come back to this page and confirm if the details match.</li></ol>", href: "S2T1", decisionField: "S2T1Outcome", acceptedValue: "Accepted", statusField: "S2T1Status", tagField: "S2T1Tag" },
    S2T2: { pageTitle: "Review land parcel calculations", preOutcomesHtml: "<ol class=\"govuk-list govuk-list--number\"><li>Go to <a href=\"calculations2\" class=\"govuk-link\">calculations</a> to view automated checks against the customer’s land parcels and actions.</li><li>Check for failures and resolve these by:<ul class=\"govuk-list govuk-list--bullet\"><li>requesting information from the customer</li><li>running the calculations again</li></ul></li></ol>", href: "S2T2", decisionField: "S2T2Outcome", acceptedValue: "Accepted", statusField: "S2T2Status", tagField: "S2T2Tag" },
    S2T3: { pageTitle: "Check notice of planned activity for site of special scientific interest (SSSI) has been requested", preOutcomesHtml: "<p class=\"govuk-body\">Land parcels within this application, intersect with at least one SSSI. You can see which land parcels in the <a href=\"application\" class=\"govuk-link\">application</a>.</p><p class=\"govuk-body\">Check if a notice of planned activity has been submitted to Natural England.</p><p class=\"govuk-body\">Consent does not have to be issued to accept. The notice of planned activity only has to have been received by Natural England.</p><p class=\"govuk-body\"><a href=\"#\" class=\"govuk-link\">View SSSI request spreadsheet</a></p>", href: "S2T3", decisionField: "S2T3Outcome", acceptedValue: "Accepted", statusField: "S2T3Status", tagField: "S2T3Tag" },
    S2T4: { pageTitle: "Check payment amount", preOutcomesHtml: "<p class=\"govuk-body\">To check payment amount:</p><ol class=\"govuk-list govuk-list--number\"><li>Check the payment section of the <a href=\"application\" class=\"govuk-link\">application</a> and make a note of the:<ul class=\"govuk-list govuk-list--bullet\"><li>hectares per funded action</li><li>annual payments per funded action</li><li>per hectare payment rate per funded action</li></ul></li><li>Search how much the funded action pays per hectare on <a href=\"https://www.gov.uk/find-funding-for-land-or-farms\" class=\"govuk-link\">Find funding for land or farms</a> — check it matches the rate in the application.</li><li>Multiply the total hectares for each funded action by the payment rate per hectare.</li><li>Check your figure matches the total yearly payment in the application.</li></ol>", href: "S2T4", decisionField: "S2T4Outcome", acceptedValue: "Accepted", statusField: "S2T4Status", tagField: "S2T4Tag" },
    S2T5: { pageTitle: "Review scheme budget as a finance officer", preOutcomesHtml: "<p class=\"govuk-body\">You cannot complete this task.</p><details class=\"govuk-details govuk-!-margin-top-0 govuk-!-margin-bottom-7\"><summary class=\"govuk-details__summary\"><span class=\"govuk-details__summary-text\">Who can complete this task</span></summary><div class=\"govuk-details__text\"><p class=\"govuk-body\">Someone who is a:</p><ul class=\"govuk-list govuk-list--bullet\"><li>FINANCE_OFFICER</li><li>SENIOR_ADMIN</li></ul></div></details><p class=\"govuk-body\">You must check there is enough budget left for the total yearly payment the customer has applied for.</p><table class=\"govuk-table\"><tbody class=\"govuk-table__body\"><tr class=\"govuk-table__row\"><th scope=\"row\" class=\"govuk-table__header\">Total yearly payment applied for</th><td class=\"govuk-table__cell\">£323.17</td></tr></tbody></table><p class=\"govuk-body\"><a href=\"#\" class=\"govuk-link\">View SFI budget spreadsheet</a></p>", href: "S2T5", decisionField: "S2T5Outcome", acceptedValue: "Accepted", statusField: "S2T5Status", tagField: "S2T5Tag" },

    // ---------- S3 (Application on hold) — same 5 tasks, on-hold label variants ----------
    S3T1: { pageTitle: "Customer details review", preOutcomesHtml: "<ol class=\"govuk-list govuk-list--number\"><li>Go to <a href=\"application\" class=\"govuk-link\">Application</a> to view submitted customer details.</li><li>Check the submitted details match the details and permissions on the <a href=\"#\" class=\"govuk-link\">Rural Payments service (RPS)</a>.</li><li>Come back to this page and confirm if the details match.</li></ol>", href: "S3T1", decisionField: "S3T1Outcome", acceptedValue: "Accepted", statusField: "S3T1Status", tagField: "S3T1Tag" },
    S3T2: { pageTitle: "Review land parcel rule checks", preOutcomesHtml: "<ol class=\"govuk-list govuk-list--number\"><li>Go to <a href=\"calculations2\" class=\"govuk-link\">calculations</a> to view automated checks against the customer’s land parcels and actions.</li><li>Check for failures and resolve these by:<ul class=\"govuk-list govuk-list--bullet\"><li>requesting information from the customer</li><li>running the calculations again</li></ul></li></ol>", href: "S3T2", decisionField: "S3T2Outcome", acceptedValue: "Accepted", statusField: "S3T2Status", tagField: "S3T2Tag" },
    S3T3: { pageTitle: "Check if SSSI consent has been requested", preOutcomesHtml: "<p class=\"govuk-body\">Land parcels within this application, intersect with at least one SSSI. You can see which land parcels in the <a href=\"application\" class=\"govuk-link\">application</a>.</p><p class=\"govuk-body\">Check if a notice of planned activity has been submitted to Natural England.</p><p class=\"govuk-body\">Consent does not have to be issued to accept. The notice of planned activity only has to have been received by Natural England.</p><p class=\"govuk-body\"><a href=\"#\" class=\"govuk-link\">View SSSI request spreadsheet</a></p>", href: "S3T3", decisionField: "S3T3Outcome", acceptedValue: "Accepted", statusField: "S3T3Status", tagField: "S3T3Tag" },
    S3T4: { pageTitle: "Check payment amount", preOutcomesHtml: "<p class=\"govuk-body\">To check payment amount:</p><ol class=\"govuk-list govuk-list--number\"><li>Check the payment section of the <a href=\"application\" class=\"govuk-link\">application</a> and make a note of the:<ul class=\"govuk-list govuk-list--bullet\"><li>hectares per funded action</li><li>annual payments per funded action</li><li>per hectare payment rate per funded action</li></ul></li><li>Search how much the funded action pays per hectare on <a href=\"https://www.gov.uk/find-funding-for-land-or-farms\" class=\"govuk-link\">Find funding for land or farms</a> — check it matches the rate in the application.</li><li>Multiply the total hectares for each funded action by the payment rate per hectare.</li><li>Check your figure matches the total yearly payment in the application.</li></ol>", href: "S3T4", decisionField: "S3T4Outcome", acceptedValue: "Accepted", statusField: "S3T4Status", tagField: "S3T4Tag" },
    S3T5: { pageTitle: "Review scheme budget as a finance officer", preOutcomesHtml: "<p class=\"govuk-body\">You cannot complete this task.</p><p class=\"govuk-body\">You must check there is enough budget left for the total yearly payment the customer has applied for.</p><table class=\"govuk-table\"><tbody class=\"govuk-table__body\"><tr class=\"govuk-table__row\"><th scope=\"row\" class=\"govuk-table__header\">Total yearly payment applied for</th><td class=\"govuk-table__cell\">£323.17</td></tr></tbody></table><p class=\"govuk-body\"><a href=\"#\" class=\"govuk-link\">View SFI budget spreadsheet</a></p>", href: "S3T5", decisionField: "S3T5Outcome", acceptedValue: "Accepted", statusField: "S3T5Status", tagField: "S3T5Tag" },

    // ---------- S4 (Draft agreement) — 2 tasks ----------
    S4T1: { pageTitle: "Check funding agreement", preOutcomesHtml: "<p class=\"govuk-body\">Check the <a href=\"agreement\" class=\"govuk-link\">agreement</a> is accurate.</p>", href: "S4T1", decisionField: "S4T1Outcome", acceptedValue: "Confirm", statusField: "S4T1Status", tagField: "S4T1Tag" },
    S4T2: { pageTitle: "Notify customer that agreement is ready", preOutcomesHtml: "<p class=\"govuk-body\">Tell the customer their agreement is ready to review.</p>", href: "S4T2", decisionField: "S4T2Outcome", acceptedValue: "Confirm", statusField: "S4T2Status", tagField: "S4T2Tag" },

    // ---------- S9 (Payment control tasks — 5 months) — 6 tasks ----------
    S9T1: { pageTitle: "Check failed land parcel calculations", preOutcomesHtml: "<ol class=\"govuk-list govuk-list--number\"><li>Go to <a href=\"calculations\" class=\"govuk-link\">calculations</a> to review the checks against the customer’s land parcels and actions.</li><li>Check for failures and resolve these by:<ul class=\"govuk-list govuk-list--bullet\"><li>requesting information from the customer</li><li>running the calculations again</li><li>updating our systems</li></ul></li></ol>", href: "S9T1", decisionField: "S9T1Outcome", acceptedValue: "No action needed", statusField: "S9T1Status", tagField: "S9T1Tag" },
    S9T2: { pageTitle: "Confirm land parcels are linked to customer", preOutcomesHtml: "<p class=\"govuk-body\">Confirm land parcels in this grant are linked to the customer’s single business identifier (SBI) until the T1 date.</p><p class=\"govuk-body\">Go to <a href=\"agreement\" class=\"govuk-link\">agreement</a> to check the T1 date.</p>", href: "S9T2", decisionField: "S9T2Outcome", acceptedValue: "No action needed", statusField: "S9T2Status", tagField: "S9T2Tag" },
    S9T3: { pageTitle: "Confirm no overlapping agreements", preOutcomesHtml: "<p class=\"govuk-body\">Check if start and end dates for land parcels overlap with another agreement that:</p><ul class=\"govuk-list govuk-list--bullet\"><li>contains a revenue commitment</li><li>is registered to another single business identifier (SBI)</li></ul><p class=\"govuk-body\">If there is no overlap, no action is needed.</p>", href: "S9T3", decisionField: "S9T3Outcome", acceptedValue: "No action needed", statusField: "S9T3Status", tagField: "S9T3Tag" },
    S9T4: { pageTitle: "Check if ITE assessment is required", preOutcomesHtml: "<p class=\"govuk-body\">Check all land parcels that intersect with an ITE (inheritance tax exemption) layer.</p><p class=\"govuk-body\">If any actions are an amber list action, they need to be assessed.</p>", href: "S9T4", decisionField: "S9T4Outcome", acceptedValue: "No action needed", statusField: "S9T4Status", tagField: "S9T4Tag" },
    S9T5: { pageTitle: "Confirm action is within hedge tolerance", preOutcomesHtml: "<p class=\"govuk-body\">Compare length of funded action with system tolerance for hedges.</p><p class=\"govuk-body\">Go to <a href=\"agreement\" class=\"govuk-link\">agreement</a> to check the maximum hedge tolerance.</p>", href: "S9T5", decisionField: "S9T5Outcome", acceptedValue: "No action needed", statusField: "S9T5Status", tagField: "S9T5Tag" },
    S9T6: { pageTitle: "Confirm no CS conflict with hedgerows", preOutcomesHtml: "<p class=\"govuk-body\">For land parcels with a CHRW2 (manage hedgerows) funded action, check there is no active countryside stewardship action of BE3 (management of hedgerows) from now until the T1 date.</p><p class=\"govuk-body\">Go to <a href=\"agreement\" class=\"govuk-link\">agreement</a> to check the T1 date.</p>", href: "S9T6", decisionField: "S9T6Outcome", acceptedValue: "No action needed", statusField: "S9T6Status", tagField: "S9T6Tag" }
  },

  stages: {
    S1: {
      heading: "Application received",
      prefix: "S1",
      description: "<p class=\"govuk-body\">You cannot complete any tasks until you start the case.</p>",
      conditional: null,
      tasks: ["S1T1", "S1T2", "S1T3", "S1T4", "S1T5"],
      decisionGroup: "S1DecisionOptions",
      stageDecisionField: "S1Decision",
      stageStatusField: "S1Status",
      stageTagField: "S1Tag",
      decisions: [
        { label: "Start", stageChange: "S2", statusChange: { status: "In review", tag: "govuk-tag govuk-tag--blue" } }
      ]
    },
    S2: {
      heading: "Application review",
      prefix: "S2",
      description: "<p class=\"govuk-body\">You cannot approve the application until all tasks have been accepted.</p>",
      conditional: null,
      tasks: ["S2T1", "S2T2", "S2T3", "S2T4", "S2T5"],
      decisionGroup: "S2DecisionOptions",
      stageDecisionField: "S2Decision",
      stageStatusField: "S2Status",
      stageTagField: "S2Tag",
      decisions: [
        { label: "Approve",     stageChange: "S4",  statusChange: { status: "Agreement drafted",   tag: "govuk-tag govuk-tag--blue" },   requiresAllTasksAccepted: true,  reasonField: "reviewNote" },
        { label: "Put on hold", stageChange: "S3",  statusChange: { status: "On hold",             tag: "govuk-tag govuk-tag--yellow" }, requiresAllTasksAccepted: false, reasonField: "reviewNote" },
        { label: "Return",      stageChange: "S6",  statusChange: { status: "Returned to customer", tag: "govuk-tag govuk-tag--orange" }, requiresAllTasksAccepted: false, reasonField: "reviewNote" },
        { label: "Reject",      stageChange: "S12", statusChange: { status: "Rejected",            tag: "govuk-tag govuk-tag--red" },    requiresAllTasksAccepted: false, reasonField: "reviewNote" },
        { label: "Withdraw",    stageChange: "S11", statusChange: { status: "Withdrawn",           tag: "govuk-tag govuk-tag--orange" }, requiresAllTasksAccepted: false, reasonField: "reviewNote" }
      ]
    },
    S3: {
      heading: "Application on hold",
      prefix: "S3",
      description: "<p class=\"govuk-body\">You cannot do any work on tasks whilst the case is on hold.</p>",
      conditional: { field: "caseStatus", equals: "on-hold", text: "<p class=\"govuk-body\">The case is currently on hold. Press Resume when ready to continue the review.</p>" },
      tasks: ["S3T1", "S3T2", "S3T3", "S3T4", "S3T5"],
      decisionGroup: "S3DecisionOptions",
      stageDecisionField: "S3Decision",
      stageStatusField: "S3Status",
      stageTagField: "S3Tag",
      decisions: [
        { label: "Resume", stageChange: "S2", statusChange: { status: "In review", tag: "govuk-tag govuk-tag--blue" } }
      ]
    },
    S4: {
      heading: "Draft agreement",
      prefix: "S4",
      description: "<p class=\"govuk-body\">Draft agreement is live and can be accepted by the customer.</p>",
      conditional: null,
      tasks: ["S4T1", "S4T2"],
      decisionGroup: "S4DecisionOptions",
      stageDecisionField: "S4Decision",
      stageStatusField: "S4Status",
      stageTagField: "S4Tag",
      decisions: [
        { label: "Agreement sent", stageChange: "S8",  statusChange: { status: "Agreement offered", tag: "govuk-tag govuk-tag--blue" },   requiresAllTasksAccepted: true,  reasonField: "agreeNote" },
        { label: "Reject",         stageChange: "S12", statusChange: { status: "Rejected",         tag: "govuk-tag govuk-tag--red" },    requiresAllTasksAccepted: false, reasonField: "agreeNote" },
        { label: "Withdraw",       stageChange: "S11", statusChange: { status: "Withdrawn",        tag: "govuk-tag govuk-tag--orange" }, requiresAllTasksAccepted: false, reasonField: "agreeNote" }
      ]
    },
    S5: {
      heading: "Amending application",
      prefix: "S5",
      description: "<p class=\"govuk-body\">Application has now been withdrawn.</p><p class=\"govuk-body\">A new application will be submitted after amendments have been made in Grants-UI.</p><p class=\"govuk-body\"><a class=\"govuk-link\" href=\"#\">Amend this application in Grants-UI (opens in new tab)</a></p>",
      conditional: null,
      tasks: [],
      decisionGroup: "S5DecisionOptions",
      stageDecisionField: "S5Decision",
      stageStatusField: "S5Status",
      stageTagField: "S5Tag",
      decisions: []
    },
    S6: {
      heading: "Application returned to customer for amending",
      prefix: "S6",
      description: "<p class=\"govuk-body\">The application has been closed and returned to the customer. You can still review the notes and timeline for this application.</p><p class=\"govuk-body\">A new, linked application will be submitted after amendments have been made by the customer.</p>",
      conditional: null,
      tasks: [],
      decisionGroup: "S6DecisionOptions",
      stageDecisionField: "S6Decision",
      stageStatusField: "S6Status",
      stageTagField: "S6Tag",
      decisions: []
    },
    S7: {
      heading: "Amended application with customer for review",
      prefix: "S7",
      description: "<p class=\"govuk-body\">Amendment sent. There is nothing more you need to do.</p><p class=\"govuk-body\">You can still make a decision on this case until the customer has submitted their amended application.</p>",
      conditional: null,
      tasks: [],
      decisionGroup: "S7DecisionOptions",
      stageDecisionField: "S7Decision",
      stageStatusField: "S7Status",
      stageTagField: "S7Tag",
      decisions: [
        { label: "Remove from Amendment state", stageChange: "S2",  statusChange: { status: "In review", tag: "govuk-tag govuk-tag--blue" },    requiresAllTasksAccepted: false, reasonField: "moreDetail2" },
        { label: "Reject",                       stageChange: "S12", statusChange: { status: "Rejected", tag: "govuk-tag govuk-tag--red" },     requiresAllTasksAccepted: false, reasonField: "moreDetail2" },
        { label: "Withdraw",                     stageChange: "S11", statusChange: { status: "Withdrawn", tag: "govuk-tag govuk-tag--orange" }, requiresAllTasksAccepted: false, reasonField: "moreDetail2" }
      ]
    },
    S8: {
      heading: "Agreement with customer for review",
      prefix: "S8",
      description: "<p class=\"govuk-body\">Agreement sent. There is nothing more you need to do.</p><p class=\"govuk-body\">You can still withdraw the agreement until the customer has accepted or rejected.</p>",
      conditional: null,
      tasks: [],
      decisionGroup: "S8DecisionOptions",
      stageDecisionField: "S8Decision",
      stageStatusField: "S8Status",
      stageTagField: "S8Tag",
      decisions: [
        { label: "Withdraw", stageChange: "S11", statusChange: { status: "Withdrawn", tag: "govuk-tag govuk-tag--orange" }, requiresAllTasksAccepted: false, reasonField: "case4Note" }
      ]
    },
    S9: {
      heading: "Payment control tasks (5 months)",
      prefix: "S9",
      description: "<p class=\"govuk-body\">Agreement is live. However, you need to check the land parcel calculations have not changed.</p>",
      conditional: null,
      tasks: ["S9T1", "S9T2", "S9T3", "S9T4", "S9T5", "S9T6"],
      decisionGroup: "S9DecisionOptions",
      stageDecisionField: "S9Decision",
      stageStatusField: "S9Status",
      stageTagField: "S9Tag",
      decisions: [
        { label: "No action needed", stageChange: "S10", statusChange: { status: "Agreement accepted", tag: "govuk-tag govuk-tag--green" },  requiresAllTasksAccepted: true,  reasonField: "moreDetail3" },
        { label: "Put on hold",      stageChange: "S3",  statusChange: { status: "On hold",            tag: "govuk-tag govuk-tag--yellow" }, requiresAllTasksAccepted: false, reasonField: "moreDetail3" },
        { label: "Withdraw agreement", stageChange: "S11", statusChange: { status: "Withdrawn",        tag: "govuk-tag govuk-tag--orange" }, requiresAllTasksAccepted: false, reasonField: "moreDetail3" }
      ]
    },
    S10: {
      heading: "Post-agreement monitoring and compliance",
      prefix: "S10",
      description: "<p class=\"govuk-body\">There are no tasks to complete yet.</p>",
      conditional: null,
      tasks: [],
      decisionGroup: "S10DecisionOptions",
      stageDecisionField: "S10Decision",
      stageStatusField: "S10Status",
      stageTagField: "S10Tag",
      decisions: []
    },
    S11: {
      heading: "Application withdrawn",
      prefix: "S11",
      description: "<p class=\"govuk-body\">There are no tasks to complete.</p>",
      conditional: null,
      tasks: [],
      decisionGroup: "S11DecisionOptions",
      stageDecisionField: "S11Decision",
      stageStatusField: "S11Status",
      stageTagField: "S11Tag",
      decisions: []
    },
    S12: {
      heading: "Application rejected",
      prefix: "S12",
      description: "<p class=\"govuk-body\">There are no tasks to complete.</p>",
      conditional: null,
      tasks: [],
      decisionGroup: "S12DecisionOptions",
      stageDecisionField: "S12Decision",
      stageStatusField: "S12Status",
      stageTagField: "S12Tag",
      decisions: []
    },
    S13: {
      heading: "Case closed due to amendment submitted",
      prefix: "S13",
      description: "<p class=\"govuk-body\">There are no tasks to complete.</p>",
      conditional: null,
      tasks: [],
      decisionGroup: "S13DecisionOptions",
      stageDecisionField: "S13Decision",
      stageStatusField: "S13Status",
      stageTagField: "S13Tag",
      decisions: []
    }
  },

  decisionOptions: {
    S1DecisionOptions:  { legend: "Outcome", formField: "S1Decision",  options: [ { value: "Accepted", label: "Accepted" }, { value: "Information requested", label: "Information requested" }, { value: "Internal investigation", label: "Internal investigation" }, { value: "Cannot accept", label: "Cannot accept" } ], acceptedValue: "Accepted" },
    S2DecisionOptions:  { legend: "Outcome", formField: "S2Decision",  options: [ { value: "Accepted", label: "Accepted" }, { value: "Information requested", label: "Information requested" }, { value: "Internal investigation", label: "Internal investigation" }, { value: "Cannot accept", label: "Cannot accept" } ], acceptedValue: "Accepted" },
    S3DecisionOptions:  { legend: "Outcome", formField: "S3Decision",  options: [ { value: "Accepted", label: "Accepted" }, { value: "Information requested", label: "Information requested" }, { value: "Internal investigation", label: "Internal investigation" }, { value: "Cannot accept", label: "Cannot accept" } ], acceptedValue: "Accepted" },
    S4DecisionOptions:  { legend: "Outcome", formField: "S4Decision",  options: [ { value: "Confirm", label: "Confirm" }, { value: "There's a problem", label: "There's a problem" } ], acceptedValue: "Confirm" },
    S5DecisionOptions:  { legend: "Outcome", formField: "S5Decision",  options: [], acceptedValue: "" },
    S6DecisionOptions:  { legend: "Outcome", formField: "S6Decision",  options: [], acceptedValue: "" },
    S7DecisionOptions:  { legend: "Outcome", formField: "S7Decision",  options: [], acceptedValue: "" },
    S8DecisionOptions:  { legend: "Outcome", formField: "S8Decision",  options: [], acceptedValue: "" },
    S9DecisionOptions:  { legend: "Outcome", formField: "S9Decision",  options: [ { value: "No action needed", label: "No action needed" }, { value: "Escalate", label: "Escalate" }, { value: "Information requested", label: "Information requested" }, { value: "Cannot accept", label: "Cannot accept" } ], acceptedValue: "No action needed" },
    S10DecisionOptions: { legend: "Outcome", formField: "S10Decision", options: [], acceptedValue: "" },
    S11DecisionOptions: { legend: "Outcome", formField: "S11Decision", options: [], acceptedValue: "" },
    S12DecisionOptions: { legend: "Outcome", formField: "S12Decision", options: [], acceptedValue: "" },
    S13DecisionOptions: { legend: "Outcome", formField: "S13Decision", options: [], acceptedValue: "" }
  }
};
