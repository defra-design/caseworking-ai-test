// Applicant portal prototype: landing page driven by phase, with in-portal mini journeys.
// Views in views/applicant-portal. Phase data in ./data.js, journeys in ./journeys.js.
const { TRK, HEAD, PHASES } = require('./data.js')
const { JOURNEYS, ACTIONS } = require('./journeys.js')

const START = { water: 'w0', grass: 'g0' }
const APPS = {
  water: { ref: 'WM-2026-0412', name: 'Water management grant' },
  grass: { ref: 'GR-2026-0287', name: 'Grasslands' }
}

function state (req) {
  const d = req.session.data
  if (!d.ap) d.ap = { phase: { water: START.water, grass: START.grass }, done: {}, banner: {}, reason: {}, evidence: { water: [], grass: [] } }
  // sessions created before a key existed (e.g. evidence) get it filled in rather than breaking
  if (!d.ap.evidence) d.ap.evidence = { water: [], grass: [] }
  if (!d.ap.evidence.water) d.ap.evidence.water = []
  if (!d.ap.evidence.grass) d.ap.evidence.grass = []
  return d.ap
}
function phaseOf (g, s) { return PHASES.find(function (p) { return p.id === s.phase[g] }) }
function href (g, label) { return '/applicant-portal/do/' + g + '?label=' + encodeURIComponent(label) }

function buildView (g, s) {
  const p = phaseOf(g, s)
  const done = s.done[p.id] || []
  const left = p.action ? p.action.filter(function (t) { return done.indexOf(t.key || ACTIONS[t.b]) === -1 }) : null
  const links = function (a) { return (a || []).map(function (l) { return { label: l, href: href(g, l) } }) }
  const reason = s.reason[g] || 'Withdrawn by you'
  const rec = p.record
  return {
    g: g, p: p, head: Object.assign({}, HEAD[g], p.cap ? { cap: p.cap } : {}), trk: TRK[g],
    // 1 Action needed
    action: left && left.length ? left.map(function (t) { return Object.assign({}, t, { href: t.b ? href(g, t.b) : null }) }) : null,
    next: left && left.length ? links(p.next) : [],
    // 2 Your application / Your agreement (end-of-case next steps move here when there is no action)
    record: { title: rec.title, tag: rec.tag, change: links(rec.change), button: rec.button ? { label: rec.button, href: href(g, rec.button) } : null,
      links: links(rec.links.concat(left && left.length ? [] : (p.next || []))),
      rows: rec.rows.map(function (r) { return [r[0], r[1] === '__REASON__' ? reason : r[1]] }) },
    // 3 Payments and claims, 4 Messages, 5 History
    pay: p.pay ? { tag: p.pay.tag, rows: p.pay.rows || [], links: links(p.pay.links) } : null,
    msgs: p.msgs ? p.msgs.map(function (m) { return Object.assign({}, m, { links: links(m.links) }) }) : null,
    hist: p.hist, related: links(p.related),
    // Your evidence: the phase's seeded examples (claim or report due onwards) plus anything uploaded in this session
    evidence: (p.evidence || []).concat(s.evidence[g]).map(function (e) {
      return { name: e[0], when: e[1], href: href(g, e[0]) }
    }),
    phases: PHASES.filter(function (x) { return x.g === g }),
    banner: s.banner[g]
  }
}

module.exports = function (router) {
  router.get('/applicant-portal', function (req, res) {
    const s = state(req)
    res.render('applicant-portal/index', {
      apps: Object.keys(APPS).map(function (g) { return Object.assign({ g: g, phase: phaseOf(g, s) }, APPS[g]) })
    })
  })

  router.get('/applicant-portal/case/:g', function (req, res) {
    const s = state(req)
    const g = req.params.g
    if (!START[g]) return res.redirect('/applicant-portal')
    const view = buildView(g, s)
    delete s.banner[g]
    res.render('applicant-portal/case', view)
  })

  router.get('/applicant-portal/phase/:g/:id', function (req, res) {
    const s = state(req)
    if (START[req.params.g] && PHASES.some(function (p) { return p.id === req.params.id })) {
      s.phase[req.params.g] = req.params.id
      s.done[req.params.id] = []
      delete s.banner[req.params.g]
    }
    res.redirect('/applicant-portal/case/' + req.params.g)
  })

  router.get('/applicant-portal/reset', function (req, res) {
    delete req.session.data.ap
    res.redirect('/applicant-portal')
  })

  router.get('/applicant-portal/do/:g', function (req, res) {
    const g = req.params.g
    const label = req.query.label || ''
    const key = ACTIONS[label]
    if (!key) return res.render('applicant-portal/placeholder', { g: g, label: label })
    res.render('applicant-portal/journey', { g: g, key: key, j: JOURNEYS[key] })
  })

  router.post('/applicant-portal/complete/:g/:key', function (req, res) {
    const s = state(req)
    const g = req.params.g
    const key = req.params.key
    const j = JOURNEYS[key]
    if (!j) return res.redirect('/applicant-portal/case/' + g)
    const answer = String(req.body.decision || req.body.sure || '')
    const closeTo = function (reason) { s.phase[g] = j.forceTo[g]; s.reason[g] = reason; s.done[s.phase[g]] = [] }

    if (j.forceTo) {
      if (answer.indexOf(j.yesOn) === 0) {
        if (key === 'amend') { s.phase[g] = j.forceTo[g]; s.banner[g] = 'We opened a copy of your application for you to amend.' } else closeTo(j.reason)
      }
      return res.redirect('/applicant-portal/case/' + g)
    }
    if (j.rejectOn && answer.indexOf(j.rejectOn) === 0) {
      s.phase[g] = g === 'water' ? 'w9' : 'g10'
      s.reason[g] = 'You rejected the offer'
      return res.redirect('/applicant-portal/case/' + g)
    }

    const pid = s.phase[g]
    if (key === 'upload') {
      const type = String(req.body.evType || 'Evidence')
      const when = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
      s.evidence[g].push([type, 'Uploaded ' + when])
    }
    s.done[pid] = (s.done[pid] || []).concat(key)
    const p = phaseOf(g, s)
    const left = (p.action || []).filter(function (t) { return s.done[pid].indexOf(t.key || ACTIONS[t.b]) === -1 })
    s.banner[g] = j.banner
    if (!left.length && j.next && j.next[pid]) {
      s.phase[g] = j.next[pid]
      s.done[s.phase[g]] = []
    }
    res.redirect('/applicant-portal/case/' + g)
  })
}
