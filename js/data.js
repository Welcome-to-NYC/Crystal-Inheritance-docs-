// Central data store. Loads every JSON dataset once and builds lookup maps.
export const Store = {
  pokedex: [], trainers: {}, items: [], meta: {}, encounters: {},
  credits: '', spriteIndex: {},
  dexByKey: {}, dexByName: {}, evolvesFrom: {},
};

const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export async function loadAll() {
  const base = './data/';
  const j = f => fetch(base + f).then(r => r.json());
  const [pokedex, trainers, items, meta, encounters, spriteIndex] = await Promise.all([
    j('pokedex.json'), j('trainers.json'), j('items.json'),
    j('meta.json'), j('encounters.json'), j('sprite_index.json'),
  ]);
  const credits = await fetch(base + 'credits.md').then(r => r.text());
  Object.assign(Store, { pokedex, trainers, items, meta, encounters, spriteIndex, credits });

  pokedex.forEach(m => {
    Store.dexByKey[m.key] = m;
    if (!Store.dexByName[norm(m.name)]) Store.dexByName[norm(m.name)] = m;
    if (!Store.dexByName[norm(m.base)]) Store.dexByName[norm(m.base)] = m;
  });
  // reverse evolution map: target display-name -> list of pre-evolutions
  pokedex.forEach(m => {
    (m.evolutions || []).forEach(ev => {
      const k = norm(ev.into);
      (Store.evolvesFrom[k] = Store.evolvesFrom[k] || []).push({ from: m, method: ev.text });
    });
  });
  return Store;
}
