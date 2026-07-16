const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
// express isn't a direct project dependency; reach it through the kit's bundle.
const express = require('govuk-prototype-kit/node_modules/express')

// Make the case 3 tasklist data model available to all templates as `tasklistData`.
// The data file is reloaded on each request so /builder/persist edits are picked up live.
const path = require('path')
const fs = require('fs')

// Serve the accessible-autocomplete dist files (CSS/JS) from node_modules.
// Used by /FRPS-D2/case2/calculations-new2 to power the parcel search.
router.use('/vendor/accessible-autocomplete', express.static(
  path.join(__dirname, '..', 'node_modules', 'accessible-autocomplete', 'dist')
))
const tasklistDataPath = path.join(__dirname, 'data', 'd2-case-tasklist.js')

function loadTasklistData () {
  delete require.cache[require.resolve(tasklistDataPath)]
  return require(tasklistDataPath)
}

router.use(function (req, res, next) {
  const live = loadTasklistData()
  res.locals.tasklistData = live
  if (req.session && req.session.data) {
    req.session.data.tasklistData = live
  }
  next()
})

// Expose the Grasslands team reference data to every template (tab label,
// "Switch team" dropdown, team filtering). Reloaded per request so edits to
// data/grasslands-teams.js are picked up live.
const grasslandsTeamsPath = path.join(__dirname, 'data', 'grasslands-teams.js')
router.use(function (req, res, next) {
  delete require.cache[require.resolve(grasslandsTeamsPath)]
  const gt = require(grasslandsTeamsPath)
  res.locals.grasslandsTeams = gt.teams
  res.locals.grasslandsTeamNames = gt.nameById
  next()
})

// ============================================================
// Research archive — change-history surface for the pattern library
// Reads app/research-archive/manifest.json (v2 contract) fresh per request
// so edits show live. Order + per-screen version are DERIVED here from
// reports[].fieldworkDate — never stored on a capture. See
// research-archive/schema-notes.md.
// ============================================================

const researchManifestPath = path.join(__dirname, 'research-archive', 'manifest.json')

function loadManifest () {
  return JSON.parse(fs.readFileSync(researchManifestPath, 'utf8'))
}

// fieldworkDate is the authoritative sort key; fall back to display `date`.
function fieldworkTime (report) {
  if (!report) return 0
  const iso = report.fieldworkDate || (report.date ? report.date + '-01' : '1970-01-01')
  const t = Date.parse(iso)
  return Number.isNaN(t) ? 0 : t
}

// Lower number = more severe; used to sort the outstanding backlog.
const VERDICT_SEVERITY = { problem: 0, mixed: 1, 'mostly-worked': 2, worked: 3 }

function rollupRecs (recs) {
  const c = { addressed: 0, partial: 0, outstanding: 0, rejected: 0, total: recs.length }
  recs.forEach(function (r) { if (c[r.status] !== undefined) c[r.status]++ })
  const pct = function (n) { return c.total ? Math.round((n / c.total) * 100) : 0 }
  c.pctDone = pct(c.addressed)
  c.pctPart = pct(c.partial)
  c.pctOut = pct(c.outstanding)
  c.pctNo = pct(c.rejected)
  c.openCount = c.outstanding + c.partial
  return c
}

// Parse an ISO date string (e.g. a version sortDate) to a sortable number.
function dateTime (s) {
  const t = Date.parse(s || '')
  return Number.isNaN(t) ? 0 : t
}

// Human-readable date — "17 June 2025" (day precision) or "June 2025" (month).
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
function prettyDate (iso, precision) {
  if (!iso) return ''
  const p = String(iso).split('-')
  const mi = parseInt(p[1], 10) - 1
  if (mi < 0 || mi > 11) return iso
  if (precision === 'month' || !p[2]) return MONTH_NAMES[mi] + ' ' + p[0]
  return parseInt(p[2], 10) + ' ' + MONTH_NAMES[mi] + ' ' + p[0]
}

// Roll up persona needs by status (met / partial / unmet) + provenance.
function rollupNeeds (list) {
  const c = { met: 0, partial: 0, unmet: 0, total: list.length, fromResearch: 0, added: 0 }
  list.forEach(function (n) {
    if (c[n.status] !== undefined) c[n.status]++
    if (n.source === 'research') c.fromResearch++; else c.added++
  })
  const pct = function (x) { return c.total ? Math.round((x / c.total) * 100) : 0 }
  c.pctMet = pct(c.met)
  c.pctPart = pct(c.partial)
  c.pctUnmet = pct(c.unmet)
  c.openCount = c.partial + c.unmet
  return c
}

// Build the fully-derived archive model the templates render from.
function buildResearchArchive () {
  const m = loadManifest()
  const reportById = {}
  m.reports.forEach(function (r) {
    r.indicative = !!(r.sampleSize && r.sampleSize <= 5)
    reportById[r.id] = r
  })

  const screens = Object.keys(m.screens).map(function (id) {
    const meta = m.screens[id]
    const caps = m.captures
      .filter(function (c) { return c.screenId === id })
      .map(function (c) { return Object.assign({}, c, { report: reportById[c.reportId] }) })
      .sort(function (a, b) { return fieldworkTime(a.report) - fieldworkTime(b.report) })

    caps.forEach(function (c, i) {
      c.version = i + 1
      c.isBaseline = i === 0
      c.previous = i > 0 ? caps[i - 1] : null
      c.recommendedChanges = c.recommendedChanges || []
      c.rollup = rollupRecs(c.recommendedChanges)
    })

    const recs = caps.reduce(function (acc, c) { return acc.concat(c.recommendedChanges) }, [])
    const latest = caps[caps.length - 1] || null

    // Version spine: a screen's history is its design versions (sorted by
    // sortDate). A research capture attaches to a version via screenId@date;
    // a version may have no capture (design-only) and still renders.
    const screenVersions = (m.versions || [])
      .filter(function (v) { return v.screenId === id })
      .slice()
      .sort(function (a, b) { return dateTime(a.sortDate) - dateTime(b.sortDate) })
      .map(function (v, i) {
        const cap = caps.find(function (c) { return (c.screenId + '@' + (c.report ? c.report.date : '')) === v.versionId }) || null
        const displayDate = cap
          ? prettyDate(cap.report.fieldworkDate, cap.report.datePrecision)
          : prettyDate(v.sortDate, 'month')
        return Object.assign({}, v, { label: i + 1, isBaseline: i === 0, capture: cap, displayDate: displayDate })
      })
    screenVersions.forEach(function (v, i) { v.previous = i > 0 ? screenVersions[i - 1] : null })

    // Hero image = most recent version that has a screenshot; last-changed = newest version date.
    let heroImage = null
    for (let hv = screenVersions.length - 1; hv >= 0; hv--) { if (screenVersions[hv].image) { heroImage = screenVersions[hv].image; break } }
    const lastVersion = screenVersions[screenVersions.length - 1] || null

    const screenNeeds = (m.needs || []).filter(function (n) { return (n.relatedScreens || []).indexOf(id) !== -1 })

    return Object.assign({}, meta, {
      id: id,
      captures: caps,
      captureCount: caps.length,
      versions: screenVersions,
      versionCount: screenVersions.length,
      heroImage: heroImage,
      lastChangedDate: lastVersion ? lastVersion.date : null,
      needs: screenNeeds,
      latestVerdict: latest ? latest.verdict : null,
      rollup: rollupRecs(recs)
    })
  })

  const allRecs = screens.reduce(function (acc, s) {
    return acc.concat(s.captures.reduce(function (a, c) { return a.concat(c.recommendedChanges) }, []))
  }, [])

  // Flat backlog of every open (outstanding/partial) recommendation, with
  // screen + report context, sorted by verdict severity then recency.
  const backlog = []
  screens.forEach(function (s) {
    s.captures.forEach(function (c) {
      c.recommendedChanges.forEach(function (r) {
        if (r.status === 'outstanding' || r.status === 'partial') {
          backlog.push({
            rec: r,
            screenId: s.id,
            screenTitle: s.title,
            area: s.area,
            currentScreen: s.currentScreen,
            verdict: c.verdict,
            report: c.report
          })
        }
      })
    })
  })
  backlog.sort(function (a, b) {
    const sv = (VERDICT_SEVERITY[a.verdict] || 9) - (VERDICT_SEVERITY[b.verdict] || 9)
    if (sv !== 0) return sv
    return fieldworkTime(b.report) - fieldworkTime(a.report)
  })

  const areas = screens.reduce(function (acc, s) {
    if (s.area && acc.indexOf(s.area) === -1) acc.push(s.area)
    return acc
  }, [])

  // Reports list (newest first), each augmented with what it captured so the
  // archive index can show report-level findings — including discovery reports
  // that have themes but no screen captures.
  const reportsList = m.reports.slice()
    .sort(function (a, b) { return fieldworkTime(b) - fieldworkTime(a) })
    .map(function (r) {
      const caps = m.captures.filter(function (c) { return c.reportId === r.id })
      const screenIds = []
      caps.forEach(function (c) { if (screenIds.indexOf(c.screenId) === -1) screenIds.push(c.screenId) })
      return Object.assign({}, r, {
        captureCount: caps.length,
        screenIds: screenIds,
        screenCount: screenIds.length
      })
    })

  // --- Pillar the archive around the three interface-development stages ---
  // Each screen-testing report carries a `stage` (1/2/3); discovery/survey
  // reports carry none and fall into "Context". Screens tested in a stage are
  // derived from that stage's captures; a capture with no findings and no
  // recommendations means "tested, no issues recorded".
  const STAGE_META = {
    1: { n: 1, title: 'Stage 1 — FG-casework', blurb: 'The first built caseworking interface (case list + case view), tested as an early concept.', liveUrl: '/FG-casework/caselist-my' },
    2: { n: 2, title: 'Stage 2 — FRPS Private Beta, Day 1', blurb: 'The HTML prototype iteration built for the SFI Private Beta Day 1, tested with appraisers and SFI processors.', liveUrl: '/FRPS-PB-D1/caselist-my' },
    3: { n: 3, title: 'Stage 3 — FRPS-D2', blurb: 'The current iteration, tested for the amend-application-pre-agreement flow.', liveUrl: '/FRPS-D2/caseReal/tasklist-stage' }
  }

  function stageScreens (n) {
    const out = []
    screens.forEach(function (s) {
      const caps = s.captures.filter(function (c) { return c.report && c.report.iteration === n })
      if (!caps.length) return
      const c = caps[caps.length - 1]
      const noIssues = (!c.findings || c.findings.length === 0) &&
                       (!c.recommendedChanges || c.recommendedChanges.length === 0)
      out.push({ id: s.id, title: s.title, currentScreen: s.currentScreen, verdict: c.verdict, noIssues: noIssues, shipped: c.shippedInStage !== false })
    })
    return out
  }

  const stages = [1, 2, 3].map(function (n) {
    return Object.assign({}, STAGE_META[n], {
      reports: reportsList.filter(function (r) { return r.iteration === n }),
      screens: stageScreens(n)
    })
  })

  const contextReports = reportsList.filter(function (r) { return !r.iteration })

  // --- Personas & needs (Move 4) ---
  const allNeeds = (m.needs || []).map(function (n) {
    const screenTitles = (n.relatedScreens || []).map(function (sid) { return m.screens[sid] ? m.screens[sid].title : sid })
    const persona = m.personas && m.personas[n.personaId] ? m.personas[n.personaId] : null
    return Object.assign({}, n, { screenTitles: screenTitles, personaName: persona ? persona.name : n.personaId })
  })
  const personas = Object.keys(m.personas || {}).map(function (pid) {
    const pneeds = allNeeds.filter(function (n) { return n.personaId === pid })
    return Object.assign({}, m.personas[pid], { id: pid, needs: pneeds, rollup: rollupNeeds(pneeds) })
  })

  // Screens with a tracked history but no research captures yet.
  const screensNoResearch = screens.filter(function (s) { return s.captureCount === 0 })

  return {
    imageBase: m.imageBase,
    screens: screens,
    reports: reportsList,
    stages: stages,
    contextReports: contextReports,
    grasslandsChanges: m.grasslandsChanges || [],
    personas: personas,
    needs: allNeeds,
    needsRollup: rollupNeeds(allNeeds),
    screensNoResearch: screensNoResearch,
    archiveRollup: rollupRecs(allRecs),
    backlog: backlog,
    areas: areas
  }
}

// Research history — hub landing (links to the four areas).
router.get('/pattern-library/research', function (req, res) {
  res.render('pattern-library/research/index', { archive: buildResearchArchive(), researchArea: 'hub' })
})

// Area 1 — Background research (discovery / survey studies + themes).
router.get('/pattern-library/research/background', function (req, res) {
  res.render('pattern-library/research/background', { archive: buildResearchArchive(), researchArea: 'background' })
})

// Area 2 — Screen histories index (stage pillars + screens grid + filter).
router.get('/pattern-library/research/screens', function (req, res) {
  const archive = buildResearchArchive()
  const filter = req.query.filter || 'all' // all | unresolved | changed
  const area = req.query.area || ''
  let screens = archive.screens
  if (area) screens = screens.filter(function (s) { return s.area === area })
  if (filter === 'unresolved') {
    screens = screens.filter(function (s) { return s.rollup.openCount > 0 })
  } else if (filter === 'changed') {
    screens = screens.filter(function (s) { return s.versionCount > 1 })
  }
  res.render('pattern-library/research/screens', {
    archive: archive,
    researchArea: 'screens',
    screensFiltered: screens,
    screensDeployed: screens.filter(function (s) { return s.deployed }),
    screensNotDeployed: screens.filter(function (s) { return !s.deployed }),
    filter: filter,
    area: area
  })
})

// Area 2 — one screen's history.
router.get('/pattern-library/research/screens/:screenId', function (req, res, next) {
  const archive = buildResearchArchive()
  const screen = archive.screens.find(function (s) { return s.id === req.params.screenId })
  if (!screen) return next()
  res.render('pattern-library/research/screen', { archive: archive, screen: screen, researchArea: 'screens' })
})

// Area 3 — Personas & needs (list).
router.get('/pattern-library/research/personas', function (req, res) {
  res.render('pattern-library/research/personas', { archive: buildResearchArchive(), researchArea: 'personas' })
})

// Area 3 — one persona.
router.get('/pattern-library/research/personas/:personaId', function (req, res, next) {
  const archive = buildResearchArchive()
  const persona = archive.personas.find(function (p) { return p.id === req.params.personaId })
  if (!persona) return next()
  res.render('pattern-library/research/persona', { archive: archive, persona: persona, researchArea: 'personas' })
})

// Area 4 — Coverage (rollups, outstanding backlog, grasslands, needs-met, no-research).
router.get('/pattern-library/research/coverage', function (req, res) {
  res.render('pattern-library/research/coverage', { archive: buildResearchArchive(), researchArea: 'coverage' })
})

// ============================================================
// Builder — edit and persist the case 3 tasklist data file
// ============================================================

function getDraft (req) {
  if (!req.session.data.tasklistDraft) {
    req.session.data.tasklistDraft = JSON.parse(JSON.stringify(loadTasklistData()))
  }
  return req.session.data.tasklistDraft
}

function asArray (v) {
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
}

router.get('/builder', function (req, res) {
  res.render('builder/index')
})

router.get('/builder/edit-task', function (req, res) {
  req.session.data.key = req.query.key
  res.render('builder/edit-task')
})

router.get('/builder/edit-stage', function (req, res) {
  req.session.data.key = req.query.key
  res.render('builder/edit-stage')
})

router.get('/builder/edit-decision', function (req, res) {
  req.session.data.key = req.query.key
  res.render('builder/edit-decision')
})

router.post('/builder/save-task', function (req, res) {
  const draft = getDraft(req)
  const k = req.body.key
  const t = draft.tasks[k] || {}
  t.linkText = req.body.linkText
  t.href = req.body.href
  if (req.body.hrefIfFinanceOfficer) t.hrefIfFinanceOfficer = req.body.hrefIfFinanceOfficer
  else delete t.hrefIfFinanceOfficer
  t.decisionField = req.body.decisionField
  t.acceptedValue = req.body.acceptedValue
  t.statusField = req.body.statusField
  t.tagField = req.body.tagField
  draft.tasks[k] = t
  req.session.data.tasklistDraftDirty = true
  res.redirect('/builder')
})

router.post('/builder/save-stage', function (req, res) {
  const draft = getDraft(req)
  const k = req.body.key
  const s = draft.stages[k] || {}
  s.heading = req.body.heading
  s.intro = req.body.intro || null
  s.taskListHeading = req.body.taskListHeading || null
  s.tasks = (req.body.tasks || '').split(',').map(x => x.trim()).filter(Boolean)
  if (req.body.defaultStatusTagClass || req.body.defaultStatusTagText) {
    s.defaultStatusTag = { class: req.body.defaultStatusTagClass, text: req.body.defaultStatusTagText }
  }
  s.decision = req.body.decision || null
  if (req.body.actionType) {
    s.action = { type: req.body.actionType, text: req.body.actionText }
    if (req.body.actionHref) s.action.href = req.body.actionHref
  } else {
    s.action = null
  }
  draft.stages[k] = s
  req.session.data.tasklistDraftDirty = true
  res.redirect('/builder')
})

