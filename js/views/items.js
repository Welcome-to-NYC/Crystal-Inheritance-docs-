// Items — where to find every item, TM, HM, and move tutor in Crystal Inheritance.
// Mirrors the Pokédex/Encounters idiom: live search across all categories, category
// jump-pills, and per-category blocks with the best layout for each kind of data.
// The big "TM / HM / Move Tutor" set becomes a grid of pixel-badged cards; HMs and
// Move Tutors get their own badge styles; the trade-quest spoilers hide behind a toggle.
import { Store } from '../data.js';
import { el, clear, norm, sectionHead, stagger, cap } from '../util.js';

// ---- one-time, id-guarded component CSS (namespaced under .itm-view) ----
function ensureStyles() {
  if (document.getElementById('itm-styles')) return;
  document.head.append(el('style', { id: 'itm-styles', html: `
.itm-view .cat-bar { position: sticky; top: 64px; z-index: 30; padding: 10px 0; margin: 0 0 22px;
  background: linear-gradient(180deg, rgba(7,10,20,.96) 70%, rgba(7,10,20,0));
  backdrop-filter: blur(8px); }
.itm-view .filterbar { margin-bottom: 10px; }
.itm-view .jump-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin;
  -webkit-overflow-scrolling: touch; }
.itm-view .jump-row::-webkit-scrollbar { height: 6px; }
.itm-view .jump-row::-webkit-scrollbar-thumb { background: rgba(var(--accent-rgb), .35); border-radius: 3px; }
.itm-view .jump { flex: none; }
.itm-view .jump .n { font-family: var(--font-pixel); font-size: 8px; margin-left: 6px;
  padding: 1px 4px; background: rgba(0,0,0,.28); color: inherit; opacity: .8;
  clip-path: polygon(3px 0,100% 0,100% calc(100% - 3px),calc(100% - 3px) 100%,0 100%,0 3px); }

/* ---- category block header (gem band, like the era bands) ---- */
.itm-view .cat { margin: 0 0 40px; scroll-margin-top: 150px; }
.itm-view .cat-head { display: flex; align-items: center; gap: 14px; margin: 0 0 16px; }
.itm-view .cat-head__dot { width: 13px; height: 13px; flex: none;
  background: conic-gradient(from 45deg, var(--accent), var(--accent-glow), var(--accent));
  clip-path: polygon(50% 0, 100% 38%, 80% 100%, 20% 100%, 0 38%);
  box-shadow: 0 0 12px rgba(var(--accent-rgb), .7); }
.itm-view .cat-head h3 { font-family: var(--font-display); font-weight: 700; font-size: clamp(19px, 3vw, 26px);
  text-transform: uppercase; letter-spacing: .03em; margin: 0; line-height: 1; }
.itm-view .cat-head__rule { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(var(--accent-rgb), .45), transparent); }
.itm-view .cat-head__count { font-family: var(--font-pixel); font-size: 10px; color: var(--muted-2); letter-spacing: .5px; }

/* ---- generic item list: two-column responsive rows ---- */
.itm-view .item-list { display: grid; gap: 6px 14px; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); }
.itm-view .item-row { display: flex; align-items: baseline; gap: 10px; padding: 8px 12px;
  border: 1px solid var(--line); background: rgba(255,255,255,.018);
  clip-path: polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px);
  transition: border-color .15s, background .15s; }
.itm-view .item-row:hover { border-color: rgba(var(--accent-rgb), .4); background: rgba(var(--accent-rgb), .05); }
.itm-view .item-row__name { font-family: var(--font-display); font-weight: 600; font-size: 14.5px;
  letter-spacing: .01em; color: var(--ink); flex: none; }
.itm-view .item-row__loc { font-size: 13px; color: var(--muted); margin-left: auto; text-align: right; }

/* ---- the data-table flavour (used for compact categories) ---- */
.itm-view .tbl-wrap { overflow-x: auto; border: 1px solid var(--line);
  clip-path: polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px); }
.itm-view .data-table td .here { color: var(--muted); }

/* ---- TM / HM / Tutor highlight grid ---- */
.itm-view .move-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(248px, 1fr)); }
.itm-view .tm { position: relative; padding: 0; --cut: 11px; display: flex; flex-direction: column; }
.itm-view .tm__top { display: flex; align-items: center; gap: 10px; padding: 11px 13px 10px;
  background: linear-gradient(150deg, rgba(var(--accent-rgb), .14), transparent 78%);
  border-bottom: 1px solid var(--line); }
.itm-view .badge { font-family: var(--font-pixel); font-size: 9px; letter-spacing: .5px; text-transform: uppercase;
  line-height: 1; flex: none; padding: 6px 7px 5px; color: #04120f;
  background: linear-gradient(135deg, var(--accent), var(--accent-glow));
  box-shadow: 0 4px 14px -6px rgba(var(--accent-rgb), .9);
  clip-path: polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px); }
.itm-view .badge--hm    { background: linear-gradient(135deg, var(--amber), var(--gold)); color: #1c1203; }
.itm-view .badge--tutor { background: linear-gradient(135deg, var(--violet), #6f7bff); color: #fff; box-shadow: 0 4px 14px -6px rgba(154,139,255,.9); }
.itm-view .tm__move { font-family: var(--font-display); font-weight: 700; font-size: 16px; line-height: 1.08;
  letter-spacing: .01em; color: var(--ink); }
.itm-view .tm__loc { display: flex; align-items: center; gap: 8px; padding: 10px 13px 12px; font-size: 13px;
  color: var(--muted); flex: 1; }
.itm-view .tm__loc .pin { color: var(--accent); flex: none; font-size: 11px; line-height: 1.4;
  text-shadow: 0 0 8px rgba(var(--accent-rgb), .6); }
.itm-view .tm.na { opacity: .5; }
.itm-view .tm.na .tm__loc { color: var(--muted-2); }

/* ---- spoiler veil ---- */
.itm-view .spoiler { position: relative; }
.itm-view .spoiler.locked .spoiler__inner { filter: blur(11px) saturate(.6); pointer-events: none; user-select: none; }
.itm-view .spoiler__veil { position: absolute; inset: 0; z-index: 4; display: grid; place-items: center;
  text-align: center; gap: 14px; padding: 24px;
  background: radial-gradient(120% 120% at 50% 30%, rgba(255,194,77,.10), rgba(7,10,20,.55)); }
.itm-view .spoiler.unlocked .spoiler__veil { display: none; }
.itm-view .spoiler__lock { font-family: var(--font-pixel); font-size: 10px; letter-spacing: 1px; text-transform: uppercase;
  color: var(--amber); text-shadow: 0 0 12px rgba(255,194,77,.5); }
.itm-view .spoiler__sub { font-size: 13px; color: var(--muted); max-width: 42ch; }

@media (max-width: 760px) {
  .itm-view .cat-bar { top: 58px; }
  .itm-view .item-row { flex-wrap: wrap; gap: 2px 10px; }
  .itm-view .item-row__loc { margin-left: 0; text-align: left; width: 100%; }
}
` }));
}

