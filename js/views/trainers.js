// Trainers — major opponents, rivals & bosses with full battle-prep rosters.
// Easy / Normal / Expert share the same trainers; teams scale in strength & movesets.
import { Store } from '../data.js';
import { el, clear, norm, monSprite, monChip, sectionHead, stagger } from '../util.js';

const DIFFS = [
  { key: 'easy',   label: 'Easy' },
  { key: 'normal', label: 'Normal' },
  { key: 'expert', label: 'Expert' },
];

// One id-guarded, namespaced style block for the battle-slot component.
function ensureStyles() {
  if (document.getElementById('trn-styles')) return;
  const css = `
.trn-view .trn-grid { grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); align-items: start; }
.trn-view .trn-card { padding: 0; --cut: 12px; display: flex; flex-direction: column; }

.trn-view .trn-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px 12px;
  background: linear-gradient(150deg, rgba(var(--accent-rgb), .14), transparent 62%);
  border-bottom: 1px solid var(--line); }
.trn-view .trn-head__main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.trn-view .trn-head__name { font-family: var(--font-display); font-weight: 700; font-size: 21px;
  line-height: 1; letter-spacing: .015em; text-transform: uppercase; }
.trn-view .trn-head__meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.trn-view .trn-vs { font-family: var(--font-pixel); font-size: 11px; line-height: 1; color: var(--accent);
  text-shadow: 0 0 10px rgba(var(--accent-rgb), .55); flex: none;
  border: 1px solid rgba(var(--accent-rgb), .4); padding: 7px 8px 6px;
  clip-path: polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px); }
.trn-view .trn-cap { font-family: var(--font-pixel); font-size: 10px; color: var(--gold); letter-spacing: .5px; }

.trn-view .trn-team { display: grid; gap: 8px; padding: 12px;
  grid-template-columns: repeat(auto-fill, minmax(138px, 1fr)); }

.trn-view .slot { position: relative; background:
    radial-gradient(120% 90% at 50% 0, rgba(var(--accent-rgb), .08), transparent 60%),
    rgba(8,12,24,.5);
  border: 1px solid var(--line); padding: 8px 9px 9px;
  clip-path: polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);
  display: flex; flex-direction: column; gap: 6px; transition: border-color .15s, background .15s; }
.trn-view .slot:hover { border-color: rgba(var(--accent-rgb), .45); background:
    radial-gradient(120% 90% at 50% 0, rgba(var(--accent-rgb), .14), transparent 60%),
    rgba(8,12,24,.5); }

.trn-view .slot__top { display: flex; align-items: center; gap: 8px; }
.trn-view .slot__sprite { width: 44px; height: 44px; flex: none; --cut: 8px; }
.trn-view .slot__id { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.trn-view .slot__species { font-family: var(--font-display); font-weight: 700; font-size: 14px;
  line-height: 1.05; letter-spacing: .01em; }
.trn-view .slot__species a { color: var(--ink); }
.trn-view .slot__species a:hover { color: var(--accent); }
.trn-view .slot__lvl { font-family: var(--font-pixel); font-size: 9px; color: var(--gold);
  letter-spacing: .5px; line-height: 1; }
.trn-view .slot__nick { font-family: var(--font-display); font-weight: 600; font-size: 11.5px;
  font-style: italic; color: var(--accent-glow); }

.trn-view .slot__item { align-self: flex-start; display: inline-flex; align-items: center; gap: 5px;
  font-size: 10.5px; padding: 3px 7px 2px; max-width: 100%; }
.trn-view .slot__item .ico { font-size: 9px; color: var(--amber); }
.trn-view .slot__item .nm { color: var(--gold); font-weight: 600; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; }

.trn-view .slot__moves { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-top: auto; }
.trn-view .move { font-family: var(--font-display); font-weight: 600; font-size: 10px;
  letter-spacing: .02em; color: var(--muted); background: rgba(255,255,255,.035);
  border: 1px solid var(--line); padding: 4px 6px 3px; line-height: 1.15; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  clip-path: polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px); }
.trn-view .move--solo { grid-column: 1 / -1; }
.trn-view .slot__nomoves { font-family: var(--font-pixel); font-size: 8px; color: var(--muted-2);
  letter-spacing: .5px; text-align: center; padding: 3px 0; margin-top: auto; }

@media (max-width: 560px) {
  .trn-view .trn-grid { grid-template-columns: 1fr; }
  .trn-view .trn-team { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); }
}`;
  document.head.append(el('style', { id: 'trn-styles', html: css }));
}

const highestLevel = team => team.reduce((m, p) => Math.max(m, p.level || 0), 0);

