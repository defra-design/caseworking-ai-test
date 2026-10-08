// Made-up Water management applications, one per caselist case.
// Single source of truth for BOTH the application page (/WaterManagement/application)
// and the Score column of the caselist (data/water-management-cases.js): every score
// is the sum of the four scored sections, so only scores that can really be earned
// appear. Maximum 100 = 25 sector + 60 water scarcity + 10 businesses + 5 consents.
//
// Answers are deterministic from the case ID. Kick-out answers are never generated.
// See .claude/skills/water-management-application/SKILL.md.
const MONTHS3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function dateVal (s) {
  const p = String(s || '').trim().split(/\s+/)
  return new Date(parseInt(p[2], 10), MONTHS3.indexOf(p[1]), parseInt(p[0], 10)).getTime()
}

// Made-up project location per case (no real priority-area map data yet): the case
// ID picks a rural region and a deterministic offset of up to ~8km around it.
// Red = rural Kent / rural south, Green = East Anglia / rural Wales / Cumbria,
// Amber = rural middle of the country. Easting / Northing are approximate British
// National Grid values; lat / lng are for the map.
const WATER_REGIONS = [
  { area: 'Rural Kent (Ashford)', colour: 'Red', e: 601000, n: 142000, lat: 51.148, lng: 0.875 },
  { area: 'Rural Kent (Maidstone)', colour: 'Red', e: 576000, n: 155000, lat: 51.272, lng: 0.521 },
  { area: 'Rural Kent (Canterbury)', colour: 'Red', e: 616000, n: 158000, lat: 51.28, lng: 1.08 },
  { area: 'Rural Sussex (Horsham)', colour: 'Red', e: 517000, n: 131000, lat: 51.063, lng: -0.326 },
  { area: 'Rural Surrey', colour: 'Red', e: 501000, n: 148000, lat: 51.2, lng: -0.55 },
  { area: 'Rural Hampshire', colour: 'Red', e: 471000, n: 139000, lat: 51.15, lng: -0.97 },
  { area: 'Rural Dorset', colour: 'Red', e: 387000, n: 106000, lat: 50.857, lng: -2.16 },
  { area: 'Rural Northamptonshire', colour: 'Amber', e: 475000, n: 262000, lat: 52.24, lng: -0.9 },
  { area: 'Rural Warwickshire', colour: 'Amber', e: 430000, n: 255000, lat: 52.19, lng: -1.55 },
  { area: 'Rural Leicestershire', colour: 'Amber', e: 475000, n: 318000, lat: 52.76, lng: -0.89 },
  { area: 'Rural Derbyshire', colour: 'Amber', e: 410000, n: 330000, lat: 52.9, lng: -1.8 },
  { area: 'Rural Worcestershire', colour: 'Amber', e: 388000, n: 255000, lat: 52.19, lng: -2.22 },
  { area: 'Rural Norfolk', colour: 'Green', e: 581000, n: 309000, lat: 52.65, lng: 0.69 },
  { area: 'Rural Suffolk', colour: 'Green', e: 585000, n: 264000, lat: 52.25, lng: 0.72 },
  { area: 'Cambridgeshire fens', colour: 'Green', e: 551000, n: 291000, lat: 52.5, lng: 0.25 },
  { area: 'Rural Powys, Wales', colour: 'Green', e: 305000, n: 261000, lat: 52.24, lng: -3.38 },
  { area: 'Rural Ceredigion, Wales', colour: 'Green', e: 260000, n: 280000, lat: 52.4, lng: -4.05 },
  { area: 'Rural Cumbria (Penrith)', colour: 'Green', e: 351000, n: 530000, lat: 54.66, lng: -2.75 },
  { area: 'Rural Cumbria (Keswick)', colour: 'Green', e: 326000, n: 523000, lat: 54.6, lng: -3.13 }
]
const WATER_SCARCITY = { Red: { level: 1, score: 60 }, Amber: { level: 2, score: 40 }, Green: { level: 3, score: 20 } }
function waterLocation (id, colour, area) {
  const h = (parseInt(id, 10) * 2654435761) >>> 0
  const pool = colour ? WATER_REGIONS.filter(function (x) { return x.colour === colour }) : WATER_REGIONS
  const r = area ? WATER_REGIONS.filter(function (x) { return x.area === area })[0] : pool[h % pool.length]
  const dE = ((h >>> 8) % 16001) - 8000
  const dN = ((h >>> 16) % 16001) - 8000
  const lat = r.lat + dN / 111000
  const lng = r.lng + dE / (111000 * Math.cos(r.lat * Math.PI / 180))
  const sc = WATER_SCARCITY[r.colour]
  return {
    area: r.area, colour: r.colour, level: sc.level, score: sc.score,
    easting: Math.round((r.e + dE) / 10) * 10, northing: Math.round((r.n + dN) / 10) * 10,
    lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000
  }
}
// Planning permission + Environment Agency abstraction licence answers (the
// follow-on questions included), made up per case. Both questions are
// Yes / No / Not needed (EA: licence already secured / needed but not yet secured /
// not needed). Scored by consentScore() below.
function waterHash (id, mult, shift) { return (((parseInt(id, 10) * mult) >>> 0) >>> shift) }
function waterConsents (id, ov) {
  // Yes about half the time, No a quarter, Not needed a quarter.
  function pick (h) { const v = h % 4; return v < 2 ? 'Yes' : (v === 2 ? 'No' : 'Not needed') }
  const planningReasons = ['Exemption under General Permitted Development Order 2015', 'Reason 2', 'Reason 3', 'Something else']
  const licenceReasons = ['Reason 1 (list to be confirmed)', 'Reason 2 (list to be confirmed)', 'Something else']
  function reasons (list, h) {
    const mask = (h % ((1 << list.length) - 1)) + 1
    return list.filter(function (r, i) { return mask & (1 << i) })
  }
  const pa = (ov && ov.planning) || pick(waterHash(id, 2654435761, 7))
  const ea = (ov && ov.ea) || pick(waterHash(id, 2246822519, 9))
  const n = parseInt(id, 10)
  const planning = { answer: pa }
  if (pa === 'Yes') planning.ref = 'DC/26/' + String(10000 + (n * 7919) % 89999).slice(0, 5)
  if (pa === 'Not needed') {
    planning.reasons = reasons(planningReasons, waterHash(id, 3266489917, 11))
    if (planning.reasons.indexOf('Something else') !== -1) planning.detail = 'The reservoir is for agricultural use on land covered by an existing prior notification.'
  }
  const licence = { answer: ea }
  if (ea === 'Yes') licence.number = String(10 + n % 40) + '/' + String(30 + n % 60) + '/' + String(1 + n % 20).padStart(2, '0') + '/' + String(1000 + (n * 104729) % 8999)
  if (ea === 'Not needed') {
    licence.reasons = reasons(licenceReasons, waterHash(id, 2654435761, 13))
    if (licence.reasons.indexOf('Something else') !== -1) licence.detail = 'Water is transferred from an existing licensed source and no new abstraction is made.'
  }
  return { planning: planning, licence: licence }
}
// Expected project start (month and year), made up per case: 3 to 12 months after
// the application date.
function waterWorkStart (c) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const d = new Date(dateVal(c.date))
  const offset = 3 + (((parseInt(c.id, 10) * 2654435761) >>> 0) >>> 15) % 10
  const m = d.getMonth() + offset
  return { month: months[m % 12], year: d.getFullYear() + Math.floor(m / 12) }
}
// Items to install, their follow-up quantities and the total estimated cost, made up
// per case. Rates stand in for the "correct ref costs" still to be supplied:
//   clay-lined reservoir £2.50 / m3 (from the journey's example summary)
//   synthetic-lined reservoir £3.50 / m3 (ASSUMED, no rate given yet)
//   water storage tanks £1,500 / m3 (the journey says £1.50 per litre, to be
//     amended to m3)
//   water distribution main £5.00 / m (from the journey)
// A case gets at most ONE reservoir type: the journey asks a single volume question
// for "clay and/or synthetic", so a mixed answer isn't priced yet.
const WATER_RATES = { clay: 2.5, synthetic: 3.5, tank: 1500, main: 5 }
// targetGrant (optional, whole £): size the items so that 40% of the estimated cost is
// exactly that grant (used for cases whose list Grant value must agree with their
// application). Without it the quantities are just made up from the case ID.
function waterItems (id, targetGrant) {
  const n = parseInt(id, 10)
  const h = ((n * 2654435761) >>> 0) >>> 5
  let resType = ['none', 'clay', 'synthetic', 'clay'][h % 4]
  let tank = ((h >>> 3) % 3) === 0
  let main = ((h >>> 5) % 3) !== 0
  if (resType === 'none' && !tank && !main) main = true
  let resM3 = 5000 + (((n * 40503) >>> 0) % 151) * 500
  let tankM3 = 20 + (((n * 31337) >>> 0) % 21) * 5
  let mainM = 200 + (((n * 27449) >>> 0) % 97) * 50
  if (targetGrant) {
    // Whole-number quantities that add up to exactly cost = grant / 0.4.
    let rem = Math.round(targetGrant * 2.5)
    if (rem >= 60000 && ((h >>> 7) % 3) === 0) {
      // a tank: 20-120 m3, never more than half the cost
      const maxM3 = Math.floor(rem * 0.5 / WATER_RATES.tank / 5) * 5
      tankM3 = Math.max(0, Math.min(20 + ((h >>> 9) % 21) * 5, maxM3))
      tank = tankM3 >= 20
    } else tank = false
    if (tank) rem -= tankM3 * WATER_RATES.tank
    if (resType === 'none') resType = 'clay'
    const share = 0.55 + (((h >>> 11) % 31) / 100) // 55-85% of what is left
    resM3 = Math.floor(rem * share / WATER_RATES[resType] / 100) * 100
    if (resM3 < 100) { resType = 'none'; resM3 = 0 }
    rem -= resM3 * WATER_RATES[resType === 'none' ? 'clay' : resType]
    mainM = Math.round(rem / WATER_RATES.main)
    main = mainM > 0
    if (resType === 'none' && !tank && !main) { main = true; mainM = Math.round(Math.round(targetGrant * 2.5) / WATER_RATES.main) }
  }
  const fmt = function (v) { return v.toLocaleString('en-GB') }
  const gbp = function (v) { return '£' + fmt(Math.round(v)) }
  const chosen = []
  const lines = []
  let total = 0
  const out = {}
  if (resType !== 'none') {
    const m3 = resM3
    const cost = m3 * WATER_RATES[resType]
    chosen.push(resType === 'clay' ? 'Clay lined reservoir' : 'Synthetic lined reservoir')
    out.reservoir = fmt(m3) + ' m³'
    lines.push('Reservoir - ' + resType + '-lined: ' + fmt(m3) + 'm³ at £' + WATER_RATES[resType].toFixed(2) + ' per m³ = ' + gbp(cost))
    total += cost
  }
  if (tank) {
    const m3 = tankM3
    const cost = m3 * WATER_RATES.tank
    chosen.push('Water storage tank(s) above ground')
    out.tank = fmt(m3) + ' m³'
    lines.push('Water storage tanks: ' + fmt(m3) + 'm³ at ' + gbp(WATER_RATES.tank) + ' per m³ = ' + gbp(cost))
    total += cost
  }
  if (main) {
    const m = mainM
    const cost = m * WATER_RATES.main
    chosen.push('Underground water distribution main')
    out.main = fmt(m) + ' m'
    lines.push('Water distribution network: ' + fmt(m) + 'm at £' + WATER_RATES.main.toFixed(2) + ' per m = ' + gbp(cost))
    total += cost
  }
  out.rawTotal = total
  out.chosen = chosen
  out.lines = lines
  out.total = gbp(total)
  // Grant is up to 40% of the estimated cost, but never more than the scheme maximum
  // award of £300,000, however large the project.
  const WATER_MAX_AWARD = 300000
  const forty = total * 0.4
  out.maxGrant = gbp(Math.min(forty, WATER_MAX_AWARD))
  out.grantCapped = forty > WATER_MAX_AWARD
  out.fortyPercent = gbp(forty)
  return out
}

