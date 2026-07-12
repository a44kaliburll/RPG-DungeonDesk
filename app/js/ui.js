/* Modals + toasts shared across the app. */

import { state, newEntry, markDirty, CATEGORIES } from './state.js';

const backdrop = () => document.getElementById('modal-backdrop');
const modal = () => document.getElementById('modal');

let escHandler = null;

export function showModal(html) {
  modal().innerHTML = html;
  backdrop().classList.remove('hidden');
  escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
  window.addEventListener('keydown', escHandler);
  backdrop().onmousedown = (e) => { if (e.target === backdrop()) closeModal(); };
  return modal();
}

export function closeModal() {
  backdrop().classList.add('hidden');
  modal().innerHTML = '';
  if (escHandler) { window.removeEventListener('keydown', escHandler); escHandler = null; }
}

export function confirmModal(title, message, confirmLabel = 'Delete') {
  return new Promise((resolve) => {
    const m = showModal(`
      <h3>${title}</h3>
      <p style="color:var(--text-dim);line-height:1.6">${message}</p>
      <div class="modal-actions">
        <button class="btn" data-act="cancel">Cancel</button>
        <button class="btn danger" data-act="ok">${confirmLabel}</button>
      </div>`);
    m.querySelector('[data-act=cancel]').onclick = () => { closeModal(); resolve(false); };
    m.querySelector('[data-act=ok]').onclick = () => { closeModal(); resolve(true); };
  });
}

let toastTimer = null;
export function toast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 3200);
}

/* Pick (or create) a codex entry. Resolves with entryId or null. */
export function pickEntryModal({ allowCreate = true, title = 'Choose an entry' } = {}) {
  return new Promise((resolve) => {
    const catOptions = Object.entries(CATEGORIES)
      .map(([k, c]) => `<option value="${k}">${c.icon} ${c.name}</option>`).join('');
    const m = showModal(`
      <h3>${title}</h3>
      <div class="form-row"><input type="text" id="pick-search" placeholder="Search entries…" autocomplete="off"></div>
      <div class="pick-list" id="pick-list"></div>
      ${allowCreate ? `
      <div class="form-row" style="margin-top:16px">
        <label>…or create a new entry</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="pick-new-title" placeholder="New entry title" style="flex:1">
          <select id="pick-new-cat">${catOptions}</select>
          <button class="btn primary" id="pick-create">Create</button>
        </div>
      </div>` : ''}
      <div class="modal-actions"><button class="btn" id="pick-cancel">Cancel</button></div>
    `);

    const listEl = m.querySelector('#pick-list');
    const searchEl = m.querySelector('#pick-search');

    const renderList = () => {
      const q = searchEl.value.trim().toLowerCase();
      const entries = state.project.entries.filter((e) => !q || e.title.toLowerCase().includes(q));
      listEl.innerHTML = entries.length ? '' : '<div class="pick-item dim">No entries yet — create one below.</div>';
      for (const e of entries.slice(0, 60)) {
        const cat = CATEGORIES[e.category] || CATEGORIES.note;
        const div = document.createElement('div');
        div.className = 'pick-item';
        div.innerHTML = `${cat.icon} ${escapeHtml(e.title)} <span class="c">— ${cat.name}</span>`;
        div.onclick = () => { closeModal(); resolve(e.id); };
        listEl.appendChild(div);
      }
    };
    searchEl.oninput = renderList;
    renderList();
    searchEl.focus();

    if (allowCreate) {
      m.querySelector('#pick-create').onclick = () => {
        const t = m.querySelector('#pick-new-title').value.trim();
        if (!t) return;
        const entry = newEntry(m.querySelector('#pick-new-cat').value, t);
        state.project.entries.push(entry);
        markDirty();
        closeModal();
        resolve(entry.id);
      };
    }
    m.querySelector('#pick-cancel').onclick = () => { closeModal(); resolve(null); };
  });
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
