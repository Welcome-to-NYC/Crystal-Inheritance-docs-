// Shared UI utilities used by every view.
import { Store } from './data.js';

export const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Tiny hyperscript-style DOM builder.
 *  el('div', {class:'x', onClick:fn}, child1, 'text', [arr]) */
export function el(tag, props, ...kids) {
  const n = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
    else n.setAttribute(k, v);
  }
  for (const kid of kids.flat(3)) {
    if (kid == null || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

/** Resolve any free-text species name to its sprite-index record (or null). */
export function lookupMon(name) {
  if (!name) return null;
  const idx = Store.spriteIndex;
  if (idx[norm(name)]) return idx[norm(name)];
  let cleaned = name.replace(/\blv\.?\s*\d+\b/ig, '').replace(/\bline\b/ig, '')
                    .replace(/\(.*?\)/g, '').trim();
  if (idx[norm(cleaned)]) return idx[norm(cleaned)];
  const words = cleaned.split(/[\s,]+/).filter(Boolean);
  for (let take = words.length; take >= 1; take--) {
    const cand = norm(words.slice(-take).join(''));
    if (idx[cand]) return idx[cand];
  }
  return null;
}

export const TYPES = ['normal','fire','water','electric','grass','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];

export const cap = s => (s || '').charAt(0).toUpperCase() + (s || '').slice(1);

export function typeBadge(t) { return el('span', { class: `type type-${t}` }, t); }
export function typeRow(types) { return el('span', { class: 'type-row' }, (types || []).map(typeBadge)); }

/** A framed gem sprite tile for a species (by free-text name or dex record). */
export function monSprite(nameOrMon, opts = {}) {
  const mon = typeof nameOrMon === 'string' ? lookupMon(nameOrMon) : nameOrMon;
  const era = mon && Store.dexByKey[mon.key] ? Store.dexByKey[mon.key].spriteEra : (mon && mon.spriteEra);
  const src = mon && (mon.sprite || mon.spriteFile);
  const tile = el('div', { class: `sprite-tile ${era === 'modern' ? 'modern' : ''} ${opts.class || ''}` });
  if (src) tile.append(el('img', { src, alt: opts.alt || (mon && mon.name) || nameOrMon, loading: 'lazy' }));
  else tile.append(el('div', { class: 'sprite-ph' }, (typeof nameOrMon === 'string' ? nameOrMon : (mon && mon.name) || '???')));
  return tile;
}

/** Small inline sprite + label, linking to the Pokédex entry when known. */
export function monChip(name, opts = {}) {
  const mon = lookupMon(name);
  const inner = [
    el('span', { class: 'monchip__sprite sprite-tile ' + (mon && Store.dexByKey[mon.key] && Store.dexByKey[mon.key].spriteEra === 'modern' ? 'modern' : '') },
       mon && (mon.sprite || mon.spriteFile) ? el('img', { src: mon.sprite || mon.spriteFile, alt: name, loading: 'lazy' }) : el('span', { class: 'sprite-ph' }, '?')),
    el('span', { class: 'monchip__name' }, opts.label || name),
  ];
  if (mon && mon.key) return el('a', { class: 'monchip', href: `#/pokedex/${encodeURIComponent(mon.key)}` }, inner);
  return el('span', { class: 'monchip monchip--plain' }, inner);
}

export function sectionHead(kicker, title, desc) {
  return el('div', { class: 'section-head' },
    el('div', {},
      kicker && el('span', { class: 'section-head__kicker' }, kicker),
      el('h2', {}, title),
      desc && el('p', {}, desc)));
}

/** Minimal, safe markdown renderer for the credits document. */
export function renderMarkdown(md) {
  const wrap = el('div', { class: 'md' });
  let list = null;
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = t => esc(t)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  for (const raw of md.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    const li = line.match(/^\s*\*\s+(.*)$/);
    if (li) { list = list || el('ul', { class: 'md__list' }); list.append(el('li', { html: inline(li[1]) })); continue; }
    if (list) { wrap.append(list); list = null; }
    if (!line.trim()) continue;
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) wrap.append(el('h' + Math.min(h[1].length + 1, 5), { class: 'md__h', html: inline(h[2]) }));
    else wrap.append(el('p', { html: inline(line) }));
  }
  if (list) wrap.append(list);
  return wrap;
}

/** Stagger a fade-up reveal across a set of nodes. */
export function stagger(nodes, step = 28, max = 360) {
  nodes.forEach((n, i) => { n.classList.add('reveal'); n.style.animationDelay = Math.min(i * step, max) + 'ms'; });
}