// ---------- Scoring tables ----------
// Sector: the HIGHEST-scoring crop selected counts. ("Something else" is a kick-out,
// so it is not here.)
const SECTOR_SCORES = {
  'Soft & Cane Fruit': 25, 'Protected edible crops': 25,
  'Ornamentals': 20, 'Forest Nursery': 20,
  'Top & Stone Fruit': 15, 'Vineyards': 15, 'Field scale vegetables': 15,
  'Arable': 5, 'Grass - for feeding livestock, commercial turf': 2
}
const SECTOR_CROPS = ['Arable', 'Field scale vegetables', 'Forest Nursery', 'Grass - for feeding livestock, commercial turf', 'Ornamentals', 'Protected edible crops', 'Soft & Cane Fruit', 'Top & Stone Fruit', 'Vineyards']
const BIZ_SCORES = { 'One': 0, 'Two to four': 5, 'Five or more': 10 }
const BIZ_OPTIONS = ['One', 'Two to four', 'Five or more']
// EA consent | Planning. The table omits Not needed|No and No|Not needed, scored 0
// on the rule "any No scores 0".
const CONSENT_SCORES = {
  'Yes|Yes': 5, 'No|No': 0, 'Yes|No': 0, 'No|Yes': 0,
  'Yes|Not needed': 5, 'Not needed|Yes': 5, 'Not needed|Not needed': 5,
  'No|Not needed': 0, 'Not needed|No': 0
}
function consentScore (ea, planning) { return CONSENT_SCORES[ea + '|' + planning] }

