# Grasslands caselist — edit the data in Excel

The Grasslands caselist is driven by `app/data/grasslands-cases.js`. These tools
let you edit that data in a spreadsheet and load it back in.

- **`app/data/grasslands-cases.xlsx`** — the editable spreadsheet (the data driving the caselist).
- **`build-xlsx.py`** — regenerate the spreadsheet from the `.js` (export).
- **`import-xlsx.py`** — write the `.js` from the spreadsheet (re-upload).

## Edit-and-reupload workflow

1. Open `app/data/grasslands-cases.xlsx` and edit the **Cases** sheet.
   - One row per case. Columns: `id, business, sbi, submitted, status, tag, team, assignee`.
   - `status`, `tag` and `team` have dropdowns. The **Reference** sheet lists the
     valid `status → tag` pairs — keep them in step.
   - `sbi` keeps leading zeros (the column is stored as text — don't reformat it as a number).
   - For an unassigned case, leave `team` blank and set `assignee` to `Not assigned`.
   - Add a row to add a case; delete a row to remove one.
2. Save and close the spreadsheet.
3. Re-upload it into the prototype:
   ```
   cd app
   python tools/grasslands-caselist/import-xlsx.py
   ```
4. Refresh the caselist — the routes reload `grasslands-cases.js` per request, so
   changes show immediately (no restart needed).

To go the other way (someone edited the `.js` and you want a fresh spreadsheet):
```
cd app
python tools/grasslands-caselist/build-xlsx.py
```

## Notes

- Requires Python with `openpyxl` (`pip install openpyxl`); `build-xlsx.py` also needs `node`.
- Don't rename or reorder the columns on the **Cases** sheet — `import-xlsx.py`
  reads them by header name.
- The round-trip is lossless: exporting then importing leaves `grasslands-cases.js`
  byte-for-byte unchanged.
