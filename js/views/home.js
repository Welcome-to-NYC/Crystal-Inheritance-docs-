// Home — the "Field Archive" landing page.
// Hero · The Climb (level caps) · Completionist checklist · Faithful-mode changes · Explore.
import { Store } from '../data.js';
import { el, monChip, sectionHead, stagger } from '../util.js';

const STORE_KEY = 'ci-completionist';

/* One-time, namespaced style injection for components the base system
   doesn't cover. Everything lives under .home-view to avoid collisions. */
function injectStyles() {
  if (document.getElementById('home-view-style')) return;
  const css = `
.home-view { display: block; }

/* ---------- hero ---------- */
.hero { display: grid; grid-template-columns: minmax(0, 360px) 1fr; gap: clamp(24px, 5vw, 56px);
  align-items: center; margin: 4px 0 72px; }
.hero__art { position: relative; padding: 14px; --cut: var(--cut-lg);
  background:
    linear-gradient(155deg, rgba(var(--accent-rgb), .18), rgba(255,255,255,.02) 38%, transparent),
    var(--panel-2);
  box-shadow: 0 28px 80px -34px rgba(var(--accent-rgb), .8), inset 0 1px 0 rgba(255,255,255,.08); }
.hero__art::after { content: ''; position: absolute; inset: -1px; pointer-events: none; z-index: 3;
  background: linear-gradient(120deg, transparent 30%, rgba(var(--accent-glow-rgb, 125,247,236), .35) 50%, transparent 70%);
  background-size: 280% 280%; mix-blend-mode: screen; opacity: .55;
  clip-path: polygon(var(--cut-lg) 0, 100% 0, 100% calc(100% - var(--cut-lg)), calc(100% - var(--cut-lg)) 100%, 0 100%, 0 var(--cut-lg));
  animation: heroSheen 7s ease-in-out infinite; }
@keyframes heroSheen { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.hero__slab { position: relative; z-index: 2; aspect-ratio: 3 / 4; overflow: hidden; --cut: 14px; }
.hero__slab img { width: 100%; height: 100%; object-fit: cover; image-rendering: auto;
  filter: saturate(1.08) contrast(1.04); }
.hero__seal { position: absolute; z-index: 4; bottom: 6px; right: 8px;
  font-family: var(--font-pixel); font-size: 8px; letter-spacing: .5px; color: var(--accent);
  background: rgba(7,10,20,.78); border: 1px solid rgba(var(--accent-rgb), .35);
  padding: 4px 8px 3px; text-shadow: 0 0 8px rgba(var(--accent-rgb), .6);
  clip-path: polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px); }

.hero__body { min-width: 0; }
.hero__kicker { font-family: var(--font-pixel); font-size: 11px; letter-spacing: 1.5px; color: var(--accent);
  text-transform: uppercase; text-shadow: 0 0 12px rgba(var(--accent-rgb), .55); margin: 0 0 14px; }
.hero__title { font-family: var(--font-display); font-weight: 700; line-height: .92;
  font-size: clamp(40px, 8vw, 88px); letter-spacing: .005em; text-transform: uppercase; margin: 0; }
.hero__title b { display: block; color: transparent;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-glow) 55%, #fff 100%);
  -webkit-background-clip: text; background-clip: text;
  filter: drop-shadow(0 6px 26px rgba(var(--accent-rgb), .35)); }
.hero__tag { color: var(--muted); font-size: clamp(14px, 1.8vw, 16.5px); max-width: 56ch;
  margin: 18px 0 22px; line-height: 1.6; }
.hero__tag b { color: var(--cyan); font-weight: 600; }
.hero__tag i { color: var(--amber); font-style: normal; font-weight: 600; }
.hero__stats { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 26px; }
.stat { display: grid; gap: 2px; padding: 9px 15px 10px; min-width: 84px;
  background: rgba(255,255,255,.035); border: 1px solid var(--line);
  clip-path: polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px); }
.stat__n { font-family: var(--font-pixel); font-size: 15px; color: var(--accent);
  text-shadow: 0 0 10px rgba(var(--accent-rgb), .4); }
.stat__l { font-family: var(--font-display); font-weight: 600; font-size: 11px; letter-spacing: .07em;
  text-transform: uppercase; color: var(--muted); }
.hero__cta { display: flex; flex-wrap: wrap; gap: 12px; }
.btn--primary { color: #04120f !important;
  background: linear-gradient(135deg, var(--accent), var(--accent-glow)) !important;
  border-color: transparent !important; box-shadow: 0 10px 26px -10px rgba(var(--accent-rgb), .85); }
.btn--primary:hover { filter: brightness(1.08); }

/* ---------- the climb (level caps) ---------- */
.climb { position: relative; padding: 8px 0 4px; }
.climb__track { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
.stop { position: relative; padding: 16px 14px 15px; overflow: hidden; --cut: 11px; }
.stop::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(180deg, var(--accent), transparent); opacity: .75; }
.stop--opt { --accent: var(--amber); --accent-rgb: 255,194,77; }
.stop__no { font-family: var(--font-pixel); font-size: 9px; color: var(--muted-2); letter-spacing: .5px; }
.stop__cap { display: flex; align-items: baseline; gap: 5px; margin: 3px 0 6px; }
.stop__cap b { font-family: var(--font-pixel); font-size: 22px; line-height: 1; color: var(--accent);
  text-shadow: 0 0 14px rgba(var(--accent-rgb), .5); }
.stop__cap span { font-family: var(--font-pixel); font-size: 8px; color: var(--muted-2); letter-spacing: .5px; }
.stop__loc { font-family: var(--font-display); font-weight: 700; font-size: 15px; line-height: 1.15;
  letter-spacing: .01em; }
.stop__gem { position: absolute; top: 12px; right: 12px; width: 9px; height: 9px;
  background: var(--accent); box-shadow: 0 0 10px rgba(var(--accent-rgb), .8);
  clip-path: polygon(50% 0,100% 50%,50% 100%,0 50%); }
.stop__tag { margin-top: 9px; }
.climb__legend { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin: 18px 2px 0;
  font-size: 12.5px; color: var(--muted); }
.climb__legend .dot { display: inline-block; width: 9px; height: 9px; margin-right: 7px; vertical-align: middle;
  clip-path: polygon(50% 0,100% 50%,50% 100%,0 50%); }

/* ---------- completionist checklist ---------- */
.check__bar-wrap { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin: 0 0 22px; }
.check__meter { flex: 1; min-width: 200px; height: 12px; position: relative; overflow: hidden;
  background: rgba(8,12,24,.7); border: 1px solid var(--line);
  clip-path: polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px); }
.check__fill { height: 100%; width: 0; transition: width .45s cubic-bezier(.4,0,.2,1);
  background: linear-gradient(90deg, var(--accent-deep), var(--accent-glow));
  box-shadow: 0 0 14px rgba(var(--accent-rgb), .6); }
.check__count { font-family: var(--font-pixel); font-size: 12px; color: var(--accent); letter-spacing: .5px;
  white-space: nowrap; }
.check__count b { color: var(--ink); }
.check__reset { margin-left: auto; }
.check__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.objective { display: flex; align-items: flex-start; gap: 13px; padding: 13px 15px; cursor: pointer;
  text-align: left; width: 100%; color: var(--ink); font-family: inherit; font-size: 14px; line-height: 1.4;
  --cut: 9px; transition: background .18s, border-color .18s; }
.objective:hover { background: rgba(var(--accent-rgb), .06); }
.objective:focus-visible { outline: 2px solid rgba(var(--accent-rgb), .6); outline-offset: 2px; }
.objective__box { flex: none; width: 22px; height: 22px; position: relative; margin-top: 1px;
  background: rgba(8,12,24,.6); border: 1px solid rgba(var(--accent-rgb), .4);
  clip-path: polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px);
  display: grid; place-items: center; transition: background .18s; }
.objective__box::after { content: ''; width: 9px; height: 9px; background: var(--accent);
  clip-path: polygon(50% 0,100% 50%,50% 100%,0 50%); opacity: 0; transform: scale(.4); transition: all .18s;
  box-shadow: 0 0 8px rgba(var(--accent-rgb), .8); }
.objective.done .objective__box { background: rgba(var(--accent-rgb), .14); border-color: var(--accent); }
.objective.done .objective__box::after { opacity: 1; transform: scale(1); }
.objective.done .objective__txt { color: var(--muted-2); text-decoration: line-through;
  text-decoration-color: rgba(var(--accent-rgb), .5); }
.objective__n { font-family: var(--font-pixel); font-size: 8px; color: var(--muted-2); margin-right: 2px; }

/* ---------- faithful changes ---------- */
.faith__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
.faith-card { padding: 14px 15px 15px; --cut: 11px; }
.faith-card__head { display: flex; align-items: center; justify-content: space-between; gap: 8px;
  margin: 0 0 11px; padding-bottom: 11px; border-bottom: 1px solid var(--line); }
.faith-card__chg { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.faith-card__chg li { position: relative; padding-left: 16px; font-size: 13px; color: var(--ink); line-height: 1.4; }
.faith-card__chg li::before { content: '◆'; position: absolute; left: 0; top: 1px;
  color: var(--accent); font-size: 8px; }

/* ---------- explore ---------- */
.explore__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.navcard { display: block; padding: 20px 18px 18px; --cut: 12px; }
.navcard__ico { font-family: var(--font-pixel); font-size: 10px; letter-spacing: 1px; color: var(--accent);
  text-transform: uppercase; text-shadow: 0 0 10px rgba(var(--accent-rgb), .5); }
.navcard__h { font-family: var(--font-display); font-weight: 700; font-size: 21px; text-transform: uppercase;
  letter-spacing: .02em; margin: 6px 0 6px; }
.navcard__p { color: var(--muted); font-size: 13.5px; margin: 0; line-height: 1.5; }
.navcard__arrow { display: inline-block; margin-top: 12px; color: var(--accent); font-family: var(--font-display);
  font-weight: 600; font-size: 13px; letter-spacing: .08em; text-transform: uppercase;
  transition: transform .2s; }
.navcard:hover .navcard__arrow { transform: translateX(4px); }

@media (max-width: 820px) {
  .hero { grid-template-columns: 1fr; gap: 28px; }
  .hero__art { max-width: 320px; margin: 0 auto; }
}
`;
  document.head.append(el('style', { id: 'home-view-style', html: css }));
}

