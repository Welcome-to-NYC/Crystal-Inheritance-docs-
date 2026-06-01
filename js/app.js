import { loadAll } from './data.js';
import { el } from './util.js';

const ROUTES = {
  '':           './views/home.js',
  'pokedex':    './views/pokedex.js',
  'encounters': './views/encounters.js',
  'trainers':   './views/trainers.js',
  'items':      './views/items.js',
  'credits':    './views/credits.js',
};

const app = document.getElementById('app');

function setActive(view) {
  document.querySelectorAll('#navLinks a').forEach(a =>
    a.classList.toggle('active', (a.dataset.route || '') === view));
}

async function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').map(decodeURIComponent);
  const view = parts[0] || '';
  const path = ROUTES[view] ? view : '';
  setActive(path);
  document.getElementById('navLinks').classList.remove('open');
  app.innerHTML = '';
  app.append(el('div', { class: 'loading' }, el('span', { class: 'loading__gem' }), el('p', {}, 'Loading…')));
  try {
    const mod = await import(ROUTES[path]);
    app.innerHTML = '';
    (mod.render || mod.default)(app, parts.slice(1));
  } catch (err) {
    console.error(err);
    app.innerHTML = '';
    app.append(el('div', { class: 'empty' },
      el('p', {}, 'This section failed to load.'),
      el('pre', { style: { color: '#ff7bbf', fontSize: '12px', whiteSpace: 'pre-wrap' } }, String(err && err.stack || err))));
  }
  if (!location.hash.includes('/' + parts.slice(1).join('/')) || parts.length <= 1) window.scrollTo(0, 0);
}

document.getElementById('navMenu').addEventListener('click', () =>
  document.getElementById('navLinks').classList.toggle('open'));

async function main() {
  try {
    await loadAll();
  } catch (err) {
    app.innerHTML = '';
    app.append(el('div', { class: 'empty' }, 'Could not load archive data. ' + err));
    return;
  }
  window.addEventListener('hashchange', route);
  route();
}
main();
