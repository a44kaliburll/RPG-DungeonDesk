/* Project data model, persistence and app-wide state. */

export const MAP_TYPES = {
  world:   { name: 'World Map',   icon: '🌍', desc: 'Continents, oceans, kingdoms', background: 'ocean' },
  region:  { name: 'Region Map',  icon: '🏞️', desc: 'A kingdom, province or island', background: 'ocean' },
  town:    { name: 'Town Map',    icon: '🏘️', desc: 'Cities, towns and villages', background: 'field' },
  dungeon: { name: 'Dungeon Map', icon: '🗝️', desc: 'Grid-based dungeons & interiors', background: 'dungeon' }
};

export const CATEGORIES = {
  location: { name: 'Locations', icon: '🏰', fields: ['Type', 'Population', 'Ruler / Leader', 'Parent Region'] },
  npc:      { name: 'NPCs',      icon: '🧙', fields: ['Race', 'Role / Class', 'Alignment', 'Affiliation', 'Attitude (Friend / Foe)'] },
  faction:  { name: 'Factions',  icon: '⚔️', fields: ['Type', 'Leader', 'Headquarters', 'Goal'] },
  item:     { name: 'Items',     icon: '🗡️', fields: ['Type', 'Rarity', 'Value', 'Current Owner'] },
  event:    { name: 'History',   icon: '📜', fields: ['Date / Era', 'Location', 'Participants', 'Outcome'] },
  creature: { name: 'Creatures', icon: '🐉', fields: ['Type', 'Threat Level', 'Habitat', 'Weakness', 'Attitude (Friend / Foe)'] },
  note:     { name: 'Notes',     icon: '✒️', fields: [] }
};

/* Stat blocks: NPCs & Creatures get a full character block, Items get item stats.
   Other categories have none (by design). */
export const STAT_TEMPLATES = {
  character: {
    vitals: ['Armor Class', 'Hit Points', 'Speed', 'Challenge / Level'],
    abilities: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
    lines: ['Skills', 'Senses', 'Languages', 'Resistances / Immunities'],
    blocks: ['Traits & Abilities', 'Actions & Attacks']
  },
  item: {
    vitals: ['Damage', 'Range', 'Armor Bonus', 'Weight', 'Charges', 'Attunement'],
    abilities: [],
    lines: [],
    blocks: ['Properties & Effects']
  }
};

export function statTemplateFor(category) {
  if (category === 'npc' || category === 'creature') return STAT_TEMPLATES.character;
  if (category === 'item') return STAT_TEMPLATES.item;
  return null;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function newProject() {
  return {
    app: 'rpg-dungeon-desk',
    version: 1,
    name: 'Untitled World',
    createdAt: Date.now(),
    modifiedAt: Date.now(),
    maps: [],
    entries: [],
    customStamps: []
  };
}

export function newMap(name, type, width, height) {
  const t = MAP_TYPES[type] || MAP_TYPES.world;
  return {
    id: uid(),
    name: name || 'Untitled Map',
    type,
    width,
    height,
    gridSize: type === 'dungeon' ? 40 : 64,
    gridVisible: type === 'dungeon',
    background: t.background,
    terrain: null,     // dataURL of the painted raster layer
    tiles: {},         // dungeon: "col,row" -> tile key
    objects: [],       // stamps
    paths: [],         // roads / rivers / walls / borders
    labels: [],
    pins: [],
    thumb: null
  };
}

export function newEntry(category, title) {
  return {
    id: uid(),
    title: title || 'New Entry',
    category: category || 'note',
    fields: {},
    stats: {},
    body: '',
    createdAt: Date.now(),
    modifiedAt: Date.now()
  };
}

/* ---------------- global state ---------------- */

export const state = {
  project: newProject(),
  filePath: null,        // current .rpgworld path (Electron)
  dirty: false,
  activeMapId: null,
  activeEntryId: null,
  codexCategory: 'all',
  codexSearch: ''
};

const listeners = new Set();
export function onChange(fn) { listeners.add(fn); }
export function markDirty() {
  state.dirty = true;
  state.project.modifiedAt = Date.now();
  listeners.forEach((fn) => fn());
}

export function getMap(id) { return state.project.maps.find((m) => m.id === id); }
export function getEntry(id) { return state.project.entries.find((e) => e.id === id); }
export function findEntryByTitle(title) {
  const t = title.trim().toLowerCase();
  return state.project.entries.find((e) => e.title.trim().toLowerCase() === t);
}

/* Pins across all maps that reference an entry. */
export function pinsForEntry(entryId) {
  const out = [];
  for (const m of state.project.maps) {
    for (const p of m.pins) if (p.entryId === entryId) out.push({ map: m, pin: p });
  }
  return out;
}

/* Entries whose body links to the given entry via [[Title]]. */
export function backlinksFor(entry) {
  const needle = '[[' + entry.title.trim().toLowerCase();
  return state.project.entries.filter(
    (e) => e.id !== entry.id && (e.body || '').toLowerCase().includes(needle)
  );
}

/* ---------------- serialization ---------------- */

export function serializeProject() {
  return JSON.stringify(state.project);
}

export function loadProjectData(json) {
  const data = JSON.parse(json);
  if (!data || data.app !== 'rpg-dungeon-desk' || !Array.isArray(data.maps)) {
    throw new Error('Not a valid RPG Dungeon Desk project file.');
  }
  data.entries = data.entries || [];
  data.customStamps = data.customStamps || [];
  data.entries.forEach((e) => {
    e.fields = e.fields || {};
    e.stats = e.stats || {};
  });
  data.maps.forEach((m) => {
    m.tiles = m.tiles || {};
    m.objects = m.objects || [];
    m.paths = m.paths || [];
    m.labels = m.labels || [];
    m.pins = m.pins || [];
  });
  state.project = data;
  state.activeMapId = null;
  state.activeEntryId = null;
  state.dirty = false;
}

/* ---------------- autosave (crash recovery) ---------------- */

const AUTOSAVE_KEY = 'rpgdd-autosave';

export function autosave() {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      when: Date.now(),
      filePath: state.filePath,
      project: state.project
    }));
    return true;
  } catch {
    return false; // project too large for localStorage — file saving still works
  }
}

export function loadAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function clearAutosave() {
  try { localStorage.removeItem(AUTOSAVE_KEY); } catch { /* ignore */ }
}