/* ----------------------------------------------------------------------- */

export function render(root) {
  injectStyles();
  const meta = Store.meta || {};
  const view = el('div', { class: 'home-view' });

  view.append(
    heroSection(),
    climbSection(meta.levelCaps || []),
    checklistSection(meta.completionist || {}),
    faithfulSection(meta.faithful || []),
    exploreSection(),
  );
  root.append(view);
}

/* ---------- 1. HERO ---------- */
function heroSection() {
  const dexCount = (Store.pokedex || []).length;

  const art = el('div', { class: 'facet facet--line hero__art' },
    el('div', { class: 'hero__slab cut' },
      el('img', { src: 'assets/boxart.png', alt: 'Crystal Inheritance box art', loading: 'eager' })),
    el('span', { class: 'hero__seal' }, 'CARTRIDGE · SEALED'));

  const stat = (n, l) => el('div', { class: 'stat' },
    el('span', { class: 'stat__n' }, n), el('span', { class: 'stat__l' }, l));

  const cta = (href, label, primary) =>
    el('a', { class: 'btn' + (primary ? ' btn--primary' : ''), href }, label);

  const body = el('div', { class: 'hero__body' },
    el('p', { class: 'hero__kicker' }, 'GEN II · JOHTO · v1.0.0'),
    el('h1', { class: 'hero__title' }, 'CRYSTAL ', el('b', {}, 'INHERITANCE')),
    el('p', { class: 'hero__tag' },
      'A modern-mechanics Johto adventure built on ', el('b', {}, 'Polished Crystal'),
      ' — one journey spanning two eras, ', el('b', {}, 'Modern Johto'), ' and ',
      el('i', {}, 'Historic Johto'), ', across all ', el('i', {}, '14 badges'),
      '. New types, abilities, and a remixed region await beneath the same crystal shell.'),
    el('div', { class: 'hero__stats' },
      stat(dexCount ? String(dexCount) : '—', 'Pokédex forms'),
      stat('14', 'Badges'),
      stat('2', 'Eras'),
      stat('16 → 60', 'Level climb')),
    el('div', { class: 'hero__cta' },
      cta('#/pokedex', 'Open Pokédex', true),
      cta('#/encounters', 'Wild Encounters'),
      cta('#/trainers', 'Trainer Rosters')));

  const hero = el('section', { class: 'hero era-modern' }, art, body);
  // Confident staggered fade-in of the hero pieces on load.
  stagger([art, body.querySelector('.hero__kicker'), body.querySelector('.hero__title'),
    body.querySelector('.hero__tag'), body.querySelector('.hero__stats'),
    body.querySelector('.hero__cta')], 70, 460);
  return hero;
}

