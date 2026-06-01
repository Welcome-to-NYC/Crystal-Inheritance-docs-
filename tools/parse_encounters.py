#!/usr/bin/env python3
"""Parse the Encounters PDF (wide landscape table) via pymupdf word coordinates."""
import fitz, re, json, os, bisect

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "source_docs")
OUT = os.path.join(ROOT, "site", "data")

DOC = fitz.open(os.path.join(SRC, "CrystalInheritance_Encounters_v100.pdf"))

def rows_of(page, ymin=-1, ymax=1e9):
    buckets = {}
    for w in page.get_text("words"):
        x0, y0, txt = w[0], w[1], w[4]
        if y0 < ymin or y0 > ymax:
            continue
        placed = False
        for k in list(buckets.keys()):
            if abs(k - y0) <= 2.5:
                buckets[k].append((x0, txt)); placed = True; break
        if not placed:
            buckets[y0] = [(x0, txt)]
    out = []
    for y in sorted(buckets):
        out.append((y, sorted(buckets[y], key=lambda t: t[0])))
    return out

def join(words, lo, hi):
    return " ".join(t for x, t in words if lo <= x < hi).strip()

GRASS_BOUNDS = [187, 226, 264, 299, 339, 378]
def grass_list(words):
    slots = ["", "", "", "", "", "", ""]
    for x, t in words:
        if 165 <= x < 440:
            i = bisect.bisect_right(GRASS_BOUNDS, x)
            slots[i] = (slots[i] + " " + t).strip()
    return [s for s in slots if s]

SKIP_KW = ("Location", "Grass", "Inheritance", "Crystal", "Pokemon", "Headbutt/Rock",
           "Smash Group", "Rod Group", "Surfing", "Gifts/Static/Trades", "Spoilers!")

def parse_main():
    regions = []
    cur_region = None
    cur_loc = None
    pages = [(DOC[0], -1, 1e9), (DOC[1], -1, 338)]
    for page, ymin, ymax in pages:
        for y, words in rows_of(page, ymin, ymax):
            time = join(words, -1, 100)
            location = join(words, 100, 165)
            grass = grass_list(words)
            rod = join(words, 440, 472)
            surf = join(words, 472, 546)
            smash = join(words, 546, 584)
            special = join(words, 584, 1e9)
            if location in ("Location",) or time == "v1.0.0":
                continue
            if location in ("Modern Johto", "Historic Johto"):
                cur_region = {"name": location, "locations": []}
                regions.append(cur_region); cur_loc = None
                continue
            if not location:
                if special and not grass and not surf and not rod and not smash and cur_loc:
                    cur_loc["special"] = (cur_loc["special"] + " " + special).strip()
                continue
            if any(k in location for k in ("Pokemon", "Grass")):
                continue
            if cur_region is None:
                cur_region = {"name": "Johto", "locations": []}
                regions.append(cur_region)
            cur_loc = {"location": location, "time": time, "grass": grass,
                       "rodGroup": rod, "surf": surf, "smashGroup": smash, "special": special}
            cur_region["locations"].append(cur_loc)
    return regions

def is_header(words):
    txt = " ".join(t for x, t in words)
    return any(k in txt for k in ("Species", "Move", "Common 1", "Uncommon", "Location",
               "Hidden", "Olivine", "Azalea", "Ecruteak", "Headbutt", "Fish Group",
               "Kimono", "Old", "Good", "Super"))

