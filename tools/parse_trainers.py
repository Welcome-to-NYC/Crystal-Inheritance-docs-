#!/usr/bin/env python3
"""Parse the three trainer-guide PDFs into structured JSON via word coordinates."""
import pdfplumber, re, json, os

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "source_docs")
OUT = os.path.join(ROOT, "site", "data")

def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())

# Build a move-name set from the parsed pokedex learnsets + TM/tutor moves.
def build_move_set():
    moves = set()
    dex = json.load(open(os.path.join(OUT, "pokedex.json")))
    for m in dex:
        for lm in m["learnset"]:
            moves.add(norm(lm["move"]))
    # add moves from item doc (TMs/HMs/tutors)
    try:
        items = json.load(open(os.path.join(OUT, "items.json")))
        for cat in items:
            if "TM" in cat["category"] or "Tutor" in cat["category"] or cat["category"] in ("HMs",):
                for it in cat["items"]:
                    nm = it["name"]
                    nm = re.sub(r"^(TM|HM)\d+\s+", "", nm)
                    moves.add(norm(nm.replace("_", " ")))
    except Exception:
        pass
    # common extras trainers may use
    extra = ["Tackle","Growl","Scratch","Pound","Ember","Bubble","Water Gun","Vine Whip",
             "Quick Attack","Sand Attack","Thunder Wave","Confuse Ray","Sonic Boom","Sonicboom",
             "Rest","Curse","Spore","Slash","Recover","Amnesia","Pursuit","U Turn","Bug Bite",
             "Endure","Reversal","String Shot","Protect","Headbutt","Agility","Leer","Cut",
             "Focus Energy","Scary Face","Screech","Rock Smash","Mirror Coat","Rock Throw",
             "Swords Dance","Giga Drain","Air Slash","Supersonic","Fury Strikes","Baton Pass",
             "Rain Dance","Poison Sting","Bubble Beam","Extrasensory","Play Rough","Moonblast",
             "Rollout","Charm","Drain Kiss","Bite","Encore","Metronome","Tri Attack","Megahorn",
             "Mud Slap","Night Shade","Razor Leaf","Aerial Ace","Roost","Energy Ball","Wing Attack",
             "False Swipe","Gust","Hypnosis","Dream Eater","Sludge Bomb","Sucker Punch","Nasty Plot",
             "Flame Charge","Sand Tomb","Faint Attack","Feint Attack","Dynamic Punch","Cross Chop",
             "Mach Punch","Vacuum Wave","Power Up Punch","Drain Punch","Knock Off","Foul Play",
             "Dark Pulse","Shadow Ball","Shadow Sneak","Will O Wisp","Hex","Dazzling Gleam",
             "Moonlight","Calm Mind","Psychic","Psybeam","Future Sight","Zen Headbutt","Iron Head",
             "Flash Cannon","Gyro Ball","Bullet Punch","Steel Wing","Earthquake","Earth Power",
             "Stone Edge","Rock Slide","Stealth Rock","Ancient Power","Power Gem","Ice Beam",
             "Blizzard","Icy Wind","Avalanche","Aurora Beam","Surf","Waterfall","Scald","Hydro Pump",
             "Aqua Jet","Aqua Tail","Liquidation","Thunderbolt","Thunder","Wild Charge","Volt Switch",
             "Spark","Discharge","Flamethrower","Fire Blast","Fire Punch","Lava Plume","Flare Blitz",
             "Solar Beam","Giga Drain","Leaf Blade","Seed Bomb","Petal Dance","Leech Life","X Scissor",
             "Outrage","Dragon Claw","Dragon Pulse","Dragon Dance","Twister","Double Edge","Body Slam",
             "Hyper Voice","Boomburst","Return","Frustration","Double Team","Toxic","Venoshock",
             "Poison Jab","Sludge Wave","Cross Poison","High Horsepower","Hone Claws","Acrobatics",
             "Brave Bird","Drill Peck","Fly","Sky Attack","Defog","Tailwind","Bulk Up","Superpower",
             "Close Combat","Brick Break","Low Kick","Counter","Seismic Toss","Rock Tomb","Smack Down"]
    for e in extra:
        moves.add(norm(e))
    return moves

MOVES = None

