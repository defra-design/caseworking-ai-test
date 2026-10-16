//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

// Add your filters here


// Filters used by the PA3 v8 caseworking journey (views/pa3/v8)
addFilter('currencyGBP', function (num) {
  if (isNaN(num)) return num
  return Number(num).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

addFilter('prettyDateShort', function (dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date)) return dateString
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
})

const schemeNames = {
  pa3: 'Woodland Management Plan (PA3)',
  msfp: 'Methane'
}
addFilter('schemeName', function (code) {
  return schemeNames[code] || code
})
