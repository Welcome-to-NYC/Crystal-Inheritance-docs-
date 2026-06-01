// Encounters — wild habitat dossiers (Modern vs. Historic Johto) + a field reference.
// Time-duality is the central motif: each region is wrapped in .era-modern / .era-historic,
// which re-theme every child component (chips, tags, tables) cyan or amber.
import { Store } from '../data.js';
import { el, clear, norm, monSprite, monChip, sectionHead, stagger } from '../util.js';

// ---- one-time, id-guarded component CSS (namespaced under .enc-view) ----
function ensureStyles() {
  if (document.getElementById('enc-styles')) return;
  document.head.append(el('style', { id: 'enc-styles', html: `
.enc-view .loc-grid { margin-top: 4px; }
.enc-view .loc { padding: 0; --cut: 12px; display: flex; flex-direction: column; }
.enc-view .loc__head { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px 10px;
  background: linear-gradient(150deg, rgba(var(--accent-rgb), .12), transparent 70%);
  border-bottom: 1px solid var(--line); }
.enc-view .loc__name { font-family: var(--font-display); font-weight: 700; font-size: 18px; line-height: 1.12;
  letter-spacing: .01em; margin: 0; flex: 1; }
.enc-view .loc__body { padding: 12px 16px 16px; display: grid; gap: 12px; }
.enc-view .loc__row { display: grid; gap: 6px; }
.enc-view .loc__label { display: flex; align-items: center; gap: 8px; font-family: var(--font-pixel);
  font-size: 9px; letter-spacing: .5px; text-transform: uppercase; color: var(--accent);
  text-shadow: 0 0 8px rgba(var(--accent-rgb), .4); }
.enc-view .loc__label .hint { margin-left: auto; font-family: var(--font-body); font-size: 10px;
  letter-spacing: normal; text-transform: none; color: var(--muted-2); text-shadow: none; }
.enc-view .loc__chips { display: flex; flex-wrap: wrap; gap: 6px; }
/* rarity fade: most-common first, dimming toward the tail */
.enc-view .loc__chips--rank .monchip { opacity: var(--rar, 1); }
.enc-view .loc__field { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.enc-view .loc__field b { font-family: var(--font-pixel); font-size: 9px; letter-spacing: .5px;
  text-transform: uppercase; color: var(--accent); white-space: nowrap; }
.enc-view .loc__field .grp { font-family: var(--font-display); font-weight: 600; font-size: 14px; color: var(--ink); }
.enc-view .loc__field .grp::after { content: ' group'; color: var(--muted-2); font-weight: 500; font-size: 12px; }
.enc-view .timebadge { display: inline-flex; align-items: center; gap: 5px; font-family: var(--font-pixel);
  font-size: 8px; letter-spacing: .5px; text-transform: uppercase; padding: 4px 7px 3px; line-height: 1;
  color: #0a0a0a; flex: none;
  clip-path: polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px); }
.enc-view .timebadge--day  { background: linear-gradient(135deg, var(--gold), var(--amber)); }
.enc-view .timebadge--nite { background: linear-gradient(135deg, var(--violet), #6f7bff); color: #fff; }
.enc-view .callout { display: flex; align-items: flex-start; gap: 9px; padding: 9px 11px;
  background: rgba(var(--accent-rgb), .08); border: 1px solid rgba(var(--accent-rgb), .28);
  clip-path: polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px); }
.enc-view .callout__icon { flex: none; color: var(--accent); font-size: 12px; line-height: 1.5;
  text-shadow: 0 0 8px rgba(var(--accent-rgb), .6); }
.enc-view .callout__text { font-size: 13px; color: var(--ink); }
.enc-view .callout__text em { font-style: normal; color: var(--accent); font-weight: 600; }
.enc-view .era-band { display: flex; align-items: center; gap: 14px; margin: 6px 0 18px; }
.enc-view .era-band__dot { width: 14px; height: 14px; flex: none;
  background: conic-gradient(from 45deg, var(--accent), var(--accent-glow), var(--accent));
  clip-path: polygon(50% 0, 100% 38%, 80% 100%, 20% 100%, 0 38%);
  box-shadow: 0 0 12px rgba(var(--accent-rgb), .7); }
.enc-view .era-band h3 { font-family: var(--font-display); font-weight: 700; font-size: clamp(20px, 3vw, 28px);
  text-transform: uppercase; letter-spacing: .03em; margin: 0; line-height: 1; }
.enc-view .era-band__rule { flex: 1; height: 1px; background: linear-gradient(90deg, rgba(var(--accent-rgb), .5), transparent); }
.enc-view .era-band__count { font-family: var(--font-pixel); font-size: 10px; color: var(--muted-2); letter-spacing: .5px; }
/* reference */
.enc-view .ref-grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); }
.enc-view .ref { padding: 18px 18px 20px; --cut: 12px; }
.enc-view .ref--wide { grid-column: 1 / -1; }
.enc-view .ref h3 { font-family: var(--font-display); font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; font-size: 16px; margin: 0 0 4px; }
.enc-view .ref__sub { color: var(--muted); font-size: 12.5px; margin: 0 0 14px; }
.enc-view .ref__scroll { overflow-x: auto; }
.enc-view .ref .data-table td .monchip { margin: -2px 0; }
.enc-view .splitcols { display: grid; gap: 6px 14px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.enc-view .grp-row { display: flex; align-items: baseline; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--line); }
.enc-view .grp-row:last-child { border-bottom: 0; }
.enc-view .grp-row .grp-name { font-family: var(--font-display); font-weight: 700; font-size: 13px;
  text-transform: uppercase; letter-spacing: .04em; color: var(--accent); flex: none; min-width: 92px; }
.enc-view .grp-row .grp-mons { color: var(--ink); font-size: 13.5px; }
/* hidden grottos — completionist treasure cards */
.enc-view .grottos { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.enc-view .grotto { padding: 0; --cut: 12px; }
.enc-view .grotto__top { display: flex; align-items: center; gap: 8px; padding: 11px 14px;
  background: linear-gradient(150deg, rgba(var(--accent-rgb), .16), transparent 75%); border-bottom: 1px solid var(--line); }
.enc-view .grotto__loc { font-family: var(--font-display); font-weight: 700; font-size: 14.5px; line-height: 1.1; flex: 1; }
.enc-view .grotto__item { display: flex; align-items: center; gap: 8px; padding: 9px 14px;
  border-bottom: 1px solid var(--line); font-size: 13px; }
.enc-view .grotto__item .berry { color: var(--gold); font-weight: 600; }
.enc-view .grotto__grid { display: grid; grid-template-columns: repeat(2, 1fr); }
.enc-view .grotto__cell { display: grid; justify-items: center; gap: 4px; padding: 12px 6px 14px;
  border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.enc-view .grotto__cell:nth-child(2n) { border-right: 0; }
.enc-view .grotto__cell:nth-child(n+3) { border-bottom: 0; }
.enc-view .grotto__cell .sprite-tile { width: 60px; height: 60px; --cut: 8px; }
.enc-view .grotto__rank { font-family: var(--font-pixel); font-size: 8px; letter-spacing: .5px; text-transform: uppercase; }
.enc-view .grotto__rank.common   { color: var(--muted-2); }
.enc-view .grotto__rank.uncommon { color: var(--accent); }
.enc-view .grotto__rank.rare     { color: var(--gold); text-shadow: 0 0 8px rgba(255,216,135,.5); }
.enc-view .grotto__name { font-family: var(--font-display); font-weight: 600; font-size: 12.5px; text-align: center; line-height: 1.1; }
.enc-view .gem-sub { display: flex; align-items: center; gap: 8px; margin: 26px 0 10px; }
.enc-view .gem-sub .ico { color: var(--accent); }
.enc-view .gem-sub h4 { font-family: var(--font-display); font-weight: 700; text-transform: uppercase;
  letter-spacing: .05em; font-size: 14px; margin: 0; }
@media (max-width: 640px) {
  .enc-view .ref-grid, .enc-view .ref-grid--two { grid-template-columns: 1fr; }
}
` }));
}

