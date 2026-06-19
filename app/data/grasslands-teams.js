// Data reference file for the Grasslands caselist team split.
// Three teams, three caseworkers each (distinct names). Used to:
//  - split All cases as equally as possible into teams, balanced by age
//    (see the round-robin reshape that stamps a `team` on each case), and
//  - drive the Team tab label, the "Switch team" dropdown, and team filtering.
// M Walker is the current prototype user ("My cases") and sits in Team A,
// so My cases is a subset of Team A.
const teams = [
  { id: 'A', name: 'Team A', caseworkers: ['M Walker', 'R Singh', 'T Okafor'] },
  { id: 'B', name: 'Team B', caseworkers: ['E Carter', 'J Jones', 'P Shah'] },
  { id: 'C', name: 'Team C', caseworkers: ['A Jones', 'L Owusu', 'K Reed'] }
]

const nameById = {}
teams.forEach(function (t) { nameById[t.id] = t.name })

module.exports = { teams: teams, nameById: nameById }
