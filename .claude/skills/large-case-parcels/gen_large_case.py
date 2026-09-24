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

# Fails are applied after the parcels are built (see apply_fails): N parcels have
# their permanent grassland reduced to just under their largest area action, so
# exactly one available-area check fails on each and its figures show as changed.
FAIL_DROP = D("0.1500")


def q4(x):
    return "%.4f" % x


def money(x):
    return "£{:,.2f}".format(x.quantize(D("0.01"), ROUND_HALF_UP))


def pick_actions(k, want_ponds):
    """Choose k distinct actions (k <= 6): area actions plus HEF1 / WBD1.

    want_ponds forces WBD1 in or out, so a case can have a set number of
    pond parcels (--ponds); the rest of the slots are filled with area actions
    and, where they won't fit, HEF1.
    """
    other = ["WBD1"] if want_ponds else []
    if k - len(other) > len(AREA_CODES):          # more slots than area actions
        other.append("HEF1")
    elif k - len(other) == len(AREA_CODES) and random.random() < 0.4:
        other.append("HEF1")
    elif not want_ponds and random.random() < 0.5:
        other.append("HEF1")
    n_area = k - len(other)
    if n_area < 0 or n_area > len(AREA_CODES):
        raise SystemExit(f"cannot make {k} actions with {other}")
    area = random.sample(AREA_CODES, n_area)
    return [c for c in AREA_CODES if c in area], other


def build_parcels(count, kmin, kmax, n_ponds=None, n_sssi=None):
    ids = REAL[:count]
    while len(ids) < count:
        pre = random.choice(list(GRID))
        g = GRID[pre]
        i = "%s%04d %04d" % (pre, random.randint(g[0], g[1]), random.randint(g[2], g[3]))
        if i not in ids:
            ids.append(i)
    # Which parcels claim ponds: an even spread of n_ponds of them, or ~half when
    # no quota is given.
    if n_ponds is None:
        pond_ix = {i for i in range(count) if random.random() < 0.5}
    else:
        if n_ponds > count:
            raise SystemExit(f"--ponds {n_ponds} is more than the {count} parcels")
        step = count / n_ponds if n_ponds else 0
        pond_ix = {int(i * step) for i in range(n_ponds)}
    # Which parcels sit in an SSSI: an even spread of n_sssi of them (offset from the
    # pond parcels so the two don't always coincide), or about a quarter by default.
    if n_sssi is None:
        sssi_ix = {i for i in range(count) if random.random() < 0.25}
    else:
        if n_sssi > count:
            raise SystemExit(f"--sssi {n_sssi} is more than the {count} parcels")
        step = count / n_sssi if n_sssi else 0
        sssi_ix = {min(count - 1, int(i * step) + 1) for i in range(n_sssi)}
    rows = []
    for n, pid in enumerate(ids):
        g = round(random.uniform(8, 32), 4)
        k = random.choice(range(kmin, kmax + 1))
        area, other = pick_actions(k, n in pond_ix)
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
        sssi = random.randint(3, 25) if n in sssi_ix else 0
        hist = random.choice([0, 0, random.randint(2, 8)])
        rows.append((pid, q4(g), None, pond, sssi, hist, acts, bld, ponds))
    return rows


