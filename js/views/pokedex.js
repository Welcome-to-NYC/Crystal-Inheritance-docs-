// Pokédex — searchable/filterable grid + rich detail modal.
import { Store } from '../data.js';
import { el, clear, norm, monSprite, typeBadge, sectionHead, lookupMon } from '../util.js';

const faithfulMap = () => {
  const m = {};
  (Store.meta.faithful || []).forEach(e => { m[norm(e.name)] = e.changes; });
  return m;
};

export function render(root, params) {
  const dex = Store.pokedex;
  const FAITH = faithfulMap();
  const state = { q: '', type: '', form: '', sort: 'dex' };

  const wrap = el('section', { class: 'section era-modern' });
  wrap.append(sectionHead('Living Archive · ' + dex.length + ' forms', 'Pokédex',
    'Every species catalogued in Crystal Inheritance — with movesets, evolution paths, and where each one roams. Sprites are authentic Gen II / GBC where the species existed; newer arrivals use modern art.'));

  // ---- filter bar ----
  const search = el('input', { class: 'input', type: 'search', placeholder: 'Search by name…', 'aria-label': 'Search Pokédex' });
  const typeSel = el('div', { class: 'pill-row' });
  const allTypes = [...new Set(dex.flatMap(m => m.types || []))].sort();
  const typeBtn = (t, label) => {
    const b = el('button', { class: 'pill' + (state.type === t ? ' active' : '') }, label || t);
    b.onclick = () => { state.type = state.type === t ? '' : t; sync(); paint(); };
    return b;
  };
  const formSel = el('div', { class: 'pill-row' });
  ['', 'Alolan', 'Galarian', 'Hisuian'].forEach(f => {
    const b = el('button', { class: 'pill' + (state.form === f ? ' active' : '') }, f || 'All forms');
    b.onclick = () => { state.form = f; sync(); paint(); };
    formSel.append(b);
  });
  const sortBtn = el('button', { class: 'pill' }, 'Sort: Dex №');
  sortBtn.onclick = () => { state.sort = state.sort === 'dex' ? 'name' : 'dex'; sortBtn.textContent = 'Sort: ' + (state.sort === 'dex' ? 'Dex №' : 'A–Z'); paint(); };
  const countEl = el('span', { class: 'count' });

  search.oninput = () => { state.q = norm(search.value); paint(); };

  const bar1 = el('div', { class: 'filterbar' }, el('div', { class: 'search' }, search), sortBtn, countEl);
  const bar2 = el('div', { class: 'filterbar', style: { marginTop: '-12px' } });
  allTypes.forEach(t => typeSel.append(typeBtn(t)));
  bar2.append(formSel, typeSel);
  wrap.append(bar1, bar2);

  function sync() {
    typeSel.querySelectorAll('.pill').forEach((b, i) => b.classList.toggle('active', b.textContent === state.type));
    formSel.querySelectorAll('.pill').forEach(b => b.classList.toggle('active', (b.textContent === 'All forms' ? '' : b.textContent) === state.form));
  }

  const grid = el('div', { class: 'grid grid--mons' });
  wrap.append(grid);
  root.append(wrap);

  function filtered() {
    let list = dex.filter(m =>
      (!state.q || norm(m.name).includes(state.q)) &&
      (!state.type || (m.types || []).includes(state.type)) &&
      (!state.form || m.form === state.form));
    list.sort(state.sort === 'name'
      ? (a, b) => a.name.localeCompare(b.name)
      : (a, b) => (a.sortKey || a.nationalNo) - (b.sortKey || b.nationalNo));
    return list;
  }

  function card(m) {
    const c = el('article', { class: 'facet card mon-card', tabindex: '0', role: 'button', 'aria-label': m.name });
    const art = monSprite(m, { class: 'mon-card__art' });
    c.append(art);
    if (m.form) c.append(el('span', { class: 'mon-card__form tag' + (m.form === 'Hisuian' || m.form === 'Galarian' ? ' tag--amber' : '') }, m.form));
    if (FAITH[norm(m.name)]) c.append(el('span', { class: 'mon-card__star', title: 'Faithful-mode differences' }, '✦'));
    c.append(el('div', { class: 'mon-card__body' },
      el('div', { class: 'mon-card__no' }, m.nationalNo < 9999 ? '№ ' + String(m.nationalNo).padStart(3, '0') : '— —'),
      el('h3', { class: 'mon-card__name' }, m.name),
      el('div', { class: 'mon-card__types' }, (m.types || []).map(typeBadge))));
    const open = () => openDetail(m, FAITH);
    c.onclick = open;
    c.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
    return c;
  }

  function paint() {
    clear(grid);
    const list = filtered();
    countEl.textContent = list.length + ' / ' + dex.length;
    if (!list.length) { grid.append(el('div', { class: 'empty' }, 'No Pokémon match those filters.')); return; }
    list.forEach(m => grid.append(card(m)));
  }
  paint();

  // deep link: #/pokedex/<key>
  if (params && params[0]) {
    const m = Store.dexByKey[params[0]] || lookupMon(params[0]);
    const target = m && (m.key ? Store.dexByKey[m.key] : null);
    if (target) openDetail(target, FAITH);
  }
}

