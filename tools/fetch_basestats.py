#!/usr/bin/env python3
"""Fetch accurate base stats + abilities from the Crystal Inheritance / Polished
Crystal source disassembly (data/pokemon/base_stats/*.asm) and merge into pokedex.json.
The romhack rebalances stats, so these source values are authoritative (PokeAPI is not).
GSC stat byte order is: hp, atk, def, SPEED, sp.atk, sp.def."""
import json, os, re, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "site", "data")
CACHE = os.path.join(os.path.dirname(__file__), ".cache_bs")
os.makedirs(CACHE, exist_ok=True)
RAW = "https://raw.githubusercontent.com/dwg-and-dogs/PLC_Polished/main/data/pokemon/base_stats/"

def fetch(fname):
    cf = os.path.join(CACHE, fname)
    if os.path.exists(cf):
        return open(cf, encoding="utf-8").read()
    try:
        req = urllib.request.Request(RAW + fname, headers={"User-Agent": "CI-docs/1.0"})
        for _ in range(4):
            try:
                txt = urllib.request.urlopen(req, timeout=45).read().decode("utf-8")
                open(cf, "w", encoding="utf-8").write(txt)
                return txt
            except urllib.error.HTTPError as e:
                if e.code == 404: return None
                raise
            except Exception:
                continue
    except Exception:
        return None
    return None

def pretty(tok):
    specials = {"SOFTBOILED": "Soft-Boiled"}
    if tok in specials: return specials[tok]
    return " ".join(w.capitalize() for w in tok.split("_"))

STAT_RE = re.compile(r"^\s*db\s+(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\b")
ABIL_RE = re.compile(r"abilities_for\s+\w+\s*,\s*([A-Z0-9_]+)\s*,\s*([A-Z0-9_]+)\s*,\s*([A-Z0-9_]+)")

def to_stats(v):
    hp, atk, df, spe, spa, spd = v
    return {"hp": hp, "atk": atk, "def": df, "spa": spa, "spd": spd, "spe": spe,
            "bst": hp + atk + df + spe + spa + spd}

def abilities(m):
    reg = []
    for a in [m[0], m[1]]:
        if a != "NO_ABILITY" and pretty(a) not in reg:
            reg.append(pretty(a))
    ha = pretty(m[2]) if m[2] != "NO_ABILITY" else None
    return {"regular": reg, "hidden": ha}

def parse(txt):
    # stat lines: may be wrapped in `if DEF(FAITHFUL) ... else ... endc` (two lines)
    stats = [STAT_RE.match(l) for l in txt.splitlines()]
    stat_lines = [tuple(int(x) for x in m.groups()) for m in stats if m]
    abil = ABIL_RE.findall(txt)
    out = {}
    if stat_lines:
        # if two, the second (else / non-faithful) is the default experience
        out["baseStats"] = to_stats(stat_lines[-1])
        if len(stat_lines) > 1 and stat_lines[0] != stat_lines[-1]:
            out["baseStatsFaithful"] = to_stats(stat_lines[0])
    if abil:
        out["abilities"] = abilities(abil[-1])
        if len(abil) > 1 and abil[0] != abil[-1]:
            out["abilitiesFaithful"] = abilities(abil[0])
    # types from source (the hack's REAL typing). Handle faithful conditional:
    # take the last `db T1,T2 ; type` (the non-faithful / else branch) as default.
    tmatches = TYPE_RE.findall(txt)
    if tmatches:
        out["types"] = map_types(tmatches[-1])
        if len(tmatches) > 1 and tmatches[0] != tmatches[-1]:
            out["typesFaithful"] = map_types(tmatches[0])
    out["bio"] = parse_bio(txt)
    return out

TYPE_RE = re.compile(r"^\s*db\s+([A-Z_]+),\s*([A-Z_]+)\s*;\s*type", re.M)
TYPE_CLASSES = {"normal","fire","water","electric","grass","ice","fighting","poison","ground",
                "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy"}
UNMAPPED = set()
def map_type(t):
    t = t.lower().replace("_type", "")
    if t not in TYPE_CLASSES:
        UNMAPPED.add(t)
    return t
def map_types(pair):
    t1, t2 = pair
    out = [map_type(t1)]
    if t2 != t1:
        out.append(map_type(t2))
    return out

