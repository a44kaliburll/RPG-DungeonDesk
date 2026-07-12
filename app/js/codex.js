/* World Codex — lore entries, templates, cross-links, backlinks. */

import {
  state, CATEGORIES, newEntry, markDirty, getEntry,
  findEntryByTitle, pinsForEntry, backlinksFor, statTemplateFor
} from './state.js';
import { confirmModal, toast, escapeHtml } from './ui.js';
import { generateEntry } from './generators.js';

let onShowPin = null;   // (mapId, pin) => void, set by app
let previewMode = false;

export function initCodex(opts) {
  onShowPin = opts.onShowPin;

  document.getElementById('codex-search').addEventListener('input', (e) => {
    state.codexSearch = e.target.value;
    renderList();
  });

  document.getElementById('btn-new-entry').addEventListener('click', () => {
    const cat = state.codexCategory === 'all' ? 'location' : state.codexCategory;
    const entry = newEntry(cat, 'New Entry');
    state.project.entries.push(entry);
    state.activeEntryId = entry.id;
    markDirty();
    renderCodex();
    setTimeout(() => {
      const t = document.querySelector('.entry-title');
      if (t) { t.focus(); t.select(); }
    }, 30);
  });

  document.getElementById('btn-random-entry').addEventListener('click', () => {
    const generatable = ['npc', 'location', 'faction', 'item', 'event', 'creature'];
    const cat = generatable.includes(state.codexCategory) ? state.codexCategory : undefined;
    const entry = generateEntry(cat);
    state.project.entries.push(entry);
    state.activeEntryId = entry.id;
    previewMode = true; // show the generated entry formatted
    markDirty();
    renderCodex();
    toast(`Rolled “${entry.title}”`);
  });
}

export function renderCodex() {
  renderCategories();
  renderList();
  renderEditor();
}

/* ---------------- categories ---------------- */

function renderCategories() {
  const wrap = document.getElementById('codex-cats');
  wrap.innerHTML = '';
  const counts = {};
  for (const e of state.project.entries) counts[e.category] = (counts[e.category] || 0) + 1;

  const mk = (key, icon, name, count) => {
    const div = document.createElement('div');
    div.className = 'codex-cat' + (state.codexCategory === key ? ' active' : '');
    div.innerHTML = `<span>${icon} ${name}</span><span class="count">${count}</span>`;
    div.onclick = () => { state.codexCategory = key; renderCodex(); };
    wrap.appendChild(div);
  };
  mk('all', '📚', 'All Entries', state.project.entries.length);
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    mk(key, cat.icon, cat.name, counts[key] || 0);
  }
}

/* ---------------- list ---------------- */

function renderList() {
  const wrap = document.getElementById('codex-list');
  wrap.innerHTML = '';
  const q = state.codexSearch.trim().toLowerCase();
  let entries = state.project.entries;
  if (state.codexCategory !== 'all') entries = entries.filter((e) => e.category === state.codexCategory);
  if (q) {
    entries = entries.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      (e.body || '').toLowerCase().includes(q) ||
      Object.values(e.fields || {}).some((v) => String(v).toLowerCase().includes(q))
    );
  }
  entries = [...entries].sort((a, b) => a.title.localeCompare(b.title));

  if (!entries.length) {
    wrap.innerHTML = '<div class="codex-list-empty">No entries here yet.<br>Create one with “+ New Entry”.</div>';
    return;
  }
  for (const e of entries) {
    const cat = CATEGORIES[e.category] || CATEGORIES.note;
    const div = document.createElement('div');
    div.className = 'codex-item' + (state.activeEntryId === e.id ? ' active' : '');
    div.innerHTML = `<div class="t">${cat.icon} ${escapeHtml(e.title)}</div><div class="c">${cat.name}</div>`;
    div.onclick = () => { state.activeEntryId = e.id; previewMode = false; renderCodex(); };
    wrap.appendChild(div);
  }
}

/* ---------------- editor ---------------- */