router.post('/builder/save-decision', function (req, res) {
  const draft = getDraft(req)
  const k = req.body.key
  const d = draft.decisionOptions[k] || {}
  d.legend = req.body.legend
  d.legendHint = req.body.legendHint || undefined
  d.formField = req.body.formField
  d.conditionalNoteField = req.body.conditionalNoteField
  d.conditionalHint = req.body.conditionalHint
  if (d.legendHint === undefined) delete d.legendHint
  const values = asArray(req.body.optValue)
  const labels = asArray(req.body.optLabel)
  d.options = []
  for (let i = 0; i < values.length; i++) {
    const v = (values[i] || '').trim()
    const l = (labels[i] || '').trim()
    if (v) d.options.push({ value: v, label: l || v })
  }
  draft.decisionOptions[k] = d
  req.session.data.tasklistDraftDirty = true
  res.redirect('/builder')
})

router.post('/builder/persist', function (req, res) {
  const draft = req.session.data.tasklistDraft
  if (!draft) return res.redirect('/builder')
  const out = '// Auto-generated by /builder/persist. Run-time edits saved here.\n' +
              'module.exports = ' + JSON.stringify(draft, null, 2) + ';\n'
  fs.writeFileSync(tasklistDataPath, out)
  delete req.session.data.tasklistDraft
  delete req.session.data.tasklistDraftDirty
  res.redirect('/builder')
})

router.get('/builder/discard', function (req, res) {
  delete req.session.data.tasklistDraft
  delete req.session.data.tasklistDraftDirty
  res.redirect('/builder')
})

// ============================================================
// Builder /new — guided flow that creates a new tasklist data file
// ============================================================

function getFlow (req) {
  if (!req.session.data.builderFlow) {
    req.session.data.builderFlow = { stageCount: 0, stages: [], setupIndex: 0, cur: { stage: 0, task: 0 } }
  }
  return req.session.data.builderFlow
}

function stagePrefix (name) {
  const alpha = (name || '').replace(/[^a-zA-Z]/g, '')
  return (alpha.slice(0, 3) || 'stg').toLowerCase()
}

function newDecisionFromBody (body, idx) {
  const label = asArray(body.decLabel)[idx] || ''
  const cs    = asArray(body.decChangesStage)[idx] || ''
  const ts    = asArray(body.decTargetStage)[idx] || ''
  const css   = asArray(body.decChangesStatus)[idx] || ''
  const stxt  = asArray(body.decStatusText)[idx] || ''
  const tag   = asArray(body.decTagClass)[idx] || ''
  const reqAllRaw = asArray(body.decReqAllTasks)
  const reqAll    = reqAllRaw[idx] === 'yes'
  const reasonF   = asArray(body.decReasonField)[idx] || ''
  return {
    label: label,
    changesStage: cs === 'yes',
    targetStage: ts,
    changesStatus: css === 'yes',
    statusText: stxt,
    tagClass: tag,
    requiresAllTasksAccepted: reqAll,
    reasonField: reasonF
  }
}

router.get('/builder/new', function (req, res) {
  res.render('builder/new/start')
})

// ----- Loader: open an existing builder-tasklist file in the CYA -----

router.get('/builder/loader', function (req, res) {
  const dir = path.join(__dirname, 'data')
  const files = fs.readdirSync(dir).filter(f => /^builder-tasklist-.*\.js$/.test(f)).sort().reverse()
  res.render('builder/loader', { loaderFiles: files })
})

function fileToFlow (filePath) {
  delete require.cache[require.resolve(filePath)]
  const m = require(filePath)
  const flow = { stageCount: 0, stages: [], setupIndex: 0, cur: { stage: 0, task: 0 } }
  const stageKeys = Object.keys(m.stages || {})
  flow.stageCount = stageKeys.length
  stageKeys.forEach((sk, sIdx) => {
    const sObj = m.stages[sk]
    const decGroup = (m.decisionOptions || {})[sObj.decisionGroup] || {}
    const outcomes = (decGroup.options || []).map(o => o.label).join(', ')
    const tasks = (sObj.tasks || []).map(tk => {
      const t = (m.tasks || {})[tk] || {}
      return { pageTitle: t.pageTitle || '', preOutcomesHtml: t.preOutcomesHtml || '' }
    })
    const cond = sObj.conditional || null
    flow.stages.push({
      name: sObj.heading || sk,
      prefix: sObj.prefix || sk,
      taskCount: tasks.length,
      tasks: tasks,
      description: sObj.description || '',
      hasConditional: !!(cond && (cond.field || cond.when || cond.text)),
      conditionalField: cond ? (cond.field || '') : '',
      conditionalEquals: cond ? (cond.equals !== undefined ? cond.equals : '') : '',
      conditionalText: cond ? (cond.text || '') : '',
      outcomes: outcomes,
      acceptedOutcome: decGroup.acceptedValue || '',
      decisions: (sObj.decisions || []).map(d => ({
        label: d.label || '',
        changesStage: !!d.stageChange,
        targetStage: d.stageChange || '',
        changesStatus: !!d.statusChange,
        statusText: d.statusChange ? d.statusChange.status : '',
        tagClass: d.statusChange ? d.statusChange.tag : '',
        requiresAllTasksAccepted: !!d.requiresAllTasksAccepted,
        reasonField: d.reasonField || ''
      }))
    })
  })
  return flow
}

router.post('/builder/loader/load', function (req, res) {
  const file = req.body.file
  if (!file || !/^builder-tasklist-.*\.js$/.test(file)) return res.redirect('/builder/loader')
  const filePath = path.join(__dirname, 'data', file)
  if (!fs.existsSync(filePath)) return res.redirect('/builder/loader')
  req.session.data.builderFlow = fileToFlow(filePath)
  res.redirect('/builder/new/check-answers')
})

router.post('/builder/new/start', function (req, res) {
  const n = parseInt(req.body.stageCount, 10) || 0
  const flow = { stageCount: n, stages: [], setupIndex: 0, cur: { stage: 0, task: 0 } }
  for (let i = 0; i < n; i++) flow.stages.push({ name: '', prefix: '', taskCount: 0, tasks: [], description: '', hasConditional: false, conditionalField: '', conditionalEquals: '', conditionalText: '', outcomes: '', acceptedOutcome: '', decisions: [{}] })
  req.session.data.builderFlow = flow
  res.redirect('/builder/new/stage-setup')
})

router.get('/builder/new/stage-setup', function (req, res) {
  res.render('builder/new/stage-setup')
})

router.post('/builder/new/stage-setup', function (req, res) {
  const flow = getFlow(req)
  const i = parseInt(req.body.index, 10)
  const tc = parseInt(req.body.taskCount, 10) || 0
  const stage = flow.stages[i]
  stage.name = req.body.stageName || ('Stage ' + (i + 1))
  stage.prefix = stagePrefix(stage.name)
  stage.taskCount = tc
  if (!stage.tasks || stage.tasks.length !== tc) {
    stage.tasks = []
    for (let t = 0; t < tc; t++) stage.tasks.push({})
  }
  stage.description = req.body.description || ''
  const hcRaw = req.body.hasConditional
  stage.hasConditional = Array.isArray(hcRaw) ? hcRaw.indexOf('yes') !== -1 : hcRaw === 'yes'
  stage.conditionalField = req.body.conditionalField || ''
  stage.conditionalEquals = req.body.conditionalEquals || ''
  stage.conditionalText = req.body.conditionalText || ''
  stage.outcomes = req.body.outcomes || ''
  stage.acceptedOutcome = req.body.acceptedOutcome || ''

  const labels = asArray(req.body.decLabel)
  stage.decisions = []
  for (let d = 0; d < labels.length; d++) {
    stage.decisions.push(newDecisionFromBody(req.body, d))
  }
  if (stage.decisions.length === 0) stage.decisions.push({})

  if (req.body.action === 'add-decision') {
    stage.decisions.push({})
    return res.redirect('/builder/new/stage-setup')
  }

  if (flow.editReturn) {
    const anchor = flow.editReturn
    delete flow.editReturn
    return res.redirect('/builder/new/check-answers#' + anchor)
  }

  if (i + 1 < flow.stageCount) {
    flow.setupIndex = i + 1
    return res.redirect('/builder/new/stage-setup')
  }
  // All stages set up — jump to the first stage that has any tasks.
  // Stages with 0 tasks (terminal / note-and-button) skip the task capture loop.
  const firstWithTasks = flow.stages.findIndex(function (s) { return (s.taskCount || 0) > 0 })
  if (firstWithTasks === -1) return res.redirect('/builder/new/stages-list')
  flow.cur = { stage: firstWithTasks, task: 0 }
  res.redirect('/builder/new/task')
})

router.get('/builder/new/task', function (req, res) {
  res.render('builder/new/task-form')
})

router.post('/builder/new/task', function (req, res) {
  const flow = getFlow(req)
  const s = parseInt(req.body.stage, 10)
  const t = parseInt(req.body.task, 10)
  flow.stages[s].tasks[t] = {
    pageTitle: req.body.pageTitle || '',
    preOutcomesHtml: req.body.preOutcomesHtml || ''
  }
  flow.cur = { stage: s, task: t }
  if (flow.editReturn) {
    const anchor = flow.editReturn
    delete flow.editReturn
    return res.redirect('/builder/new/check-answers#' + anchor)
  }
  if (t + 1 < flow.stages[s].taskCount) {
    flow.cur.task = t + 1
    return res.redirect('/builder/new/task')
  }
  res.redirect('/builder/new/tasks-list')
})

router.get('/builder/new/tasks-list', function (req, res) {
  res.render('builder/new/tasks-list')
})

router.post('/builder/new/tasks-list', function (req, res) {
  const flow = getFlow(req)
  const s = parseInt(req.body.stage, 10)
  if (req.body.addAnotherTask === 'yes') {
    flow.stages[s].tasks.push({})
    flow.stages[s].taskCount = flow.stages[s].tasks.length
    flow.cur = { stage: s, task: flow.stages[s].tasks.length - 1 }
    return res.redirect('/builder/new/task')
  }
  // Skip past any later stages that have 0 tasks; they don't need a task-capture loop.
  let nextIdx = -1
  for (let i = s + 1; i < flow.stages.length; i++) {
    if ((flow.stages[i].taskCount || 0) > 0) { nextIdx = i; break }
  }
  if (nextIdx === -1) return res.redirect('/builder/new/stages-list')
  flow.cur = { stage: nextIdx, task: 0 }
  res.redirect('/builder/new/task')
})

router.get('/builder/new/stages-list', function (req, res) {
  res.render('builder/new/stages-list')
})

router.post('/builder/new/stages-list', function (req, res) {
  const flow = getFlow(req)
  if (req.body.addAnotherStage === 'yes') {
    flow.stages.push({ name: '', prefix: '', taskCount: 0, tasks: [], description: '', hasConditional: false, conditionalField: '', conditionalEquals: '', conditionalText: '', outcomes: '', acceptedOutcome: '', decisions: [{}] })
    flow.stageCount = flow.stages.length
    flow.setupIndex = flow.stages.length - 1
    return res.redirect('/builder/new/stage-setup')
  }
  res.redirect('/builder/new/check-answers')
})

router.get('/builder/new/edit-task', function (req, res) {
  const flow = getFlow(req)
  flow.cur = { stage: parseInt(req.query.stage, 10), task: parseInt(req.query.task, 10) }
  flow.editReturn = req.query.return || null
  res.render('builder/new/task-form')
})

router.get('/builder/new/edit-stage', function (req, res) {
  const flow = getFlow(req)
  flow.setupIndex = parseInt(req.query.stage, 10)
  flow.editReturn = req.query.return || null
  res.render('builder/new/stage-setup')
})

router.get('/builder/new/check-answers', function (req, res) {
  res.render('builder/new/check-answers')
})

router.get('/builder/new/save-options', function (req, res) {
  res.render('builder/new/save-options')
})

function slugify (s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function buildDataModel (flow) {
  const tasks = {}
  const stages = {}
  const decisionOptions = {}
  flow.stages.forEach((stage, sIdx) => {
    const sNum = sIdx + 1
    const stageKey = 'S' + sNum
    const taskKeys = []
    stage.tasks.forEach((task, tIdx) => {
      const tNum = tIdx + 1
      const key = 'S' + sNum + 'T' + tNum
      tasks[key] = {
        pageTitle: task.pageTitle || '',
        preOutcomesHtml: task.preOutcomesHtml || '',
        href: key,
        decisionField: key + 'Outcome',
        acceptedValue: stage.acceptedOutcome || '',
        statusField: key + 'Status',
        tagField: key + 'Tag'
      }
      taskKeys.push(key)
    })
    const decKey = stageKey + 'DecisionOptions'
    const optList = (stage.outcomes || '').split(',').map(s => s.trim()).filter(Boolean)
    decisionOptions[decKey] = {
      legend: 'Outcome',
      formField: stageKey + 'Decision',
      options: optList.map(label => ({ value: label, label: label })),
      acceptedValue: stage.acceptedOutcome || ''
    }
    stages[stageKey] = {
      heading: stage.name || stageKey,
      prefix: stageKey,
      description: stage.description || '',
      conditional: stage.hasConditional ? { field: stage.conditionalField || '', equals: stage.conditionalEquals || '', text: stage.conditionalText || '' } : null,
      tasks: taskKeys,
      decisionGroup: decKey,
      stageDecisionField: stageKey + 'Decision',
      stageStatusField: stageKey + 'Status',
      stageTagField: stageKey + 'Tag',
      decisions: (stage.decisions || []).filter(d => d && d.label).map(d => ({
        label: d.label,
        stageChange: d.changesStage ? d.targetStage : null,
        statusChange: d.changesStatus ? { status: d.statusText, tag: d.tagClass } : null,
        requiresAllTasksAccepted: !!d.requiresAllTasksAccepted,
        reasonField: d.reasonField || ''
      }))
    }
  })
  return { tasks, stages, decisionOptions }
}

function scaffoldCase (caseDir, dataFileBase) {
  const tplDir   = path.join(__dirname, 'views', 'cases', '_template')
  const dstDir   = path.join(__dirname, 'views', 'cases', caseDir)
  const dstInc   = path.join(dstDir, 'includes')
  const d2Dir    = path.join(__dirname, 'views', 'FRPS-D2')
  const d2Inc    = path.join(d2Dir, 'includes')
  if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true })
  if (!fs.existsSync(dstInc)) fs.mkdirSync(dstInc, { recursive: true })

  // Includes copied straight across.
  ;['_defra-header.html', '_case-context-strip.html', '_case-nav.html'].forEach(function (f) {
    fs.copyFileSync(path.join(d2Inc, f), path.join(dstInc, f))
  })

  // The FRPS-D2 case nav references "calculations2" — we don't copy that, so retarget to "calculations".
  const navPath = path.join(dstInc, '_case-nav.html')
  fs.writeFileSync(navPath, fs.readFileSync(navPath, 'utf8').replace(/href="calculations2"/g, 'href="calculations"'))

  // Page files copied across with include paths rewritten to point at this case's includes folder.
  const pages = ['application.html', 'calculations.html', 'timeline.html', 'notes.html', 'agreement.html']
  pages.forEach(function (f) {
    const src = path.join(d2Dir, f)
    if (!fs.existsSync(src)) return
    let html = fs.readFileSync(src, 'utf8')
    html = html.replace(/FRPS-D2\/includes\//g, 'cases/' + caseDir + '/includes/')
    fs.writeFileSync(path.join(dstDir, f), html)
  })

  // Tasklist + task templates with __CASE_DIR__ replaced.
  ;['tasklist.html', 'task.html'].forEach(function (f) {
    let html = fs.readFileSync(path.join(tplDir, f), 'utf8')
    html = html.replace(/__CASE_DIR__/g, caseDir)
    fs.writeFileSync(path.join(dstDir, f), html)
  })

  // Also expose tasklist at the URL the case-nav uses.
  fs.copyFileSync(path.join(dstDir, 'tasklist.html'), path.join(dstDir, 'tasklist-stage.html'))

  const meta = { dataFile: dataFileBase, caseDir: caseDir }
  fs.writeFileSync(path.join(dstDir, 'meta.json'), JSON.stringify(meta, null, 2))
}