def parse_aux():
    p = DOC[1]
    # --- Reference groups + Kimono (y 344-405) ---
    headbutt_groups, fish_groups, kimono = [], [], []
    for y, words in rows_of(p, 343, 405):
        if is_header(words):
            # the right side may still carry fish-group header; capture kimono pairs below only
            pass
        # left: headbutt/rock smash group
        gname = join(words, -1, 100)
        mons = [t for x, t in words if 100 <= x < 358]
        if gname and mons and not is_header(words):
            headbutt_groups.append({"group": gname, "mons": merge_commas(mons)})
        # right: fish group
        fname = join(words, 358, 392)
        if fname and "Fish" not in fname and "Old" not in fname:
            fname = re.sub(r"\s*\(.*$", "", fname).replace("_", " ").strip().title()
            fish_groups.append({"group": fname,
                                "old": join(words, 392, 440),
                                "good": join(words, 440, 472),
                                "super": join(words, 472, 546)})
        # far right: kimono cabin
        area = join(words, 584, 655)
        reward = join(words, 655, 1e9)
        if area and reward:
            kimono.append({"area": area, "reward": reward})

    # --- Hidden grottos (left, y 432-466) ---
    grottos = []
    for y, words in rows_of(p, 432, 466):
        loc = join(words, -1, 100)
        if not loc or is_header(words):
            continue
        grottos.append({"location": loc, "item": join(words, 100, 162),
                        "common1": join(words, 162, 200), "common2": join(words, 200, 242),
                        "uncommon": join(words, 242, 278), "rare": join(words, 278, 358)})

    # --- Olivine Fish Shop (right, y 432-520) ---
    olivine = []
    for y, words in rows_of(p, 432, 522):
        sp = join(words, 388, 440)
        if not sp or sp.split()[0] in ("Species", "Olivine"):
            continue
        olivine.append({"species": sp, "item": join(words, 440, 472), "move": join(words, 472, 546)})

    # --- Azalea / Ecruteak gift mons (y 480-522) ---
    gift_mons = []
    for y, words in rows_of(p, 480, 522):
        a_sp = join(words, -1, 100)
        if a_sp in ("Species",) or a_sp.startswith("Azalea"):
            a_sp = ""
        if a_sp:
            gift_mons.append({"npc": "Azalea Bug Collector", "species": a_sp,
                              "item": join(words, 100, 162), "move": join(words, 162, 242)})
        e_sp = join(words, 242, 280)
        if e_sp in ("Species",) or e_sp.startswith("Ecruteak"):
            e_sp = ""
        if e_sp:
            gift_mons.append({"npc": "Ecruteak Psy Shop", "species": e_sp,
                              "item": join(words, 280, 316), "move": join(words, 316, 388)})

    return {"headbuttGroups": headbutt_groups, "fishGroups": fish_groups,
            "kimonoCabin": kimono, "hiddenGrottos": grottos,
            "olivineFishShop": olivine, "giftMons": gift_mons}

def merge_commas(mons):
    return ", ".join(m.rstrip(",") for m in mons)

if __name__ == "__main__":
    data = {"regions": parse_main()}
    data.update(parse_aux())
    json.dump(data, open(os.path.join(OUT, "encounters.json"), "w"), ensure_ascii=False, indent=1)
    for r in data["regions"]:
        print(f"REGION {r['name']}: {len(r['locations'])} locations")
    print("first 3 locations:")
    for l in data["regions"][0]["locations"][:3]:
        print(" ", l["location"], "|", l["time"], "| grass:", l["grass"], "| surf:", l["surf"],
              "| rod:", l["rodGroup"], "| smash:", l["smashGroup"], "| special:", l["special"][:40])
    print("headbuttGroups:", len(data["headbuttGroups"]), [g["group"] for g in data["headbuttGroups"]])
    print("fishGroups:", len(data["fishGroups"]), [g["group"] for g in data["fishGroups"]])
    print("kimono:", data["kimonoCabin"])
    print("grottos:", len(data["hiddenGrottos"]), [g["location"] for g in data["hiddenGrottos"]])
    print("olivine:", len(data["olivineFishShop"]), [g["species"] for g in data["olivineFishShop"]])
    print("giftMons:", len(data["giftMons"]))
    for g in data["giftMons"]:
        print("   ", g["npc"], "|", g["species"], "|", g["item"], "|", g["move"])