// ---------- detail modal ----------
function findLocations(mon) {
  const terms = new Set([norm(mon.name), norm(mon.base)]);
  if (mon.form) terms.add(norm(mon.form + mon.base));
  const hit = s => { const n = norm(s); return [...terms].some(t => t && n.includes(t)); };
  const out = [];
  (Store.encounters.regions || []).forEach(r => r.locations.forEach(loc => {
    const tags = [];
    if ((loc.grass || []).some(hit)) tags.push('Grass');
    if (loc.surf && hit(loc.surf)) tags.push('Surf');
    if (loc.special && hit(loc.special)) tags.push('Special');
    if (tags.length) out.push({ region: r.name, location: loc.location, how: tags.join(' · ') });
  }));
  (Store.encounters.hiddenGrottos || []).forEach(g => {
    if ([g.common1, g.common2, g.uncommon, g.rare].some(hit)) out.push({ region: 'Hidden Grotto', location: g.location, how: 'Grotto' });
  });
  (Store.encounters.giftMons || []).forEach(g => { if (hit(g.species)) out.push({ region: 'Gift', location: g.npc, how: 'Held: ' + g.item }); });
  return out;
}

function evoNode(name) {
  const mon = lookupMon(name);
  const node = el('div', { class: 'evo-node' });
  const tile = monSprite(name);
  if (mon && mon.key) node.append(el('a', { href: `#/pokedex/${encodeURIComponent(mon.key)}`, onClick: () => closeModal() }, tile));
  else node.append(tile);
  node.append(el('small', {}, mon ? mon.name : name));
  return node;
}

