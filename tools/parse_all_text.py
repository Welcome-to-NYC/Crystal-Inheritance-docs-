#!/usr/bin/env python3
"""Parse the plain-text Crystal Inheritance docs into structured JSON."""
import json, re, os

SRC = os.path.join(os.path.dirname(__file__), "..", "source_docs")
OUT = os.path.join(os.path.dirname(__file__), "..", "site", "data")
os.makedirs(OUT, exist_ok=True)

def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()

# ---------- Move / item / location name prettifier ----------
SPECIAL_WORDS = {
    "HP": "HP", "PP": "PP", "TM": "TM", "HM": "HM", "EXP": "EXP",
}
def pretty(token):
    """CONST_NAME -> Pretty Name."""
    if token is None:
        return None
    t = token.strip()
    # hyphenated specials
    specials = {
        "DOUBLE_EDGE": "Double-Edge", "U_TURN": "U-turn", "WILL_O_WISP": "Will-O-Wisp",
        "X_SCISSOR": "X-Scissor", "DAZZLINGLEAM": "Dazzling Gleam", "DYNAMICPUNCH": "Dynamic Punch",
        "EXTREMESPEED": "Extreme Speed", "SOLARBEAM": "Solar Beam", "THUNDERPUNCH": "Thunder Punch",
        "SOFTBOILED": "Soft-Boiled", "FAINT_ATTACK": "Faint Attack", "ANCIENTPOWER": "Ancient Power",
        "DOUBLESLAP": "Double Slap", "DOUBLE_SLAP": "Double Slap", "SELFDESTRUCT": "Self-Destruct",
        "MUD_SLAP": "Mud-Slap", "LOCK_ON": "Lock-On", "BABYDOLLEYES": "Baby-Doll Eyes",
        "POWER_UP_PUNCH": "Power-Up Punch", "TRI_ATTACK": "Tri Attack", "FOCUS_BLAST": "Focus Blast",
        "ODD_SOUVENIR": "Odd Souvenir", "KINGS_ROCK": "King's Rock", "UP_GRADE": "Up-Grade",
        "RAZOR_FANG": "Razor Fang", "RAZOR_CLAW": "Razor Claw", "DRAGON_SCALE": "Dragon Scale",
        "METAL_COAT": "Metal Coat", "DUBIOUS_DISC": "Dubious Disc", "DUSK_STONE": "Dusk Stone",
        "SHINY_STONE": "Shiny Stone", "ICE_STONE": "Ice Stone", "MOON_STONE": "Moon Stone",
        "SUN_STONE": "Sun Stone", "FIRE_STONE": "Fire Stone", "WATER_STONE": "Water Stone",
        "LEAF_STONE": "Leaf Stone", "THUNDERSTONE": "Thunder Stone", "DAWN_STONE": "Dawn Stone",
    }
    if t in specials:
        return specials[t]
    parts = t.split("_")
    out = []
    for p in parts:
        if p in SPECIAL_WORDS:
            out.append(SPECIAL_WORDS[p])
        else:
            out.append(p.capitalize())
    return " ".join(out)

def species_key(label):
    """CyndaquilEvosAttacks-label -> raw key like 'Vulpix_Alolan'."""
    return label

def split_form(key):
    """Return (baseName, formLabel|None) from a key like 'Vulpix_Alolan'."""
    for suf, lab in [("_Alolan","Alolan"),("_Galarian","Galarian"),("_Hisuian","Hisuian"),
                     ("_Paldean","Paldean")]:
        if key.endswith(suf):
            return key[:-len(suf)], lab
    return key, None

def display_name(base, form):
    nm = base.replace("_"," ")
    nm = " ".join(w.capitalize() for w in nm.split())
    fixups = {"Nidoran":"Nidoran","Porygon z":"Porygon-Z","Porygon2":"Porygon2",
              "Ho oh":"Ho-Oh","Mr mime":"Mr. Mime","Farfetch d":"Farfetch'd",
              "Mime jr":"Mime Jr.","Type null":"Type: Null"}
    nm = fixups.get(nm, nm)
    if form:
        return f"{form} {nm}"
    return nm

# ---------- evos_attacks (Pokedex master) ----------
def parse_dex():
    txt = read("CrystalInheritance_evos_attacks_v100.txt")
    blocks = re.split(r"\n(?=\w[\w_]*EvosAttacks:)", txt)
    mons = []
    for b in blocks:
        m = re.match(r"(\w[\w_]*)EvosAttacks:", b.strip())
        if not m:
            continue
        key = m.group(1)
        base, form = split_form(key)
        evolutions = []
        learnset = []
        for line in b.splitlines():
            line = line.strip()
            ev = re.match(r"db\s+EVOLVE_(\w+),\s*(.+)", line)
            if ev:
                kind = ev.group(1)
                rest = [x.strip() for x in ev.group(2).split(";")[0].split(",")]
                evolutions.append(parse_evo(kind, rest))
                continue
            lm = re.match(r"db\s+(\d+),\s*([A-Z][A-Z0-9_]*)", line)
            if lm:
                learnset.append({"level": int(lm.group(1)), "move": pretty(lm.group(2))})
        mons.append({
            "key": key, "base": base, "form": form,
            "name": display_name(base, form),
            "evolutions": evolutions, "learnset": learnset,
        })
    return mons

