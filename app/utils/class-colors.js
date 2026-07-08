const CLASS_COLORS = {
  warrior: '#c79c6e',
  paladin: '#f58cba',
  hunter: '#abd473',
  rogue: '#fff569',
  priest: '#ffffff',
  shaman: '#0070de',
  mage: '#69ccf0',
  warlock: '#9482c9',
  druid: '#ff7d0a',
  deathknight: '#c41f3b',
  monk: '#00ff96',
  demonhunter: '#a330c9'
};

const FALLBACK_COLOR = '#d89b23';

export function classColorFor(sourceType) {
  let normalizedType = (sourceType || '').toLowerCase().replace(/[^a-z]/g, '');

  return CLASS_COLORS[normalizedType] || FALLBACK_COLOR;
}

