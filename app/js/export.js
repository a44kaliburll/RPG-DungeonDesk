/* Exports: current map → PNG, whole world → standalone HTML document. */

import { state, CATEGORIES, findEntryByTitle } from './state.js';
import { renderMapStandalone } from './editor.js';
import { renderMarkdown, statBlockHtml } from './codex.js';
import { exportFile } from './bridge.js';
import { toast, escapeHtml } from './ui.js';

export async function exportMapPNG(editor) {
  if (!editor.map) return;
  const canvas = editor.renderToCanvas(1);
  const dataURL = canvas.toDataURL('image/png');
  const res = await exportFile({
    defaultName: safeName(editor.map.name) + '.png',
    dataBase64: dataURL.split(',')[1],
    filters: [{ name: 'PNG Image', extensions: ['png'] }]
  });
  if (!res.canceled) toast('Map exported' + (res.filePath ? ` → ${res.filePath}` : ''));
}

/* Standalone HTML "player handout" of the whole world. */
export async function exportCodexHTML() {
  const p = state.project;
  toast('Building codex export…');

  // render every map at a reasonable width
  const mapImages = [];
  for (const m of p.maps) {
    const scale = Math.min(1, 1100 / m.width);
    const c = await renderMapStandalone(m, scale);
    mapImages.push({ map: m, src: c.toDataURL('image/jpeg', 0.85) });
  }

  const entriesByCat = {};
  for (const e of p.entries) (entriesByCat[e.category] ||= []).push(e);
  for (const k of Object.keys(entriesByCat)) entriesByCat[k].sort((a, b) => a.title.localeCompare(b.title));

  const anchor = (e) => 'e-' + e.id;
  const linkified = (src) => renderMarkdown(src || '').replace(
    /<a class="xlink( missing)?" data-entry="([^"]*)" data-name="([^"]*)">/g,
    (_m, missing, id, name) => {
      const t = findEntryByTitle(name);
      return t ? `<a class="xlink" href="#${'e-' + t.id}">` : `<span class="xlink-missing">`;
    }
  ).replace(/<\/a>/g, (m) => m).replace(/<span class="xlink-missing">([^<]*)<\/a>/g, '<span class="xlink-missing">$1</span>');

  let mapsHtml = '';
  for (const { map, src } of mapImages) {
    mapsHtml += `<section class="map-sec"><h2>🗺️ ${escapeHtml(map.name)}</h2><img src="${src}" alt="${escapeHtml(map.name)}"></section>\n`;
  }

  let entriesHtml = '';
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    const list = entriesByCat[key];
    if (!list || !list.length) continue;
    entriesHtml += `<h2 class="cat-head">${cat.icon} ${cat.name}</h2>\n`;
    for (const e of list) {
      const fields = (cat.fields || []).filter((f) => e.fields[f]);
      entriesHtml += `<article id="${anchor(e)}"><h3>${escapeHtml(e.title)}</h3>`;
      if (fields.length) {
        entriesHtml += '<table class="fields">' + fields.map(
          (f) => `<tr><td>${escapeHtml(f)}</td><td>${escapeHtml(e.fields[f])}</td></tr>`
        ).join('') + '</table>';
      }
      entriesHtml += statBlockHtml(e);
      entriesHtml += `<div class="body">${linkified(e.body)}</div></article>\n`;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(p.name)} — World Codex</title>
<style>
body{margin:0;background:#171412;color:#e8ddc8;font-family:Georgia,serif;line-height:1.65}
.wrap{max-width:880px;margin:0 auto;padding:40px 24px 100px}
h1{color:#c9973f;font-size:34px;border-bottom:2px solid #3d362d;padding-bottom:14px}
h2{color:#c9973f;margin-top:44px}
.cat-head{border-bottom:1px solid #3d362d;padding-bottom:8px}
h3{color:#e8b55a;margin:28px 0 8px}
article{background:#1e1a16;border:1px solid #2e2922;border-radius:10px;padding:6px 22px 16px;margin:14px 0}
img{max-width:100%;border-radius:8px;border:1px solid #3d362d}
.fields{border-collapse:collapse;margin:8px 0;font-size:14px}
.fields td{border:1px solid #2e2922;padding:4px 12px}
.fields td:first-child{color:#a89a80;font-variant:small-caps}
a.xlink{color:#e8b55a;text-decoration:none;border-bottom:1px dotted #8a6526}
.sb-view{border:1px solid #8a6526;border-radius:8px;padding:12px 18px;margin:12px 0;background:#231e19}
.sb-vitals{color:#e8b55a;font-size:15px;margin-bottom:6px}
.sb-vitals b{color:#a89a80;font-size:11px;text-transform:uppercase;letter-spacing:.6px}
.sb-abilities{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:10px 0;text-align:center}
.sb-abilities .a{background:#2b2620;border-radius:6px;padding:6px 2px;font-size:14px}
.sb-abilities .a b{display:block;font-size:10px;color:#a89a80;letter-spacing:1px}
.sb-abilities .m{color:#c9973f;font-size:12px}
.sb-line{font-size:14px;margin:4px 0}
.sb-block h4{color:#c9973f;margin:10px 0 4px}
.sb-block p{margin:4px 0;font-size:14px}
.xlink-missing{color:#a89a80;border-bottom:1px dotted #6f6452}
.body ul{margin:8px 0 8px 22px}
.foot{margin-top:60px;color:#6f6452;font-size:12px;text-align:center}
</style></head><body><div class="wrap">
<h1>${escapeHtml(p.name)}</h1>
<p style="color:#a89a80">A world codex — ${p.maps.length} map${p.maps.length === 1 ? '' : 's'}, ${p.entries.length} entr${p.entries.length === 1 ? 'y' : 'ies'}.</p>
${mapsHtml}
${entriesHtml}
<div class="foot">Created with RPG Dungeon Desk</div>
</div></body></html>`;

  const res = await exportFile({
    defaultName: safeName(p.name) + '-codex.html',
    dataText: html,
    filters: [{ name: 'HTML Document', extensions: ['html'] }]
  });
  if (!res.canceled) toast('Codex exported' + (res.filePath ? ` → ${res.filePath}` : ''));
}

function safeName(s) {
  return (s || 'map').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'map';
}