def apply_fails(rows, n):
    """Reduce the grassland on n parcels so exactly one area check on each fails in the latest run.

    The new figure sits between the parcel's largest area action (which then fails)
    and its next largest (which still passes), so only one check goes red.
    """
    def new_grass(r):
        qs = sorted((D(q) for c, q in r[6] if c in AREA_CODES), reverse=True)
        if not qs:
            return None
        second = qs[1] if len(qs) > 1 else D(0)
        if qs[0] - second < D("0.0002"):
            return None                       # can't fail one without failing the next
        return max(second + (qs[0] - second) / 2, qs[0] - FAIL_DROP).quantize(D("0.0001"))

    eligible = [(i, g) for i, r in enumerate(rows) for g in [new_grass(r)] if g is not None]
    if n > len(eligible):
        raise SystemExit(f"--fails {n} is more than the {len(eligible)} parcels that can fail exactly one check")
    step = len(eligible) / n if n else 0
    failed = []
    for j in range(n):
        i, g = eligible[int(j * step)]
        r = list(rows[i])
        r[2] = str(g)                          # grassland as at the latest run
        rows[i] = tuple(r)
        failed.append(r[0])
    return failed


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
                # The first run used the figures as at submission, so every area check passed.
                if code == "CLIG3" and D(q) == D(g):
                    reason1 = f"The area applied for ({q} ha) matches the total available area ({g} ha)."
                else:
                    reason1 = f"The applied figure ({q} ha) is within the allowed range (greater than 0 ha and up to {g} ha)."
                a = {"code": code, "name": NAMES[code], "type": "area", "available": g + " ha",
                     "reasonOriginal": reason1,
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


def header(count, kmin, kmax, label, out, failed):
    real = min(count, len(REAL))
    ids = (f"the first {real} IDs are the real Grasslands /\n   Golden Grange case's; "
           f"the other {count - real} are invented in the same format"
           if count > real else "IDs from the real Grasslands / Golden Grange case")
    acts = f"{kmin}-{kmax} actions each" if kmin != kmax else f"{kmin} actions each"
    if failed:
        which = ", ".join(failed)
        fail = (f"""
   `changed` is true — {which}, whose land data was
   updated after submission, so one area check on each of them fails)""")
    else:
        fail = """
   `changed` is true — none in this set)"""
    base = os.path.basename(out)
    stem = base[1:-5] if base.startswith("_") else base
    pages = stem.rsplit("-data", 1)[0].replace("-case", "") or "large"
    return f'''{{# Shared data for the "{label}" variant — imported by
   application-{pages}.html and calculations-{pages}.html so the two stay in step:
     {{% import "GrassMVP/includes/{base}" as lc %}}
   {count} land parcels, {acts} ({ids}),
   Grasslands actions only (no moorland). Figures are invented. Area actions:
   available = total available area at submission (shown on the application);
   availableNow = the figure used in the latest rules run (differs only where{fail}. Yearly = quantity x rate.
   Generated by .claude/skills/large-case-parcels/gen_large_case.py — edit and
   re-run that rather than hand-editing, so the payment totals stay correct. #}}
'''


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--parcels", type=int, default=40)
    ap.add_argument("--min-actions", type=int, default=4)
    ap.add_argument("--max-actions", type=int, default=5)
    ap.add_argument("--seed", type=int, default=26)
    ap.add_argument("--ponds", type=int, default=None,
                    help="How many parcels claim ponds (WBD1). Default: about half")
    ap.add_argument("--sssi", type=int, default=None,
                    help="How many parcels sit in an SSSI. Default: about a quarter")
    ap.add_argument("--fails", type=int, default=1,
                    help="How many available-area checks fail in the latest run (one per parcel)")
    ap.add_argument("--label", default="Large case MVP Grasslands",
                    help="Variant name used in the generated file's header comment")
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--out", default=os.path.normpath(os.path.join(
        here, "..", "..", "..", "app", "views", "GrassMVP", "includes", "_large-case-data.html")))
    args = ap.parse_args()
    if not (1 <= args.min_actions <= args.max_actions <= 6):
        ap.error("need 1 <= --min-actions <= --max-actions <= 6 (there are 6 Grasslands actions)")
    if args.parcels < 1:
        ap.error("--parcels must be at least 1")

    random.seed(args.seed)
    rows = build_parcels(args.parcels, args.min_actions, args.max_actions, args.ponds, args.sssi)
    failed = apply_fails(rows, args.fails)
    data = to_data(rows)
    body = json.dumps(data, indent=2, ensure_ascii=False)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(header(args.parcels, args.min_actions, args.max_actions, args.label, args.out, failed)
                + "{% set data_ = " + body + " %}\n{% set parcels = data_.parcels %}\n"
                "{% set totalYearly = data_.yearly %}\n{% set totalAgreement = data_.agreement %}\n")

    sys.stdout.reconfigure(encoding="utf-8")
    n_actions = sum(len(p["actions"]) for p in data["parcels"])
    manual = sum(1 for p in data["parcels"] for a in p["actions"]
                 if a["type"] != "area" or a.get("sssiCheck"))
    print(f"Wrote {args.out}")
    print(f"{len(data['parcels'])} parcels, {n_actions} actions, {manual} manual (Task) checks")
    ponds = sum(1 for p in data["parcels"] if "ponds" in p)
    builds = sum(1 for p in data["parcels"] if "building" in p)
    sssi = sum(1 for p in data["parcels"] if any(a.get("sssiCheck") for a in p["actions"]))
    print(f"{ponds} parcels with ponds, {builds} with buildings, {sssi} with an SSSI check")
    print(f"{len(failed)} failed available-area check(s): {', '.join(failed) or 'none'}")
    print(f"Total yearly payment {data['yearly']}, agreement {data['agreement']} over 3 years")


if __name__ == "__main__":
    main()