EGG = {"EGG_MONSTER":"Monster","EGG_WATER_1":"Water 1","EGG_BUG":"Bug","EGG_FLYING":"Flying",
       "EGG_GROUND":"Field","EGG_FAIRY":"Fairy","EGG_PLANT":"Grass","EGG_HUMANSHAPE":"Human-Like",
       "EGG_WATER_3":"Water 3","EGG_MINERAL":"Mineral","EGG_INDETERMINATE":"Amorphous",
       "EGG_WATER_2":"Water 2","EGG_DITTO":"Ditto","EGG_DRAGON":"Dragon","EGG_NONE":"Undiscovered"}
GENDER = {"GENDER_F0":"100% ♂","GENDER_F12_5":"87.5% ♂","GENDER_F25":"75% ♂","GENDER_F50":"50 / 50",
          "GENDER_F75":"25% ♂","GENDER_F100":"100% ♀","GENDER_UNKNOWN":"Genderless"}
EV_LABELS = ["HP","Atk","Def","Spe","SpA","SpD"]

def parse_bio(txt):
    bio = {}
    cr = re.search(r"^\s*db\s+(\d+)\s*;\s*catch rate", txt, re.M)
    if cr: bio["catchRate"] = int(cr.group(1))
    be = re.search(r"^\s*db\s+(\d+)\s*;\s*base exp", txt, re.M)
    if be: bio["baseExp"] = int(be.group(1))
    gr = re.search(r"dn\s+(GENDER_\w+),", txt)
    if gr: bio["gender"] = GENDER.get(gr.group(1), gr.group(1))
    eg = re.search(r"dn\s+(EGG_\w+),\s*(EGG_\w+)\s*;\s*egg groups", txt)
    if eg:
        g = [EGG.get(eg.group(1), eg.group(1))]
        if eg.group(2) != eg.group(1): g.append(EGG.get(eg.group(2), eg.group(2)))
        bio["eggGroups"] = g
    gw = re.search(r"db\s+GROWTH_(\w+)\s*;\s*growth", txt)
    if gw: bio["growth"] = " ".join(w.capitalize() for w in gw.group(1).split("_"))
    ev = re.search(r"ev_yield\s+([\d,\s]+)", txt)
    if ev:
        vals = [int(x) for x in ev.group(1).split(",")]
        if len(vals) == 6:
            bio["evYield"] = ", ".join(f"{v} {EV_LABELS[i]}" for i, v in enumerate(vals) if v)
    return bio

def work(mon):
    txt = fetch(mon["key"].lower() + ".asm")
    return mon["key"], (parse(txt) if txt else None)

def main():
    dex = json.load(open(os.path.join(OUT, "pokedex.json")))
    res = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        for k, v in ex.map(work, dex):
            res[k] = v
    miss = []
    for mon in dex:
        v = res.get(mon["key"])
        mon.pop("srcTypes", None)  # drop stale field from earlier run
        if v:
            if v.get("types"):
                mon["officialTypes"] = mon.get("types")  # keep PokeAPI types for reference
            mon.update(v)
        elif "baseStats" not in mon:
            miss.append(mon["key"])
    # keep dex sorted as before
    dex.sort(key=lambda m: m.get("sortKey", m.get("nationalNo", 9999)))
    json.dump(dex, open(os.path.join(OUT, "pokedex.json"), "w"), ensure_ascii=False, indent=1)

    # sync accurate types into the sprite index (used by other views' lookups)
    idxp = os.path.join(OUT, "sprite_index.json")
    idx = json.load(open(idxp))
    by_key = {m["key"]: m for m in dex}
    for alias, rec in idx.items():
        m = by_key.get(rec.get("key"))
        if m and m.get("types"):
            rec["types"] = m["types"]
    json.dump(idx, open(idxp, "w"), ensure_ascii=False, indent=1)

    have = sum(1 for m in dex if m.get("baseStats"))
    typed = sum(1 for m in dex if m.get("types"))
    print(f"base stats merged: {have}/{len(dex)} | types from source: {typed}")
    print(f"missing: {miss}")
    print(f"UNMAPPED type constants: {sorted(UNMAPPED) or 'none'}")
    print(f"type changes vs official (faithful-doc mons + others):")
    for nm in ("Luxray", "Sunflora", "Ninetales", "Octillery", "Mismagius", "Girafarig", "Electivire", "Yanmega"):
        m = next((x for x in dex if x["key"] == nm), None)
        if m: print(f"  {nm}: official {m.get('officialTypes')} -> source {m.get('types')} | faithful {m.get('typesFaithful','—')}")
    c = next((x for x in dex if x["key"] == "Cyndaquil"), None)
    print(f"  Cyndaquil bio: {c.get('bio')}")

if __name__ == "__main__":
    main()
