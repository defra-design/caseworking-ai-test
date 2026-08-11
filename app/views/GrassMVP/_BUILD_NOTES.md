# GrassMVP prototype area

A full, independent clone of `views/Grasslands/` (folder, caselist, nav,
context strip, case journey) created as the starting point for the Grasslands
MVP. All session keys / route fragments use an `MVP` scope suffix (e.g.
`caseStageMVP`, `mvpCalcVariant`, `/tasklistStageMVP`, `/GrassMVP/caseMVP/`) so
it is completely isolated from the original Grasslands case.

Data: `data/grassmvp-cases.js` + `data/grassmvp-teams.js`.
Routes: the "GrassMVP grant type" block at the end of `app/routes.js`.
Entry: `/grassmvpApplication` (launcher) — also reached from the second link in
the Grasslands "My cases" caselist (Thornton Holdings, 100315).
