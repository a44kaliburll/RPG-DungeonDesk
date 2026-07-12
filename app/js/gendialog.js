/* The 🎲 Generate dialog — presets, sliders, seeds, and codex weaving. */

import { showModal, closeModal } from './ui.js';
import { randomSeedString } from './generators.js';

const lastOpts = {}; // remembered per map type within the session

const WORLD_PRESET_NAMES = {
  continents: 'Continents', pangea: 'Lone Continent', archipelago: 'Archipelago',
  inlandsea: 'Inland Sea', frozen: 'Frozen North', desert: 'Desert World'
};
const TOWN_PRESET_NAMES = {
  village: 'Fishing Village', market: 'Market Town', capital: 'Capital City', outpost: 'Mountain Outpost'
};
const DUNGEON_ALGO_NAMES = {
  rooms: 'Rooms & Corridors', caves: 'Natural Caves', catacombs: 'Catacombs Maze', temple: 'Sunken Temple'
};

function sel(id, options, current) {
  return `<select id="${id}">` + Object.entries(options)
    .map(([k, n]) => `<option value="${k}" ${k === current ? 'selected' : ''}>${n}</option>`).join('') + '</select>';
}

function slider(id, label, value, min = 0, max = 100) {
  return `<div class="slider-row"><label style="width:86px">${label}</label>
    <input type="range" id="${id}" min="${min}" max="${max}" value="${value}">
    <span class="val" data-for="${id}">${value}</span></div>`;
}

function check(id, label, on, hint = '') {
  return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin:7px 0;font-size:13px" ${hint ? `title="${hint}"` : ''}>
    <input type="checkbox" id="${id}" ${on ? 'checked' : ''}> ${label}</label>`;
}

/* Opens the dialog; resolves with an opts object or null if cancelled. */
export function openGenerateDialog(map, hasContent) {
  return new Promise((resolve) => {
    const t = map.type;
    const prev = lastOpts[t] || {};
    const isWorldish = t === 'world' || t === 'region';

    let body = '';
    if (isWorldish) {
      body = `
        <div class="form-row"><label>World shape</label>${sel('gd-preset', WORLD_PRESET_NAMES, prev.preset || (t === 'region' ? 'pangea' : 'continents'))}</div>
        ${slider('gd-land', 'Land', prev.land ?? 50)}
        ${slider('gd-mountains', 'Mountains', prev.mountains ?? 50)}
        ${slider('gd-forests', 'Forests', prev.forests ?? 50)}
        ${slider('gd-rivers', 'Rivers', prev.rivers ?? 50)}
        ${slider('gd-settlements', 'Settlements', prev.settlements ?? (t === 'region' ? 5 : 4), 0, 9)}
        ${check('gd-borders', 'Kingdom borders & tints', prev.borders !== false)}
        ${check('gd-labels', 'Name things (labels)', prev.labels !== false)}
        ${check('gd-weave', 'Weave into codex — create location entries + lore pins for settlements', prev.weave || false)}`;
    } else if (t === 'town') {
      body = `
        <div class="form-row"><label>Town type</label>${sel('gd-town', TOWN_PRESET_NAMES, prev.townPreset || 'market')}</div>
        ${check('gd-river', 'River through town (with bridges)', prev.river ?? true)}
        ${check('gd-labels', 'Name the town (label)', prev.labels !== false)}
        ${check('gd-weave', 'Weave into codex — create a location entry + lore pin', prev.weave || false)}`;
    } else {
      body = `
        <div class="form-row"><label>Layout</label>${sel('gd-algo', DUNGEON_ALGO_NAMES, prev.algo || 'rooms')}</div>
        ${slider('gd-rooms', 'Rooms', prev.roomCount ?? 9, 4, 16)}
        ${slider('gd-loot', 'Treasure', prev.loot ?? 40)}
        ${slider('gd-traps', 'Traps', prev.traps ?? 30)}
        ${slider('gd-water', 'Water', prev.water ?? 40)}
        ${slider('gd-levels', 'Levels', prev.levels ?? 1, 1, 3)}
        ${check('gd-secret', 'Secret doors', prev.secretDoors !== false)}
        ${check('gd-roomkey', 'Number the rooms', prev.roomKey !== false)}
        ${check('gd-weave', 'Weave into codex — write a room-key entry describing every room', prev.weave || false)}`;
    }

    const m = showModal(`
      <h3>🎲 Generate ${t === 'world' ? 'World' : t === 'region' ? 'Region' : t === 'town' ? 'Town' : 'Dungeon'}</h3>
      ${hasContent ? '<p style="color:#e08a7a;font-size:12px;margin-bottom:12px">This replaces everything on the current map (Ctrl+Z undoes it).</p>' : ''}
      ${body}
      <div class="form-row" style="margin-top:14px"><label>Seed — same seed, same map</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="gd-seed" value="${prev.seed || randomSeedString()}" spellcheck="false" style="flex:1">
          <button class="btn small" id="gd-reroll" title="New random seed">↻</button>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn" id="gd-cancel">Cancel</button>
        <button class="btn primary" id="gd-go">Generate</button>
      </div>`);

    m.querySelectorAll('input[type=range]').forEach((r) => {
      r.oninput = () => { m.querySelector(`[data-for="${r.id}"]`).textContent = r.value; };
    });
    m.querySelector('#gd-reroll').onclick = () => { m.querySelector('#gd-seed').value = randomSeedString(); };
    m.querySelector('#gd-cancel').onclick = () => { closeModal(); resolve(null); };
    m.querySelector('#gd-go').onclick = () => {
      const v = (id) => m.querySelector('#' + id)?.value;
      const n = (id) => Number(v(id));
      const b = (id) => !!m.querySelector('#' + id)?.checked;
      let opts = { seed: (v('gd-seed') || '').trim() || randomSeedString(), labels: b('gd-labels'), weave: b('gd-weave') };
      if (isWorldish) {
        opts = {
          ...opts, preset: v('gd-preset'), land: n('gd-land'), mountains: n('gd-mountains'),
          forests: n('gd-forests'), rivers: n('gd-rivers'), settlements: n('gd-settlements'),
          borders: b('gd-borders')
        };
      } else if (t === 'town') {
        opts = { ...opts, townPreset: v('gd-town'), river: b('gd-river') };
      } else {
        opts = {
          ...opts, algo: v('gd-algo'), roomCount: n('gd-rooms'), loot: n('gd-loot'),
          traps: n('gd-traps'), water: n('gd-water'), levels: n('gd-levels'),
          secretDoors: b('gd-secret'), roomKey: b('gd-roomkey')
        };
      }
      lastOpts[t] = opts;
      closeModal();
      resolve(opts);
    };
  });
}