/* ---------- 2. THE CLIMB (level caps) ---------- */
function climbSection(caps) {
  const wrap = el('section', { class: 'section era-modern climb' });
  wrap.append(sectionHead('The Climb · Lv 16 → 60',
    'The Crystal Path',
    'Nineteen waypoints chart the run from your first rival clash to the summit. Each stop raises the obedience cap; amber markers are optional detours — including Cynthia, the post-game crown at Lv 63.'));

  if (!caps.length) {
    wrap.append(el('div', { class: 'empty' }, 'Progression data unavailable.'));
    return wrap;
  }

  const track = el('div', { class: 'climb__track' });
  caps.forEach((c, i) => {
    const opt = !!c.optional;
    const stop = el('div', {
      class: 'facet facet--line card stop' + (opt ? ' stop--opt era-historic' : ''),
      'aria-label': `Stop ${i + 1}: ${c.location}, level cap ${c.cap}` + (opt ? ', optional' : ''),
    },
      el('span', { class: 'stop__gem' }),
      el('div', { class: 'stop__no' }, 'STOP ' + String(i + 1).padStart(2, '0')),
      el('div', { class: 'stop__cap' }, el('b', {}, c.cap), el('span', {}, 'CAP')),
      el('div', { class: 'stop__loc' }, c.location),
      opt && el('span', { class: 'tag tag--amber stop__tag' }, 'Optional'));
    track.append(stop);
  });
  wrap.append(track);

  wrap.append(el('div', { class: 'climb__legend' },
    el('span', {}, el('span', { class: 'dot', style: { background: 'var(--cyan)' } }), 'Required milestone'),
    el('span', {}, el('span', { class: 'dot', style: { background: 'var(--amber)' } }), 'Optional detour')));

  stagger([...track.children], 22, 420);
  return wrap;
}