// A single Pokémon "battle slot" cell.
function slot(p) {
  const cell = el('div', { class: 'facet slot' });

  // Reuse monChip's Pokédex resolution (it returns an <a> when the species is known,
  // a plain <span> otherwise) but render our own dense, sprite-separated layout.
  const chip = monChip(p.species);
  const isLink = chip.tagName === 'A';
  const nameNode = el(isLink ? 'a' : 'span',
    isLink ? { href: chip.getAttribute('href') } : {},
    p.species);
  const id = el('div', { class: 'slot__id' },
    el('div', { class: 'slot__species' }, nameNode));
  id.append(el('span', { class: 'slot__lvl' }, 'Lv.' + (p.level ?? '—')));
  if (p.nickname) id.append(el('span', { class: 'slot__nick' }, '“' + p.nickname + '”'));

  cell.append(el('div', { class: 'slot__top' },
    monSprite(p.species, { class: 'slot__sprite' }),
    id));

  if (p.item) cell.append(el('span', { class: 'chip tag--amber slot__item', title: 'Held item' },
    el('span', { class: 'ico' }, '◆'),
    el('span', { class: 'nm' }, p.item)));

  const moves = (p.moves || []).filter(Boolean);
  if (moves.length) {
    const grid = el('div', { class: 'slot__moves' });
    moves.forEach(mv => grid.append(el('span',
      { class: 'move' + (moves.length === 1 ? ' move--solo' : ''), title: mv }, mv)));
    cell.append(grid);
  } else {
    cell.append(el('div', { class: 'slot__nomoves' }, 'Moveset undisclosed'));
  }
  return cell;
}

// A trainer roster card.
function trainerCard(t) {
  const cap = highestLevel(t.team);
  const card = el('article', { class: 'facet card trn-card', 'aria-label': t.name });
  card.append(el('div', { class: 'trn-head' },
    el('span', { class: 'trn-vs' }, 'VS'),
    el('div', { class: 'trn-head__main' },
      el('h3', { class: 'trn-head__name' }, t.name),
      el('div', { class: 'trn-head__meta' },
        el('span', { class: 'count' }, t.team.length + (t.team.length === 1 ? ' Pokémon' : ' Pokémon team')),
        cap ? el('span', { class: 'trn-cap' }, 'Lv.' + cap) : null))));
  const team = el('div', { class: 'trn-team' });
  t.team.forEach(p => team.append(slot(p)));
  card.append(team);
  return card;
}

export function render(root, params) {
  ensureStyles();
  const data = Store.trainers || {};

  // deep-link difficulty: #/trainers/expert
  const deep = params && params[0] ? norm(params[0]) : '';
  const startKey = DIFFS.some(d => d.key === deep) ? deep : 'normal';
  const state = { diff: startKey, q: '' };

  const wrap = el('section', { class: 'section era-modern trn-view' });
  wrap.append(sectionHead('Battle Archive · 41 opponents',
    'Trainers',
    'The major trainers, rival encounters and bosses of Crystal Inheritance — each card a battle-prep dossier of species, levels, held items and movesets. Easy, Normal and Expert pit you against the same opponents, but the teams grow tougher and the movesets sharper as you climb; level caps run 16 → 60, with bosses fielding full teams of six.'));

  // ---- difficulty pills ----
  const diffRow = el('div', { class: 'pill-row' });
  DIFFS.forEach(d => {
    const b = el('button', { class: 'pill' + (state.diff === d.key ? ' active' : ''), 'data-diff': d.key }, d.label);
    b.onclick = () => {
      if (state.diff === d.key) return;
      state.diff = d.key;
      diffRow.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.diff === d.key));
      try { history.replaceState(null, '', '#/trainers/' + d.key); } catch (_) {}
      paint();
    };
    diffRow.append(b);
  });

  // ---- search ----
  const search = el('input', { class: 'input', type: 'search',
    placeholder: 'Search trainer or species…', 'aria-label': 'Search trainers' });
  search.oninput = () => { state.q = norm(search.value); paint(); };
  const countEl = el('span', { class: 'count' });

  wrap.append(
    el('div', { class: 'filterbar' }, diffRow),
    el('div', { class: 'filterbar' }, el('div', { class: 'search' }, search), countEl));

  const grid = el('div', { class: 'grid trn-grid' });
  wrap.append(grid);
  root.append(wrap);

  function filtered() {
    const list = data[state.diff] || [];
    if (!state.q) return list;
    return list.filter(t =>
      norm(t.name).includes(state.q) ||
      t.team.some(p => norm(p.species).includes(state.q) || (p.nickname && norm(p.nickname).includes(state.q))));
  }

  function paint() {
    clear(grid);
    const all = data[state.diff] || [];
    const list = filtered();
    countEl.textContent = list.length + ' / ' + all.length;
    if (!list.length) {
      grid.append(el('div', { class: 'empty' }, 'No trainers match that search.'));
      return;
    }
    const cards = list.map(trainerCard);
    cards.forEach(c => grid.append(c));
    stagger(cards);
  }
  paint();
}
