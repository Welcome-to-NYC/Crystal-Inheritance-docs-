// Credits — the closing artbook page.
// Parses Store.credits (markdown) into a table-of-contents + faceted
// "document" panels, laid out as a comfortable reading column with
// responsive multi-column masonry for the long bullet rosters.
import { Store } from '../data.js';
import { el, renderMarkdown, sectionHead, stagger, norm } from '../util.js';

/* One-time, namespaced style injection. Everything lives under .cred-view
   to avoid collisions with the base design system. On-aesthetic only:
   gem-cut clip-paths, cyan/amber accents, pixel-font heading accents. */
function injectStyles() {
  if (document.getElementById('cred-view-style')) return;
  const css = `
.cred-view { display: block; }

/* ---------- two-column shell: sticky TOC + reading column ---------- */
.cred-shell { display: grid; grid-template-columns: minmax(0, 244px) minmax(0, 1fr);
  gap: clamp(20px, 3.4vw, 48px); align-items: start; }

/* ---------- table of contents ---------- */
.cred-toc { position: sticky; top: 84px; padding: 18px 16px 20px; --cut: 12px; }
.cred-toc__kicker { font-family: var(--font-pixel); font-size: 9px; letter-spacing: 1px;
  text-transform: uppercase; color: var(--accent); margin: 0 0 13px; padding-bottom: 11px;
  border-bottom: 1px solid var(--line); text-shadow: 0 0 10px rgba(var(--accent-rgb), .5); }
.cred-toc__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px; }
.cred-toc__link { display: flex; align-items: baseline; gap: 9px; padding: 6px 8px;
  font-family: var(--font-display); font-weight: 600; font-size: 13px; letter-spacing: .01em;
  color: var(--muted); line-height: 1.25;
  clip-path: polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px);
  transition: color .16s, background .16s; }
.cred-toc__link:hover { color: var(--ink); background: rgba(var(--accent-rgb), .07); }
.cred-toc__link.active { color: var(--ink); background: rgba(var(--accent-rgb), .1); }
.cred-toc__n { font-family: var(--font-pixel); font-size: 8px; color: var(--muted-2);
  flex: none; min-width: 16px; }
.cred-toc__link.active .cred-toc__n,
.cred-toc__link:hover .cred-toc__n { color: var(--accent); }
.cred-toc__sub .cred-toc__link { padding-left: 26px; font-size: 12px; font-weight: 500; }
.cred-toc__divider { margin: 11px 2px 4px; padding-top: 11px; border-top: 1px dashed var(--line);
  font-family: var(--font-pixel); font-size: 8px; letter-spacing: 1px; text-transform: uppercase;
  color: var(--amber); text-shadow: 0 0 10px rgba(255,194,77,.45); }

/* ---------- reading column ---------- */
.cred-doc { min-width: 0; display: grid; gap: 22px; }

/* intro prose — generous artbook measure */
.cred-intro { padding: 26px clamp(20px, 3vw, 34px); --cut: var(--cut-lg); }
.cred-intro .md p { max-width: 62ch; font-size: 15.5px; line-height: 1.72; color: var(--ink);
  margin: 0 0 13px; }
.cred-intro .md p:last-child { margin-bottom: 0; }
.cred-intro .md p:first-child { color: var(--ink); font-size: 16.5px; }
.cred-intro .md a { color: var(--accent); }

/* a section panel in the document */
.cred-sec { scroll-margin-top: 84px; padding: 22px clamp(18px, 2.6vw, 30px) 24px; --cut: 13px; }
.cred-sec__head { display: flex; align-items: baseline; gap: 12px; margin: 0 0 4px;
  padding-bottom: 14px; border-bottom: 1px solid rgba(var(--accent-rgb), .22); flex-wrap: wrap; }
.cred-sec__no { font-family: var(--font-pixel); font-size: 10px; color: var(--accent);
  text-shadow: 0 0 10px rgba(var(--accent-rgb), .5); flex: none; }
.cred-sec__title { font-family: var(--font-display); font-weight: 700; font-size: clamp(20px, 2.6vw, 27px);
  letter-spacing: .015em; text-transform: uppercase; line-height: 1.04; margin: 0; color: var(--ink); }
.cred-sec__count { margin-left: auto; align-self: center; }

/* the parsed markdown body inside a section */
.cred-sec__body { margin-top: 16px; }
.cred-sec__body .md__h { font-family: var(--font-display); font-weight: 700; text-transform: uppercase;
  letter-spacing: .04em; font-size: 14px; color: var(--accent); margin: 18px 0 9px; }
.cred-sec__body .md p { color: var(--muted); max-width: 64ch; line-height: 1.62; margin: 0 0 12px; }
.cred-sec__body .md a { color: var(--accent); border-bottom: 1px solid rgba(var(--accent-rgb), .35); }
.cred-sec__body .md a:hover { color: var(--accent-glow); }
.cred-sec__body .md strong { color: var(--ink); font-weight: 600; }

/* multi-column masonry for bullet-heavy rosters so they don't run forever */
.cred-sec__body .md__list { columns: 2 248px; column-gap: clamp(22px, 3vw, 40px);
  list-style: none; margin: 4px 0 0; padding: 0; }
.cred-sec__body .md__list li { break-inside: avoid; position: relative; padding: 4px 0 4px 17px;
  font-size: 14px; line-height: 1.5; color: var(--ink); }
.cred-sec__body .md__list li::before { content: '◆'; position: absolute; left: 0; top: 5px;
  color: var(--accent); font-size: 8px; opacity: .9; }
.cred-sec__body .md__list li strong { color: var(--accent); font-weight: 600; }
/* prose paragraphs that precede a list shouldn't be clipped into a column */
.cred-sec__body .md > p + .md__list { margin-top: 10px; }

/* ---------- upstream (Polished Crystal) divider banner ---------- */
.cred-upstream { position: relative; margin: 14px 0 2px; padding: 22px clamp(18px, 2.6vw, 28px);
  --cut: var(--cut-lg); overflow: hidden; }
.cred-upstream::after { content: ''; position: absolute; right: -40px; top: -40px; width: 180px; height: 180px;
  background: radial-gradient(circle, rgba(255,194,77,.16), transparent 68%); pointer-events: none; }
.cred-upstream__kicker { font-family: var(--font-pixel); font-size: 9px; letter-spacing: 1px;
  text-transform: uppercase; color: var(--amber); margin: 0 0 9px;
  text-shadow: 0 0 10px rgba(255,194,77,.5); }
.cred-upstream__title { font-family: var(--font-display); font-weight: 700; font-size: clamp(22px, 3.2vw, 32px);
  letter-spacing: .02em; text-transform: uppercase; line-height: 1; margin: 0 0 9px; color: var(--ink); }
.cred-upstream__p { color: var(--muted); max-width: 60ch; margin: 0; font-size: 14.5px; line-height: 1.6; }
.cred-upstream__p b { color: var(--amber); font-weight: 600; }

/* ---------- closing footer note (in-page) ---------- */
.cred-coda { margin-top: 30px; padding: 24px clamp(20px, 3vw, 32px) 26px; --cut: 13px; text-align: center; }
.cred-coda__gem { width: 26px; height: 26px; margin: 0 auto 14px;
  background: conic-gradient(from 45deg, var(--cyan), var(--gold), var(--violet), var(--cyan));
  clip-path: polygon(50% 0,100% 38%,80% 100%,20% 100%,0 38%);
  box-shadow: 0 0 18px rgba(var(--accent-rgb), .6); animation: spin 16s linear infinite; }
.cred-coda__mark { font-family: var(--font-pixel); font-size: 10px; letter-spacing: 1px;
  text-transform: uppercase; color: var(--accent); margin: 0 0 12px;
  text-shadow: 0 0 12px rgba(var(--accent-rgb), .5); }
.cred-coda__note { color: var(--muted); font-size: 13px; line-height: 1.7; max-width: 62ch;
  margin: 0 auto; }
.cred-coda__note b { color: var(--cyan); font-weight: 600; }
.cred-coda__note i { color: var(--amber); font-style: normal; font-weight: 600; }
.cred-coda__note a { color: var(--amber); border-bottom: 1px solid rgba(255,194,77,.4); }
.cred-coda__note a:hover { color: var(--gold); }

/* ---------- responsive ---------- */
@media (max-width: 900px) {
  .cred-shell { grid-template-columns: 1fr; gap: 22px; }
  .cred-toc { position: static; top: auto; }
  .cred-toc__list { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 2px; }
  .cred-toc__sub .cred-toc__link { padding-left: 20px; }
}
@media (max-width: 520px) {
  .cred-sec__body .md__list { columns: 1; }
}
`;
  document.head.append(el('style', { id: 'cred-view-style', html: css }));
}

