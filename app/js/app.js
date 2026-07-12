/* App bootstrap: screens, home page, project lifecycle, menus, autosave. */

import {
  state, newProject, newMap, MAP_TYPES, CATEGORIES, uid,
  serializeProject, loadProjectData, onChange,
  autosave, loadAutosave, clearAutosave, markDirty, getMap
} from './state.js';
import * as bridge from './bridge.js';
import { MapEditor, renderMapStandalone } from './editor.js';
import { initCodex, renderCodex, openEntryInCodex } from './codex.js';
import { exportMapPNG, exportCodexHTML } from './export.js';
import { showModal, closeModal, confirmModal, toast, escapeHtml } from './ui.js';
import { applyGeoBackground } from './appbg.js';
import { openGenerateDialog } from './gendialog.js';
import { locationEntryFor, roomKeyBody } from './generators.js';
import { generateMap } from './mapgen.js';
import { setCustomStamps } from './stamps.js';

const $ = (id) => document.getElementById(id);

const editor = new MapEditor();
let currentScreen = 'home';

/* ---------------- screens ---------------- */

function showScreen(name) {
  currentScreen = name;
  for (const s of ['home', 'editor', 'codex']) {
    $('screen-' + s).classList.toggle('hidden', s !== name);
  }
  if (name === 'home') renderHome();
  if (name === 'codex') renderCodex();
}

/* ---------------- home ---------------- */

function renderHome() {
  const grid = $('map-grid');
  grid.innerHTML = '';

  for (const m of state.project.maps) {
    const t = MAP_TYPES[m.type] || MAP_TYPES.world;
    const card = document.createElement('div');
    card.className = 'map-card';
    card.innerHTML = `
      <div class="map-card-thumb">${m.thumb ? `<img src="${m.thumb}">` : `<span class="placeholder">${t.icon}</span>`}</div>
      <div class="map-card-body">
        <div style="min-width:0">
          <div class="map-card-name">${escapeHtml(m.name)}</div>
          <div class="map-card-sub">${t.name} · ${m.width}×${m.height}</div>
        </div>
        <button class="map-card-del" title="Delete map">✕</button>
      </div>`;
    card.querySelector('.map-card-del').onclick = async (e) => {
      e.stopPropagation();
      const ok = await confirmModal('Delete map?', `“${escapeHtml(m.name)}” and everything on it will be removed.`);
      if (!ok) return;
      state.project.maps = state.project.maps.filter((x) => x.id !== m.id);
      markDirty();
      renderHome();
    };
    card.onclick = () => openMap(m.id);
    grid.appendChild(card);
  }

  const add = document.createElement('div');
  add.className = 'map-card new-map';
  add.textContent = '+ New Map';
  add.onclick = newMapModal;
  grid.appendChild(add);

  // codex summary
  const sum = $('codex-summary');
  sum.innerHTML = '';
  const counts = {};
  for (const e of state.project.entries) counts[e.category] = (counts[e.category] || 0) + 1;
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const div = document.createElement('div');
    div.className = 'codex-stat';
    div.innerHTML = `<div class="num">${counts[key] || 0}</div><div class="lbl">${cat.icon} ${cat.name}</div>`;
    div.onclick = () => { state.codexCategory = key; showScreen('codex'); };
    sum.appendChild(div);
  }
}

/* ---------------- new map ---------------- */

