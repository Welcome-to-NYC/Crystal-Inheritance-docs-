#!/usr/bin/env python3
"""Fetch sprites + types + national dex numbers from PokeAPI.
Prefer Gen 2 (Crystal) GBC sprites; fall back to modern sprites for newer mons."""
import json, os, re, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "site", "data")
SPRITES = os.path.join(ROOT, "site", "sprites")
CACHE = os.path.join(os.path.dirname(__file__), ".cache")
os.makedirs(SPRITES, exist_ok=True)
os.makedirs(CACHE, exist_ok=True)

API = "https://pokeapi.co/api/v2/pokemon/"

def http_get(url, binary=False):
    last = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CrystalInheritanceDocs/1.0"})
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read() if binary else r.read().decode("utf-8")
        except urllib.error.HTTPError:
            raise
        except Exception as e:
            last = e
    raise last

def get_pokemon(name):
    cf = os.path.join(CACHE, name + ".json")
    if os.path.exists(cf):
        return json.load(open(cf))
    try:
        data = json.loads(http_get(API + name))
        json.dump(data, open(cf, "w"))
        return data
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise

FORM_SUF = {"Alolan": "alola", "Galarian": "galar", "Hisuian": "hisui", "Paldean": "paldea"}
BASE_MAP = {
    "NIDORAN": "nidoran-m", "PORYGON_Z": "porygon-z", "HO_OH": "ho-oh",
    "MR_MIME": "mr-mime", "MIME_JR": "mime-jr", "TYPE_NULL": "type-null",
    "FARFETCH_D": "farfetchd", "MINSIR": None,
}

SPECIAL_BASE_SUFFIX = ("-ancestor", "-immortal", "-matdemo")

def candidates(base, form):
    bup = base.upper()
    if bup in BASE_MAP and BASE_MAP[bup] is None:
        return []
    bclean = base.lower().replace("_", "-")
    # custom boss forms have no PokeAPI entry -> fall back to base species sprite
    for suf in SPECIAL_BASE_SUFFIX:
        if bclean.endswith(suf):
            bclean = bclean[: -len(suf)]
    bclean = BASE_MAP.get(bup, bclean)
    if form and form in FORM_SUF:
        suf = FORM_SUF[form]
        c = [f"{bclean}-{suf}"]
        if base == "BASCULIN":
            c = ["basculin-white-striped"]
        return c
    c = [bclean]
    extra = {
        "dudunsparce": ["dudunsparce-two-segment"],
        "basculegion": ["basculegion-male"],
        "basculin": ["basculin-red-striped"],
        "tauros": ["tauros"],
        "urshifu": ["urshifu-single-strike"],
    }
    c += extra.get(bclean, [])
    return c

def pick_sprite(sp):
    v = sp.get("versions", {})
    g2 = v.get("generation-ii", {})
    chain = [
        (g2.get("crystal", {}).get("front_default"), "gen2"),
        (g2.get("gold", {}).get("front_default"), "gen2"),
        (g2.get("silver", {}).get("front_default"), "gen2"),
        (v.get("generation-i", {}).get("yellow", {}).get("front_default"), "gen1"),
        (v.get("generation-iii", {}).get("emerald", {}).get("front_default"), "modern"),
        (sp.get("front_default"), "modern"),
        (v.get("generation-v", {}).get("black-white", {}).get("front_default"), "modern"),
    ]
    for url, era in chain:
        if url:
            return url, era
    return None, None

def process(mon):
    key = mon["key"]
    result = {"key": key, "nationalNo": 9999, "types": [], "spriteFile": None,
              "spriteEra": None, "pokeapiName": None}
    for cand in candidates(mon["base"], mon["form"]):
        data = get_pokemon(cand)
        if not data:
            continue
        result["pokeapiName"] = cand
        spurl = data.get("species", {}).get("url", "")
        m = re.search(r"/pokemon-species/(\d+)/?$", spurl)
        result["nationalNo"] = int(m.group(1)) if m else data.get("id", 9999)
        result["types"] = [t["type"]["name"] for t in sorted(data.get("types", []), key=lambda t: t["slot"])]
        url, era = pick_sprite(data.get("sprites", {}))
        if url:
            ext = ".png"
            fn = key + ext
            try:
                blob = http_get(url, binary=True)
                open(os.path.join(SPRITES, fn), "wb").write(blob)
                result["spriteFile"] = "sprites/" + fn
                result["spriteEra"] = era
            except Exception as e:
                print("  sprite dl fail", key, e, file=sys.stderr)
        break
    return key, result

SPECIAL_LABEL = {"_Ancestor": "Ancestor", "_Immortal": "Immortal", "_Matdemo": "Variant"}

def fix_special_name(mon):
    for suf, lab in SPECIAL_LABEL.items():
        if mon["base"].endswith(suf):
            real = mon["base"][: -len(suf)].replace("_", " ").title()
            mon["form"] = lab
            mon["name"] = f"{lab} {real}"
            return

def main():
    dex = json.load(open(os.path.join(OUT, "pokedex.json")))
    dex = [m for m in dex if m["base"].lower() != "egg"]  # drop egg placeholder
    for m in dex:
        fix_special_name(m)
    results = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        for key, res in ex.map(process, dex):
            results[key] = res
    # merge + assign form sub-order
    failed = []
    form_order = {None: 0, "Alolan": 1, "Galarian": 2, "Hisuian": 3, "Paldean": 4}
    for mon in dex:
        r = results[mon["key"]]
        mon.update({k: r[k] for k in ("nationalNo", "types", "spriteFile", "spriteEra", "pokeapiName")})
        mon["sortKey"] = mon["nationalNo"] * 10 + form_order.get(mon["form"], 5)
        if not mon["spriteFile"]:
            failed.append(mon["key"])
    dex.sort(key=lambda m: m["sortKey"])
    json.dump(dex, open(os.path.join(OUT, "pokedex.json"), "w"), ensure_ascii=False, indent=1)

    # sprite index: normalized name aliases -> sprite file (for trainers/encounters lookups)
    idx = {}
    def add_alias(alias, mon):
        a = re.sub(r"[^a-z0-9]", "", alias.lower())
        if a and mon["spriteFile"] and a not in idx:
            idx[a] = {"sprite": mon["spriteFile"], "key": mon["key"], "types": mon["types"],
                      "name": mon["name"], "nationalNo": mon["nationalNo"]}
    for mon in dex:
        add_alias(mon["name"], mon)
        add_alias(mon["base"], mon)
        if mon["form"]:
            add_alias(mon["form"] + mon["base"], mon)
            add_alias(mon["base"] + mon["form"], mon)
    json.dump(idx, open(os.path.join(OUT, "sprite_index.json"), "w"), ensure_ascii=False, indent=1)

    print(f"enriched {len(dex)} mons; sprites OK: {sum(1 for m in dex if m['spriteFile'])}")
    print(f"FAILED ({len(failed)}): {failed}")
    print(f"sprite_index aliases: {len(idx)}")

if __name__ == "__main__":
    main()
