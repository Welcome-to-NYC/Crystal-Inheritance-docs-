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
    # type from source (the hack's real typing) — keep as extra, do not override PokeAPI display
    tm = re.search(r"^\s*db\s+([A-Z_]+),\s*([A-Z_]+)\s*;\s*type", txt, re.M)
    if tm:
        t = [tm.group(1)]
        if tm.group(2) != tm.group(1): t.append(tm.group(2))
        out["srcTypes"] = [pretty(x) for x in t]
    return out

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
        if v: mon.update(v)
        elif "baseStats" not in mon: miss.append(mon["key"])
    json.dump(dex, open(os.path.join(OUT, "pokedex.json"), "w"), ensure_ascii=False, indent=1)
    have = sum(1 for m in dex if m.get("baseStats"))
    print(f"base stats merged: {have}/{len(dex)}")
    print(f"missing: {miss}")
    # spot checks
    for nm in ("Cyndaquil", "Ledyba", "Luxray"):
        m = next((x for x in dex if x["key"] == nm), None)
        if m: print(f"  {nm}: {m.get('baseStats')} | abil {m.get('abilities')} | faithfulStats {m.get('baseStatsFaithful')}")

if __name__ == "__main__":
    main()