function newMapModal() {
  let chosenType = 'world';
  const sizes = {
    small: { name: 'Small (1600 × 1200)', w: 1600, h: 1200 },
    medium: { name: 'Medium (2400 × 1800)', w: 2400, h: 1800 },
    large: { name: 'Large (3200 × 2400)', w: 3200, h: 2400 }
  };
  const m = showModal(`
    <h3>New Map</h3>
    <div class="form-row"><label>Name</label><input type="text" id="nm-name" value="" placeholder="The Shattered Coast"></div>
    <div class="form-row"><label>Type</label><div class="type-pick" id="nm-types"></div></div>
    <div class="form-row"><label>Size</label>
      <select id="nm-size">
        ${Object.entries(sizes).map(([k, s]) => `<option value="${k}" ${k === 'medium' ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-row">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
        <input type="checkbox" id="nm-random"> 🎲 Open the map generator after creating
      </label>
    </div>
    <div class="modal-actions">
      <button class="btn" id="nm-cancel">Cancel</button>
      <button class="btn primary" id="nm-create">Create Map</button>
    </div>`);

  const typesEl = m.querySelector('#nm-types');
  for (const [key, t] of Object.entries(MAP_TYPES)) {
    const div = document.createElement('div');
    div.className = 'type-opt' + (key === chosenType ? ' active' : '');
    div.innerHTML = `<div class="ico">${t.icon}</div><div class="nm">${t.name}</div><div class="ds">${t.desc}</div>`;
    div.onclick = () => {
      chosenType = key;
      typesEl.querySelectorAll('.type-opt').forEach((el) => el.classList.remove('active'));
      div.classList.add('active');
    };
    typesEl.appendChild(div);
  }

  m.querySelector('#nm-name').focus();
  m.querySelector('#nm-cancel').onclick = closeModal;
  m.querySelector('#nm-create').onclick = () => {
    const name = m.querySelector('#nm-name').value.trim() || 'Untitled Map';
    const size = sizes[m.querySelector('#nm-size').value];
    const generate = m.querySelector('#nm-random').checked;
    const map = newMap(name, chosenType, size.w, size.h);
    state.project.maps.push(map);
    markDirty();
    closeModal();
    openMap(map.id);
    if (generate) {
      openGenerateDialog(map, false).then((opts) => { if (opts) runGeneration(opts); });
    }
  };
}

function openMap(id, focusPin = null) {
  const map = getMap(id);
  if (!map) return;
  state.activeMapId = id;
  showScreen('editor');
  $('editor-map-name').value = map.name;
  $('editor-map-type').textContent = (MAP_TYPES[map.type] || MAP_TYPES.world).name;
  editor.loadMap(map);
  if (focusPin) {
    editor.cam.zoom = 1;
    editor.cam.x = editor.host.clientWidth / 2 - focusPin.x;
    editor.cam.y = editor.host.clientHeight / 2 - focusPin.y;
    editor.setTool('select');
    editor.select('pin', focusPin.id);
    editor.requestRender();
  }
}

/* ---------------- project lifecycle ---------------- */

async function guardDirty() {
  if (!state.dirty) return true;
  return confirmModal('Unsaved changes', 'You have unsaved changes. Continue and discard them?', 'Discard');
}

async function doNewProject() {
  if (!(await guardDirty())) return;
  state.project = newProject();
  state.filePath = null;
  state.dirty = false;
  state.activeMapId = null;
  state.activeEntryId = null;
  setCustomStamps([]);
  clearAutosave();
  $('project-name').value = state.project.name;
  setStatus('');
  showScreen('home');
}

async function doSave(saveAs = false) {
  state.project.name = $('project-name').value.trim() || 'Untitled World';
  const data = serializeProject();
  const opts = { data, suggestedName: state.project.name };
  const res = saveAs
    ? await bridge.saveProjectAs(opts)
    : await bridge.saveProject({ ...opts, filePath: state.filePath });
  if (res.canceled) {
    if (res.error) toast('Save failed: ' + res.error, true);
    return;
  }
  if (res.filePath) state.filePath = res.filePath;
  state.dirty = false;
  setStatus('Saved ' + timeNow());
  toast('Project saved' + (res.filePath ? ` → ${res.filePath}` : ''));
}

async function doOpen() {
  if (!(await guardDirty())) return;
  const res = await bridge.openProject();
  if (res.canceled) {
    if (res.error) toast('Open failed: ' + res.error, true);
    return;
  }
  try {
    loadProjectData(res.data);
    state.filePath = res.filePath || null;
    setCustomStamps(state.project.customStamps);
    $('project-name').value = state.project.name;
    setStatus('');
    showScreen('home');
    toast('Project loaded');
  } catch (err) {
    toast(String(err.message || err), true);
  }
}

/* ---------------- status / autosave ---------------- */

function setStatus(text) { $('save-status').textContent = text; }
function timeNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

let autosaveTimer = null;
onChange(() => {
  setStatus('Unsaved changes');
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    if (autosave()) setStatus('Autosaved ' + timeNow());
  }, 3000);
});

/* ---------------- wire up top-level UI ---------------- */

$('brand-home').onclick = () => showScreen('home');
$('btn-new-project').onclick = doNewProject;
$('btn-open-project').onclick = doOpen;
$('btn-save-project').onclick = () => doSave(false);
$('btn-new-map').onclick = newMapModal;
$('btn-open-codex').onclick = () => showScreen('codex');
$('project-name').onchange = () => {
  state.project.name = $('project-name').value.trim() || 'Untitled World';
  markDirty();
};

// editor toolbar
$('btn-editor-back').onclick = () => showScreen('home');
$('editor-map-name').onchange = () => {
  if (editor.map) {
    editor.map.name = $('editor-map-name').value.trim() || 'Untitled Map';
    markDirty();
  }
};
$('btn-undo').onclick = () => editor.undo();
$('btn-redo').onclick = () => editor.redo();
$('btn-zoom-in').onclick = () => editor.zoomAt(1.25, editor.host.clientWidth / 2, editor.host.clientHeight / 2);
$('btn-zoom-out').onclick = () => editor.zoomAt(1 / 1.25, editor.host.clientWidth / 2, editor.host.clientHeight / 2);
$('btn-zoom-fit').onclick = () => editor.zoomFit();
$('btn-toggle-grid').onclick = () => {
  if (!editor.map) return;
  editor.map.gridVisible = !editor.map.gridVisible;
  markDirty();
  editor.requestRender();
};
$('btn-export-png').onclick = () => exportMapPNG(editor);

/* ---------------- generation flow ---------------- */

function weaveDungeonEntry(map, report) {
  if (!report.rooms || !report.rooms.length) return;
  const entry = locationEntryFor(report.name || map.name, 'Dungeon');
  entry.body = roomKeyBody(report.name || map.name, report.rooms);
  state.project.entries.push(entry);
  if (report.entrance) {
    map.pins.push({ id: uid(), x: report.entrance.x, y: report.entrance.y, color: '#c9973f', entryId: entry.id });
  }
}

function runGeneration(opts) {
  const report = editor.generateRandom(opts);
  const map = editor.map;
  $('editor-map-name').value = map.name;

  if (opts.weave) {
    if (map.type === 'dungeon') {
      weaveDungeonEntry(map, report);
    } else {
      for (const s of report.settlements) {
        const entry = locationEntryFor(s.name, s.kind || 'Town');
        state.project.entries.push(entry);
        map.pins.push({ id: uid(), x: s.x, y: s.y, color: '#c0503e', entryId: entry.id });
      }
    }
    markDirty();
    editor.requestRender();
  }

  /* extra dungeon levels as linked maps */
  if (map.type === 'dungeon' && (opts.levels || 1) > 1) {
    const base = report.name;
    for (let lvl = 2; lvl <= opts.levels; lvl++) {
      const nm = newMap(`${base} — Level ${lvl}`, 'dungeon', map.width, map.height);
      const dummy = document.createElement('canvas');
      dummy.width = dummy.height = 1;
      const rep = generateMap(nm, dummy.getContext('2d'), dummy, { ...opts, seed: opts.seed + '-L' + lvl, levels: 1, weave: false });
      nm.name = `${base} — Level ${lvl}`;
      const titleLbl = nm.labels.find((l) => l.text === rep.name);
      if (titleLbl) titleLbl.text = nm.name;
      state.project.maps.push(nm);
      if (opts.weave) { rep.name = nm.name; weaveDungeonEntry(nm, rep); }
      renderMapStandalone(nm, 260 / nm.width).then((c) => {
        nm.thumb = c.toDataURL('image/jpeg', 0.72);
        markDirty();
      });
    }
    markDirty();
  }
  const levelNote = map.type === 'dungeon' && (opts.levels || 1) > 1 ? ` (${opts.levels} levels)` : '';
  toast(`Generated “${map.name}”${levelNote} — seed: ${opts.seed}`);
}

$('btn-generate-map').onclick = async () => {
  const m = editor.map;
  if (!m) return;
  const hasContent = !!(m.objects.length || m.paths.length || m.labels.length || m.pins.length ||
    Object.keys(m.tiles).length || m.terrain);
  const opts = await openGenerateDialog(m, hasContent);
  if (!opts) return;
  runGeneration(opts);
};

// codex
$('btn-codex-back').onclick = () => showScreen('home');
$('btn-export-codex').onclick = exportCodexHTML;

initCodex({
  onShowPin: (mapId, pin) => openMap(mapId, pin)
});

// editor <-> codex hooks
editor.onOpenEntry = (entryId) => {
  showScreen('codex');
  openEntryInCodex(entryId);
};

/* ---------------- keyboard (browser fallback; Electron uses the menu) ---------------- */

window.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (bridge.isElectron && ['s', 'o', 'n', 'e'].includes(k)) return; // menu handles these
  const inField = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
  if (k === 's') { e.preventDefault(); doSave(e.shiftKey); }
  else if (k === 'o') { e.preventDefault(); doOpen(); }
  else if (k === 'z' && !inField && currentScreen === 'editor') { e.preventDefault(); editor.undo(); }
  else if (k === 'y' && !inField && currentScreen === 'editor') { e.preventDefault(); editor.redo(); }
  else if (k === 'e' && currentScreen === 'editor') { e.preventDefault(); exportMapPNG(editor); }
});

/* ---------------- Electron menu ---------------- */

bridge.onMenu((ch) => {
  switch (ch) {
    case 'menu:new-project': doNewProject(); break;
    case 'menu:open-project': doOpen(); break;
    case 'menu:save-project': doSave(false); break;
    case 'menu:save-project-as': doSave(true); break;
    case 'menu:export-png': if (currentScreen === 'editor') exportMapPNG(editor); else toast('Open a map first'); break;
    case 'menu:export-codex': exportCodexHTML(); break;
    case 'menu:undo': if (currentScreen === 'editor') editor.undo(); break;
    case 'menu:redo': if (currentScreen === 'editor') editor.redo(); break;
    case 'app:before-quit': autosave(); break;
  }
});

window.addEventListener('beforeunload', () => { if (state.dirty) autosave(); });

/* ---------------- boot ---------------- */

(function boot() {
  applyGeoBackground();
  const saved = loadAutosave();
  if (saved && saved.project && (saved.project.maps.length || saved.project.entries.length)) {
    state.project = saved.project;
    state.project.customStamps = state.project.customStamps || [];
    state.project.entries.forEach((e) => { e.fields = e.fields || {}; e.stats = e.stats || {}; });
    state.filePath = saved.filePath || null;
    state.dirty = true;
    $('project-name').value = state.project.name;
    setStatus('Restored session — remember to Save');
  }
  setCustomStamps(state.project.customStamps);
  showScreen('home');
})();