def parse_evo(kind, rest):
    rest = [r for r in rest if r != ""]
    if kind == "LEVEL":
        return {"method": "level", "text": f"Lv. {rest[0]}", "into": pretty(rest[1])}
    if kind == "ITEM":
        return {"method": "item", "text": f"Use {pretty(rest[0])}", "into": pretty(rest[1])}
    if kind == "HOLDING":
        return {"method": "holding", "text": f"Level up holding {pretty(rest[0])}", "into": pretty(rest[1])}
    if kind == "HAPPINESS":
        return {"method": "happiness", "text": "High Friendship", "into": pretty(rest[-1])}
    if kind == "STAT":
        cond = rest[1]
        condtxt = {"ATK_LT_DEF":"Atk < Def","ATK_GT_DEF":"Atk > Def","ATK_EQ_DEF":"Atk = Def"}.get(cond, cond)
        return {"method": "stat", "text": f"Lv. {rest[0]} ({condtxt})", "into": pretty(rest[2])}
    if kind == "MOVE":
        return {"method": "move", "text": f"Level up knowing {pretty(rest[0])}", "into": pretty(rest[1])}
    if kind == "LOCATION":
        return {"method": "location", "text": f"Level up at {pretty(rest[0])}", "into": pretty(rest[1])}
    return {"method": kind.lower(), "text": kind + " " + " ".join(rest[:-1]), "into": pretty(rest[-1])}

# ---------- items ----------
def parse_items():
    txt = read("CrystalInheritance_Items_v100.txt")
    cats = []
    cur = None
    item_re = re.compile(r"^\s*(.+?)\s{2,}(.+?)\s*$")
    for raw in txt.splitlines():
        if not raw.strip():
            continue
        low = raw.lower()
        if "item locations" in low or "reference sheet" in low or "last update" in low:
            continue
        m = item_re.match(raw)
        if m and m.group(1).strip() and m.group(2).strip():
            if cur is None:
                cur = {"category": "Misc", "items": []}
                cats.append(cur)
            cur["items"].append({"name": m.group(1).strip(), "location": m.group(2).strip()})
        else:
            cur = {"category": raw.strip(), "items": []}
            cats.append(cur)
    return [c for c in cats if c["items"]]

# ---------- level caps ----------
def parse_levelcaps():
    txt = read("CrystalInheritance_LevelCaps_v100.txt")
    caps = []
    for line in txt.splitlines():
        m = re.match(r"^(.+?):\s*(\d+)\s*$", line.strip())
        if m:
            name = m.group(1).strip()
            optional = "(Optional)" in name
            name = name.replace("(Optional)","").strip()
            caps.append({"location": name, "cap": int(m.group(2)), "optional": optional})
    return caps

# ---------- faithful ----------
def parse_faithful():
    txt = read("CrystalInheritance_FaithfulMode_Changes_v100.txt")
    entries = []
    cur = None
    for line in txt.splitlines():
        s = line.strip()
        if not s or s.startswith("Listed by"):
            continue
        m = re.match(r"^([A-Z][A-Z0-9]+):\s*(.*)$", s)
        if m:
            cur = {"name": display_name(m.group(1).capitalize(), None), "changes": []}
            if m.group(2).strip():
                cur["changes"].append(m.group(2).strip())
            entries.append(cur)
        elif cur is not None:
            cur["changes"].append(s)
    return entries

# ---------- completionist ----------
def parse_completionist():
    txt = read("CrystalInheritance_Completionist_v100.txt")
    items = []
    title = "Completionist Checklist"
    for line in txt.splitlines():
        s = line.strip()
        if s.startswith("*"):
            items.append(s.lstrip("* ").strip())
        elif s and "Checklist" in s:
            title = s
    return {"title": title, "items": items}

# ---------- credits (keep raw markdown) ----------
def parse_credits():
    return read("CREDITS_CrystalInheritance_v100.txt")

if __name__ == "__main__":
    dex = parse_dex()
    json.dump(dex, open(os.path.join(OUT,"pokedex.json"),"w"), ensure_ascii=False, indent=1)
    json.dump(parse_items(), open(os.path.join(OUT,"items.json"),"w"), ensure_ascii=False, indent=1)
    meta = {
        "levelCaps": parse_levelcaps(),
        "faithful": parse_faithful(),
        "completionist": parse_completionist(),
    }
    json.dump(meta, open(os.path.join(OUT,"meta.json"),"w"), ensure_ascii=False, indent=1)
    open(os.path.join(OUT,"credits.md"),"w").write(parse_credits())
    print(f"pokedex: {len(dex)} entries")
    print(f"  with evolutions: {sum(1 for m in dex if m['evolutions'])}")
    print(f"  forms: {sorted(set(m['form'] for m in dex if m['form']))}")
    print(f"  sample: {dex[0]['name']} learns {len(dex[0]['learnset'])} moves; evo {dex[0]['evolutions']}")
    items = parse_items()
    print(f"items: {len(items)} categories, {sum(len(c['items']) for c in items)} items")
    print(f"  categories: {[c['category'] for c in items]}")
    print(f"levelcaps: {len(parse_levelcaps())}")
    print(f"faithful: {len(parse_faithful())} -> {[e['name'] for e in parse_faithful()]}")
    print(f"completionist: {len(parse_completionist()['items'])} items")