// ---------- Business profiles for SBIs with more than one case ----------
// One business = one set of "Confirm your details" answers on EVERY application it
// has, and its projects sit in the same part of the country (`region` is the
// WATER_REGIONS area they are scattered around, so the water scarcity colour agrees
// across the business's cases). All names, numbers and addresses are invented.
// Any SBI not listed here gets the generic example business (defaultProfile).
const BUSINESS_PROFILES = {
  // 4 cases: the original example business from the "Confirm your details" screen.
  '244666513': {
    region: 'Rural Sussex (Horsham)', orgType: 'Landowner/owner occupier',
    name: 'North Sussex Weald Dairy Farm Ltd',
    address: ['15 London Road', 'Horsham', 'West Sussex', 'RH13 6PJ'],
    phones: ['Telephone: 0191 305 7642', 'Mobile: 07392 674851'], email: 'wealddairyfarm@me.com',
    legal: 'Limited company', companyNumber: '12345678', vat: 'GB123456789',
    person: 'Sally Wiston', customerRef: '1234512345',
    personAddress: ['10 Skirbeck Way', 'Maidstone', 'SK22 1DL'],
    personPhones: ['Mobile: 01273 333000'], personEmail: 'sally.wiston@wistonlandagents.co.uk'
  },
  // 3 cases: Kent top-fruit and vegetable growers.
  '824231248': {
    region: 'Rural Kent (Ashford)', orgType: 'Landowner/owner occupier',
    name: 'Hothfield Growers Ltd',
    address: ['Hothfield Court Farm', 'Hothfield Road', 'Ashford', 'Kent', 'TN26 1HB'],
    phones: ['Telephone: 01233 620418', 'Mobile: 07814 902256'], email: 'office@hothfieldgrowers.example.co.uk',
    legal: 'Limited company', companyNumber: '09481736', vat: 'GB247913085',
    person: 'Thomas Brecknock', customerRef: '2057418830',
    personAddress: ['The Old Dairy', 'Hothfield Road', 'Ashford', 'TN26 1HD'],
    personPhones: ['Mobile: 07814 902256'], personEmail: 'thomas.brecknock@hothfieldgrowers.example.co.uk'
  },
  // 3 cases: Norfolk arable and irrigated vegetables.
  '286559022': {
    region: 'Rural Norfolk', orgType: 'Landowner/landlord',
    name: 'Breckland Farms (Swaffham) Ltd',
    address: ['Manor Farm', 'Cley Road', 'Swaffham', 'Norfolk', 'PE37 7QT'],
    phones: ['Telephone: 01760 725309'], email: 'accounts@brecklandfarms.example.co.uk',
    legal: 'Limited company', companyNumber: '07236954', vat: 'GB318506247',
    person: 'Helen Marsden', customerRef: '3190275584',
    personAddress: ['Cley House', 'Cley Road', 'Swaffham', 'PE37 7QS'],
    personPhones: ['Telephone: 01760 725310', 'Mobile: 07702 418839'], personEmail: 'helen.marsden@brecklandfarms.example.co.uk'
  },
  // 3 cases: Warwickshire family orchard partnership (not a company).
  '900962676': {
    region: 'Rural Warwickshire', orgType: 'Landowner/owner occupier',
    name: 'Walton Hall Orchards Partnership',
    address: ['Walton Hall Farm', 'Walton Lane', 'Wellesbourne', 'Warwick', 'CV35 9DX'],
    phones: ['Telephone: 01789 840672', 'Mobile: 07966 130485'], email: 'info@waltonhallorchards.example.co.uk',
    legal: 'Partnership', companyNumber: 'Not applicable', vat: 'GB561720934',
    person: 'David Okafor', customerRef: '4426081957',
    personAddress: ['Walton Hall Farmhouse', 'Walton Lane', 'Wellesbourne', 'CV35 9DX'],
    personPhones: ['Mobile: 07966 130485'], personEmail: 'david.okafor@waltonhallorchards.example.co.uk'
  },
  // 2 cases: Mid Wales sole trader, upland grass and a little horticulture.
  '552347606': {
    region: 'Rural Powys, Wales', orgType: 'Landowner/owner occupier',
    name: 'R M Pugh & Son',
    address: ['Pen-y-bont Farm', 'Crossgates', 'Llandrindod Wells', 'Powys', 'LD1 6RF'],
    phones: ['Telephone: 01597 851204', 'Mobile: 07583 207716'], email: 'rhian.pugh@penybontfarm.example.co.uk',
    legal: 'Sole trader', companyNumber: 'Not applicable', vat: 'GB702458316',
    person: 'Rhian Pugh', customerRef: '5538190246',
    personAddress: ['Pen-y-bont Farm', 'Crossgates', 'Llandrindod Wells', 'LD1 6RF'],
    personPhones: ['Mobile: 07583 207716'], personEmail: 'rhian.pugh@penybontfarm.example.co.uk'
  },
  // 2 cases: Hampshire estate, a water management company runs the reservoirs.
  '713334260': {
    region: 'Rural Hampshire', orgType: 'Water Management Company',
    name: 'Itchen Valley Water Management Ltd',
    address: ['Home Farm Office', 'Alresford Road', 'Alton', 'Hampshire', 'GU34 3PQ'],
    phones: ['Telephone: 01420 563817'], email: 'enquiries@itchenvalleywater.example.co.uk',
    legal: 'Limited company', companyNumber: '10358429', vat: 'GB839061752',
    person: 'James Ashworth', customerRef: '6641203379',
    personAddress: ['Lower Mill House', 'Mill Lane', 'Alton', 'GU34 3QA'],
    personPhones: ['Mobile: 07455 918204'], personEmail: 'james.ashworth@itchenvalleywater.example.co.uk'
  }
}
function defaultProfile (c) {
  return {
    name: 'North Sussex Weald Dairy Farm Ltd',
    address: ['15 London Road', 'Horsham', 'West Sussex', 'RH13 6PJ'],
    phones: ['Telephone: 0191 305 7642', 'Mobile: 07392 674851'], email: 'wealddairyfarm@me.com',
    legal: 'Limited company', companyNumber: '12345678', vat: 'GB123456789',
    person: 'Sally Wiston', customerRef: '1234512345',
    personAddress: ['10 Skirbeck Way', 'Maidstone', 'SK22 1DL'],
    personPhones: ['Mobile: 01273 333000'], personEmail: 'sally.wiston@wistonlandagents.co.uk'
  }
}

