// Applicant portal prototype: landing page driven by phase, with in-portal mini journeys.
// Views in views/applicant-portal. Phase data in ./data.js, journeys in ./journeys.js.
const { TRK, HEAD, PHASES } = require('./data.js')
const { JOURNEYS, ACTIONS } = require('./journeys.js')

const START = { water: 'w1', grass: 'g1' }
const APPS = {
  water: { ref: 'WM-2026-0412', name: 'Water management grant' },
  grass: { ref: 'GR-2026-0287', name: 'Grasslands' }
}

function state (req) {
  const d = req.session.data
  if (!d.ap) d.ap = { phase: { water: START.water, grass: START.grass }, done: {}, banner: {}, reason: {} }
  return d.ap
}
function phaseOf (g, s) { return PHASES.find(function (p) { return p.id === s.phase[g] }) }
function href (g, label) { return '/applicant-portal/do/' + g + '?label=' + encodeURIComponent(label) }

function buildView (g, s) {
  const p = phaseOf(g, s)
  const done = s.done[p.id] || []
  const todo = p.todo ? p.todo.filter(function (t) { return done.indexOf(ACTIONS[t.b]) === -1 }) : null
  const cards = p.cards.map(function (c) {
    return {
      t: c.t, tag: c.tag,
      rows: (c.rows || []).map(function (r) { return [r[0], r[1] === '__REASON__' ? (s.reason[g] || 'Withdrawn by you') : r[1]] }),
      links: (c.links || []).map(function (l) { return { label: l, href: href(g, l) } })
    }
  })
  return {
    g: g, p: p, head: HEAD[g], trk: TRK[g], cards: cards,
    todo: todo && todo.length ? todo.map(function (t) { return Object.assign({}, t, { href: href(g, t.b) }) }) : null,
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
      s.phase[g] = START[g] === 'w1' ? 'w9' : 'g10'
      s.reason[g] = 'You rejected the offer'
      return res.redirect('/applicant-portal/case/' + g)
    }

    const pid = s.phase[g]
    s.done[pid] = (s.done[pid] || []).concat(key)
    const p = phaseOf(g, s)
    const left = (p.todo || []).filter(function (t) { return s.done[pid].indexOf(ACTIONS[t.b]) === -1 })
    s.banner[g] = j.banner
    if (!left.length && j.next && j.next[pid]) {
      s.phase[g] = j.next[pid]
      s.done[s.phase[g]] = []
    }
    res.redirect('/applicant-portal/case/' + g)
  })
}