/* ---------- 3. COMPLETIONIST CHECKLIST ---------- */
function loadChecked() {
  try { return new Set(JSON.parse(localStorage.getItem(STORE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveChecked(set) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify([...set])); } catch { /* storage may be unavailable */ }
}

function checklistSection(comp) {
  const items = comp.items || [];
  const wrap = el('section', { class: 'section section--narrow era-modern' });
  wrap.append(sectionHead('100% Run',
    comp.title || 'Completionist Checklist',
    'Every side-objective for a true clear of Crystal Inheritance v1.0.0. Your progress is saved in this browser, so tick them off as you go.'));

  if (!items.length) {
    wrap.append(el('div', { class: 'empty' }, 'Checklist unavailable.'));
    return wrap;
  }

  const checked = loadChecked();
  // Drop any stale indices that no longer exist in the dataset.
  [...checked].forEach(i => { if (i >= items.length) checked.delete(i); });

  const fill = el('div', { class: 'check__fill' });
  const count = el('span', { class: 'check__count' });
  const meter = el('div', { class: 'check__meter', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(items.length) }, fill);
  const resetBtn = el('button', { class: 'btn check__reset' }, 'Reset');

  const grid = el('div', { class: 'check__grid' });
  const rows = [];

  function refresh() {
    const n = checked.size;
    const pct = items.length ? Math.round((n / items.length) * 100) : 0;
    fill.style.width = pct + '%';
    count.innerHTML = '';
    count.append(el('b', {}, String(n)), document.createTextNode(' / ' + items.length + ' · ' + pct + '%'));
    meter.setAttribute('aria-valuenow', String(n));
  }

  items.forEach((text, i) => {
    const row = el('button', {
      class: 'facet objective' + (checked.has(i) ? ' done' : ''),
      type: 'button', role: 'checkbox', 'aria-checked': checked.has(i) ? 'true' : 'false',
    },
      el('span', { class: 'objective__box', 'aria-hidden': 'true' }),
      el('span', { class: 'objective__txt' },
        el('span', { class: 'objective__n' }, String(i + 1).padStart(2, '0') + ' '), text));
    row.onclick = () => {
      if (checked.has(i)) checked.delete(i); else checked.add(i);
      const on = checked.has(i);
      row.classList.toggle('done', on);
      row.setAttribute('aria-checked', on ? 'true' : 'false');
      saveChecked(checked);
      refresh();
    };
    rows.push(row);
    grid.append(row);
  });

  resetBtn.onclick = () => {
    checked.clear();
    saveChecked(checked);
    rows.forEach(r => { r.classList.remove('done'); r.setAttribute('aria-checked', 'false'); });
    refresh();
  };

  wrap.append(el('div', { class: 'check__bar-wrap' }, meter, count, resetBtn), grid);
  refresh();
  stagger(rows, 14, 320);
  return wrap;
}

/* ---------- 4. FAITHFUL-MODE CHANGES ---------- */
function faithfulSection(faithful) {
  const wrap = el('section', { class: 'section era-modern' });
  wrap.append(sectionHead('Non-Faithful Tweaks',
    'Faithful Mode',
    'Crystal Inheritance ships with non-faithful balance tweaks; toggling Faithful Mode at the start reverts these species to their official stats, types, and abilities.'));

  if (!faithful.length) {
    wrap.append(el('div', { class: 'empty' }, 'No faithful-mode changes documented.'));
    return wrap;
  }

  const grid = el('div', { class: 'faith__grid' });
  faithful.forEach(entry => {
    const card = el('article', { class: 'facet facet--line card faith-card' },
      el('div', { class: 'faith-card__head' },
        monChip(entry.name),
        el('span', { class: 'tag' }, (entry.changes || []).length + (entry.changes && entry.changes.length === 1 ? ' tweak' : ' tweaks'))),
      el('ul', { class: 'faith-card__chg' },
        (entry.changes || []).map(c => el('li', {}, c))));
    grid.append(card);
  });
  wrap.append(grid);
  stagger([...grid.children], 26, 360);
  return wrap;
}

/* ---------- 5. EXPLORE ---------- */
function exploreSection() {
  const wrap = el('section', { class: 'section era-modern' });
  wrap.append(sectionHead('Field Archive', 'Explore the Cartridge',
    'Dive deeper into the data unearthed from Crystal Inheritance.'));

  const cards = [
    { href: '#/pokedex', ico: 'DEX', h: 'Pokédex', p: 'Every catalogued form with movesets, evolution lines, and where each roams.', era: 'era-modern' },
    { href: '#/encounters', ico: 'WILD', h: 'Encounters', p: 'Grass, surf, and hidden grotto tables for every route and cave.', era: 'era-modern' },
    { href: '#/trainers', ico: 'VS', h: 'Trainers', p: 'Gym leaders, rivals, and bosses — full rosters and held items.', era: 'era-historic' },
    { href: '#/items', ico: 'BAG', h: 'Items & TMs', p: 'Where to find every key item, TM, and HM across both eras.', era: 'era-historic' },
    { href: '#/credits', ico: 'STAFF', h: 'Credits', p: 'The team behind the romhack and this fan-made archive.', era: 'era-modern' },
  ];

  const grid = el('div', { class: 'explore__grid' });
  cards.forEach(c => {
    grid.append(el('a', { class: 'facet facet--line card navcard ' + c.era, href: c.href },
      el('span', { class: 'navcard__ico' }, c.ico),
      el('h3', { class: 'navcard__h' }, c.h),
      el('p', { class: 'navcard__p' }, c.p),
      el('span', { class: 'navcard__arrow' }, 'Enter →')));
  });
  wrap.append(grid);
  stagger([...grid.children], 30, 320);
  return wrap;
}