function openDetail(m, FAITH) {
  const era = m.spriteEra === 'modern';
  const scrim = el('div', { class: 'modal-scrim' });
  scrim.onclick = e => { if (e.target === scrim) closeModal(); };

  const head = el('div', { class: 'detail__head' },
    monSprite(m, { class: 'detail__art' + (era ? ' modern' : '') }),
    el('div', {},
      el('div', { class: 'detail__no' }, m.nationalNo < 9999 ? 'NO. ' + String(m.nationalNo).padStart(3, '0') : 'CUSTOM'),
      el('h3', { class: 'detail__title' }, m.name),
      el('div', { class: 'mon-card__types', style: { marginTop: '4px' } }, (m.types || []).map(typeBadge))));

  const body = el('div', { class: 'detail__body' });

  // abilities
  if (m.abilities) {
    const ab = el('div', { class: 'abil-row' });
    (m.abilities.regular || []).forEach(a => ab.append(el('span', { class: 'abil' }, a)));
    if (m.abilities.hidden) ab.append(el('span', { class: 'abil abil--ha' }, m.abilities.hidden));
    const block = el('div', { class: 'detail__block' }, el('h4', {}, 'Abilities'), ab);
    if (m.abilitiesFaithful) {
      const f = m.abilitiesFaithful;
      const ftxt = [...(f.regular || []), f.hidden ? f.hidden + ' (HA)' : null].filter(Boolean).join(' · ');
      block.append(el('p', { class: 'faithful-note' }, el('b', {}, 'Faithful: '), ftxt));
    }
    body.append(block);
  }

  // base stats
  if (m.baseStats) {
    const s = m.baseStats;
    const order = [['HP', 'hp'], ['Atk', 'atk'], ['Def', 'def'], ['SpA', 'spa'], ['SpD', 'spd'], ['Spe', 'spe']];
    const rows = order.map(([lab, key]) => {
      const v = s[key], hue = Math.min(v, 160) / 160 * 120;
      return el('div', { class: 'stat-row' },
        el('span', { class: 'lab' }, lab),
        el('span', { class: 'val' }, v),
        el('div', { class: 'stat-bar' }, el('div', { class: 'stat-fill', style: { width: Math.min(v / 180 * 100, 100) + '%', background: `linear-gradient(90deg, hsl(${hue},68%,42%), hsl(${hue},80%,58%))` } })));
    });
    const panel = el('div', { class: 'detail__block' }, el('h4', {}, 'Base stats'),
      el('div', { class: 'stats' }, rows,
        el('div', { class: 'stat-total' }, el('span', { class: 'lab' }, 'Total'), el('span', { class: 'val' }, s.bst))));
    if (m.baseStatsFaithful) {
      const f = m.baseStatsFaithful;
      const diff = order.filter(([, k]) => f[k] !== s[k]).map(([lab, k]) => `${lab} ${f[k]}`).join(' · ');
      panel.append(el('p', { class: 'faithful-note' }, el('b', {}, 'Faithful mode: '), `${diff} (BST ${f.bst})`));
    }
    body.append(panel);
  }

  // faithful note
  const fc = FAITH[norm(m.name)];
  if (fc) body.append(el('div', { class: 'detail__block' },
    el('h4', {}, 'Faithful-mode differences'),
    el('ul', { class: 'md__list' }, fc.map(c => el('li', {}, c)))));

  // evolution family
  const pre = Store.evolvesFrom[norm(m.name)] || [];
  const evos = m.evolutions || [];
  if (pre.length || evos.length) {
    const flow = el('div', { class: 'evo-flow' });
    if (pre.length) {
      pre.slice(0, 2).forEach(p => { flow.append(evoNode(p.from.name)); flow.append(el('div', { class: 'evo-arrow' }, el('span', {}, '→'), el('em', {}, p.method))); });
    }
    flow.append(evoNode(m.name));
    if (evos.length === 1) {
      flow.append(el('div', { class: 'evo-arrow' }, el('span', {}, '→'), el('em', {}, evos[0].text)));
      flow.append(evoNode(evos[0].into));
    } else if (evos.length > 1) {
      flow.append(el('div', { class: 'evo-arrow' }, el('span', {}, '→')));
      flow.append(el('div', { class: 'evo-branch' }, evos.map(ev =>
        el('div', { class: 'evo-flow' }, evoNode(ev.into), el('em', { style: { fontSize: '10.5px', color: 'var(--muted)' } }, ev.text)))));
    }
    body.append(el('div', { class: 'detail__block' }, el('h4', {}, 'Evolution line'), flow));
  }

  // learnset
  if ((m.learnset || []).length) {
    const rows = m.learnset.map(l => el('tr', {}, el('td', { class: 'lvl' }, l.level === 1 ? '—' : 'L' + l.level), el('td', {}, l.move)));
    body.append(el('div', { class: 'detail__block' },
      el('h4', {}, 'Level-up moves'),
      el('div', { class: 'learnset-wrap' }, el('table', { class: 'data-table' },
        el('thead', {}, el('tr', {}, el('th', { style: { width: '64px' } }, 'Lv'), el('th', {}, 'Move'))),
        el('tbody', {}, rows)))));
  }

  // where to find
  const locs = findLocations(m);
  if (locs.length) body.append(el('div', { class: 'detail__block' },
    el('h4', {}, 'Where to find'),
    el('div', { class: 'find-list' }, locs.slice(0, 24).map(l =>
      el('span', { class: 'find-pill' }, el('b', {}, l.location), ' ', el('span', { class: 'tagdot' }, l.how))))));

  const modal = el('div', { class: 'facet facet--line modal era-modern' },
    el('button', { class: 'modal__close', 'aria-label': 'Close' }, '✕'),
    head, body);
  modal.querySelector('.modal__close').onclick = closeModal;
  scrim.append(modal);
  document.body.append(scrim);
  document.body.classList.add('no-scroll');
  document.addEventListener('keydown', escClose);
}

function escClose(e) { if (e.key === 'Escape') closeModal(); }
function closeModal() {
  document.querySelectorAll('.modal-scrim').forEach(s => s.remove());
  document.body.classList.remove('no-scroll');
  document.removeEventListener('keydown', escClose);
}