function renderEditor() {
  const empty = document.getElementById('codex-empty');
  const editor = document.getElementById('codex-editor');
  const entry = state.activeEntryId ? getEntry(state.activeEntryId) : null;

  if (!entry) {
    empty.classList.remove('hidden');
    editor.classList.add('hidden');
    return;
  }
  empty.classList.add('hidden');
  editor.classList.remove('hidden');
  editor.innerHTML = '';

  /* title row */
  const titleRow = document.createElement('div');
  titleRow.className = 'title-row';
  const title = document.createElement('input');
  title.className = 'entry-title';
  title.value = entry.title;
  title.spellcheck = false;
  title.onchange = () => {
    entry.title = title.value.trim() || 'Untitled';
    entry.modifiedAt = Date.now();
    markDirty();
    renderList();
  };
  const delBtn = document.createElement('button');
  delBtn.className = 'btn small danger';
  delBtn.textContent = 'Delete';
  delBtn.onclick = async () => {
    const ok = await confirmModal('Delete entry?', `“${escapeHtml(entry.title)}” will be removed. Map pins linked to it will be unlinked.`);
    if (!ok) return;
    state.project.entries = state.project.entries.filter((e) => e.id !== entry.id);
    for (const m of state.project.maps) {
      for (const p of m.pins) if (p.entryId === entry.id) p.entryId = null;
    }
    state.activeEntryId = null;
    markDirty();
    renderCodex();
  };
  titleRow.append(title, delBtn);
  editor.appendChild(titleRow);

  /* category + dates */
  const meta = document.createElement('div');
  meta.className = 'meta-row';
  const catSel = document.createElement('select');
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = `${cat.icon} ${cat.name}`;
    if (entry.category === key) o.selected = true;
    catSel.appendChild(o);
  }
  catSel.onchange = () => {
    entry.category = catSel.value;
    entry.modifiedAt = Date.now();
    markDirty();
    renderCodex();
  };
  const dates = document.createElement('span');
  dates.className = 'dim';
  dates.style.fontSize = '11px';
  dates.textContent = 'edited ' + new Date(entry.modifiedAt).toLocaleDateString();
  meta.append(catSel, dates);
  editor.appendChild(meta);

  /* template fields */
  const cat = CATEGORIES[entry.category] || CATEGORIES.note;
  if (cat.fields.length) {
    const grid = document.createElement('div');
    grid.className = 'field-grid';
    for (const f of cat.fields) {
      const cell = document.createElement('div');
      cell.className = 'field-cell';
      const lbl = document.createElement('label');
      lbl.textContent = f;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = entry.fields[f] || '';
      input.onchange = () => {
        entry.fields[f] = input.value;
        entry.modifiedAt = Date.now();
        markDirty();
      };
      cell.append(lbl, input);
      grid.appendChild(cell);
    }
    editor.appendChild(grid);
  }

  /* stat block (NPCs, Creatures, Items) */
  if (statTemplateFor(entry.category)) {
    if (previewMode) {
      const html = statBlockHtml(entry);
      if (html) editor.insertAdjacentHTML('beforeend', html);
    } else {
      renderStatEditor(editor, entry);
    }
  }

  /* body: edit / preview */
  const bodyLabel = document.createElement('div');
  bodyLabel.className = 'entry-body-label';
  bodyLabel.innerHTML = `<span>Lore &nbsp;<span style="text-transform:none;letter-spacing:0;color:var(--text-faint)">— markdown-ish: # headings, **bold**, *italic*, - lists, [[Cross Links]]</span></span>`;
  const toggle = document.createElement('button');
  toggle.className = 'btn small';
  toggle.textContent = previewMode ? '✎ Edit' : '👁 Preview';
  toggle.onclick = () => { previewMode = !previewMode; renderEditor(); };
  bodyLabel.appendChild(toggle);
  editor.appendChild(bodyLabel);

  if (previewMode) {
    const prev = document.createElement('div');
    prev.className = 'entry-preview';
    prev.innerHTML = renderMarkdown(entry.body || '*Nothing written yet.*');
    bindCrossLinks(prev);
    editor.appendChild(prev);
  } else {
    const body = document.createElement('textarea');
    body.className = 'entry-body';
    body.spellcheck = false;
    body.placeholder = 'The ancient city of… \n\nLink other entries like [[The Sunken King]] and they become clickable in preview and exports.';
    body.value = entry.body || '';
    body.oninput = () => {
      entry.body = body.value;
      entry.modifiedAt = Date.now();
      markDirty();
    };
    editor.appendChild(body);
  }

  /* map references */
  const pins = pinsForEntry(entry.id);
  if (pins.length) {
    const sec = document.createElement('div');
    sec.className = 'backlinks';
    sec.innerHTML = '<h4>📍 On the map</h4>';
    for (const { map, pin } of pins) {
      const chip = document.createElement('span');
      chip.className = 'entry-link-chip';
      chip.textContent = `🗺️ ${map.name}`;
      chip.title = 'Show this pin on the map';
      chip.onclick = () => onShowPin && onShowPin(map.id, pin);
      sec.appendChild(chip);
    }
    editor.appendChild(sec);
  }

  /* backlinks */
  const back = backlinksFor(entry);
  if (back.length) {
    const sec = document.createElement('div');
    sec.className = 'backlinks';
    sec.innerHTML = '<h4>🔗 Mentioned in</h4>';
    for (const e of back) {
      const chip = document.createElement('span');
      chip.className = 'entry-link-chip';
      chip.textContent = `${(CATEGORIES[e.category] || CATEGORIES.note).icon} ${e.title}`;
      chip.onclick = () => { state.activeEntryId = e.id; renderCodex(); };
      sec.appendChild(chip);
    }
    editor.appendChild(sec);
  }
}

