// Comparison table for one SBI's applications (Water management V3 / V4).
// Input: the case rows (already sorted) and the version's waterApplication(c).
// Output: { cases: [{id}], sections: [{ title, rows: [{ label, values: [html|null per case] }] }] }
// A row is kept when at least one application has a value; the rest show as blank.
// Values are HTML strings (they are rendered with | safe), built from made-up data only.

const eaLabel = { Yes: 'Licence already secured', No: 'Licence needed but not yet secured', 'Not needed': 'Licence not needed' }
const join = function (a) { return a ? a.join('<br>') : null }

// [section, row label, function (application) -> html or null/undefined when not asked]
const ROWS = [
  ['Confirm your details', 'Business name', function (a) { return a.profile.name }],
  ['Confirm your details', 'Business address', function (a) { return join(a.profile.address) }],
  ['Confirm your details', 'Business phone numbers', function (a) { return join(a.profile.phones) }],
  ['Confirm your details', 'Business email address', function (a) { return a.profile.email }],
  ['Confirm your details', 'Legal status', function (a) { return a.profile.legal }],
  ['Confirm your details', 'Company number', function (a) { return a.profile.companyNumber }],
  ['Confirm your details', 'Single business identifier (SBI)', function (a, c) { return c.sbi }],
  ['Confirm your details', 'VAT registration number', function (a) { return a.profile.vat }],
  ['Confirm your details', 'Full name', function (a) { return a.profile.person }],
  ['Confirm your details', 'Customer reference number', function (a) { return a.profile.customerRef }],
  ['Confirm your details', 'Personal address', function (a) { return join(a.profile.personAddress) }],
  ['Confirm your details', 'Personal phone numbers', function (a) { return join(a.profile.personPhones) }],
  ['Confirm your details', 'Personal email address', function (a) { return a.profile.personEmail }],

  ['Sector', 'Crops irrigated using the water from this project', function (a) { return join(a.sector.crops) }],
  ['Sector', 'Section score', function (a) { return '<strong>' + a.sector.best.score + '%</strong><br><span class="govuk-hint govuk-!-margin-bottom-0">Highest scoring crop selected: ' + a.sector.best.crop + '</span>' }],

  ['Project location', 'Easting', function (a) { return a.loc.easting }],
  ['Project location', 'Northing', function (a) { return a.loc.northing }],

  ['Water scarcity', 'Priority area', function (a) { return a.loc.colour + ' &middot; level ' + a.loc.level + ' &middot; ' + a.loc.area }],
  ['Water scarcity', 'Section score', function (a) { return '<strong>' + a.loc.score + '%</strong>' }],

  ['Work already started', 'Have you already started work on the project?', function () { return 'No, we have not done any work on this project yet' }],
  ['Public body', 'National Parks authority, government department, executive agency or non-departmental public body?', function () { return 'No' }],
  ['Type of organisation', 'Type of organisation applying', function (a) { return a.orgType }],
  ['Businesses using the water', 'Businesses using the water for irrigation', function (a) { return a.businesses }],
  ['Businesses using the water', 'Section score', function (a) { return '<strong>' + a.bizScore + '%</strong>' }],
  ['Water source', 'Where the water will come from', function (a) { return join(a.waterSources) }],

  ['Planning permission and abstraction licence', 'Planning permission confirmed by the Local Planning Authority?', function (a) { return a.consents.planning.answer }],
  ['Planning permission and abstraction licence', 'Planning permission reference number', function (a) { return a.consents.planning.answer === 'Yes' ? a.consents.planning.ref : null }],
  ['Planning permission and abstraction licence', 'Why planning permission is not needed', function (a) { return a.consents.planning.answer === 'Not needed' ? join(a.consents.planning.reasons) : null }],
  ['Planning permission and abstraction licence', 'More detail on why planning permission is not needed', function (a) { return a.consents.planning.answer === 'Not needed' ? a.consents.planning.detail : null }],
  ['Planning permission and abstraction licence', 'Abstraction licence (Environment Agency)', function (a) { return eaLabel[a.consents.licence.answer] }],
  ['Planning permission and abstraction licence', 'Licence consent number', function (a) { return a.consents.licence.answer === 'Yes' ? a.consents.licence.number : null }],
  ['Planning permission and abstraction licence', 'Why an abstraction licence is not needed', function (a) { return a.consents.licence.answer === 'Not needed' ? join(a.consents.licence.reasons) : null }],
  ['Planning permission and abstraction licence', 'More detail on why an abstraction licence is not needed', function (a) { return a.consents.licence.answer === 'Not needed' ? a.consents.licence.detail : null }],
  ['Planning permission and abstraction licence', 'Section score', function (a) { return '<strong>' + a.consentScore + '%</strong>' }],

  ['Expected start', 'Expected start of the project work', function (a) { return a.workStart.month + ' ' + a.workStart.year }],

  ['Items and estimated cost', 'Items to install', function (a) { return join(a.items.chosen) }],
  ['Items and estimated cost', 'Reservoir volume when full (m³)', function (a) { return a.items.reservoir }],
  ['Items and estimated cost', 'Water storage tank capacity (m³)', function (a) { return a.items.tank }],
  ['Items and estimated cost', 'Water distribution network length (m)', function (a) { return a.items.main }],
  ['Items and estimated cost', 'Estimated costs', function (a) { return join(a.items.lines) }],
  ['Items and estimated cost', 'Total estimated cost', function (a) { return '<strong>' + a.items.total + '</strong>' }],
  ['Items and estimated cost', 'Grant available (up to 40%, maximum £300,000)', function (a) {
    return a.items.grantCapped
      ? '<strong>' + a.items.maxGrant + '</strong><br><span class="govuk-hint govuk-!-margin-bottom-0">40% of the estimated cost is ' + a.items.fortyPercent + ', capped at the scheme maximum award of £300,000</span>'
      : a.items.maxGrant
  }]
]

function buildCompare (cases, waterApplication) {
  const apps = cases.map(function (c) { return waterApplication(c) })
  const sections = []
  ROWS.forEach(function (def) {
    const values = apps.map(function (a, i) {
      const v = def[2](a, cases[i])
      return (v === undefined || v === null || v === '') ? null : String(v)
    })
    if (!values.some(function (v) { return v !== null })) return
    let s = sections.filter(function (x) { return x.title === def[0] })[0]
    if (!s) { s = { title: def[0], rows: [] }; sections.push(s) }
    s.rows.push({ label: def[1], values: values })
  })
  return { cases: cases.map(function (c) { return { id: c.id } }), sections: sections }
}

module.exports = { buildCompare: buildCompare }