function addCaseToIndex (caseName, caseDir, dateStr) {
  const indexPath = path.join(__dirname, 'views', 'index.html')
  let content = fs.readFileSync(indexPath, 'utf8')
  const hrefMarker = 'href="/cases/' + caseDir + '"'
  if (content.indexOf(hrefMarker) !== -1) return // already linked, don't duplicate
  const linkLine = '      <li><a href="/cases/' + caseDir + '">launch ' + caseName + ' (' + dateStr + ')</a></li>'

  if (content.indexOf('New made cases') === -1) {
    const block = '\n    <h2 class="govuk-heading-l">New made cases</h2>\n    <ul class="govuk-list govuk-list--bullet">\n' + linkLine + '\n    </ul>\n  '
    const lastIdx = content.lastIndexOf('{% endblock %}')
    if (lastIdx !== -1) {
      content = content.slice(0, lastIdx) + block + '\n' + content.slice(lastIdx)
    }
  } else {
    const re = /(New made cases[\s\S]*?<ul[^>]*>)([\s\S]*?)(<\/ul>)/
    content = content.replace(re, function (m, h, body, end) {
      return h + body + linkLine + '\n    ' + end
    })
  }
  fs.writeFileSync(indexPath, content)
}

router.post('/builder/new/save', function (req, res) {
  const flow = getFlow(req)
  const model = buildDataModel(flow)

  const rawName = (req.body.filename || '').trim()
  const safe = slugify(rawName) || ('builder-tasklist-' + new Date().toISOString().replace(/[:.]/g, '-'))
  const baseName = safe.indexOf('builder-tasklist-') === 0 ? safe : ('builder-tasklist-' + safe)
  const filename = baseName + '.js'
  const outPath = path.join(__dirname, 'data', filename)
  const out = '// Saved by /builder/new/save on ' + new Date().toISOString() + '\n' +
              'module.exports = ' + JSON.stringify(model, null, 2) + ';\n'
  fs.writeFileSync(outPath, out)
  flow.savedPath = 'app/data/' + filename

  const ccRaw = req.body.createCase
  const createCaseChecked = Array.isArray(ccRaw) ? ccRaw.indexOf('yes') !== -1 : ccRaw === 'yes'
  console.log('[builder/new/save] body =', { filename: req.body.filename, createCase: ccRaw, caseDir: req.body.caseDir, caseName: req.body.caseName, createCaseChecked })

  if (createCaseChecked) {
    const caseDir = slugify(req.body.caseDir)
    const caseName = (req.body.caseName || caseDir).trim()
    console.log('[builder/new/save] createCase branch entered, slugified caseDir =', JSON.stringify(caseDir))
    if (caseDir) {
      try {
        scaffoldCase(caseDir, baseName)
        const dateStr = new Date().toLocaleDateString('en-GB')
        addCaseToIndex(caseName, caseDir, dateStr)
        flow.savedCaseDir = caseDir
        flow.savedCaseName = caseName
        console.log('[builder/new/save] scaffold + index update OK for', caseDir)
      } catch (e) {
        console.error('[builder/new/save] scaffold/index FAILED:', e)
      }
    } else {
      console.log('[builder/new/save] caseDir was blank after slugify — skipping')
    }
  } else {
    console.log('[builder/new/save] createCase not "yes" — skipping')
  }

  res.render('builder/new/saved')
})

// ----- Dynamic case routes -----

function loadCaseMeta (caseDir) {
  const metaPath = path.join(__dirname, 'views', 'cases', caseDir, 'meta.json')
  if (!fs.existsSync(metaPath)) return null
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  const dataPath = path.join(__dirname, 'data', meta.dataFile + '.js')
  if (!fs.existsSync(dataPath)) return null
  delete require.cache[require.resolve(dataPath)]
  meta.caseData = require(dataPath)
  meta.firstStageKey = Object.keys(meta.caseData.stages)[0]
  return meta
}

function renderCaseTasklist (req, res) {
  const meta = loadCaseMeta(req.params.dir)
  if (!meta) return res.status(404).send('Case not found')
  const sessionData = (req.session && req.session.data) || {}
  const stageKey = sessionData.caseStage || meta.firstStageKey
  const stage = (meta.caseData.stages || {})[stageKey] || {}

  // Filter decisions by per-decision gating (rule 12c).
  const allTasksAccepted = (stage.tasks || []).every(function (tk) {
    const t = meta.caseData.tasks[tk]
    return t && sessionData[t.decisionField] === t.acceptedValue
  })
  const visibleDecisions = (stage.decisions || []).filter(function (d) {
    return !d.requiresAllTasksAccepted || allTasksAccepted
  })

  // Evaluate conditional stage text (field === equals).
  const cond = stage.conditional
  const showConditional = !!(cond && cond.field && cond.equals !== undefined && sessionData[cond.field] === cond.equals)

  res.render('cases/' + req.params.dir + '/tasklist-stage', {
    caseData: meta.caseData,
    caseDir: req.params.dir,
    caseName: req.params.dir,
    firstStageKey: meta.firstStageKey,
    visibleDecisions: visibleDecisions,
    showConditional: showConditional,
    allTasksAccepted: allTasksAccepted
  })
}

router.get('/cases/:dir', function (req, res) {
  res.redirect('/cases/' + req.params.dir + '/tasklist-stage')
})

router.get('/cases/:dir/tasklist-stage', renderCaseTasklist)

router.get('/cases/:dir/task/:taskKey', function (req, res) {
  const meta = loadCaseMeta(req.params.dir)
  if (!meta) return res.status(404).send('Case not found')
  const task = meta.caseData.tasks[req.params.taskKey]
  if (!task) return res.status(404).send('Task not found')
  let stageDecisionGroup = null
  Object.keys(meta.caseData.stages).forEach(function (sk) {
    const s = meta.caseData.stages[sk]
    if ((s.tasks || []).indexOf(req.params.taskKey) !== -1) {
      stageDecisionGroup = meta.caseData.decisionOptions[s.decisionGroup]
    }
  })
  res.render('cases/' + req.params.dir + '/task', {
    caseData: meta.caseData,
    caseDir: req.params.dir,
    taskKey: req.params.taskKey,
    task: task,
    stageDecisionGroup: stageDecisionGroup || { legend: 'Outcome', options: [] }
  })
})

router.post('/cases/:dir/task/:taskKey/save', function (req, res) {
  res.redirect('/cases/' + req.params.dir + '/tasklist-stage')
})

router.post('/cases/:dir/decide', function (req, res) {
  const meta = loadCaseMeta(req.params.dir)
  if (!meta) return res.status(404).send('Case not found')
  const stage = meta.caseData.stages[req.body.stageKey]
  const chosen = (stage.decisions || []).find(function (d) { return d.label === req.body.decision })
  if (chosen && chosen.stageChange) req.session.data.caseStage = chosen.stageChange
  if (chosen && chosen.statusChange) {
    req.session.data[stage.stageStatusField] = chosen.statusChange.status
    req.session.data[stage.stageTagField] = chosen.statusChange.tag
  }
  res.redirect('/cases/' + req.params.dir + '/tasklist-stage')
})

// Generic page route for the copied FRPS-D2 pages (application, calculations, timeline, notes, agreement)
router.get('/cases/:dir/:page', function (req, res) {
  const dir = req.params.dir
  const page = req.params.page
  const filePath = path.join(__dirname, 'views', 'cases', dir, page + '.html')
  if (!fs.existsSync(filePath)) return res.status(404).send('Page not found')
  const meta = loadCaseMeta(dir) || {}
  res.render('cases/' + dir + '/' + page, {
    caseData: meta.caseData || null,
    caseDir: dir,
    firstStageKey: meta.firstStageKey || null
  })
})

router.get('/builder/new/discard', function (req, res) {
  delete req.session.data.builderFlow
  res.redirect('/builder')
})

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