/* ---------------- stat blocks ---------------- */

function abilityMod(v) {
  const n = parseInt(v, 10);
  if (isNaN(n)) return '';
  const mod = Math.floor((n - 10) / 2);
  return (mod >= 0 ? '+' : '') + mod;
}

function renderStatEditor(editor, entry) {
  const tpl = statTemplateFor(entry.category);
  entry.stats = entry.stats || {};
  const s = entry.stats;
  const touch = () => { entry.modifiedAt = Date.now(); markDirty(); };

  const sec = document.createElement('div');
  sec.className = 'stat-section';
  sec.insertAdjacentHTML('beforeend', '<div class="entry-body-label"><span>⚔ Stat Block</span></div>');

  /* vitals */
  const vit = document.createElement('div');
  vit.className = 'field-grid three';
  for (const f of tpl.vitals) {
    const cell = document.createElement('div');
    cell.className = 'field-cell';
    const lbl = document.createElement('label');
    lbl.textContent = f;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = s[f] || '';
    input.onchange = () => { s[f] = input.value; touch(); };
    cell.append(lbl, input);
    vit.appendChild(cell);
  }
  sec.appendChild(vit);

  /* ability scores with live modifiers */
  if (tpl.abilities.length) {
    const ab = document.createElement('div');
    ab.className = 'stat-abilities';
    for (const a of tpl.abilities) {
      const cell = document.createElement('div');
      cell.className = 'stat-ab';
      cell.innerHTML = `<label>${a}</label>`;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = s[a] || '';
      input.placeholder = '10';
      const mod = document.createElement('div');
      mod.className = 'mod';
      mod.textContent = abilityMod(s[a]) || ' ';
      input.oninput = () => { s[a] = input.value; mod.textContent = abilityMod(input.value) || ' '; touch(); };
      cell.append(input, mod);
      ab.appendChild(cell);
    }
    sec.appendChild(ab);
  }

  /* one-line traits */
  if (tpl.lines.length) {
    const grid = document.createElement('div');
    grid.className = 'field-grid';
    for (const f of tpl.lines) {
      const cell = document.createElement('div');
      cell.className = 'field-cell';
      const lbl = document.createElement('label');
      lbl.textContent = f;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = s[f] || '';
      input.onchange = () => { s[f] = input.value; touch(); };
      cell.append(lbl, input);
      grid.appendChild(cell);
    }
    sec.appendChild(grid);
  }

  /* multi-line blocks (traits, actions, properties) */
  for (const b of tpl.blocks) {
    const lbl = document.createElement('div');
    lbl.className = 'entry-body-label';
    lbl.innerHTML = `<span>${b}</span>`;
    const ta = document.createElement('textarea');
    ta.className = 'stat-ta';
    ta.spellcheck = false;
    ta.placeholder = b === 'Actions & Attacks'
      ? 'Longsword. +5 to hit, 1d8+3 slashing.\nFire Breath (recharge 5–6). 8d6 fire, DC 15 Dex save for half.'
      : 'One per line…';
    ta.value = s[b] || '';
    ta.oninput = () => { s[b] = ta.value; touch(); };
    sec.append(lbl, ta);
  }

  editor.appendChild(sec);
}