// ---------- Hand-set cases ----------
// Cases the user asked for particular scores / SBI groupings on. Their answers are
// chosen so the derived score matches exactly (and is one that can be earned).
//   301246  95  top case of SBI 244666513        60 + 25 + 10 + 0
//   301236  90  same SBI, just below             60 + 15 + 10 + 5
//   300245  85  same SBI, equal pair (£56,300)   60 + 20 + 5  + 0
//   301085  85  TWIN of 300245 (identical application)
//   301305  85  SBI 824231248, equal pair        60 + 15 + 5  + 5
//   300348  85  TWIN of 301305 (identical application)
//   300819  65  SBI 824231248                    60 + 5  + 0  + 0
const OVERRIDES = {
  '301246': { colour: 'Red', crops: ['Soft & Cane Fruit', 'Arable'], biz: 'Five or more', planning: 'No', ea: 'Not needed' },
  '301236': { colour: 'Red', crops: ['Top & Stone Fruit'], biz: 'Five or more', planning: 'Yes', ea: 'Yes' },
  '300245': { colour: 'Red', crops: ['Ornamentals'], biz: 'Two to four', planning: 'No', ea: 'No' },
  '301305': { colour: 'Red', crops: ['Field scale vegetables'], biz: 'Two to four', planning: 'Yes', ea: 'Not needed' },
  '300819': { colour: 'Red', crops: ['Arable'], biz: 'One', planning: 'No', ea: 'Not needed' }
}
// Everything else is capped at 90 so the hand-set top case (95) stays the clear top.
const NATURAL_MAX = 90
// Two instances where the same business submitted the SAME application twice: the
// twin carries exactly its partner's answers (so the same score and, being priced
// from the same items, the same cost); only the case ID and application date differ.
const TWINS = { '301085': '300245', '300348': '301305' }