const TERMINATE_OUTCOMES = {
  'Check complete':           { tag: '',                            status: 'Completed' },
  'Need further information': { tag: 'govuk-tag govuk-tag--yellow', status: 'On hold' },
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

router.get('/largeCase1', function (req, res) {
  // Sets the largeCase flag so the case-nav swaps in application-new and calculations-new,
  // then forwards to /tasklistStage2C2 to advance case2 to its next stage
  req.session.data.largeCase = 'yes';
  res.redirect('/tasklistStage2C2');
});

router.get('/largeCase2', function (req, res) {
  // Sets the largeCase flag to 'new2' so the case-nav swaps in application-new2 and
  // calculations-new2, then forwards to /tasklistStage2C2 to advance case2.
  req.session.data.largeCase = 'new2';
  res.redirect('/tasklistStage2C2');
});

router.get('/smallApplication', function (req, res) {
  // Small application: clears any large-case flag so the case-nav uses the default
  // application + calculations2 templates, then drops the user on the case2 tasklist
  // (same destination as the D2 WIP link on the index).
  req.session.data.largeCase = false;
  res.redirect('/tasklistStage2C2');
});

router.get('/mediumApplication', function (req, res) {
  // Medium application: routes case-nav to application-new and calculations-new (11 parcels).
  req.session.data.largeCase = 'yes';
  res.redirect('/tasklistStage2C2');
});

router.get('/largeApplication', function (req, res) {
  // Large application: routes case-nav to application-new2 and calculations-new2 (101 parcels).
  req.session.data.largeCase = 'new2';
  res.redirect('/tasklistStage2C2');
});

router.get('/realApplication', function (req, res) {
  // Real application: Golden Grange case (15 parcels, real data from
  // fg-cw-frontend export). Sits in its own /FRPS-D2/caseReal/ folder with its
  // own nav include and context strip, so we forward to /tasklistStageReal
  // rather than the shared case2 tasklist.
  req.session.data.largeCase = 'real';
  // Default Calculations variant — per-action SSSI / HEFER (calculations-new).
  req.session.data.realCalcVariant = 'new';
  res.redirect('/tasklistStageReal');
});

router.get('/realApplication2', function (req, res) {
  // Same Golden Grange case, but the caseReal nav's Calculations tab now
  // resolves to calculations-new2 (parcel-level SSSI / HEFER variant).
  req.session.data.largeCase = 'real';
  req.session.data.realCalcVariant = 'new2';
  res.redirect('/tasklistStageReal');
});

router.get('/realAgreement', function (req, res) {
  // Jump straight into Golden Grange with a live agreement (caseStageReal = 'pay').
  // From here the user can hit "Terminate" to walk through the revised termination
  // content (FGP-1010): tasklist-stage 'pay' / 'pending-termination' / 'terminate'
  // branches, terminate-cancel, terminate-confirm, end-terminate, task-1Tr, task-2Tr.
  req.session.data.largeCase = 'real';
  req.session.data.realCalcVariant = 'new';
  req.session.data.caseStageReal = 'pay';
  req.session.data.caseStatusReal = 'Live';
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});


// Map calc page URLs to their per-page filter key (matches the `from` value in each page's filter form)
const calcPageKeys = {
  '/FRPS-D2/calculations-new':       'main-new',
  '/FRPS-D2/calculations-old':       'main-old',
  '/FRPS-D2/case2/calculations-new':  'case2-new',
  '/FRPS-D2/case2/calculations-new2': 'case2-new2',
  '/FRPS-D2/case2/calculations-mid2': 'case2-mid2',
  '/FRPS-D2/case2/calculations-old':  'case2-old',
  '/FRPS-D2/case2/calculations-old2': 'case2-old2',
  '/FRPS-D2/caseReal/calculations-new':  'caseReal',
  '/FRPS-D2/caseReal/calculations-new2': 'caseRealNew2',
  '/FRPS-D2/caseReal/calculations-mid':  'caseRealMid',
  '/FRPS-D2/caseReal/calculations-old':  'caseRealOld',
  '/Grasslands/caseGrass/calculations-new':  'caseGrass',
  '/Grasslands/caseGrass/calculations-new2': 'caseGrassNew2',
  '/Grasslands/caseGrass/calculations-mid':  'caseGrassMid',
  '/Grasslands/caseGrass/calculations-old':  'caseGrassOld',
};

// Before rendering any calc page, swap in that page's own filter state so settings on one page
// don't leak into another. The kit's autoStoreData has already copied session.data onto
// res.locals.data (which is what templates read as `data`), so we must update BOTH the session
// (for persistence) and res.locals.data (for this render).
router.use((req, res, next) => {
  const key = calcPageKeys[req.path];
  if (key) {
    req.session.data.calcFilters = req.session.data.calcFilters || {};
    const f = req.session.data.calcFilters[key] || {};
    const fails   = f.fails   || false;
    const changes = f.changes || false;
    const sssi    = f.sssi    || false;
    const hefer   = f.hefer   || false;
    req.session.data.showFailsOnly   = fails;
    req.session.data.showChangesOnly = changes;
    req.session.data.showSssiOnly    = sssi;
    req.session.data.showHeferOnly   = hefer;
    if (res.locals && res.locals.data) {
      res.locals.data.showFailsOnly   = fails;
      res.locals.data.showChangesOnly = changes;
      res.locals.data.showSssiOnly    = sssi;
      res.locals.data.showHeferOnly   = hefer;
    }
  }
  next();
});

router.get('/largeCalcFilter', function (req, res) {
  // Filter handler for the large-case calculations pages (new and old, top and case2).
  // The destination page is taken from `sort` (the Run date dropdown — its option
  // values are page keys, mirroring the version history). If the user picks a
  // different version, the chosen filter is applied to THAT version's slot and
  // the redirect goes there. Falls back to `from` if `sort` isn't a page key.
  const targets = {
    'main-new':  '/FRPS-D2/calculations-new',
    'main-old':  '/FRPS-D2/calculations-old',
    'case2-new': '/FRPS-D2/case2/calculations-new',
    'case2-new2': '/FRPS-D2/case2/calculations-new2',
    'case2-mid2': '/FRPS-D2/case2/calculations-mid2',
    'case2-old': '/FRPS-D2/case2/calculations-old',
    'case2-old2': '/FRPS-D2/case2/calculations-old2',
    'caseReal':     '/FRPS-D2/caseReal/calculations-new',
    'caseRealNew2': '/FRPS-D2/caseReal/calculations-new2',
    'caseRealMid':  '/FRPS-D2/caseReal/calculations-mid',
    'caseRealOld':  '/FRPS-D2/caseReal/calculations-old',
    'caseGrass':     '/Grasslands/caseGrass/calculations-new',
    'caseGrassNew2': '/Grasslands/caseGrass/calculations-new2',
    'caseGrassMid':  '/Grasslands/caseGrass/calculations-mid',
    'caseGrassOld':  '/Grasslands/caseGrass/calculations-old',
  };
  const filter = req.query.filter;
  const dest   = targets[req.query.sort] ? req.query.sort : req.query.from;
  req.session.data.calcFilters = req.session.data.calcFilters || {};
  const entry = { fails: false, changes: false, sssi: false, hefer: false };
  if (filter === 'fails')   entry.fails   = 'yes';
  if (filter === 'changes') entry.changes = 'yes';
  if (filter === 'sssi')    entry.sssi    = 'yes';
  if (filter === 'hefer')   entry.hefer   = 'yes';
  req.session.data.calcFilters[dest] = entry;
  // Reflect on the legacy globals so the upcoming redirect renders correctly even before
  // the per-page middleware fires.
  req.session.data.showFailsOnly   = entry.fails;
  req.session.data.showChangesOnly = entry.changes;
  req.session.data.showSssiOnly    = entry.sssi;
  req.session.data.showHeferOnly   = entry.hefer;
  res.redirect(targets[dest] || '/FRPS-D2/calculations-new');
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
  outcomes:          TERMINATE_OUTCOMES,
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
  outcomes:          TERMINATE_OUTCOMES,
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

// Real case (Golden Grange) — same lifecycle pattern as case2 so the first hit
// after clearing data lands on the caselist (with the case row showing 'Application
// received') and subsequent hits walk the case through its stages.
makeStageRoute('/tasklistStageReal', {
  stageCountKey:    'stageCountReal',
  stageKey:         'caseStageReal',
  statusKey:        'caseStatusReal',
  tagKey:           'caseStatusTagReal',
  firstRedirect:    '/FRPS-D2/caselist',
  tasklistRedirect: '/FRPS-D2/caseReal/tasklist-stage',
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




// ============================================================
// FRPS-D2/caseReal routes (Golden Grange — auto-generated from case2 block)
// ============================================================

// --- Approval/rejection ---

makeApproveRoute('/app-approve2Real', {
  decisionKey:           'decision1Real',
  approvedKey:           'caseApprovedReal',
  agreementStageKey:     'agreementStageReal',
  reviewNoteKey:         'reviewNoteReal',
  filteredReviewNoteKey: 'filteredReviewNoteReal',
  stageKey:              'caseStageReal',
  statusKey:             'caseStatusReal',
  tagKey:                'caseStatusTagReal',
  onApproveRedirect:     '/tasklistStageReal',
  amendRedirect:         '/FRPS-D2/caseReal/amend-confirm',
  returnRedirect:        '/FRPS-D2/caseReal/return-confirm',
  defaultRedirect:       '/FRPS-D2/caseReal/tasklist-stage',
});

// --- State resets ---

router.get('/resume2Real', function (req, res) {
  // Returns Real case (Golden Grange) to 'In review' after a pause or rejection reopen
  req.session.data.caseStageReal     = 'review';
  req.session.data.caseStatusReal    = 'In review';
  req.session.data.caseStatusTagReal = 'govuk-tag govuk-tag--blue';
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

router.get('/amendReturn1Real', function (req, res) {
  // Cancels amend/return flow and restores Real case (Golden Grange) to 'In review'
  req.session.data.caseStageReal     = 'review';
  req.session.data.caseStatusReal    = 'In review';
  req.session.data.caseStatusTagReal = 'govuk-tag govuk-tag--blue';
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

// --- Confirmation gates ---

router.get('/returnConf1Real', function (req, res) {
  // Proceeds with return if confirmed, otherwise cancels back to tasklist
  if (req.session.data.rConfReal === 'yes') {
    res.redirect('/FRPS-D2/caseReal/tasklist-stage');
  } else {
    res.redirect('/amendReturn1Real');
  }
});

router.get('/terminateConf1Real', function (req, res) {
  // Finalises termination if confirmed, otherwise leaves Real case (Golden Grange) stage unchanged
  if (req.session.data.tConfReal === 'yes') {
    req.session.data.caseStageReal     = 'terminate';
    req.session.data.caseStatusReal    = 'Terminated';
    req.session.data.caseStatusTagReal = 'govuk-tag govuk-tag--red';
  }
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

router.get('/amendConf1Real', function (req, res) {
  // Proceeds with amendment if confirmed, otherwise cancels back to tasklist
  if (req.session.data.aConfReal === 'yes') {
    res.redirect('/FRPS-D2/caseReal/tasklist-stage');
  } else {
    res.redirect('/amendReturn1Real');
  }
});

// --- Amendment flow ---

makeAmendRoute('/amend1Real', {
  decisionKey: 'decisionAmReal',
  stageKey:    'caseStageReal',
  statusKey:   'caseStatusReal',
  tagKey:      'caseStatusTagReal',
  redirectTo:  '/FRPS-D2/caseReal/tasklist-stage',
});

router.get('/amend2Real', function (req, res) {
  // Closes Real case (Golden Grange) via amendment submission
  req.session.data.caseStageReal     = 'amendment_submitted';
  req.session.data.caseStatusReal    = 'Case close by amendment';
  req.session.data.caseStatusTagReal = 'govuk-tag govuk-tag--orange';
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

// --- Agreement sent ---

makeAgreementSentRoute('/aggSent2Real', {
  decisionKey:     'decisionAgReal',
  rawNoteKey:      'agreeNoteReal',
  filteredNoteKey: 'filteredAggNoteReal',
  stageKey:        'caseStageReal',
  statusKey:       'caseStatusReal',
  tagKey:          'caseStatusTagReal',
  onSentRedirect:  '/tasklistStageReal',
  defaultRedirect: '/FRPS-D2/caseReal/tasklist-stage',
});

// --- Termination flow ---

router.get('/terminate1Real', function (req, res) {
  // Begins termination process for Real case (Golden Grange)
  req.session.data.caseStageReal     = 'pending-termination';
  req.session.data.caseStatusReal    = 'Preparing to terminate';
  req.session.data.caseStatusTagReal = 'govuk-tag govuk-tag--orange';
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

router.get('/terminatePrepReal', function (req, res) {
  // Routes termination preparation outcome: confirm page, end process, or default
  const d = req.session.data;
  switch (d.decisionTrReal) {
  case 'Terminate agreement':
    d.filteredTrNoteReal = stripEmptyAndNulls(d.terminateNoteReal);
    return res.redirect('/FRPS-D2/caseReal/terminate-confirm');
  case 'End termination process':
    d.caseStageReal     = 'pay';
    d.caseStatusReal    = 'Agreement accepted';
    d.caseStatusTagReal = 'govuk-tag govuk-tag--green';
    return res.redirect('/FRPS-D2/caseReal/tasklist-stage');
  }
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

// --- Termination task routes ---

const D2RealT = '/FRPS-D2/caseReal/tasklist-stage';

// Note: original task1TrT2Real default branch used wrong keys (terminateTagReal/terminateStatusReal). Fixed to terminate1TagReal/terminate1StatusReal.
makeTaskRoute('/task1TrT2Real', {
  checkedKey:        'terminateCheckedReal',
  decisionKey:       'decisionTerminateTask1Real',
  noteActionKey:     'noteActionTerminateTask1Real',
  tagKey:            'terminate1TagReal',
  statusKey:         'terminate1StatusReal',
  rawNoteKey:        'task1TrNoteReal',
  filteredNoteKey:   'filteredNote1TrReal',
  rawNoteKey2:       'task1TrNote2Real',
  filteredNoteKey2:  'filteredNote1Tr_2Real',
  outcomes:          TERMINATE_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task2TrT2Real', {
  decisionKey:       'decisionTerminateTask2Real',
  noteActionKey:     'noteActionTerminateTask2Real',
  tagKey:            'terminate2TagReal',
  statusKey:         'terminate2StatusReal',
  rawNoteKey:        'task2TrNoteReal',
  filteredNoteKey:   'filteredNote2TrReal',
  rawNoteKey2:       'task2TrNote2Real',
  filteredNoteKey2:  'filteredNote2Tr_2Real',
  outcomes:          TERMINATE_OUTCOMES,
  redirectTo:        D2RealT,
});

// --- Task review routes ---

// Note: task5T2Real and task6T2Real use 'detailsChecked' (not detailsCheckedReal) — preserved from original.
makeTaskRoute('/task1T2Real', {
  checkedKey:        'detailsCheckedReal',
  decisionKey:       'decisionTask1Real',
  noteActionKey:     'noteActionTask1Real',
  tagKey:            'detailsTagReal',
  statusKey:         'detailsStatusReal',
  rawNoteKey:        'task1NoteReal',
  filteredNoteKey:   'filteredNote1Real',
  rawNoteKey2:       'task1Note2Real',
  filteredNoteKey2:  'filteredNote1_2Real',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task2T2Real', {
  checkedKey:        'detailsCheckedReal',
  decisionKey:       'decisionTask2Real',
  noteActionKey:     'noteActionTask2Real',
  tagKey:            'calcsTagReal',
  statusKey:         'calcsStatusReal',
  rawNoteKey:        'task2NoteReal',
  filteredNoteKey:   'filteredNote2Real',
  rawNoteKey2:       'task2Note2Real',
  filteredNoteKey2:  'filteredNote2_2Real',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task3T2Real', {
  checkedKey:        'detailsCheckedReal',
  decisionKey:       'decisionTask3Real',
  noteActionKey:     'noteActionTask3Real',
  tagKey:            'sssiTagReal',
  statusKey:         'sssiStatusReal',
  rawNoteKey:        'task3NoteReal',
  filteredNoteKey:   'filteredNote3Real',
  rawNoteKey2:       'task3Note2Real',
  filteredNoteKey2:  'filteredNote3_2Real',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task5T2Real', {
  checkedKey:        'detailsCheckedReal',
  decisionKey:       'decisionTask5Real',
  noteActionKey:     'noteActionTask5Real',
  tagKey:            'paymentTagReal',
  statusKey:         'paymentStatusReal',
  rawNoteKey:        'task5NoteReal',
  filteredNoteKey:   'filteredNote5Real',
  rawNoteKey2:       'task5Note2Real',
  filteredNoteKey2:  'filteredNote5_2Real',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task6T2Real', {
  checkedKey:        'detailsCheckedReal',
  decisionKey:       'decisionTask6Real',
  noteActionKey:     'noteActionTask6Real',
  tagKey:            'budgetTagReal',
  statusKey:         'budgetStatusReal',
  rawNoteKey:        'task6NoteReal',
  filteredNoteKey:   'filteredNote6Real',
  rawNoteKey2:       'task6Note2Real',
  filteredNoteKey2:  'filteredNote6_2Real',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2RealT,
});

// --- Case assignment ---

router.get('/caselistTeam2Real', function (req, res) {
  // Marks Real case (Golden Grange) as assigned and returns to caselist
  req.session.data.caseAssignedReal = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/setUserFo2Real', function (req, res) {
  // Assigns finance officer role for Real case (Golden Grange)
  req.session.data.financeOfficerReal = 'yes';
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

// --- Amendment task routes ---

makeTaskRoute('/task1T2AmReal', {
  decisionKey:       'decisionTaskAm1Real',
  noteActionKey:     'noteActionTaskAm1Real',
  tagKey:            'amend1TagReal',
  statusKey:         'amend1StatusReal',
  rawNoteKey:        'task1AmNoteReal',
  filteredNoteKey:   'filteredNoteAm1Real',
  rawNoteKey2:       'task1_2AmNoteReal',
  filteredNoteKey2:  'filteredNoteAm1_2Real',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task2T2AmReal', {
  decisionKey:       'decisionTaskAm2Real',
  noteActionKey:     'noteActionTaskAm2Real',
  tagKey:            'amend2TagReal',
  statusKey:         'amend2StatusReal',
  rawNoteKey:        'task2AmNoteReal',
  filteredNoteKey:   'filteredNoteAm2Real',
  rawNoteKey2:       'task2_2AmNoteReal',
  filteredNoteKey2:  'filteredNoteAm2_2Real',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task3T2AmReal', {
  decisionKey:       'decisionTaskAm3Real',
  noteActionKey:     'noteActionTaskAm3Real',
  tagKey:            'amend3TagReal',
  statusKey:         'amend3StatusReal',
  rawNoteKey:        'task3AmNoteReal',
  filteredNoteKey:   'filteredNoteAm3Real',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2RealT,
});

// --- Agreement progression ---

router.get('/agreementStage2Real', function (req, res) {
  // Unlocks the agreement tab in the Real case (Golden Grange) navigation
  req.session.data.agreementStageReal = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

// --- Agreement task routes ---

makeTaskRoute('/task1AgT2Real', {
  checkedKey:        'AgreeCheckedReal',
  decisionKey:       'decisionAgreeTask1Real',
  noteActionKey:     'noteActionAgreeTask1Real',
  tagKey:            'agreeTagReal',
  statusKey:         'agreeStatusReal',
  rawNoteKey:        'task1ANoteReal',
  filteredNoteKey:   'filteredNote1AReal',
  rawNoteKey2:       'task1ANote2Real',
  filteredNoteKey2:  'filteredNote1A_2Real',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task2AgT2Real', {
  decisionKey:       'decisionAgreeTask2Real',
  noteActionKey:     'noteActionAgreeTask2Real',
  tagKey:            'agreeSTagReal',
  statusKey:         'agreeSStatusReal',
  rawNoteKey:        'task2ANoteReal',
  filteredNoteKey:   'filteredNoteA2Real',
  rawNoteKey2:       'task2ANote2Real',
  filteredNoteKey2:  'filteredNote2A_2Real',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2RealT,
});

// --- Agreement signing ---

router.get('/setAgreeSign2Real', function (req, res) {
  // Records customer signature and advances Real case (Golden Grange) status
  req.session.data.caseStatusReal = 'Agreement accepted';
  res.redirect('/tasklistStageReal');
});

// --- Stage progression ---

router.get('/startReal', function (req, res) {
  // Resets Real case (Golden Grange) to the start stage (used when re-entering a completed case)
  req.session.data.caseStageReal     = 'start';
  req.session.data.caseStatusReal    = 'Application received';
  req.session.data.caseStatusTagReal = 'govuk-tag govuk-tag--grey';
  req.session.data.stageCountReal    = 1;
  res.redirect('/FRPS-D2/caselist');
});


// Real case (Golden Grange) — same lifecycle pattern as Real case (Golden Grange) so the first hit
// after clearing data lands on the caselist (with the case row showing 'Application
// received') and subsequent hits walk the case through its stages.
makeStageRoute('/tasklistStageReal', {
  stageCountKey:    'stageCountReal',
  stageKey:         'caseStageReal',
  statusKey:        'caseStatusReal',
  tagKey:           'caseStatusTagReal',
  firstRedirect:    '/FRPS-D2/caselist',
  tasklistRedirect: '/FRPS-D2/caseReal/tasklist-stage',
});

// --- 5-month checks ---

router.get('/6month1Real', function (req, res) {
  // Transitions Real case (Golden Grange) into the simple single-task 6-month phase
  req.session.data.caseStatusReal = '6 month checks';
  req.session.data.caseStageReal  = '6month';
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

router.get('/6month1FullReal', function (req, res) {
  // Transitions Real case (Golden Grange) into the FULL 6-month phase
  // (5 tasks: AAC re-run, AAC review, management control, Siti Tenure, LPIS)
  // Per draft content for FGP-1109.
  req.session.data.caseStatusReal = '6 month checks (full)';
  req.session.data.caseStageReal  = '6month-full';
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

makeTaskRoute('/task6m1Real', {
  decisionKey:       'decisionTask1mReal',
  noteActionKey:     'noteActionTask1mReal',
  tagKey:            'month5_1TagReal',
  statusKey:         'month5_1StatusReal',
  rawNoteKey:        'task1mNoteReal',
  filteredNoteKey:   'filteredNote1mReal',
  rawNoteKey2:       'task1mNote2Real',
  filteredNoteKey2:  'filteredNote1m_2Real',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task5m2Real', {
  decisionKey:       'decisionTask2mReal',
  noteActionKey:     'noteActionTask2mReal',
  tagKey:            'month5_2TagReal',
  statusKey:         'month5_2StatusReal',
  rawNoteKey:        'task2mNoteReal',
  filteredNoteKey:   'filteredNote2mReal',
  rawNoteKey2:       'task2mNote2Real',
  filteredNoteKey2:  'filteredNote2m_2Real',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task5m3Real', {
  decisionKey:       'decisionTask3mReal',
  noteActionKey:     'noteActionTask3mReal',
  tagKey:            'month5_3TagReal',
  statusKey:         'month5_3StatusReal',
  rawNoteKey:        'task3mNoteReal',
  filteredNoteKey:   'filteredNote3mReal',
  rawNoteKey2:       'task3mNote2Real',
  filteredNoteKey2:  'filteredNote3m_2Real',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task5m4Real', {
  decisionKey:       'decisionTask4mReal',
  noteActionKey:     'noteActionTask4mReal',
  tagKey:            'month5_4TagReal',
  statusKey:         'month5_4StatusReal',
  rawNoteKey:        'task4mNoteReal',
  filteredNoteKey:   'filteredNote4mReal',
  rawNoteKey2:       'task4mNote2Real',
  filteredNoteKey2:  'filteredNote4m_2Real',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task5m5Real', {
  decisionKey:       'decisionTask5mReal',
  noteActionKey:     'noteActionTask5mReal',
  tagKey:            'month5_5TagReal',
  statusKey:         'month5_5StatusReal',
  rawNoteKey:        'task5mNoteReal',
  filteredNoteKey:   'filteredNote5mReal',
  rawNoteKey2:       'task5mNote2Real',
  filteredNoteKey2:  'filteredNote5m_2Real',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2RealT,
});

makeTaskRoute('/task5m6Real', {
  decisionKey:       'decisionTask6mReal',
  noteActionKey:     'noteActionTask6mReal',
  tagKey:            'month5_6TagReal',
  statusKey:         'month5_6StatusReal',
  rawNoteKey:        'task6mNoteReal',
  filteredNoteKey:   'filteredNote6mReal',
  rawNoteKey2:       'task6mNote2Real',
  filteredNoteKey2:  'filteredNote6m_2Real',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2RealT,
});

// --- Utility routes ---


router.get('/endTerminateReal', function (req, res) {
  // Ends termination process and restores Real case (Golden Grange) to 'Agreement accepted' if confirmed
  if (req.session.data.terminateDecision === 'yes') {
    req.session.data.caseStageReal     = 'pay';
    req.session.data.caseStatusReal    = 'Agreement accepted';
    req.session.data.caseStatusTagReal = 'govuk-tag govuk-tag--green';
  }
  res.redirect('/FRPS-D2/caseReal/tasklist-stage');
});

// ============================================================
// Grasslands grant type — blank-canvas clone of the Golden Grange journey
// (own /Grasslands/caseGrass/ folder, nav + context strip). New grant-type
// prototyping starts here; routes mirror caseReal with a Grass scope token.
// ============================================================

router.get('/grasslandsApplication', function (req, res) {
  req.session.data.largeCase = 'grass';
  req.session.data.grassCalcVariant = 'new';
  res.redirect('/tasklistStageGrass');
});

// ----- Grasslands caselist data + routes -----
// Cases live in data/grasslands-cases.js (reloaded per request so edits show
// live). Routes filter (My / team context / Completed) + paginate, then pass a
// `view` object to the template.
const grasslandsCasesPath = path.join(__dirname, 'data', 'grasslands-cases.js')
function loadGrassCases () {
  delete require.cache[require.resolve(grasslandsCasesPath)]
  return require(grasslandsCasesPath).cases
}
const GRASS_COMPLETED = ['Agreement accepted', 'Rejected', 'Withdrawn']

// Resolve + persist the selected context. The "Switch team" selector posts
// ?ctx=A|B|C|all; otherwise the session's last choice is used (default Team A).
function grassCtx (req) {
  const valid = ['A', 'B', 'C', 'all']
  if (valid.indexOf(req.query.ctx) !== -1) req.session.data.grassCtx = req.query.ctx
  const stored = req.session.data.grassCtx
  return valid.indexOf(stored) !== -1 ? stored : 'A'
}
function grassPaginate (rows, page) {
  const pageSize = 20
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  let p = (page && page > 0) ? page : 1
  if (p > totalPages) p = totalPages
  const startIdx = (p - 1) * pageSize
  const endIdx = Math.min(startIdx + pageSize, total)
  return { rows: rows.slice(startIdx, endIdx), page: p, totalPages: totalPages, total: total, startIdx: startIdx, endIdx: endIdx }
}
function grassCtxFilter (cases, ctx) {
  return ctx === 'all' ? cases : cases.filter(function (c) { return c.team === ctx })
}

// ----- Sorting (server-side, applied to the WHOLE filtered set before
// pagination, so clicking a column header re-sorts every case in the tab, not
// just the 20 on the current page). Default: submitted ascending — oldest to
// newest ("by age"). -----
const GRASS_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function grassDateVal (s) {
  const parts = String(s || '').trim().split(/\s+/)
  if (parts.length !== 3) return 0
  const d = parseInt(parts[0], 10)
  const m = GRASS_MONTHS.indexOf(parts[1])
  const y = parseInt(parts[2], 10)
  if (isNaN(d) || m === -1 || isNaN(y)) return 0
  return new Date(y, m, d).getTime()
}
const GRASS_SORT_KEYS = ['id', 'business', 'sbi', 'submitted', 'value', 'status', 'stage', 'assignee']
function grassSortState (req) {
  let sort = req.query.sort
  if (GRASS_SORT_KEYS.indexOf(sort) === -1) sort = 'submitted' // default: by age
  const dir = req.query.dir === 'desc' ? 'desc' : 'asc'        // default: oldest first
  return { sort: sort, dir: dir }
}
function grassSortRows (rows, state, req) {
  const factor = state.dir === 'desc' ? -1 : 1
  const key = state.sort
  return rows.slice().sort(function (a, b) {
    if (key === 'submitted') {
      return (grassDateVal(a.submitted) - grassDateVal(b.submitted)) * factor
    }
    if (key === 'value') {
      return ((a.valueK || 0) - (b.valueK || 0)) * factor
    }
    if (key === 'stage') {
      // Pipeline order (Application < Agreement < Payments), not alphabetical.
      // Only MVP rows carry `stage`; elsewhere every row ranks equal (no-op).
      return (grassStageRank(a) - grassStageRank(b)) * factor
    }
    let av = key === 'status' ? grassEffStatus(a, req) : a[key]
    let bv = key === 'status' ? grassEffStatus(b, req) : b[key]
    av = String(av || '').toLowerCase()
    bv = String(bv || '').toLowerCase()
    if (av < bv) return -1 * factor
    if (av > bv) return 1 * factor
    return 0
  })
}
// Sort the full filtered set, paginate, and attach the active sort state so the
// template can render header links + aria-sort and keep sort across page links.
function grassBuildView (rows, req) {
  const sortState = grassSortState(req)
  const view = grassPaginate(grassSortRows(rows, sortState, req), parseInt(req.query.page, 10))
  view.sort = sortState.sort
  view.dir = sortState.dir
  return view
}

// Completed cases (Agreement accepted / Rejected / Withdrawn) are shown only on
// the Completed tab — they are excluded from My and the context tab.
function grassActive (cases) {
  return cases.filter(function (c) { return GRASS_COMPLETED.indexOf(c.status) === -1 })
}

// caseworker name -> team id (e.g. "M Walker" -> "A"), from grasslands-teams.js.
function grassTeamByCaseworker () {
  const map = {}
  require(grasslandsTeamsPath).teams.forEach(function (t) {
    t.caseworkers.forEach(function (cw) { map[cw] = t.id })
  })
  return map
}
// Reassignment overrides — picking a caseworker on the assign screen stores
// id -> assignee in the session; applied on load so a reassignment carries
// through every tab without mutating the data file. Assigning a case to a
// person also moves it into that person's team context (every case has a team).
function grassApplyAssign (cases, req) {
  const map = (req.session.data && req.session.data.grassAssign) || {}
  const teamOf = grassTeamByCaseworker()
  return cases.map(function (c) {
    if (!map[c.id]) return c
    const assignee = map[c.id]
    return Object.assign({}, c, { assignee: assignee, team: teamOf[assignee] || c.team })
  })
}
// The caselist Select checkboxes submit selectCaseGrass; normalise to an array
// (one ticked box arrives as a string, several as an array).
function grassSelectedIds (req) {
  const v = req.query.selectCaseGrass
  if (v === undefined || v === null || v === '') return []
  return Array.isArray(v) ? v : [v]
}

// ----- Filters (Assignee / Status / search) -----
// The "Find an application" panel checkbox values map to the data's assignee
// names and status strings. Selections persist in the session so they carry
// across tabs (like the context selector).
const GRASS_ASSIGNEE_BY_VAL = {
  walker: 'M Walker', rsingh: 'R Singh', tokafor: 'T Okafor',
  carter: 'E Carter', jjones: 'J Jones', pshah: 'P Shah',
  ajones: 'A Jones', lowusu: 'L Owusu', kreed: 'K Reed',
  unassigned: 'Not assigned'
}
const GRASS_STATUS_BY_VAL = {
  'application-received': 'Application received', 'in-review': 'In review',
  'on-hold': 'On hold', 'agreement-drafted': 'Agreement drafted',
  'agreement-offered': 'Agreement offered', 'agreement-accepted': 'Agreement accepted',
  rejected: 'Rejected', withdrawn: 'Withdrawn'
}
const GRASS_VAL_BY_ASSIGNEE = {}
Object.keys(GRASS_ASSIGNEE_BY_VAL).forEach(function (v) { GRASS_VAL_BY_ASSIGNEE[GRASS_ASSIGNEE_BY_VAL[v]] = v })
const GRASS_VAL_BY_STATUS = {}
Object.keys(GRASS_STATUS_BY_VAL).forEach(function (v) { GRASS_VAL_BY_STATUS[GRASS_STATUS_BY_VAL[v]] = v })

// Normalise a checkbox field to an array of real values (the kit appends a
// "_unchecked" sentinel; a single tick arrives as a string).
function grassArr (v) {
  if (v === undefined || v === null || v === '') return []
  return (Array.isArray(v) ? v : [v]).filter(function (x) { return x && x !== '_unchecked' })
}
// Effective status for a row — the live case (Golden Grange) renders its status
// from the session, defaulting to "Application received".
function grassEffStatus (c, req) {
  if (c.status === 'live') return req.session.data.caseStageGrass ? req.session.data.caseStatusGrass : 'Application received'
  return c.status
}
// Apply the active Assignee / Status / search filters. An empty facet imposes
// no constraint (every box ticked === all shown).
function grassFilter (rows, req) {
  const d = req.session.data || {}
  const aNames = grassArr(d.filterAssigneeGrass).map(function (v) { return GRASS_ASSIGNEE_BY_VAL[v] }).filter(Boolean)
  const sNames = grassArr(d.filterStatusGrass).map(function (v) { return GRASS_STATUS_BY_VAL[v] }).filter(Boolean)
  const search = (d.searchGrass || '').toString().trim().toLowerCase()
  return rows.filter(function (c) {
    if (aNames.length && aNames.indexOf(c.assignee) === -1) return false
    if (sNames.length && sNames.indexOf(grassEffStatus(c, req)) === -1) return false
    if (search) {
      // Search is SBI-only for now.
      if (String(c.sbi).toLowerCase().indexOf(search) === -1) return false
    }
    return true
  })
}

// Assignee options for the filter, scoped to the context. For a single team:
// that team's caseworkers (+ "Not assigned"). For All teams: `team` is null and
// the filter uses the autocomplete over `all` (every caseworker + "Not assigned").
function grassAssigneeContext (ctx) {
  const teams = require(grasslandsTeamsPath).teams
  const optFor = function (name) { return { v: GRASS_VAL_BY_ASSIGNEE[name] || 'unassigned', n: name } }
  const all = []
  teams.forEach(function (t) { t.caseworkers.forEach(function (n) { all.push(optFor(n)) }) })
  all.push({ v: 'unassigned', n: 'Not assigned' })
  let team = null
  if (ctx !== 'all') {
    const t = teams.find(function (x) { return x.id === ctx })
    team = (t ? t.caseworkers.map(optFor) : [])
    team.push({ v: 'unassigned', n: 'Not assigned' })
  }
  return { team: team, all: all }
}
// Per-facet counts for the current tab/context base (pre-facet), plus the active
// selections + search, handed to the template so the panel reflects reality.
function grassFilterState (baseRows, req) {
  const d = req.session.data || {}
  const assignee = {}; const status = {}
  Object.keys(GRASS_ASSIGNEE_BY_VAL).forEach(function (v) { assignee[v] = 0 })
  Object.keys(GRASS_STATUS_BY_VAL).forEach(function (v) { status[v] = 0 })
  baseRows.forEach(function (c) {
    const av = GRASS_VAL_BY_ASSIGNEE[c.assignee]; if (av) assignee[av]++
    const sv = GRASS_VAL_BY_STATUS[grassEffStatus(c, req)]; if (sv) status[sv]++
  })
  return {
    assignee: grassArr(d.filterAssigneeGrass),
    status: grassArr(d.filterStatusGrass),
    search: (d.searchGrass || '').toString(),
    counts: { assignee: assignee, status: status }
  }
}
// "Clear filters" link — wipe the filter keys and reload the bare path.
function grassClearedFilters (req, res) {
  if (!req.query.clearGrassFilters) return false
  delete req.session.data.filterAssigneeGrass
  delete req.session.data.filterStatusGrass
  delete req.session.data.filterStageGrass
  delete req.session.data.searchGrass
  res.redirect(req.path)
  return true
}

// ----- grants-dashboard-mvp only: Stage facet (derived from status) -----
// "Stage" is a coarse grouping over the case status, shown/sorted/filtered on the
// MVP GTIF caselist only. Kept out of the shared grassFilter/grassFilterState so
// it can never leak into the original grants-dashboard / Grasslands caselists.
const GRASS_STAGE_OPTS = [
  { v: 'application', n: 'Application' },
  { v: 'agreement', n: 'Agreement' },
  { v: 'payments', n: 'Payments' }
]
const GRASS_STAGE_NAMES = { application: 'Application', agreement: 'Agreement', payments: 'Payments' }
const GRASS_STAGE_RANK = { Application: 1, Agreement: 2, Payments: 3 }
// Map a case's (effective) status to its stage name. Rejected / Withdrawn are
// terminal outcomes with no pipeline stage -> '' (rendered as "—").
function grassStageName (c, req) {
  const eff = grassEffStatus(c, req)
  if (eff === 'Agreement accepted') return 'Payments'
  if (eff === 'Agreement drafted' || eff === 'Agreement offered') return 'Agreement'
  if (eff === 'Application received' || eff === 'In review' || eff === 'On hold') return 'Application'
  return ''
}
// Attach the derived `stage` to every row so display, sort and filter all agree.
// Applied to the base set (before filtering) by every caselist route that shows
// the Stage column.
function grassWithStage (rows, req) {
  return rows.map(function (c) { return Object.assign({}, c, { stage: grassStageName(c, req) }) })
}
// Sort rank from the stage already attached to the row (pipeline order; blank last).
function grassStageRank (c) {
  return GRASS_STAGE_RANK[c.stage] || 4
}
// Apply the Stage filter (session filterStageGrass) on top of the shared filters.
function grassStageFilter (rows, req) {
  const sel = grassArr((req.session.data || {}).filterStageGrass)
  if (!sel.length) return rows
  const names = sel.map(function (v) { return GRASS_STAGE_NAMES[v] }).filter(Boolean)
  return rows.filter(function (c) { return names.indexOf(c.stage) !== -1 })
}
// Selected Stage values, for the filter UI + removable tags.
function grassStageState (req) {
  return { stage: grassArr((req.session.data || {}).filterStageGrass) }
}

// The "My cases" tab can be pointed at any caseworker who has cases. The chosen
// person (default M Walker) drives both the tab label ("<name>'s cases") and the
// filter. The autocomplete range is every user that currently owns at least one
// case (grassUsersWithCases).
function grassAllCaseworkers () {
  let names = []
  require(grasslandsTeamsPath).teams.forEach(function (t) { names = names.concat(t.caseworkers) })
  return names
}
function grassMyAssignee (req) {
  const valid = grassAllCaseworkers()
  if (req.query.myAssignee && valid.indexOf(req.query.myAssignee) !== -1) req.session.data.grassMyAssignee = req.query.myAssignee
  const stored = req.session.data && req.session.data.grassMyAssignee
  return valid.indexOf(stored) !== -1 ? stored : 'M Walker'
}
function grassUsersWithCases (req) {
  const owners = {}
  grassApplyAssign(loadGrassCases(), req).forEach(function (c) {
    if (c.assignee && c.assignee !== 'Not assigned') owners[c.assignee] = true
  })
  return Object.keys(owners).sort()
}

// My cases — a chosen caseworker's active cases. Tab-scoped controls only
// (Change assignee); the status/search filter lives on the All cases tab.
router.get('/Grasslands/caselist', function (req, res) {
  if (grassClearedFilters(req, res)) return
  const ctx = grassCtx(req)
  const myAssignee = grassMyAssignee(req)
  const base = grassWithStage(grassApplyAssign(loadGrassCases(), req), req)
  const rows = grassActive(base.filter(function (c) { return c.assignee === myAssignee }))
  res.render('Grasslands/caselist', { ctx: ctx, myAssignee: myAssignee, usersWithCases: grassUsersWithCases(req), view: grassBuildView(rows, req) })
})

// Open cases — the selected team's ACTIVE cases (completed excluded). Tab-scoped
// control only (Change team); no status/search filter here.
router.get('/Grasslands/caselist-team', function (req, res) {
  if (grassClearedFilters(req, res)) return
  const ctx = grassCtx(req)
  const base = grassWithStage(grassApplyAssign(loadGrassCases(), req), req)
  const rows = grassActive(grassCtxFilter(base, ctx))
  res.render('Grasslands/caselist-team', { ctx: ctx, myAssignee: grassMyAssignee(req), view: grassBuildView(rows, req) })
})

// All cases — EVERY case (all teams, all statuses, including closed/unassigned).
// This tab carries the permanent SBI search + the Status filter.
router.get('/Grasslands/caselist-completed', function (req, res) {
  if (grassClearedFilters(req, res)) return
  const ctx = grassCtx(req)
  const base = grassWithStage(grassApplyAssign(loadGrassCases(), req), req)
  const rows = grassStageFilter(grassFilter(base, req), req)
  res.render('Grasslands/caselist-completed', { ctx: ctx, grassFilters: grassFilterState(base, req), stageFilters: grassStageState(req), myAssignee: grassMyAssignee(req), view: grassBuildView(rows, req) })
})

// GTIF caselist — a per-scheme (Green Tech Innovation Fund) view over the SAME
// Grasslands case data, but a single "All cases" tab with the SBI search + Status
// filter + sortable table, plus a scheme-specific funds-allocation bar.
router.get('/grants-dashboard/GTIF-caselist', function (req, res) {
  if (grassClearedFilters(req, res)) return
  const base = grassApplyAssign(loadGrassCases(), req)
  const rows = grassFilter(base, req)
  res.render('grants-dashboard/GTIF-caselist', { grassFilters: grassFilterState(base, req), view: grassBuildView(rows, req) })
})

// MVP working copy of the GTIF caselist (views/grants-dashboard-mvp/). Same data
// and helpers as the route above; separate template so it can diverge freely.
router.get('/grants-dashboard-mvp/GTIF-caselist', function (req, res) {
  if (grassClearedFilters(req, res)) return
  const base = grassWithStage(grassApplyAssign(loadGrassCases(), req), req)
  const rows = grassStageFilter(grassFilter(base, req), req)
  res.render('grants-dashboard-mvp/GTIF-caselist', {
    grassFilters: grassFilterState(base, req),
    stageFilters: grassStageState(req),
    view: grassBuildView(rows, req)
  })
})

// ============================================================
// Woodlands grant — a standalone functional area (different grant type).
// A simple caselist (no checkboxes / assign / filters — just an Application-ID
// search + sortable columns) plus an entitlement-calculation flow:
//   caselist -> Calculate entitlement -> Confirm entitlement -> caselist.
// Data + the current £/hectare lookup live in data/woodlands-cases.js (reloaded
// per request so edits show live and the rate can "change over time"). Confirmed
// entitlements are held in the session (id -> FC available area) and applied on
// load, mirroring the Grasslands reassignment pattern.
// ============================================================
const woodlandsCasesPath = path.join(__dirname, 'data', 'woodlands-cases.js')
function wdLoad () {
  delete require.cache[require.resolve(woodlandsCasesPath)]
  return require(woodlandsCasesPath)
}
function wdRate () { return wdLoad().valuePerHa }
function wdCases () { return wdLoad().cases }
function wdFindCase (id) { return wdCases().find(function (c) { return c.id === id }) }

// £ with thousands separators, no decimals.
function wdGbp (n) {
  const v = Math.round(Number(n) || 0)
  return '£' + v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Confirmed FC available area for a case: session override first, then the data
// file's baseline (advanced cases ship with one), else null (no entitlement yet).
function wdEntArea (c, req) {
  const ov = (req.session.data && req.session.data.woodlandsEntitlements) || {}
  if (ov[c.id] !== undefined && ov[c.id] !== null && ov[c.id] !== '') return Number(ov[c.id])
  return (c.fcAreaHa === 0 || c.fcAreaHa) ? c.fcAreaHa : null
}
// Date the entitlement was created: session (set on confirm) first, then the data
// file's baseline, else null.
function wdEntDate (c, req) {
  const ov = (req.session.data && req.session.data.woodlandsEntitlementDates) || {}
  return ov[c.id] || c.entDate || null
}
// Today as "D Mon YYYY" (used when an entitlement is created through the flow).
function wdToday () {
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d = new Date()
  return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear()
}

// Application-ID search term. Query wins; else the session-persisted value (so it
// survives sort / pagination links that don't carry the param).
function wdSearchTerm (req) {
  if (req.query.searchWood !== undefined) return req.query.searchWood
  return (req.session.data && req.session.data.searchWood) || ''
}

const WD_SORT_KEYS = ['id', 'appDate', 'stage', 'status', 'value', 'entitlement']
const WD_STAGE_RANK = { Application: 1, Agreement: 2, Payments: 3 }
function wdSortState (req) {
  let sort = req.query.sort
  if (WD_SORT_KEYS.indexOf(sort) === -1) sort = 'id'
  const dir = req.query.dir === 'desc' ? 'desc' : 'asc'
  return { sort: sort, dir: dir }
}
function wdSortRows (rows, st) {
  const f = st.dir === 'desc' ? -1 : 1
  const k = st.sort
  return rows.slice().sort(function (a, b) {
    if (k === 'appDate') return (grassDateVal(a.appDate) - grassDateVal(b.appDate)) * f
    if (k === 'value') return (a.value - b.value) * f
    if (k === 'entitlement') {
      // Unset entitlements (null) sort to the bottom ascending / top descending.
      const av = a.entitlement === null ? -1 : a.entitlement
      const bv = b.entitlement === null ? -1 : b.entitlement
      return (av - bv) * f
    }
    if (k === 'stage') return ((WD_STAGE_RANK[a.stage] || 4) - (WD_STAGE_RANK[b.stage] || 4)) * f
    const av = String(a[k] || '').toLowerCase()
    const bv = String(b[k] || '').toLowerCase()
    if (av < bv) return -1 * f
    if (av > bv) return 1 * f
    return 0
  })
}

// Build display rows: attach derived £ Value + Entitlement (and flags).
function wdRows (req) {
  const rate = wdRate()
  return wdCases().map(function (c) {
    const entArea = wdEntArea(c, req)
    const value = c.appliedAreaHa * rate
    const entitlement = entArea === null ? null : entArea * rate
    return Object.assign({}, c, {
      value: value,
      valueDisplay: wdGbp(value),
      entArea: entArea,
      entitlement: entitlement,
      entitlementDisplay: entitlement === null ? '' : wdGbp(entitlement),
      hasEntitlement: entitlement !== null
    })
  })
}
function wdView (req) {
  let rows = wdRows(req)
  const term = (wdSearchTerm(req) || '').toString().trim().toLowerCase()
  if (term) rows = rows.filter(function (r) { return r.id.toLowerCase().indexOf(term) !== -1 })
  const st = wdSortState(req)
  rows = wdSortRows(rows, st)
  const view = grassPaginate(rows, parseInt(req.query.page, 10))
  view.sort = st.sort
  view.dir = st.dir
  view.search = wdSearchTerm(req)
  view.rate = wdRate()
  view.rateDisplay = wdGbp(wdRate())
  return view
}

// ----- Woodlands routes -----
router.get('/Woodlands/caselist', function (req, res) {
  res.render('Woodlands/caselist', { view: wdView(req) })
})

// Calculate entitlement — the input screen for a single application.
router.get('/Woodlands/calculate', function (req, res) {
  const c = wdFindCase(req.query.id)
  if (!c) return res.redirect('/Woodlands/caselist')
  res.render('Woodlands/calculate', {
    c: c, appliedArea: c.appliedAreaHa,
    rate: wdRate(), rateDisplay: wdGbp(wdRate()),
    values: {}, error: null
  })
})

// Validate the entered FC available area; on success render the Confirm screen.
router.post('/Woodlands/calculate', function (req, res) {
  const c = wdFindCase(req.body.id)
  if (!c) return res.redirect('/Woodlands/caselist')
  const rate = wdRate()
  const raw = (req.body.fcArea === undefined ? '' : req.body.fcArea).toString().trim()
  const num = Number(raw)
  let error = null
  if (raw === '') error = 'Enter the FC available area in hectares'
  else if (isNaN(num) || num <= 0) error = 'FC available area must be a number greater than 0'
  else if (num > c.appliedAreaHa) error = 'FC available area cannot be more than the applied for area (' + c.appliedAreaHa + ' hectares)'
  if (error) {
    return res.render('Woodlands/calculate', {
      c: c, appliedArea: c.appliedAreaHa, rate: rate, rateDisplay: wdGbp(rate),
      values: { fcArea: raw }, error: error
    })
  }
  const entitlement = num * rate
  res.render('Woodlands/confirm', {
    c: c, fcArea: num, rate: rate, rateDisplay: wdGbp(rate),
    entitlement: entitlement, entitlementDisplay: wdGbp(entitlement)
  })
})

// Read-only entitlement view — reached from a caselist ID that already has an
// entitlement. Same calculation content as Confirm, but no button.
router.get('/Woodlands/entitlement', function (req, res) {
  const c = wdFindCase(req.query.id)
  if (!c) return res.redirect('/Woodlands/caselist')
  const area = wdEntArea(c, req)
  if (area === null) return res.redirect('/Woodlands/calculate?id=' + encodeURIComponent(c.id))
  const rate = wdRate()
  const entitlement = area * rate
  res.render('Woodlands/confirm', {
    c: c, fcArea: area, rate: rate, rateDisplay: wdGbp(rate),
    entitlement: entitlement, entitlementDisplay: wdGbp(entitlement),
    entDate: wdEntDate(c, req),
    readonly: true
  })
})

// Confirm — persist the entitlement (session) and return to the caselist.
router.post('/Woodlands/confirm', function (req, res) {
  const c = wdFindCase(req.body.id)
  if (!c) return res.redirect('/Woodlands/caselist')
  const num = Number(req.body.fcArea)
  if (isNaN(num) || num <= 0 || num > c.appliedAreaHa) {
    return res.redirect('/Woodlands/calculate?id=' + encodeURIComponent(c.id))
  }
  if (!req.session.data.woodlandsEntitlements) req.session.data.woodlandsEntitlements = {}
  if (!req.session.data.woodlandsEntitlementDates) req.session.data.woodlandsEntitlementDates = {}
  req.session.data.woodlandsEntitlements[c.id] = num
  req.session.data.woodlandsEntitlementDates[c.id] = wdToday()
  res.redirect('/Woodlands/caselist')
})

// Assign screen — shows the ticked case(s) and a caseworker picker. The picker
// is every caseworker across all teams (autocomplete-enhanced in the template).
router.get('/Grasslands/caselist-assign', function (req, res) {
  const ctx = grassCtx(req)
  const ids = grassSelectedIds(req)
  const picked = grassApplyAssign(loadGrassCases(), req).filter(function (c) { return ids.indexOf(c.id) !== -1 })
  // Reassign if ANY picked case already has a caseworker; otherwise Assign.
  const anyAssigned = picked.some(function (c) { return c.assignee && c.assignee !== 'Not assigned' })
  // Give each row the id list MINUS itself, so the "Remove" link can reload the
  // page with that case dropped from the selection.
  const selected = picked.map(function (c) {
    return Object.assign({}, c, {
      removeIds: picked.filter(function (o) { return o.id !== c.id }).map(function (o) { return o.id })
    })
  })
  let caseworkers = []
  require(grasslandsTeamsPath).teams.forEach(function (t) { caseworkers = caseworkers.concat(t.caseworkers) })
  res.render('Grasslands/caselist-assign', { ctx: ctx, selected: selected, caseworkers: caseworkers, anyAssigned: anyAssigned })
})

// Confirm — record the chosen caseworker against every selected case, then
// return to the context tab where the Assignee column reflects the change.
router.get('/Grasslands/assign-confirm', function (req, res) {
  const ids = grassSelectedIds(req)
  const assignee = req.query.grassAssignee
  if (assignee && ids.length) {
    const map = req.session.data.grassAssign || {}
    ids.forEach(function (id) { map[id] = assignee })
    req.session.data.grassAssign = map
  }
  res.redirect('/Grasslands/caselist-team')
})

// Back-compat: the old All-cases tab is now the context tab with ctx = all.
router.get('/Grasslands/caselist-all', function (req, res) {
  res.redirect('/Grasslands/caselist-team?ctx=all')
})

makeStageRoute('/tasklistStageGrass', {
  stageCountKey:    'stageCountGrass',
  stageKey:         'caseStageGrass',
  statusKey:        'caseStatusGrass',
  tagKey:           'caseStatusTagGrass',
  firstRedirect:    '/Grasslands/caselist',
  tasklistRedirect: '/Grasslands/caseGrass/tasklist-stage',
});

// ============================================================
// Grasslands/caseGrass routes (Golden Grange journey — cloned from caseReal)
// ============================================================

// --- Approval/rejection ---

makeApproveRoute('/app-approve2Grass', {
  decisionKey:           'decision1Grass',
  approvedKey:           'caseApprovedGrass',
  agreementStageKey:     'agreementStageGrass',
  reviewNoteKey:         'reviewNoteGrass',
  filteredReviewNoteKey: 'filteredReviewNoteGrass',
  stageKey:              'caseStageGrass',
  statusKey:             'caseStatusGrass',
  tagKey:                'caseStatusTagGrass',
  onApproveRedirect:     '/tasklistStageGrass',
  amendRedirect:         '/Grasslands/caseGrass/amend-confirm',
  returnRedirect:        '/Grasslands/caseGrass/return-confirm',
  defaultRedirect:       '/Grasslands/caseGrass/tasklist-stage',
});

// --- State resets ---

router.get('/resume2Grass', function (req, res) {
  // Returns Grass case (Golden Grange) to 'In review' after a pause or rejection reopen
  req.session.data.caseStageGrass     = 'review';
  req.session.data.caseStatusGrass    = 'In review';
  req.session.data.caseStatusTagGrass = 'govuk-tag govuk-tag--blue';
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

router.get('/amendReturn1Grass', function (req, res) {
  // Cancels amend/return flow and restores Grass case (Golden Grange) to 'In review'
  req.session.data.caseStageGrass     = 'review';
  req.session.data.caseStatusGrass    = 'In review';
  req.session.data.caseStatusTagGrass = 'govuk-tag govuk-tag--blue';
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

// --- Confirmation gates ---

router.get('/returnConf1Grass', function (req, res) {
  // Proceeds with return if confirmed, otherwise cancels back to tasklist
  if (req.session.data.rConfGrass === 'yes') {
    res.redirect('/Grasslands/caseGrass/tasklist-stage');
  } else {
    res.redirect('/amendReturn1Grass');
  }
});

router.get('/terminateConf1Grass', function (req, res) {
  // Finalises termination if confirmed, otherwise leaves Grass case (Golden Grange) stage unchanged
  if (req.session.data.tConfGrass === 'yes') {
    req.session.data.caseStageGrass     = 'terminate';
    req.session.data.caseStatusGrass    = 'Terminated';
    req.session.data.caseStatusTagGrass = 'govuk-tag govuk-tag--red';
  }
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

router.get('/amendConf1Grass', function (req, res) {
  // Proceeds with amendment if confirmed, otherwise cancels back to tasklist
  if (req.session.data.aConfGrass === 'yes') {
    res.redirect('/Grasslands/caseGrass/tasklist-stage');
  } else {
    res.redirect('/amendReturn1Grass');
  }
});

// --- Amendment flow ---

makeAmendRoute('/amend1Grass', {
  decisionKey: 'decisionAmGrass',
  stageKey:    'caseStageGrass',
  statusKey:   'caseStatusGrass',
  tagKey:      'caseStatusTagGrass',
  redirectTo:  '/Grasslands/caseGrass/tasklist-stage',
});

router.get('/amend2Grass', function (req, res) {
  // Closes Grass case (Golden Grange) via amendment submission
  req.session.data.caseStageGrass     = 'amendment_submitted';
  req.session.data.caseStatusGrass    = 'Case close by amendment';
  req.session.data.caseStatusTagGrass = 'govuk-tag govuk-tag--orange';
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

// --- Agreement sent ---

makeAgreementSentRoute('/aggSent2Grass', {
  decisionKey:     'decisionAgGrass',
  rawNoteKey:      'agreeNoteGrass',
  filteredNoteKey: 'filteredAggNoteGrass',
  stageKey:        'caseStageGrass',
  statusKey:       'caseStatusGrass',
  tagKey:          'caseStatusTagGrass',
  onSentRedirect:  '/tasklistStageGrass',
  defaultRedirect: '/Grasslands/caseGrass/tasklist-stage',
});

// --- Termination flow ---

router.get('/terminate1Grass', function (req, res) {
  // Begins termination process for Grass case (Golden Grange)
  req.session.data.caseStageGrass     = 'pending-termination';
  req.session.data.caseStatusGrass    = 'Preparing to terminate';
  req.session.data.caseStatusTagGrass = 'govuk-tag govuk-tag--orange';
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

router.get('/terminatePrepGrass', function (req, res) {
  // Routes termination preparation outcome: confirm page, end process, or default
  const d = req.session.data;
  switch (d.decisionTrGrass) {
  case 'Terminate agreement':
    d.filteredTrNoteGrass = stripEmptyAndNulls(d.terminateNoteGrass);
    return res.redirect('/Grasslands/caseGrass/terminate-confirm');
  case 'End termination process':
    d.caseStageGrass     = 'pay';
    d.caseStatusGrass    = 'Agreement accepted';
    d.caseStatusTagGrass = 'govuk-tag govuk-tag--green';
    return res.redirect('/Grasslands/caseGrass/tasklist-stage');
  }
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

// --- Termination task routes ---

const D2GrassT = '/Grasslands/caseGrass/tasklist-stage';

// Note: original task1TrT2Grass default branch used wrong keys (terminateTagGrass/terminateStatusGrass). Fixed to terminate1TagGrass/terminate1StatusGrass.
makeTaskRoute('/task1TrT2Grass', {
  checkedKey:        'terminateCheckedGrass',
  decisionKey:       'decisionTerminateTask1Grass',
  noteActionKey:     'noteActionTerminateTask1Grass',
  tagKey:            'terminate1TagGrass',
  statusKey:         'terminate1StatusGrass',
  rawNoteKey:        'task1TrNoteGrass',
  filteredNoteKey:   'filteredNote1TrGrass',
  rawNoteKey2:       'task1TrNote2Grass',
  filteredNoteKey2:  'filteredNote1Tr_2Grass',
  outcomes:          TERMINATE_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task2TrT2Grass', {
  decisionKey:       'decisionTerminateTask2Grass',
  noteActionKey:     'noteActionTerminateTask2Grass',
  tagKey:            'terminate2TagGrass',
  statusKey:         'terminate2StatusGrass',
  rawNoteKey:        'task2TrNoteGrass',
  filteredNoteKey:   'filteredNote2TrGrass',
  rawNoteKey2:       'task2TrNote2Grass',
  filteredNoteKey2:  'filteredNote2Tr_2Grass',
  outcomes:          TERMINATE_OUTCOMES,
  redirectTo:        D2GrassT,
});

// --- Task review routes ---

// Note: task5T2Grass and task6T2Grass use 'detailsChecked' (not detailsCheckedGrass) — preserved from original.
makeTaskRoute('/task1T2Grass', {
  checkedKey:        'detailsCheckedGrass',
  decisionKey:       'decisionTask1Grass',
  noteActionKey:     'noteActionTask1Grass',
  tagKey:            'detailsTagGrass',
  statusKey:         'detailsStatusGrass',
  rawNoteKey:        'task1NoteGrass',
  filteredNoteKey:   'filteredNote1Grass',
  rawNoteKey2:       'task1Note2Grass',
  filteredNoteKey2:  'filteredNote1_2Grass',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task2T2Grass', {
  checkedKey:        'detailsCheckedGrass',
  decisionKey:       'decisionTask2Grass',
  noteActionKey:     'noteActionTask2Grass',
  tagKey:            'calcsTagGrass',
  statusKey:         'calcsStatusGrass',
  rawNoteKey:        'task2NoteGrass',
  filteredNoteKey:   'filteredNote2Grass',
  rawNoteKey2:       'task2Note2Grass',
  filteredNoteKey2:  'filteredNote2_2Grass',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task3T2Grass', {
  checkedKey:        'detailsCheckedGrass',
  decisionKey:       'decisionTask3Grass',
  noteActionKey:     'noteActionTask3Grass',
  tagKey:            'sssiTagGrass',
  statusKey:         'sssiStatusGrass',
  rawNoteKey:        'task3NoteGrass',
  filteredNoteKey:   'filteredNote3Grass',
  rawNoteKey2:       'task3Note2Grass',
  filteredNoteKey2:  'filteredNote3_2Grass',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task5T2Grass', {
  checkedKey:        'detailsCheckedGrass',
  decisionKey:       'decisionTask5Grass',
  noteActionKey:     'noteActionTask5Grass',
  tagKey:            'paymentTagGrass',
  statusKey:         'paymentStatusGrass',
  rawNoteKey:        'task5NoteGrass',
  filteredNoteKey:   'filteredNote5Grass',
  rawNoteKey2:       'task5Note2Grass',
  filteredNoteKey2:  'filteredNote5_2Grass',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task6T2Grass', {
  checkedKey:        'detailsCheckedGrass',
  decisionKey:       'decisionTask6Grass',
  noteActionKey:     'noteActionTask6Grass',
  tagKey:            'budgetTagGrass',
  statusKey:         'budgetStatusGrass',
  rawNoteKey:        'task6NoteGrass',
  filteredNoteKey:   'filteredNote6Grass',
  rawNoteKey2:       'task6Note2Grass',
  filteredNoteKey2:  'filteredNote6_2Grass',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2GrassT,
});

// --- Case assignment ---

router.get('/caselistTeam2Grass', function (req, res) {
  // Marks Grass case (Golden Grange) as assigned and returns to caselist
  req.session.data.caseAssignedGrass = 'yes';
  res.redirect('/Grasslands/caselist');
});

router.get('/setUserFo2Grass', function (req, res) {
  // Assigns finance officer role for Grass case (Golden Grange)
  req.session.data.financeOfficerGrass = 'yes';
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

// --- Amendment task routes ---

makeTaskRoute('/task1T2AmGrass', {
  decisionKey:       'decisionTaskAm1Grass',
  noteActionKey:     'noteActionTaskAm1Grass',
  tagKey:            'amend1TagGrass',
  statusKey:         'amend1StatusGrass',
  rawNoteKey:        'task1AmNoteGrass',
  filteredNoteKey:   'filteredNoteAm1Grass',
  rawNoteKey2:       'task1_2AmNoteGrass',
  filteredNoteKey2:  'filteredNoteAm1_2Grass',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task2T2AmGrass', {
  decisionKey:       'decisionTaskAm2Grass',
  noteActionKey:     'noteActionTaskAm2Grass',
  tagKey:            'amend2TagGrass',
  statusKey:         'amend2StatusGrass',
  rawNoteKey:        'task2AmNoteGrass',
  filteredNoteKey:   'filteredNoteAm2Grass',
  rawNoteKey2:       'task2_2AmNoteGrass',
  filteredNoteKey2:  'filteredNoteAm2_2Grass',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task3T2AmGrass', {
  decisionKey:       'decisionTaskAm3Grass',
  noteActionKey:     'noteActionTaskAm3Grass',
  tagKey:            'amend3TagGrass',
  statusKey:         'amend3StatusGrass',
  rawNoteKey:        'task3AmNoteGrass',
  filteredNoteKey:   'filteredNoteAm3Grass',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task4T2AmGrass', {
  decisionKey:       'decisionTaskAm4Grass',
  noteActionKey:     'noteActionTaskAm4Grass',
  tagKey:            'amend4TagGrass',
  statusKey:         'amend4StatusGrass',
  rawNoteKey:        'task4NoteGrass',
  filteredNoteKey:   'filteredNoteAm4Grass',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2GrassT,
});

// --- Agreement progression ---

router.get('/agreementStage2Grass', function (req, res) {
  // Unlocks the agreement tab in the Grass case (Golden Grange) navigation
  req.session.data.agreementStageGrass = 'yes';
  res.redirect('/Grasslands/caselist');
});

// --- Agreement task routes ---

makeTaskRoute('/task1AgT2Grass', {
  checkedKey:        'AgreeCheckedGrass',
  decisionKey:       'decisionAgreeTask1Grass',
  noteActionKey:     'noteActionAgreeTask1Grass',
  tagKey:            'agreeTagGrass',
  statusKey:         'agreeStatusGrass',
  rawNoteKey:        'task1ANoteGrass',
  filteredNoteKey:   'filteredNote1AGrass',
  rawNoteKey2:       'task1ANote2Grass',
  filteredNoteKey2:  'filteredNote1A_2Grass',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task2AgT2Grass', {
  decisionKey:       'decisionAgreeTask2Grass',
  noteActionKey:     'noteActionAgreeTask2Grass',
  tagKey:            'agreeSTagGrass',
  statusKey:         'agreeSStatusGrass',
  rawNoteKey:        'task2ANoteGrass',
  filteredNoteKey:   'filteredNoteA2Grass',
  rawNoteKey2:       'task2ANote2Grass',
  filteredNoteKey2:  'filteredNote2A_2Grass',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2GrassT,
});

// --- Agreement signing ---

router.get('/setAgreeSign2Grass', function (req, res) {
  // Records customer signature and advances Grass case (Golden Grange) status
  req.session.data.caseStatusGrass = 'Agreement accepted';
  res.redirect('/tasklistStageGrass');
});

// --- Stage progression ---

router.get('/startGrass', function (req, res) {
  // Resets Grass case (Golden Grange) to the start stage (used when re-entering a completed case)
  req.session.data.caseStageGrass     = 'start';
  req.session.data.caseStatusGrass    = 'Application received';
  req.session.data.caseStatusTagGrass = 'govuk-tag govuk-tag--grey';
  req.session.data.stageCountGrass    = 1;
  res.redirect('/Grasslands/caselist');
});


// Grass case (Golden Grange) — same lifecycle pattern as Grass case (Golden Grange) so the first hit
// after clearing data lands on the caselist (with the case row showing 'Application
// received') and subsequent hits walk the case through its stages.
makeStageRoute('/tasklistStageGrass', {
  stageCountKey:    'stageCountGrass',
  stageKey:         'caseStageGrass',
  statusKey:        'caseStatusGrass',
  tagKey:           'caseStatusTagGrass',
  firstRedirect:    '/Grasslands/caselist',
  tasklistRedirect: '/Grasslands/caseGrass/tasklist-stage',
});

// --- 5-month checks ---

router.get('/6month1Grass', function (req, res) {
  // Transitions Grass case (Golden Grange) into the simple single-task 6-month phase
  req.session.data.caseStatusGrass = '6 month checks';
  req.session.data.caseStageGrass  = '6month';
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

router.get('/month5_1Grass', function (req, res) {
  // 6-month-check completion step within the Grass case. The base /month5_1
  // it was cloned from has no handler; this keeps the action inside Grasslands
  // (form fields are now Grass-scoped) and returns to the case tasklist.
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

router.get('/6month1FullGrass', function (req, res) {
  // Transitions Grass case (Golden Grange) into the FULL 6-month phase
  // (5 tasks: AAC re-run, AAC review, management control, Siti Tenure, LPIS)
  // Per draft content for FGP-1109.
  req.session.data.caseStatusGrass = '6 month checks (full)';
  req.session.data.caseStageGrass  = '6month-full';
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});

makeTaskRoute('/task6m1Grass', {
  decisionKey:       'decisionTask1mGrass',
  noteActionKey:     'noteActionTask1mGrass',
  tagKey:            'month5_1TagGrass',
  statusKey:         'month5_1StatusGrass',
  rawNoteKey:        'task1mNoteGrass',
  filteredNoteKey:   'filteredNote1mGrass',
  rawNoteKey2:       'task1mNote2Grass',
  filteredNoteKey2:  'filteredNote1m_2Grass',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task5m2Grass', {
  decisionKey:       'decisionTask2mGrass',
  noteActionKey:     'noteActionTask2mGrass',
  tagKey:            'month5_2TagGrass',
  statusKey:         'month5_2StatusGrass',
  rawNoteKey:        'task2mNoteGrass',
  filteredNoteKey:   'filteredNote2mGrass',
  rawNoteKey2:       'task2mNote2Grass',
  filteredNoteKey2:  'filteredNote2m_2Grass',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task5m3Grass', {
  decisionKey:       'decisionTask3mGrass',
  noteActionKey:     'noteActionTask3mGrass',
  tagKey:            'month5_3TagGrass',
  statusKey:         'month5_3StatusGrass',
  rawNoteKey:        'task3mNoteGrass',
  filteredNoteKey:   'filteredNote3mGrass',
  rawNoteKey2:       'task3mNote2Grass',
  filteredNoteKey2:  'filteredNote3m_2Grass',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task5m4Grass', {
  decisionKey:       'decisionTask4mGrass',
  noteActionKey:     'noteActionTask4mGrass',
  tagKey:            'month5_4TagGrass',
  statusKey:         'month5_4StatusGrass',
  rawNoteKey:        'task4mNoteGrass',
  filteredNoteKey:   'filteredNote4mGrass',
  rawNoteKey2:       'task4mNote2Grass',
  filteredNoteKey2:  'filteredNote4m_2Grass',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task5m5Grass', {
  decisionKey:       'decisionTask5mGrass',
  noteActionKey:     'noteActionTask5mGrass',
  tagKey:            'month5_5TagGrass',
  statusKey:         'month5_5StatusGrass',
  rawNoteKey:        'task5mNoteGrass',
  filteredNoteKey:   'filteredNote5mGrass',
  rawNoteKey2:       'task5mNote2Grass',
  filteredNoteKey2:  'filteredNote5m_2Grass',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2GrassT,
});

makeTaskRoute('/task5m6Grass', {
  decisionKey:       'decisionTask6mGrass',
  noteActionKey:     'noteActionTask6mGrass',
  tagKey:            'month5_6TagGrass',
  statusKey:         'month5_6StatusGrass',
  rawNoteKey:        'task6mNoteGrass',
  filteredNoteKey:   'filteredNote6mGrass',
  rawNoteKey2:       'task6mNote2Grass',
  filteredNoteKey2:  'filteredNote6m_2Grass',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2GrassT,
});

// --- Utility routes ---


router.get('/endTerminateGrass', function (req, res) {
  // Ends termination process and restores Grass case (Golden Grange) to 'Agreement accepted' if confirmed
  if (req.session.data.terminateDecisionGrass === 'yes') {
    req.session.data.caseStageGrass     = 'pay';
    req.session.data.caseStatusGrass    = 'Agreement accepted';
    req.session.data.caseStatusTagGrass = 'govuk-tag govuk-tag--green';
  }
  res.redirect('/Grasslands/caseGrass/tasklist-stage');
});


// ============================================================
// FRPS-D2/case3 routes
// ============================================================

// --- Case initialisation ---

router.get('/case3-1', function (req, res) {
  // Creates the linked case record and returns to caselist
  req.session.data.case397 = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/case100310', function (req, res) {
  // Opens the linked case in 'return' stage (initial entry point)
  req.session.data.caseStageC3 = 'return';
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});

// --- Approval/rejection ---

makeApproveRoute('/app-approve2C3', {
  decisionKey:           'decision1C3',
  approvedKey:           'caseApprovedC3',
  agreementStageKey:     'agreementStageC3',
  reviewNoteKey:         'reviewNoteC3',
  filteredReviewNoteKey: 'filteredReviewNoteC3',
  stageKey:              'caseStageC3',
  statusKey:             'caseStatusC3',
  tagKey:                'caseStatusTagC3',
  onApproveRedirect:     '/tasklistStage2C3',
  amendRedirect:         '/FRPS-D2/case3/amend-confirm',
  returnRedirect:        '/FRPS-D2/case3/return-confirm',
  defaultRedirect:       '/FRPS-D2/case3/tasklist-stage',
});

// --- State resets ---

router.get('/resume2C3', function (req, res) {
  // Returns case3 to 'In review' after a pause or rejection reopen
  req.session.data.caseStageC3     = 'review';
  req.session.data.caseStatusC3    = 'In review';
  req.session.data.caseStatusTagC3 = 'govuk-tag govuk-tag--blue';
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});

router.get('/amendReturn1C3', function (req, res) {
  // Cancels amend/return flow and restores case3 to 'In review'
  req.session.data.caseStageC3     = 'review';
  req.session.data.caseStatusC3    = 'In review';
  req.session.data.caseStatusTagC3 = 'govuk-tag govuk-tag--blue';
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});

// --- Confirmation gates ---

router.get('/returnConf1C3', function (req, res) {
  // Proceeds with return if confirmed, otherwise cancels back to tasklist
  if (req.session.data.rConfC3 === 'yes') {
    res.redirect('/FRPS-D2/case3/tasklist-stage');
  } else {
    res.redirect('/amendReturn1C3');
  }
});

router.get('/terminateConf1C3', function (req, res) {
  // Finalises termination if confirmed, otherwise leaves case3 stage unchanged
  if (req.session.data.tConfC3 === 'yes') {
    req.session.data.caseStageC3     = 'terminate';
    req.session.data.caseStatusC3    = 'Terminated';
    req.session.data.caseStatusTagC3 = 'govuk-tag govuk-tag--red';
  }
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});

router.get('/amendConf1C3', function (req, res) {
  // Proceeds with amendment if confirmed, otherwise cancels back to tasklist
  if (req.session.data.aConfC3 === 'yes') {
    res.redirect('/FRPS-D2/case3/tasklist-stage');
  } else {
    res.redirect('/amendReturn1C3');
  }
});

// --- Amendment flow ---

makeAmendRoute('/amend1C3', {
  decisionKey: 'decisionAmC3',
  stageKey:    'caseStageC3',
  statusKey:   'caseStatusC3',
  tagKey:      'caseStatusTagC3',
  redirectTo:  '/FRPS-D2/case3/tasklist-stage',
});

router.get('/amend2C3', function (req, res) {
  // Closes case3 via amendment submission
  req.session.data.caseStageC3     = 'amendment_submitted';
  req.session.data.caseStatusC3    = 'Case close by amendment';
  req.session.data.caseStatusTagC3 = 'govuk-tag govuk-tag--orange';
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});

// --- Agreement sent ---

makeAgreementSentRoute('/aggSent2C3', {
  decisionKey:     'decisionAgC3',
  rawNoteKey:      'agreeNoteC3',
  filteredNoteKey: 'filteredAggNoteC3',
  stageKey:        'caseStageC3',
  statusKey:       'caseStatusC3',
  tagKey:          'caseStatusTagC3',
  onSentRedirect:  '/tasklistStage2C3',
  defaultRedirect: '/FRPS-D2/case3/tasklist-stage',
});

// --- Termination flow ---

router.get('/terminate1C3', function (req, res) {
  // Begins termination process for case3
  req.session.data.caseStageC3     = 'pending-termination';
  req.session.data.caseStatusC3    = 'Preparing to terminate';
  req.session.data.caseStatusTagC3 = 'govuk-tag govuk-tag--orange';
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});

router.get('/terminatePrepC3', function (req, res) {
  // Routes termination preparation outcome: confirm page, end process, or default
  const d = req.session.data;
  switch (d.decisionTrC3) {
  case 'Terminate agreement':
    d.filteredTrNoteC3 = stripEmptyAndNulls(d.terminateNoteC3);
    return res.redirect('/FRPS-D2/case3/terminate-confirm');
  case 'End termination process':
    d.caseStageC3     = 'pay';
    d.caseStatusC3    = 'Agreement accepted';
    d.caseStatusTagC3 = 'govuk-tag govuk-tag--green';
    return res.redirect('/FRPS-D2/case3/tasklist-stage');
  }
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});

// --- Termination task routes ---

const D2C3T = '/FRPS-D2/case3/tasklist-stage';

// Note: original task1TrT2C3 default branch used wrong keys (terminateTagC3/terminateStatusC3). Fixed to terminate1TagC3/terminate1StatusC3.
makeTaskRoute('/task1TrT2C3', {
  checkedKey:        'terminateCheckedC3',
  decisionKey:       'decisionTerminateTask1C3',
  noteActionKey:     'noteActionTerminateTask1C3',
  tagKey:            'terminate1TagC3',
  statusKey:         'terminate1StatusC3',
  rawNoteKey:        'task1TrNoteC3',
  filteredNoteKey:   'filteredNote1TrC3',
  rawNoteKey2:       'task1TrNote2C3',
  filteredNoteKey2:  'filteredNote1Tr_2C3',
  outcomes:          TERMINATE_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task2TrT2C3', {
  decisionKey:       'decisionTerminateTask2C3',
  noteActionKey:     'noteActionTerminateTask2C3',
  tagKey:            'terminate2TagC3',
  statusKey:         'terminate2StatusC3',
  rawNoteKey:        'task2TrNoteC3',
  filteredNoteKey:   'filteredNote2TrC3',
  rawNoteKey2:       'task2TrNote2C3',
  filteredNoteKey2:  'filteredNote2Tr_2C3',
  outcomes:          TERMINATE_OUTCOMES,
  redirectTo:        D2C3T,
});

// --- Task review routes ---

// Note: task5T2C3 and task6T2C3 use 'detailsChecked' (not detailsCheckedC3) — preserved from original.
makeTaskRoute('/task1T2C3', {
  checkedKey:        'detailsCheckedC3',
  decisionKey:       'decisionTask1C3',
  noteActionKey:     'noteActionTask1C3',
  tagKey:            'detailsTagC3',
  statusKey:         'detailsStatusC3',
  rawNoteKey:        'task1NoteC3',
  filteredNoteKey:   'filteredNote1C3',
  rawNoteKey2:       'task1Note2C3',
  filteredNoteKey2:  'filteredNote1_2C3',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task2T2C3', {
  checkedKey:        'detailsCheckedC3',
  decisionKey:       'decisionTask2C3',
  noteActionKey:     'noteActionTask2C3',
  tagKey:            'calcsTagC3',
  statusKey:         'calcsStatusC3',
  rawNoteKey:        'task2NoteC3',
  filteredNoteKey:   'filteredNote2C3',
  rawNoteKey2:       'task2Note2C3',
  filteredNoteKey2:  'filteredNote2_2C3',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task3T2C3', {
  checkedKey:        'detailsCheckedC3',
  decisionKey:       'decisionTask3C3',
  noteActionKey:     'noteActionTask3C3',
  tagKey:            'sssiTagC3',
  statusKey:         'sssiStatusC3',
  rawNoteKey:        'task3NoteC3',
  filteredNoteKey:   'filteredNote3C3',
  rawNoteKey2:       'task3Note2C3',
  filteredNoteKey2:  'filteredNote3_2C3',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task5T2C3', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask5C3',
  noteActionKey:     'noteActionTask5C3',
  tagKey:            'paymentTagC3',
  statusKey:         'paymentStatusC3',
  rawNoteKey:        'task5NoteC3',
  filteredNoteKey:   'filteredNote5C3',
  rawNoteKey2:       'task5Note2C3',
  filteredNoteKey2:  'filteredNote5_2C3',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task6T2C3', {
  checkedKey:        'detailsChecked',
  decisionKey:       'decisionTask6C3',
  noteActionKey:     'noteActionTask6C3',
  tagKey:            'budgetTagC3',
  statusKey:         'budgetStatusC3',
  rawNoteKey:        'task6NoteC3',
  filteredNoteKey:   'filteredNote6C3',
  rawNoteKey2:       'task6Note2C3',
  filteredNoteKey2:  'filteredNote6_2C3',
  outcomes:          REVIEW_OUTCOMES,
  redirectTo:        D2C3T,
});

// --- Case assignment ---

router.get('/caselistTeam2C3', function (req, res) {
  // Marks case3 as assigned and returns to caselist
  req.session.data.caseAssignedC3 = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/setUserFo2C3', function (req, res) {
  // Assigns finance officer role for case3
  req.session.data.financeOfficerC3 = 'yes';
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});

// --- Amendment task routes ---

makeTaskRoute('/task1T2AmC3', {
  decisionKey:       'decisionTaskAm1C3',
  noteActionKey:     'noteActionTaskAm1C3',
  tagKey:            'amend1TagC3',
  statusKey:         'amend1StatusC3',
  rawNoteKey:        'task1AmNoteC3',
  filteredNoteKey:   'filteredNoteAm1C3',
  rawNoteKey2:       'task1_2AmNoteC3',
  filteredNoteKey2:  'filteredNoteAm1_2C3',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task2T2AmC3', {
  decisionKey:       'decisionTaskAm2C3',
  noteActionKey:     'noteActionTaskAm2C3',
  tagKey:            'amend2TagC3',
  statusKey:         'amend2StatusC3',
  rawNoteKey:        'task2AmNoteC3',
  filteredNoteKey:   'filteredNoteAm2C3',
  rawNoteKey2:       'task2_2AmNoteC3',
  filteredNoteKey2:  'filteredNoteAm2_2C3',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task3T2AmC3', {
  decisionKey:       'decisionTaskAm3C3',
  noteActionKey:     'noteActionTaskAm3C3',
  tagKey:            'amend3TagC3',
  statusKey:         'amend3StatusC3',
  rawNoteKey:        'task3AmNoteC3',
  filteredNoteKey:   'filteredNoteAm3C3',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C3T,
});

// --- Agreement progression ---

router.get('/agreementStage2C3', function (req, res) {
  // Unlocks the agreement tab in the case3 navigation
  req.session.data.agreementStage = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

// --- Agreement task routes ---

makeTaskRoute('/task1AgT2C3', {
  checkedKey:        'AgreeCheckedC3',
  decisionKey:       'decisionAgreeTask1C3',
  noteActionKey:     'noteActionAgreeTask1C3',
  tagKey:            'agreeTagC3',
  statusKey:         'agreeStatusC3',
  rawNoteKey:        'task1ANoteC3',
  filteredNoteKey:   'filteredNote1AC3',
  rawNoteKey2:       'task1ANote2C3',
  filteredNoteKey2:  'filteredNote1A_2C3',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task2AgT2C3', {
  decisionKey:       'decisionAgreeTask2C3',
  noteActionKey:     'noteActionAgreeTask2C3',
  tagKey:            'agreeSTagC3',
  statusKey:         'agreeSStatusC3',
  rawNoteKey:        'task2ANoteC3',
  filteredNoteKey:   'filteredNoteA2C3',
  rawNoteKey2:       'task2ANote2C3',
  filteredNoteKey2:  'filteredNote2A_2C3',
  outcomes:          AGREEMENT_OUTCOMES,
  redirectTo:        D2C3T,
});

// --- Agreement signing ---

router.get('/setAgreeSign2C3', function (req, res) {
  // Records customer signature and advances case3 status
  req.session.data.caseStatusC3 = 'Agreement accepted';
  res.redirect('/tasklistStage2C3');
});

// --- Stage progression ---

router.get('/startC3', function (req, res) {
  // Resets case3 to the start stage (used when re-entering a completed case)
  req.session.data.caseStageC3     = 'start';
  req.session.data.caseStatusC3    = 'Application received';
  req.session.data.caseStatusTagC3 = 'govuk-tag govuk-tag--grey';
  req.session.data.stageCountC3    = 1;
  res.redirect('/FRPS-D2/caselist');
});

makeStageRoute('/tasklistStage2C3', {
  stageCountKey:    'stageCountC3',
  stageKey:         'caseStageC3',
  statusKey:        'caseStatusC3',
  tagKey:           'caseStatusTagC3',
  firstRedirect:    '/FRPS-D2/caselist',
  tasklistRedirect: '/FRPS-D2/case3/tasklist-stage',
});

// --- 5-month checks ---

router.get('/5month1C3', function (req, res) {
  // Transitions case3 into the 5-month check phase
  req.session.data.caseStatusC3 = '5 month checks';
  req.session.data.caseStageC3  = '5month';
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});

makeTaskRoute('/task5m1C3', {
  decisionKey:       'decisionTask1mC3',
  noteActionKey:     'noteActionTask1mC3',
  tagKey:            'month5_1TagC3',
  statusKey:         'month5_1StatusC3',
  rawNoteKey:        'task1mNoteC3',
  filteredNoteKey:   'filteredNote1mC3',
  rawNoteKey2:       'task1mNote2C3',
  filteredNoteKey2:  'filteredNote1m_2C3',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task5m2C3', {
  decisionKey:       'decisionTask2mC3',
  noteActionKey:     'noteActionTask2mC3',
  tagKey:            'month5_2TagC3',
  statusKey:         'month5_2StatusC3',
  rawNoteKey:        'task2mNoteC3',
  filteredNoteKey:   'filteredNote2mC3',
  rawNoteKey2:       'task2mNote2C3',
  filteredNoteKey2:  'filteredNote2m_2C3',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task5m3C3', {
  decisionKey:       'decisionTask3mC3',
  noteActionKey:     'noteActionTask3mC3',
  tagKey:            'month5_3TagC3',
  statusKey:         'month5_3StatusC3',
  rawNoteKey:        'task3mNoteC3',
  filteredNoteKey:   'filteredNote3mC3',
  rawNoteKey2:       'task3mNote2C3',
  filteredNoteKey2:  'filteredNote3m_2C3',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task5m4C3', {
  decisionKey:       'decisionTask4mC3',
  noteActionKey:     'noteActionTask4mC3',
  tagKey:            'month5_4TagC3',
  statusKey:         'month5_4StatusC3',
  rawNoteKey:        'task4mNoteC3',
  filteredNoteKey:   'filteredNote4mC3',
  rawNoteKey2:       'task4mNote2C3',
  filteredNoteKey2:  'filteredNote4m_2C3',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task5m5C3', {
  decisionKey:       'decisionTask5mC3',
  noteActionKey:     'noteActionTask5mC3',
  tagKey:            'month5_5TagC3',
  statusKey:         'month5_5StatusC3',
  rawNoteKey:        'task5mNoteC3',
  filteredNoteKey:   'filteredNote5mC3',
  rawNoteKey2:       'task5mNote2C3',
  filteredNoteKey2:  'filteredNote5m_2C3',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C3T,
});

makeTaskRoute('/task5m6C3', {
  decisionKey:       'decisionTask6mC3',
  noteActionKey:     'noteActionTask6mC3',
  tagKey:            'month5_6TagC3',
  statusKey:         'month5_6StatusC3',
  rawNoteKey:        'task6mNoteC3',
  filteredNoteKey:   'filteredNote6mC3',
  rawNoteKey2:       'task6mNote2C3',
  filteredNoteKey2:  'filteredNote6m_2C3',
  outcomes:          MONTH5_OUTCOMES,
  redirectTo:        D2C3T,
});

// --- FRPS-D2 user management: make Create user / team / role persist in-session ---
// Each form posts to its list page; we append the submitted item to a session
// array that the list template renders after the seeded rows, then redirect (GET).
function umArr (v) {
  return [].concat(v || []).filter(function (x) { return x && x !== '_unchecked' })
}

router.post('/FRPS-D2/UM2/users', function (req, res) {
  const d = req.session.data
  d.umUsers = d.umUsers || []
  d.umUsers.push({
    name:        req.body.name || 'New user',
    email:       req.body.email || '',
    teams:       umArr(req.body.teams),
    accessRole:  req.body.accessRole || 'Caseworker',
    mgrScope:    req.body.mgrScope || '',
    specialisms: umArr(req.body.specialisms),
    schemeRoles: umArr(req.body.createSchemeRoles)
  })
  res.redirect('/FRPS-D2/UM2/users')
})

router.post('/FRPS-D2/UM2/teams', function (req, res) {
  const d = req.session.data
  d.umTeams = d.umTeams || []
  d.umTeams.push({
    name:  req.body.name || 'New team',
    lead:  req.body.lead || '',
    scope: req.body.scope || ''
  })
  res.redirect('/FRPS-D2/UM2/teams')
})

router.post('/FRPS-D2/UM2/scheme-roles', function (req, res) {
  const d = req.session.data
  d.umRoles = d.umRoles || []
  d.umRoles.push({
    code:        req.body.code || 'NEW_ROLE',
    description: req.body.description || '',
    assignable:  req.body.assignable || 'Yes'
  })
  res.redirect('/FRPS-D2/UM2/scheme-roles')
})

// Change links on the user (martin) and team detail pages. Each saves the new
// value to session and returns to the detail page, which renders from session
// with a fallback to the seeded default.
router.post('/FRPS-D2/UM2/change-status', function (req, res) {
  req.session.data.rsStatus = req.body.rsStatus || 'Active'
  res.redirect('/FRPS-D2/UM2/martin')
})

router.post('/FRPS-D2/UM2/change-teams', function (req, res) {
  req.session.data.rsTeams = req.body.rsTeams || 'Team A'
  res.redirect('/FRPS-D2/UM2/martin')
})

router.post('/FRPS-D2/UM2/change-access-role', function (req, res) {
  req.session.data.rsRole = req.body.rsRole || 'Caseworker'
  req.session.data.rsScope = req.body.rsScope || ''
  res.redirect('/FRPS-D2/UM2/martin')
})

router.post('/FRPS-D2/UM2/change-specialisms', function (req, res) {
  const list = umArr(req.body.specialisms)
  req.session.data.rsSpecialisms = list.length ? list.join(', ') : '—'
  res.redirect('/FRPS-D2/UM2/martin')
})

router.post('/FRPS-D2/UM2/change-scheme-roles', function (req, res) {
  const list = umArr(req.body.rsSchemeRoles)
  req.session.data.rsSchemeRoles = list.length ? list.join(', ') : '—'
  // Persist the optional start/end date for each selected role.
  const dates = {}
  list.forEach(function (code) {
    dates[code] = { start: req.body['start-' + code] || '', end: req.body['end-' + code] || '' }
  })
  req.session.data.rsRoleDates = dates
  res.redirect('/FRPS-D2/UM2/martin')
})

// R Singh detail — precompute the scheme roles with their persisted dates so the
// page can list each role with its "from/to" without splitting strings in the view.
router.get('/FRPS-D2/UM2/martin', function (req, res) {
  const d = req.session.data || {}
  const codes = (d.rsSchemeRoles || 'PMF_READ, PMF_WRITE, BN_TAG_CHECKER').split(', ')
  const rd = d.rsRoleDates || {}
  const rsRoleList = codes.filter(function (c) { return c && c !== '—' }).map(function (c) {
    return { code: c, start: (rd[c] || {}).start || '', end: (rd[c] || {}).end || '' }
  })
  res.render('FRPS-D2/UM2/martin', { rsRoleList: rsRoleList })
})

// Created-user detail — a real per-user page (created users no longer link to the
// R Singh reference page). Reads the chosen user out of the session by index.
router.get('/FRPS-D2/UM2/user', function (req, res) {
  const users = (req.session.data && req.session.data.umUsers) || []
  const u = users[parseInt(req.query.i, 10)]
  if (!u) return res.redirect('/FRPS-D2/UM2/users')
  res.render('FRPS-D2/UM2/user', { u: u })
})

router.post('/FRPS-D2/UM2/change-lead', function (req, res) {
  req.session.data.taLead = req.body.taLead || 'M Walker'
  res.redirect('/FRPS-D2/UM2/team')
})

router.post('/FRPS-D2/UM2/change-scheme-scope', function (req, res) {
  req.session.data.taScope = req.body.taScope || 'SFI'
  res.redirect('/FRPS-D2/UM2/team')
})

// Team membership actions. Added members start with no open cases, so they can
// be removed directly; seeded members have open cases and show a reassign note
// instead of a Remove button. Delete is only offered when no members/cases remain.
router.post('/FRPS-D2/UM2/add-member', function (req, res) {
  const d = req.session.data
  d.taMembers = d.taMembers || []
  if (req.body.member) d.taMembers.push({ name: req.body.member })
  res.redirect('/FRPS-D2/UM2/team')
})

router.post('/FRPS-D2/UM2/remove-member', function (req, res) {
  const d = req.session.data
  const i = parseInt(req.body.index, 10)
  if (d.taMembers && i >= 0 && i < d.taMembers.length) d.taMembers.splice(i, 1)
  res.redirect('/FRPS-D2/UM2/team')
})

router.post('/FRPS-D2/UM2/delete-team', function (req, res) {
  // Only reachable when the team has no members and no open cases.
  res.redirect('/FRPS-D2/UM2/teams')
})

// --- Utility routes ---

router.get('/caselistResults1', function (req, res) {
  // Marks linked case results as visible and returns to caselist
  req.session.data.linkedCase  = 'yes';
  req.session.data.caseResults = 'yes';
  res.redirect('/FRPS-D2/caselist');
});

router.get('/endTerminateC3', function (req, res) {
  // Ends termination process and restores case3 to 'Agreement accepted' if confirmed
  if (req.session.data.terminateDecision === 'yes') {
    req.session.data.caseStageC3     = 'pay';
    req.session.data.caseStatusC3    = 'Agreement accepted';
    req.session.data.caseStatusTagC3 = 'govuk-tag govuk-tag--green';
  }
  res.redirect('/FRPS-D2/case3/tasklist-stage');
});