def lines_from_pdf(path):
    rows = []
    with pdfplumber.open(path) as pdf:
        for pi, page in enumerate(pdf.pages):
            words = page.extract_words(use_text_flow=False, keep_blank_chars=False)
            buckets = {}
            for w in words:
                gy = pi * 100000 + round(w["top"])
                # cluster: merge into existing bucket within 3px
                placed = False
                for k in list(buckets.keys()):
                    if abs(k - gy) <= 3:
                        buckets[k].append(w); placed = True; break
                if not placed:
                    buckets[gy] = [w]
            for gy in sorted(buckets):
                ws = sorted(buckets[gy], key=lambda w: w["x0"])
                rows.append(ws)
    return rows

def is_name_row(ws):
    if not ws:
        return False
    if any(re.match(r"Lv\.?\d", w["text"]) for w in ws):
        return False
    return ws[0]["x0"] < 103

def parse_lv_row(ws):
    cols = []
    cur, anchor = [], None
    for w in ws:
        m = re.match(r"Lv\.?(\d+)", w["text"])
        if m and cur:
            cols.append({"anchor": anchor, "species": " ".join(cur), "level": int(m.group(1))})
            cur, anchor = [], None
        elif m and not cur:
            continue
        else:
            if anchor is None:
                anchor = w["x0"]
            cur.append(w["text"])
    return cols

def assign_cells(ws, anchors, ncol):
    cells = [[] for _ in range(ncol)]
    for w in ws:
        x = w["x0"]
        ci = 0
        for i, a in enumerate(anchors):
            if x >= a - 12:
                ci = i
        cells[ci].append(w["text"])
    return [" ".join(c).strip() for c in cells]

DASH = {"—", "-", "–", "−", ""}

def parse_guide(path, mode):
    rows = lines_from_pdf(path)
    trainers = []
    i = 0
    n = len(rows)
    while i < n:
        ws = rows[i]
        if is_name_row(ws):
            name = " ".join(w["text"] for w in ws).strip()
            # next non-empty row should be the Lv row
            j = i + 1
            while j < n and not any(re.match(r"Lv\.?\d", w["text"]) for w in rows[j]):
                if is_name_row(rows[j]):
                    break
                j += 1
            if j < n and any(re.match(r"Lv\.?\d", w["text"]) for w in rows[j]):
                lv = parse_lv_row(rows[j])
                anchors = [c["anchor"] for c in lv]
                ncol = len(lv)
                # gather attribute rows until next name row
                k = j + 1
                attr = []
                while k < n and not is_name_row(rows[k]) and not any(re.match(r"Lv\.?\d", w["text"]) for w in rows[k]):
                    attr.append(assign_cells(rows[k], anchors, ncol))
                    k += 1
                # classify: first row whose any cell is a known move
                first_move = None
                for idx, cellrow in enumerate(attr):
                    if any(norm(c) in MOVES and norm(c) for c in cellrow):
                        first_move = idx; break
                leading = attr if first_move is None else attr[:first_move]
                move_rows = [] if first_move is None else attr[first_move:]
                nick_row = item_row = None
                if len(leading) >= 2:
                    nick_row, item_row = leading[0], leading[1]
                elif len(leading) == 1:
                    item_row = leading[0]
                team = []
                for ci, c in enumerate(lv):
                    nick = (nick_row[ci].strip() if nick_row and ci < len(nick_row) else "")
                    item = (item_row[ci].strip() if item_row and ci < len(item_row) else "")
                    if item in DASH:
                        item = ""
                    if nick in DASH:
                        nick = ""
                    moves = []
                    for mr in move_rows:
                        if ci < len(mr) and mr[ci].strip() and mr[ci].strip() not in DASH:
                            moves.append(mr[ci].strip())
                    team.append({
                        "species": c["species"].strip(), "level": c["level"],
                        "nickname": nick, "item": item, "moves": moves,
                    })
                trainers.append({"name": name, "team": team})
                i = k
                continue
        i += 1
    return trainers

if __name__ == "__main__":
    MOVES = build_move_set()
    out = {}
    for mode in ["easy", "normal", "expert"]:
        out[mode] = parse_guide(os.path.join(SRC, f"trainer_guide_{mode}.pdf"), mode)
        print(f"{mode}: {len(out[mode])} trainers, {sum(len(t['team']) for t in out[mode])} pokemon")
    json.dump(out, open(os.path.join(OUT, "trainers.json"), "w"), ensure_ascii=False, indent=1)
    # sample
    for t in out["normal"][:6]:
        print("\n#", t["name"])
        for p in t["team"]:
            print(f"  {p['species']} Lv.{p['level']} [{p['nickname']}] @{p['item']}: {', '.join(p['moves'])}")
