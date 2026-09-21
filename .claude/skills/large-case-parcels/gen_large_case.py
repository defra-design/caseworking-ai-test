"""Generate the shared parcel data for the "Large case MVP Grasslands" screens.

Writes app/views/GrassMVP/includes/_large-case-data.html — a Nunjucks file that
application-large.html and calculations-large.html both import, so the
Application and Calculations tabs always agree (areas, quantities, payments).

Usage (from the repo root, ai-driven-main):
    python .claude/skills/large-case-parcels/gen_large_case.py
    python .claude/skills/large-case-parcels/gen_large_case.py --parcels 60 --min-actions 3 --max-actions 5 --seed 7

Defaults (40 parcels, 4-5 actions, seed 26) reproduce the committed file exactly.
"""
import argparse
import json
import os
import random
import sys
from decimal import Decimal as D, ROUND_HALF_UP

# ---- Grasslands actions (no moorland: CMOR1 / UPL* never apply to Grasslands) ----
NAMES = {
    "CLIG3": "Manage grassland with very low nutrient inputs",
    "CNUM2": "Legumes on improved grassland",
    "CSAM3": "Herbal leys",
    "HEF1": "Maintain weatherproof traditional farm or forestry buildings",
    "SCR2": "Manage scrub and open habitat mosaics",
    "WBD1": "Manage ponds",
}
RATE = {"CLIG3": 151, "CNUM2": 102, "CSAM3": 224, "HEF1": 5, "SCR2": 350, "WBD1": 257}
UNIT = {"HEF1": ("sqm", "Quantity (sqm)"), "WBD1": ("pond", "Quantity (ponds)")}
AREA_CODES = ["CLIG3", "CNUM2", "CSAM3", "SCR2"]
# SSSI "Task" checks are raised for these area actions when the parcel is in an SSSI.
SSSI_CODES = ("CLIG3", "CNUM2")

# The 15 land parcel IDs of the real Grasslands / Golden Grange case; extra IDs are
# invented in the same format and OS grid areas.
REAL = ["SD5848 9205", "SD5649 9215", "SD6165 9218", "SD5763 9223", "SD7560 9193", "NY2105 1006",
        "NY2119 1042", "NY1118 1031", "NY1914 1032", "NU0021 1026", "NT9009 1023", "NT8726 1015",
        "NT9326 1045", "NU0403 1024", "NU0704 1008"]
GRID = {"SD": (5500, 7700, 9150, 9260), "NY": (1000, 2300, 1000, 1050),
        "NT": (8600, 9400, 1010, 1050), "NU": (0, 800, 1000, 1030)}
BUILD = ["stone threshing barn", "stone cart shed", "stone field barn", "stone bank barn",
         "timber granary", "stone byre", "brick hay barn", "stone shelter shed"]

# The one deliberate fail: land data updated after submission (grassland 6.2150 -> 5.4200 ha),
# so its CSAM3 (5.6000 ha) available-area check fails and its area figures show as changed.
FAIL_ID = "NY1118 1031"
FAIL_PARCEL = (FAIL_ID, "6.2150", "5.4200", "0.0240", 0, 0,
               [("CSAM3", "5.6000"), ("SCR2", "0.4000"), ("HEF1", "160"), ("WBD1", "2")],
               "1 stone byre, 160 sqm", ["0.0130", "0.0110"])


def q4(x):
    return "%.4f" % x


def money(x):
    return "£{:,.2f}".format(x.quantize(D("0.01"), ROUND_HALF_UP))


def pick_actions(k):
    """Choose k distinct actions (k <= 6): a set of area actions plus HEF1 / WBD1."""
    if k == 5:
        # all four area actions + one of HEF1/WBD1, or three area + both
        area = AREA_CODES[:] if random.random() < 0.5 else random.sample(AREA_CODES, 3)
    elif k == 4:
        area = random.sample(AREA_CODES, random.choice([2, 3]))
    else:
        n_area = random.choice([n for n in range(0, 5) if 0 <= k - n <= 2])
        area = random.sample(AREA_CODES, n_area)
    extra = k - len(area)
    other = ["HEF1", "WBD1"] if extra == 2 else ([random.choice(["HEF1", "WBD1"])] if extra == 1 else [])
    return [c for c in AREA_CODES if c in area], other


def build_parcels(count, kmin, kmax):
    ids = REAL[:count]
    while len(ids) < count:
        pre = random.choice(list(GRID))
        g = GRID[pre]
        i = "%s%04d %04d" % (pre, random.randint(g[0], g[1]), random.randint(g[2], g[3]))
        if i not in ids:
            ids.append(i)
    rows = []
    for pid in ids:
        if pid == FAIL_ID:
            rows.append(FAIL_PARCEL)
            continue
        g = round(random.uniform(8, 32), 4)
        k = random.choice(range(kmin, kmax + 1))
        area, other = pick_actions(k)
        # Split ~60-85% of the grassland across the area actions, so they always fit.
        w = [random.uniform(0.5, 1.5) for _ in area]
        tot = g * random.uniform(0.6, 0.85)
        acts = [(c, q4(round(tot * wi / sum(w), 1))) for c, wi in zip(area, w)]
        bld = pond = ponds = None
        if "HEF1" in other:
            sq = random.choice(range(120, 420, 10))
            acts.append(("HEF1", str(sq)))
            bld = "1 %s, %d sqm" % (random.choice(BUILD), sq)
        if "WBD1" in other:
            n = random.randint(1, 4)
            ponds = [q4(random.uniform(0.008, 0.022)) for _ in range(n)]
            pond = q4(sum(float(x) for x in ponds) + 0.002)
            acts.append(("WBD1", str(n)))
        sssi = random.choice([0, 0, 0, random.randint(3, 25)])
        hist = random.choice([0, 0, random.randint(2, 8)])
        rows.append((pid, q4(g), None, pond, sssi, hist, acts, bld, ponds))
    return rows