// ----- slug for deep-link / scroll anchors -----
const slug = s => norm(s);

// ----- which categories deserve the card grid (move-like) -----
const isMoveCat = cat => /\bTMs?\b|\bHMs?\b|move\s*tutor/i.test(cat);
const isSpoilerCat = cat => /spoiler/i.test(cat);

// Pretty-print a CONST move token: "DRAGON_CLAW" -> "Dragon Claw", "WILL_O_WISP" -> "Will O Wisp".
function prettyMove(raw) {
  return String(raw || '').trim().split(/[\s_]+/).filter(Boolean)
    .map(w => cap(w.toLowerCase())).join(' ');
}

// Split a TM/HM/Tutor item name into { badge, move }.
//   "TM13 ICE_BEAM"   -> { badge:'TM13', move:'Ice Beam' }
//   "HM03 SURF"       -> { badge:'HM03', move:'Surf' }
//   "CUT"  (HM cat)   -> { badge:'HM',   move:'Cut' }   (kind supplies fallback badge)
//   "BATON_PASS"      -> { badge:'TUTOR',move:'Baton Pass' }
function parseMoveName(name, kind) {
  const m = String(name || '').match(/^\s*(TM|HM)\s*0*?(\d+)\b[\s_]*(.*)$/i);
  if (m) {
    const num = m[2].padStart(2, '0');
    return { badge: m[1].toUpperCase() + num, move: prettyMove(m[3]) || prettyMove(m[2]), kind: m[1].toUpperCase() };
  }
  // bare CONST (HMs / Move Tutors categories)
  const fallback = kind === 'tutor' ? 'TUTOR' : kind === 'hm' ? 'HM' : 'TM';
  return { badge: fallback, move: prettyMove(name), kind: fallback === 'HM' ? 'HM' : fallback === 'TUTOR' ? 'TUTOR' : 'TM' };
}