function waterSector (id, crops) {
  if (!crops) {
    const h = waterHash(id, 2891336453, 6)
    const count = 1 + h % 3
    const start = (h >>> 4) % SECTOR_CROPS.length
    const step = [1, 2, 4, 5][(h >>> 8) % 4] // coprime with 9, so the crops are distinct
    crops = []
    for (let k = 0; k < count; k++) crops.push(SECTOR_CROPS[(start + k * step) % SECTOR_CROPS.length])
  }
  let best = { crop: '', score: -1 }
  crops.forEach(function (c) { if (SECTOR_SCORES[c] > best.score) best = { crop: c, score: SECTOR_SCORES[c] } })
  return { crops: crops, best: best }
}

const ORG_TYPES = ['Landowner/landlord', 'Landowner/owner occupier', 'Water Management Company']
const SOURCE_OPTIONS = ['Surface water abstraction for storage', 'Rainwater harvesting', 'Borehole / aquifer']

// The whole made-up application for a case ({id, sbi, date, ...}), including the
// score breakdown and total. Pure function of the case.
function waterApplication (c) {
  if (TWINS[c.id]) {
    // Same application as the partner case; reload it from the cases file.
    const partner = require('./water-management-cases.js').cases.filter(function (x) { return x.id === TWINS[c.id] })[0]
    return waterApplication(partner)
  }
  const id = c.id
  const ov = OVERRIDES[id]
  const profile = BUSINESS_PROFILES[c.sbi] || defaultProfile(c)
  const loc = waterLocation(id, ov && ov.colour, profile.region)
  const sector = waterSector(id, ov && ov.crops)
  let businesses = (ov && ov.biz) || BIZ_OPTIONS[waterHash(id, 2246822519, 10) % BIZ_OPTIONS.length]
  let consents = waterConsents(id, ov)
  let cScore = consentScore(consents.licence.answer, consents.planning.answer)
  const total = function () { return sector.best.score + loc.score + BIZ_SCORES[businesses] + cScore }
  if (!ov) {
    if (total() > NATURAL_MAX && cScore > 0) {
      consents = waterConsents(id, { planning: 'No', ea: consents.licence.answer })
      cScore = consentScore(consents.licence.answer, consents.planning.answer)
    }
    if (total() > NATURAL_MAX && businesses !== 'One') businesses = BIZ_OPTIONS[BIZ_OPTIONS.indexOf(businesses) - 1]
  }
  const mask = (waterHash(id, 3266489917, 14) % 7) + 1
  const scores = { sector: sector.best.score, scarcity: loc.score, businesses: BIZ_SCORES[businesses], consents: cScore }
  scores.total = scores.sector + scores.scarcity + scores.businesses + scores.consents
  return {
    loc: loc, sector: sector, businesses: businesses, bizScore: scores.businesses,
    consents: consents, consentScore: cScore,
    profile: profile,
    orgType: profile.orgType || ORG_TYPES[waterHash(id, 2654435761, 12) % ORG_TYPES.length],
    waterSources: SOURCE_OPTIONS.filter(function (o, i) { return mask & (1 << i) }),
    workStart: waterWorkStart(c), items: waterItems(id, BUSINESS_PROFILES[c.sbi] ? c.value : undefined), scores: scores
  }
}

module.exports = { waterApplication: waterApplication, SECTOR_SCORES: SECTOR_SCORES, OVERRIDES: OVERRIDES, TWINS: TWINS, BUSINESS_PROFILES: BUSINESS_PROFILES }