def to_data(rows):
    parcels, total = [], D(0)
    for pid, g, gnow, pond, sssi, hist, acts, bld, ponds in rows:
        area = D(g) + (D(pond) if pond else 0)
        covers = [{"name": "Permanent grassland", "code": "130", "ha": g, "haNow": gnow or g}]
        if pond:
            covers.append({"name": "Pond", "code": "243", "ha": pond, "haNow": pond})
        alist = []
        for code, q in acts:
            r = RATE[code]
            y = D(q) * r
            total += y
            if code in UNIT:
                u, lab = UNIT[code]
                n = int(q)
                qty = f"{n} {u}" if u == "sqm" else f"{n} pond{'s' if n != 1 else ''}"
                a = {"code": code, "name": NAMES[code], "type": "buildings" if code == "HEF1" else "ponds",
                     "available": False, "qtyLabel": lab, "qty": qty, "rate": f"£{r}.00 per {u}",
                     "yearly": money(y), "calc": f"{qty} x £{r} per {u}"}
            else:
                now = gnow or g
                fail = D(q) > D(now)
                if fail:
                    reason = (f"The total available area ({now} ha) is less than the area applied for ({q} ha). "
                              "This can happen when land parcel data is updated after an application has been submitted.")
                elif code == "CLIG3" and D(q) == D(now):
                    reason = f"The area applied for ({q} ha) matches the total available area ({now} ha)."
                else:
                    reason = f"The applied figure ({q} ha) is within the allowed range (greater than 0 ha and up to {now} ha)."
                a = {"code": code, "name": NAMES[code], "type": "area", "available": g + " ha",
                     "availableNow": now + " ha", "changed": gnow is not None, "fail": fail, "reason": reason,
                     "qtyLabel": "Quantity (ha)", "qty": q + " ha", "rate": f"£{r}.00 per ha",
                     "yearly": money(y), "calc": f"{q} ha x £{r} per ha",
                     "sssiCheck": bool(sssi) and code in SSSI_CODES}
            alist.append(a)
        p = {"id": pid, "area": f"{area:.4f}", "sssi": sssi, "historic": hist, "covers": covers, "actions": alist}
        if bld:
            p["building"] = bld
        if ponds:
            p["ponds"] = ponds
            p["pondsPerHa"] = f"{(D(len(ponds)) / area).quantize(D('0.01'), ROUND_HALF_UP)}"
        parcels.append(p)
    return {"parcels": parcels, "yearly": money(total), "agreement": money(total * 3)}


def header(count, kmin, kmax):
    real = min(count, len(REAL))
    ids = (f"the first {real} IDs are the real Grasslands /\n   Golden Grange case's; the other {count - real} are invented in the same format"
           if count > real else "IDs from the real Grasslands / Golden Grange case")
    acts = f"{kmin}-{kmax} actions each" if kmin != kmax else f"{kmin} actions each"
    return f'''{{# Shared data for the "Large case MVP Grasslands" variant — imported by
   application-large.html and calculations-large.html so the two stay in step:
     {{% import "GrassMVP/includes/_large-case-data.html" as lc %}}
   {count} land parcels, {acts} ({ids}),
   Grasslands actions only (no moorland). Figures are invented. Area actions:
   available = total available area at submission (shown on the application);
   availableNow = the figure used in the latest rules run (differs only where
   `changed` is true — NY1118 1031, whose land data was updated after
   submission, so its CSAM3 area check fails). Yearly = quantity x rate.
   Generated by .claude/skills/large-case-parcels/gen_large_case.py — edit and
   re-run that rather than hand-editing, so the payment totals stay correct. #}}
'''


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--parcels", type=int, default=40)
    ap.add_argument("--min-actions", type=int, default=4)
    ap.add_argument("--max-actions", type=int, default=5)
    ap.add_argument("--seed", type=int, default=26)
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--out", default=os.path.normpath(os.path.join(
        here, "..", "..", "..", "app", "views", "GrassMVP", "includes", "_large-case-data.html")))
    args = ap.parse_args()
    if not (1 <= args.min_actions <= args.max_actions <= 6):
        ap.error("need 1 <= --min-actions <= --max-actions <= 6 (there are 6 Grasslands actions)")
    if args.parcels < 1:
        ap.error("--parcels must be at least 1")

    random.seed(args.seed)
    data = to_data(build_parcels(args.parcels, args.min_actions, args.max_actions))
    body = json.dumps(data, indent=2, ensure_ascii=False)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(header(args.parcels, args.min_actions, args.max_actions)
                + "{% set data_ = " + body + " %}\n{% set parcels = data_.parcels %}\n"
                "{% set totalYearly = data_.yearly %}\n{% set totalAgreement = data_.agreement %}\n")

    sys.stdout.reconfigure(encoding="utf-8")
    n_actions = sum(len(p["actions"]) for p in data["parcels"])
    manual = sum(1 for p in data["parcels"] for a in p["actions"]
                 if a["type"] != "area" or a.get("sssiCheck"))
    print(f"Wrote {args.out}")
    print(f"{len(data['parcels'])} parcels, {n_actions} actions, {manual} manual (Task) checks")
    print(f"Total yearly payment {data['yearly']}, agreement {data['agreement']} over 3 years")


if __name__ == "__main__":
    main()