// Decide the default badge kind for a whole category (drives the fallback badge +
// colour for bare-const names). Names that carry their own "TMnn"/"HMnn" prefix
// override this per-item inside parseMoveName, so the mixed bucket safely defaults
// to "tm" while the dedicated HMs / Move Tutors lists get their own styling.
function moveKind(cat) {
  const hasTM = /\bTMs?\b/i.test(cat);
  if (/^\s*HMs?\s*$/i.test(cat) || (/\bHMs?\b/i.test(cat) && !hasTM)) return 'hm';
  if (/move\s*tutor/i.test(cat) && !hasTM) return 'tutor';
  return 'tm';
}

const naLoc = loc => /^not\s*available/i.test(String(loc || '').trim());

export function render(root, params) {
  ensureStyles();
  const data = Array.isArray(Store.items) ? Store.items : [];
  // Normalise: keep only well-formed { category, items:[...] } blocks.
  const cats = data
    .filter(c => c && Array.isArray(c.items))
    .map(c => ({ category: String(c.category || 'Items'), items: c.items.filter(it => it && (it.name != null)) }));

  const totalItems = cats.reduce((n, c) => n + c.items.length, 0);

  const state = { q: '', cat: 'all', revealed: new Set() };

  const wrap = el('section', { class: 'section itm-view era-modern' });
  wrap.append(sectionHead('Field Inventory · ' + totalItems + ' finds',
    'Items',
    'Where to find every item, TM, HM, and move tutor in Crystal Inheritance.'));

  // ---------- sticky filter bar ----------
  const search = el('input', { class: 'input', type: 'search',
    placeholder: 'Search an item or location…', 'aria-label': 'Search items' });
  const countEl = el('span', { class: 'count' });
  const jumpRow = el('div', { class: 'jump-row' });

  const jumpBtns = {};
  const makeJump = (id, label, n) => {
    const b = el('button', { class: 'pill jump' + (state.cat === id ? ' active' : '') },
      label, n != null ? el('span', { class: 'n' }, n) : null);
    b.onclick = () => {
      if (state.cat === id || id === 'all') { state.cat = 'all'; }
      else { state.cat = id; }
      // If a search is active, category pills just filter; otherwise also scroll into view.
      syncJumps(); paint();
      if (id !== 'all' && !state.q) {
        const target = wrap.querySelector('[data-cat="' + id + '"]');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    jumpBtns[id] = b;
    return b;
  };
  jumpRow.append(makeJump('all', 'All', totalItems));
  cats.forEach(c => jumpRow.append(makeJump(slug(c.category), c.category, c.items.length)));

  function syncJumps() {
    Object.entries(jumpBtns).forEach(([id, b]) => b.classList.toggle('active', state.cat === id));
  }

  search.oninput = () => { state.q = norm(search.value); paint(); };

  const bar = el('div', { class: 'cat-bar' },
    el('div', { class: 'filterbar' }, el('div', { class: 'search' }, search), countEl),
    jumpRow);
  wrap.append(bar);

  const body = el('div', {});
  wrap.append(body);
  root.append(wrap);

  // ---------- matching ----------
  const itemText = (it, cat) => {
    if (isMoveCat(cat)) {
      const k = moveKind(cat);
      const p = parseMoveName(it.name, k);
      return norm(p.badge + ' ' + p.move + ' ' + (it.location || ''));
    }
    return norm((it.name || '') + ' ' + (it.location || ''));
  };
  const itemMatches = (it, cat) => !state.q || itemText(it, cat).includes(state.q);

  // ---------- generic item list (two-column rows) ----------
  function itemRow(it) {
    return el('div', { class: 'item-row' },
      el('span', { class: 'item-row__name' }, String(it.name)),
      el('span', { class: 'item-row__loc' }, it.location ? String(it.location) : '—'));
  }

  // ---------- a compact data-table (Item | Location) ----------
  function itemTable(items) {
    const rows = items.map(it => el('tr', {},
      el('td', {}, el('strong', {}, String(it.name))),
      el('td', { class: 'here' }, it.location ? String(it.location) : '—')));
    return el('div', { class: 'tbl-wrap' },
      el('table', { class: 'data-table' },
        el('thead', {}, el('tr', {}, el('th', {}, 'Item'), el('th', {}, 'Location'))),
        el('tbody', {}, rows)));
  }

  // ---------- TM / HM / Tutor card ----------
  function moveCard(it, kind) {
    const p = parseMoveName(it.name, kind);
    const badgeMod = p.kind === 'HM' ? ' badge--hm' : p.kind === 'TUTOR' ? ' badge--tutor' : '';
    const na = naLoc(it.location);
    const card = el('article', { class: 'facet card tm' + (na ? ' na' : '') },
      el('div', { class: 'tm__top' },
        el('span', { class: 'badge' + badgeMod }, p.badge),
        el('span', { class: 'tm__move' }, p.move || String(it.name))),
      el('div', { class: 'tm__loc' },
        el('span', { class: 'pin' }, na ? '✕' : '◆'),
        el('span', {}, it.location ? String(it.location) : '—')));
    return card;
  }

  // ---------- pick the best layout for a category's items ----------
  function categoryBody(cat, items) {
    if (isMoveCat(cat.category)) {
      const kind = moveKind(cat.category);
      const grid = el('div', { class: 'move-grid' });
      const cards = items.map(it => moveCard(it, kind));
      cards.forEach(c => grid.append(c));
      stagger(cards, 12, 220);
      return grid;
    }
    // Heuristic: long location strings read better as a table; otherwise the airy
    // two-column row list. Most categories use the list; the dense "Battle Items" set
    // and anything with verbose locations get the scannable table.
    const longLoc = items.some(it => String(it.location || '').length > 46);
    if (items.length > 18 || longLoc) return itemTable(items);
    return el('div', { class: 'item-list' }, items.map(itemRow));
  }

  // ---------- a full category block ----------
  function categoryBlock(cat) {
    const id = slug(cat.category);
    const items = cat.items.filter(it => itemMatches(it, cat.category));
    const era = isSpoilerCat(cat.category) || moveKind(cat.category) === 'hm' || moveKind(cat.category) === 'tutor'
      ? 'era-historic' : 'era-modern';

    const block = el('div', { class: 'cat ' + era, 'data-cat': id });
    block.append(el('div', { class: 'cat-head' },
      el('span', { class: 'cat-head__dot' }),
      el('h3', {}, cat.category),
      el('span', { class: 'cat-head__rule' }),
      el('span', { class: 'cat-head__count' },
        state.q ? items.length + ' / ' + cat.items.length : cat.items.length + (cat.items.length === 1 ? ' item' : ' items'))));

    if (!items.length) {
      block.append(el('div', { class: 'empty' }, 'No items here match your search.'));
      return { block, count: 0 };
    }

    const inner = categoryBody(cat, items);

    // Spoiler categories hide behind a reveal toggle (blurred until clicked).
    if (isSpoilerCat(cat.category)) {
      const unlocked = state.revealed.has(id);
      const veilWrap = el('div', { class: 'spoiler ' + (unlocked ? 'unlocked' : 'locked') },
        el('div', { class: 'spoiler__inner' }, inner),
        el('div', { class: 'spoiler__veil' },
          el('span', { class: 'spoiler__lock' }, '✦ Spoiler — hidden by default'),
          el('p', { class: 'spoiler__sub' }, 'This list reveals the full trade-quest chain. Open it only if you want to be spoiled.'),
          (() => {
            const b = el('button', { class: 'pill', style: { color: 'var(--amber)', borderColor: 'rgba(255,194,77,.5)' } }, 'Reveal spoilers');
            b.onclick = () => { state.revealed.add(id); paint(); };
            return b;
          })()));
      block.append(veilWrap);
    } else {
      block.append(inner);
    }
    return { block, count: items.length };
  }

  // ---------- global flat search result (Item | Category | Location) ----------
  function flatResults() {
    const rows = [];
    let shown = 0;
    cats.forEach(c => {
      const moveCat = isMoveCat(c.category);
      const kind = moveCat ? moveKind(c.category) : null;
      const spoiler = isSpoilerCat(c.category);
      c.items.forEach(it => {
        if (!itemMatches(it, c.category)) return;
        shown++;
        let nameCell;
        if (moveCat) {
          const p = parseMoveName(it.name, kind);
          const badgeMod = p.kind === 'HM' ? ' badge--hm' : p.kind === 'TUTOR' ? ' badge--tutor' : '';
          nameCell = el('td', { style: { whiteSpace: 'nowrap' } },
            el('span', { class: 'badge' + badgeMod, style: { marginRight: '8px' } }, p.badge),
            el('strong', {}, p.move || String(it.name)));
        } else {
          nameCell = el('td', {}, el('strong', {}, spoiler ? '•••' : String(it.name)));
        }
        rows.push(el('tr', {},
          nameCell,
          el('td', {}, el('span', { class: 'chip' }, c.category)),
          el('td', { class: 'here' }, spoiler ? el('span', { style: { color: 'var(--muted-2)' } }, 'hidden (trade-quest spoiler)') : (it.location ? String(it.location) : '—'))));
      });
    });

    const block = el('div', { class: 'cat era-modern' });
    block.append(el('div', { class: 'cat-head' },
      el('span', { class: 'cat-head__dot' }),
      el('h3', {}, 'Search results'),
      el('span', { class: 'cat-head__rule' }),
      el('span', { class: 'cat-head__count' }, shown + ' across ' + cats.length + ' categories')));

    if (!shown) { block.append(el('div', { class: 'empty' }, 'Nothing matches “' + search.value.trim() + '”.')); return { block, shown }; }
    block.append(el('div', { class: 'tbl-wrap' },
      el('table', { class: 'data-table' },
        el('thead', {}, el('tr', {}, el('th', {}, 'Item'), el('th', {}, 'Category'), el('th', {}, 'Location'))),
        el('tbody', {}, rows))));
    return { block, shown };
  }

  // ---------- paint ----------
  function paint() {
    clear(body);

    // When a query is active, collapse to a single flat result list across categories.
    if (state.q) {
      const { block, shown } = flatResults();
      body.append(block);
      countEl.textContent = shown + ' / ' + totalItems + ' match';
      return;
    }

    const visibleCats = state.cat === 'all' ? cats : cats.filter(c => slug(c.category) === state.cat);
    let shown = 0;
    visibleCats.forEach(c => {
      const { block, count } = categoryBlock(c);
      shown += count;
      body.append(block);
    });

    if (!visibleCats.length) body.append(el('div', { class: 'empty' }, 'No category selected.'));
    countEl.textContent = state.cat === 'all'
      ? totalItems + ' items · ' + cats.length + ' categories'
      : shown + ' items';
  }

  // deep link / initial category: #/items/<category-slug>
  const seed = params && params[0] ? slug(params[0]) : '';
  if (seed && cats.some(c => slug(c.category) === seed)) state.cat = seed;
  syncJumps();
  paint();

  // Scroll a deep-linked category into view after first paint.
  if (state.cat !== 'all') {
    const target = wrap.querySelector('[data-cat="' + state.cat + '"]');
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
}