/* Formatted stat block (used by preview and the HTML export). */
export function statBlockHtml(entry) {
  const tpl = statTemplateFor(entry.category);
  if (!tpl) return '';
  const s = entry.stats || {};
  const has = (k) => s[k] != null && String(s[k]).trim() !== '';
  const anyAbility = tpl.abilities.some(has);
  const anything = tpl.vitals.some(has) || anyAbility || tpl.lines.some(has) || tpl.blocks.some(has);
  if (!anything) return '';

  let html = '<div class="sb-view">';
  const vitals = tpl.vitals.filter(has)
    .map((k) => `<b>${escapeHtml(k)}</b> ${escapeHtml(s[k])}`).join(' · ');
  if (vitals) html += `<div class="sb-vitals">${vitals}</div>`;
  if (anyAbility) {
    html += '<div class="sb-abilities">' + tpl.abilities.map((a) => {
      const v = has(a) ? escapeHtml(s[a]) : '—';
      const mod = abilityMod(s[a]);
      return `<div class="a"><b>${a}</b>${v}${mod ? ` <span class="m">(${mod})</span>` : ''}</div>`;
    }).join('') + '</div>';
  }
  for (const k of tpl.lines) {
    if (has(k)) html += `<div class="sb-line"><b>${escapeHtml(k)}.</b> ${escapeHtml(s[k])}</div>`;
  }
  for (const k of tpl.blocks) {
    if (has(k)) {
      html += `<div class="sb-block"><h4>${escapeHtml(k)}</h4><p>${escapeHtml(s[k]).replace(/\n/g, '<br>')}</p></div>`;
    }
  }
  return html + '</div>';
}

/* ---------------- markdown-lite ---------------- */

export function renderMarkdown(src) {
  const lines = escapeHtml(src).split('\n');
  const out = [];
  let inList = false;
  for (const line of lines) {
    const l = line.trimEnd();
    if (/^- /.test(l)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + inline(l.slice(2)) + '</li>');
      continue;
    }
    if (inList) { out.push('</ul>'); inList = false; }
    if (/^### /.test(l)) out.push('<h3>' + inline(l.slice(4)) + '</h3>');
    else if (/^## /.test(l)) out.push('<h2>' + inline(l.slice(3)) + '</h2>');
    else if (/^# /.test(l)) out.push('<h1>' + inline(l.slice(2)) + '</h1>');
    else if (l === '') out.push('');
    else out.push('<p>' + inline(l) + '</p>');
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}

function inline(s) {
  return s
    .replace(/\[\[([^\]]+)\]\]/g, (_m, name) => {
      const target = findEntryByTitle(name);
      return `<a class="xlink${target ? '' : ' missing'}" data-entry="${target ? target.id : ''}" data-name="${name}">${name}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>');
}

function bindCrossLinks(root) {
  root.querySelectorAll('a.xlink').forEach((a) => {
    a.onclick = () => {
      const id = a.dataset.entry;
      if (id) {
        state.activeEntryId = id;
        previewMode = false;
        renderCodex();
      } else {
        // create the missing entry on the spot
        const entry = newEntry('note', a.dataset.name);
        state.project.entries.push(entry);
        state.activeEntryId = entry.id;
        previewMode = false;
        markDirty();
        renderCodex();
        toast(`Created new entry “${a.dataset.name}”`);
      }
    };
  });
}

export function openEntryInCodex(entryId) {
  state.activeEntryId = entryId;
  previewMode = true;
  renderCodex();
}