/* ----------------------------------------------------------------------- *
 *  Parse the credits markdown into structured sections.
 *  - Anything before the first `##` is the intro (rendered as prose).
 *  - Each `##` opens a new section; its body is raw markdown.
 *  - "Polished Crystal 3.0.0 Credits" acts as a banner: it has empty body
 *    and the `##` sections after it are its sub-sections (rendered amber).
 * ----------------------------------------------------------------------- */
const UPSTREAM_RE = /polished crystal/i;
const slugify = s => norm(s) || 'sec';

function parseCredits(md) {
  const lines = (md || '').split('\n');
  const intro = [];
  const sections = [];
  let cur = null;
  for (const raw of lines) {
    const h2 = raw.match(/^##\s+(.*)$/);
    if (h2) {
      cur = { title: h2[1].trim(), body: [] };
      sections.push(cur);
    } else if (cur) {
      cur.body.push(raw);
    } else {
      // strip a leading `# Credits` H1 — the page header already covers it
      if (!/^#\s+/.test(raw)) intro.push(raw);
    }
  }
  // de-dupe slugs so anchors stay unique
  const seen = {};
  sections.forEach(s => {
    s.body = s.body.join('\n').replace(/^\n+|\n+$/g, '');
    let base = slugify(s.title), id = base, n = 1;
    while (seen[id]) id = base + '-' + (++n);
    seen[id] = true;
    s.id = 'cred-' + id;
    s.banner = UPSTREAM_RE.test(s.title) && !s.body.trim();
    s.bulletCount = (s.body.match(/^\s*\*\s+/gm) || []).length;
  });
  return { intro: intro.join('\n').replace(/^\n+|\n+$/g, ''), sections };
}

/* ----------------------------------------------------------------------- */

export function render(root) {
  injectStyles();
  const { intro, sections } = parseCredits(Store.credits);

  const view = el('div', { class: 'cred-view era-modern' });
  view.append(sectionHead(
    'With gratitude', 'Credits',
    'Crystal Inheritance stands on the shoulders of Polished Crystal and a huge community of spriters, musicians, and coders.'));

  // Empty-data guard.
  if (!sections.length && !intro) {
    view.append(el('section', { class: 'section' }, el('div', { class: 'empty' }, 'Credits document unavailable.')));
    root.append(view);
    return;
  }

  // Determine where the upstream block begins (for TOC grouping + theming).
  const upstreamIdx = sections.findIndex(s => s.banner);

  const shell = el('div', { class: 'cred-shell' });
  shell.append(buildToc(sections, upstreamIdx));
  shell.append(buildDocument(intro, sections, upstreamIdx));
  view.append(el('section', { class: 'section' }, shell));

  view.append(coda());
  root.append(view);

  // Scroll-spy: highlight the active TOC entry as sections pass the top.
  setupScrollSpy(view, sections);
}

/* ---------- table of contents ---------- */
function buildToc(sections, upstreamIdx) {
  const list = el('ul', { class: 'cred-toc__list' });

  sections.forEach((s, i) => {
    // The upstream block opens with a labelled divider; its sections indent.
    if (s.banner) {
      list.append(el('li', { class: 'cred-toc__divider' }, 'Polished Crystal 3.0.0'));
    }
    // Sub-items are the sections that live *after* the upstream banner.
    const isSub = upstreamIdx >= 0 && i > upstreamIdx;
    const label = s.banner ? 'Upstream Credits' : s.title;
    const link = el('a', {
      class: 'cred-toc__link',
      href: '#' + s.id,
      onClick: e => { e.preventDefault(); scrollToSection(s.id); },
    },
      el('span', { class: 'cred-toc__n' }, String(i + 1).padStart(2, '0')),
      el('span', {}, label));
    link.dataset.target = s.id;
    list.append(el('li', { class: isSub ? 'cred-toc__sub' : '' }, link));
  });

  return el('nav', { class: 'facet facet--line cred-toc', 'aria-label': 'Credits sections' },
    el('div', { class: 'cred-toc__kicker' }, 'Contents'),
    list);
}

/* ---------- reading column ---------- */
function buildDocument(intro, sections, upstreamIdx) {
  const doc = el('div', { class: 'cred-doc' });

  if (intro) {
    doc.append(el('div', { class: 'facet facet--line cred-intro cut' }, renderMarkdown(intro)));
  }

  sections.forEach((s, i) => {
    const upstream = upstreamIdx >= 0 && i >= upstreamIdx;

    if (s.banner) {
      doc.append(upstreamBanner(s));
      return;
    }

    const sec = el('section', {
      class: 'facet facet--line cred-sec cut' + (upstream ? ' era-historic' : ''),
      id: s.id,
    });
    const head = el('div', { class: 'cred-sec__head' },
      el('span', { class: 'cred-sec__no' }, String(i + 1).padStart(2, '0')),
      el('h3', { class: 'cred-sec__title' }, s.title));
    if (s.bulletCount > 0) {
      head.append(el('span', {
        class: 'tag cred-sec__count' + (upstream ? ' tag--amber' : ''),
      }, s.bulletCount + (s.bulletCount === 1 ? ' credit' : ' credits')));
    }
    sec.append(head);
    if (s.body.trim()) {
      sec.append(el('div', { class: 'cred-sec__body' }, renderMarkdown(s.body)));
    }
    doc.append(sec);
  });

  // Confident, gentle stagger across the document blocks.
  stagger([...doc.children], 30, 420);
  return doc;
}

function upstreamBanner(s) {
  return el('div', { class: 'facet facet--line cred-upstream cut-lg era-historic', id: s.id },
    el('div', { class: 'cred-upstream__kicker' }, 'Built upon'),
    el('h3', { class: 'cred-upstream__title' }, 'Polished Crystal 3.0.0'),
    el('p', { class: 'cred-upstream__p' },
      'Crystal Inheritance is a romhack of ', el('b', {}, 'Polished Crystal'),
      ' and would not exist without its developers and contributors. Their full v3.0.0 credits follow.'));
}

/* ---------- closing coda / fan-archive note ---------- */
function coda() {
  return el('section', { class: 'section' },
    el('div', { class: 'facet facet--line cred-coda cut era-modern' },
      el('div', { class: 'cred-coda__gem', 'aria-hidden': 'true' }),
      el('div', { class: 'cred-coda__mark' }, '— End of Archive —'),
      el('p', { class: 'cred-coda__note' },
        'This is an ', el('b', {}, 'unofficial fan archive'),
        '. Pokémon © Nintendo · Game Freak · Creatures Inc. Game data and these credits are drawn from the official ',
        el('i', {}, 'Crystal Inheritance'), ' documentation; supplementary sprites and type data are sourced via ',
        el('a', { href: 'https://pokeapi.co/', target: '_blank', rel: 'noopener' }, 'PokeAPI'),
        '. All trademarks belong to their respective owners — made with gratitude, for the love of the game.')));
}

/* ---------- navigation helpers ---------- */
function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + location.hash);
}

function setupScrollSpy(view, sections) {
  const links = [...view.querySelectorAll('.cred-toc__link')];
  if (!links.length || typeof IntersectionObserver === 'undefined') return;
  const byId = {};
  links.forEach(l => { byId[l.dataset.target] = l; });

  const visible = new Set();
  const setActive = id => links.forEach(l => l.classList.toggle('active', l.dataset.target === id));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id);
    });
    // Pick the topmost currently-visible section.
    let top = null, topY = Infinity;
    visible.forEach(id => {
      const r = document.getElementById(id);
      if (r) { const y = r.getBoundingClientRect().top; if (y < topY) { topY = y; top = id; } }
    });
    if (top && byId[top]) setActive(top);
  }, { rootMargin: '-80px 0px -55% 0px', threshold: 0 });

  sections.forEach(s => { const node = document.getElementById(s.id); if (node) io.observe(node); });
}