// Split a free-text species string ("Poliwag, Wooper, Poliwhirl") into clean names.
const splitMons = s => (s || '').split(/[,/]|\s{2,}/).map(x => x.trim()).filter(Boolean);

// Tokens (for search) from a free-text field.
const textTokens = s => norm(s);

export function render(root, params) {
  ensureStyles();
  const data = Store.encounters || {};
  const regions = data.regions || [];
  const totalLocs = regions.reduce((n, r) => n + (r.locations || []).length, 0);

  const ERA = { 'Modern Johto': 'era-modern', 'Historic Johto': 'era-historic' };

  const state = { q: '', view: 'all' }; // view: all | modern | historic | reference

  const wrap = el('section', { class: 'section enc-view era-modern' });
  wrap.append(sectionHead('Field Survey · ' + totalLocs + ' habitats',
    'Wild Encounters',
    'Where every species roams across the time-split Johto — present-day routes glow cyan, the ancestral past burns amber. Tap any Pokémon to open its Pokédex entry. In grass, order runs from most to least common.'));

  // ---------- filter bar ----------
  const search = el('input', { class: 'input', type: 'search',
    placeholder: 'Search a location or Pokémon…', 'aria-label': 'Search encounters' });
  const tabRow = el('div', { class: 'pill-row' });
  const countEl = el('span', { class: 'count' });

  const TABS = [
    { id: 'modern',    label: 'Modern Johto' },
    { id: 'historic',  label: 'Historic Johto' },
    { id: 'reference', label: 'Reference' },
  ];
  const tabBtns = {};
  TABS.forEach(t => {
    const b = el('button', { class: 'pill' }, t.label);
    b.onclick = () => { state.view = state.view === t.id ? 'all' : t.id; syncTabs(); paint(); };
    tabBtns[t.id] = b;
    tabRow.append(b);
  });
  function syncTabs() {
    Object.entries(tabBtns).forEach(([id, b]) => b.classList.toggle('active', state.view === id));
  }
  search.oninput = () => { state.q = norm(search.value); paint(); };

  wrap.append(el('div', { class: 'filterbar' }, el('div', { class: 'search' }, search), tabRow, countEl));

  const body = el('div', {});
  wrap.append(body);
  root.append(wrap);

  // ---------- matching ----------
  function locMatches(loc) {
    if (!state.q) return true;
    if (norm(loc.location).includes(state.q)) return true;
    if ((loc.grass || []).some(g => norm(g).includes(state.q))) return true;
    if (textTokens(loc.surf).includes(state.q)) return true;
    if (textTokens(loc.special).includes(state.q)) return true;
    return false;
  }

  // ---------- location card ----------
  function timeBadge(time) {
    if (!time) return null;
    if (/day/i.test(time)) return el('span', { class: 'timebadge timebadge--day', title: 'Daytime encounters' }, '☀ Day');
    return el('span', { class: 'timebadge timebadge--nite', title: time }, '☾ Night');
  }

  function locationCard(loc) {
    const card = el('article', { class: 'facet card loc' });

    card.append(el('div', { class: 'loc__head' },
      el('h4', { class: 'loc__name' }, loc.location),
      timeBadge(loc.time)));

    const b = el('div', { class: 'loc__body' });

    // Grass / Cave — ranked by rarity (descending probability).
    const grass = (loc.grass || []).filter(Boolean);
    if (grass.length) {
      const chips = el('div', { class: 'loc__chips loc__chips--rank' });
      grass.forEach((name, i) => {
        const chip = monChip(name);
        // fade toward the rare tail (first = most common, full opacity)
        chip.style.setProperty('--rar', (1 - (i / Math.max(grass.length - 1, 1)) * 0.5).toFixed(2));
        chips.append(chip);
      });
      b.append(el('div', { class: 'loc__row' },
        el('div', { class: 'loc__label' }, 'Grass / Cave',
          el('span', { class: 'hint' }, 'most common →')),
        chips));
    }

    // Surf
    const surf = splitMons(loc.surf);
    if (surf.length) {
      b.append(el('div', { class: 'loc__row' },
        el('div', { class: 'loc__label' }, '≈ Surf'),
        el('div', { class: 'loc__chips' }, surf.map(n => monChip(n)))));
    }

    // Fishing + Headbutt/Rock Smash group references (thin one-liners)
    const lines = el('div', { class: 'loc__row' });
    if (loc.rodGroup) lines.append(el('div', { class: 'loc__field' },
      el('b', {}, '⤒ Fishing'), el('span', { class: 'grp' }, loc.rodGroup)));
    if (loc.smashGroup) lines.append(el('div', { class: 'loc__field' },
      el('b', {}, '⛏ Headbutt / Smash'), el('span', { class: 'grp' }, loc.smashGroup)));
    if (lines.childNodes.length) b.append(lines);

    // Special — static / gifts / trades callout
    if (loc.special && loc.special.trim()) {
      b.append(el('div', { class: 'callout' },
        el('span', { class: 'callout__icon' }, '✦'),
        el('div', { class: 'callout__text' },
          el('em', {}, 'Static · Gifts · Trades '), loc.special.trim())));
    }

    if (!b.childNodes.length) b.append(el('div', { class: 'loc__field' },
      el('span', { class: 'grp', style: { color: 'var(--muted-2)' } }, 'Town — no wild encounters')));

    card.append(b);
    return card;
  }

  // ---------- region block ----------
  function regionBlock(region) {
    const eraClass = ERA[region.name] || 'era-modern';
    const locs = (region.locations || []).filter(locMatches);
    const block = el('div', { class: eraClass });

    block.append(el('div', { class: 'era-band' },
      el('span', { class: 'era-band__dot' }),
      el('h3', {}, region.name),
      el('span', { class: 'era-band__rule' }),
      el('span', { class: 'era-band__count' }, locs.length + ' / ' + (region.locations || []).length)));

    if (!locs.length) {
      block.append(el('div', { class: 'empty' }, 'No habitats match your search here.'));
      return { block, count: locs.length };
    }
    const grid = el('div', { class: 'grid grid--wide loc-grid' });
    const cards = locs.map(locationCard);
    cards.forEach(c => grid.append(c));
    stagger(cards);
    block.append(grid);
    return { block, count: locs.length };
  }

  // ---------- reference helpers ----------
  function refTable(headers, rows) {
    return el('div', { class: 'ref__scroll' },
      el('table', { class: 'data-table' },
        el('thead', {}, el('tr', {}, headers.map(h => el('th', {}, h)))),
        el('tbody', {}, rows)));
  }
  const dash = v => (v && String(v).trim()) ? v : el('span', { style: { color: 'var(--muted-2)' } }, '—');

  function referenceBlock() {
    const ref = el('div', { class: 'era-modern' });
    ref.append(el('div', { class: 'ref-grid' },
      fishingCard(),
      headbuttCard(),
      olivineCard(),
      giftCard(),
      kimonoCard()));
    ref.append(grottosCard()); // full-width, special treatment
    return ref;
  }

  function fishingCard() {
    const rows = (data.fishGroups || []).map(g => el('tr', {},
      el('td', {}, el('strong', { style: { color: 'var(--accent)' } }, g.group)),
      el('td', {}, splitMons(g.old).length ? splitMons(g.old).map(n => monChip(n)) : dash(g.old)),
      el('td', {}, splitMons(g.good).length ? splitMons(g.good).map(n => monChip(n)) : dash(g.good)),
      el('td', {}, splitMons(g.super).length ? splitMons(g.super).map(n => monChip(n)) : dash(g.super))));
    return el('div', { class: 'facet ref ref--wide' },
      el('h3', {}, '⤒ Fishing Groups'),
      el('p', { class: 'ref__sub' }, 'Each location’s rod group resolves to these tables. Better rods reach rarer water-dwellers.'),
      refTable(['Group', 'Old Rod', 'Good Rod', 'Super Rod'], rows));
  }

  function headbuttCard() {
    const rows = (data.headbuttGroups || []).map(g => el('div', { class: 'grp-row' },
      el('span', { class: 'grp-name' }, g.group),
      el('span', { class: 'grp-mons' }, g.mons)));
    return el('div', { class: 'facet ref' },
      el('h3', {}, '⛏ Headbutt & Rock Smash'),
      el('p', { class: 'ref__sub' }, 'A location’s tree/rock group determines what falls out when you Headbutt or Rock Smash.'),
      el('div', {}, rows));
  }

  function olivineCard() {
    const rows = (data.olivineFishShop || []).map(f => el('tr', {},
      el('td', {}, monChip(f.species)),
      el('td', {}, f.item ? el('span', { class: 'chip' }, f.item) : dash()),
      el('td', {}, el('span', { class: 'lvl' }, f.move || '—'))));
    return el('div', { class: 'facet ref' },
      el('h3', {}, '🐟 Olivine Fish Shop'),
      el('p', { class: 'ref__sub' }, 'Purchasable specialists — each arrives holding an item and knowing an off-list move.'),
      refTable(['Species', 'Held Item', 'Special Move'], rows));
  }

  function giftCard() {
    const rows = (data.giftMons || []).map(g => el('tr', {},
      el('td', {}, g.npc),
      el('td', {}, monChip(g.species)),
      el('td', {}, g.item ? el('span', { class: 'chip' }, g.item) : dash()),
      el('td', {}, el('span', { class: 'lvl' }, g.move || '—'))));
    return el('div', { class: 'facet ref ref--wide' },
      el('h3', {}, '✦ Gift & Tutored Mons'),
      el('p', { class: 'ref__sub' }, 'NPCs hand these out with a held berry/item and a tutored move already learned.'),
      refTable(['NPC', 'Species', 'Held Item', 'Move'], rows));
  }

  function kimonoCard() {
    const rows = (data.kimonoCabin || []).map(k => el('tr', {},
      el('td', {}, el('strong', { style: { color: 'var(--accent)' } }, k.area)),
      el('td', {}, monChip(k.reward))));
    return el('div', { class: 'facet ref' },
      el('h3', {}, '❖ Kimono Cabin'),
      el('p', { class: 'ref__sub' }, 'Clear each room of the cabin to claim its hidden reward.'),
      refTable(['Area', 'Reward'], rows));
  }

  function grottosCard() {
    const grottoCell = (name, rankLabel, rankClass) => el('div', { class: 'grotto__cell' },
      monSprite(name),
      el('span', { class: 'grotto__rank ' + rankClass }, rankLabel),
      el('span', { class: 'grotto__name' }, name));

    const cards = (data.hiddenGrottos || []).map(g => el('article', { class: 'facet card grotto' },
      el('div', { class: 'grotto__top' },
        el('span', { class: 'tag tag--amber' }, 'Grotto'),
        el('span', { class: 'grotto__loc' }, g.location)),
      el('div', { class: 'grotto__item' },
        el('span', { style: { color: 'var(--muted)' } }, 'Item:'),
        el('span', { class: 'berry' }, g.item || '—')),
      el('div', { class: 'grotto__grid' },
        grottoCell(g.common1, 'Common', 'common'),
        grottoCell(g.common2, 'Common', 'common'),
        grottoCell(g.uncommon, 'Uncommon', 'uncommon'),
        grottoCell(g.rare, 'Rare', 'rare'))));

    return el('div', { class: 'era-historic', style: { marginTop: '6px' } },
      el('div', { class: 'gem-sub' },
        el('span', { class: 'ico' }, '✦'),
        el('h4', {}, 'Hidden Grottos'),
        el('span', { class: 'era-band__rule' }),
        el('span', { class: 'era-band__count' }, (data.hiddenGrottos || []).length + ' sites')),
      el('p', { class: 'ref__sub', style: { margin: '-2px 0 12px' } },
        'A completionist’s prize: rustling thickets that hide a rare held item and one of four graded encounters.'),
      el('div', { class: 'grottos' }, cards));
  }

  // ---------- paint ----------
  function paint() {
    clear(body);
    let shown = 0;

    const showModern = state.view === 'all' || state.view === 'modern';
    const showHistoric = state.view === 'all' || state.view === 'historic';
    const showRef = state.view === 'all' || state.view === 'reference';

    if (showModern || showHistoric) {
      regions.forEach(r => {
        const isModern = (ERA[r.name] || 'era-modern') === 'era-modern';
        if (isModern && !showModern) return;
        if (!isModern && !showHistoric) return;
        const { block, count } = regionBlock(r);
        shown += count;
        body.append(block);
      });
    }

    if (showRef) {
      const refWrap = el('div', { class: 'enc-ref' });
      if (state.view === 'reference') {
        refWrap.append(sectionHead('Field Reference', 'Tables & Curiosities',
          'Group tables, shop stock, gifts, and the hidden grottos that complete the dex.'));
      } else {
        refWrap.append(el('div', { class: 'era-modern' },
          el('div', { class: 'era-band' },
            el('span', { class: 'era-band__dot' }),
            el('h3', {}, 'Field Reference'),
            el('span', { class: 'era-band__rule' }))));
      }
      refWrap.append(referenceBlock());
      body.append(refWrap);
    }

    // count label
    if (state.view === 'reference') {
      countEl.textContent = 'reference';
    } else if (state.q) {
      countEl.textContent = shown + ' habitat' + (shown === 1 ? '' : 's') + ' found';
    } else {
      countEl.textContent = totalLocs + ' habitats';
    }
  }

  // deep link / initial tab: #/encounters/modern|historic|reference
  const seed = params && params[0] ? params[0].toLowerCase() : '';
  if (['modern', 'historic', 'reference'].includes(seed)) state.view = seed;
  syncTabs();
  paint();
}
