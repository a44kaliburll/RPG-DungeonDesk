/* MapEditor — canvas engine, tools, selection, undo/redo. */

import { state, uid, markDirty, getEntry } from './state.js';
import { stampsForMapType, getStamp, drawStampObject, stampThumb, getCustomStamps, setCustomStamps } from './stamps.js';
import { TERRAINS, paintStroke, makeBackground, TILES, drawTiles, BACKGROUNDS, drawGrid, THEMES } from './terrain.js';
import { toast, pickEntryModal } from './ui.js';
import { generateMap } from './mapgen.js';

const LABEL_FONTS = ['Georgia', 'Palatino Linotype', 'Segoe UI', 'Segoe Script', 'Consolas'];
let clipboard = null; // survives map switches: copy on one map, paste on another

const PATH_KINDS = {
  road:   { name: 'Road',         color: '#7d6142', width: 7,  dash: true },
  river:  { name: 'River',        color: '#5f83a8', width: 10, dash: false },
  wall:   { name: 'Wall',         color: '#655e52', width: 9,  dash: false },
  border: { name: 'Border',       color: '#a04a3a', width: 4,  dash: true },
  trade:  { name: 'Trade Route',  color: '#c9973f', width: 5,  dash: true },
  hazard: { name: 'Hazard Route', color: '#c0503e', width: 5,  dot: true },
  route:  { name: 'Travel Route', color: '#8a4a8a', width: 4,  dash: true }
};

const PATH_COLORS = ['#7d6142', '#5f83a8', '#655e52', '#a04a3a', '#8a4a8a', '#4e6b35', '#c9973f', '#3b2e20'];
const LABEL_COLORS = ['#2e2417', '#5b4a2f', '#7a2f2f', '#2f4a7a', '#2f5c38', '#e8ddc8'];
const PIN_COLORS = ['#c0503e', '#c9973f', '#5f83a8', '#6b8c4a', '#8a4a8a', '#3b2e20'];

const TOOL_DEFS = [
  { id: 'select',  name: 'Select / Move (V)', types: ['world', 'region', 'town', 'dungeon'],
    svg: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2 1-3.2-7.4L7 18.5z"/></svg>' },
  { id: 'pan',     name: 'Pan (H, or hold Space)', types: ['world', 'region', 'town', 'dungeon'],
    svg: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l3 3h-2v4h4V7l3 3-3 3v-2h-4v4h2l-3 3-3-3h2v-4H7v2l-3-3 3-3v2h4V5H9z"/></svg>' },
  { id: 'terrain', name: 'Terrain Brush (B)', types: ['world', 'region', 'town'],
    svg: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.7 5.9l-2.6-2.6c-.4-.4-1-.4-1.4 0L9 11l-1 4 4-1 7.7-7.7c.4-.4.4-1 0-1.4zM7 16c-2.2 0-4 1.8-4 4 0 .6-.7.9-1 .9.9 1.2 2.4 2 4 2 2.2 0 4-1.8 4-4 0-1.6-1.3-2.9-3-2.9z"/></svg>' },
  { id: 'tile',    name: 'Tile Brush (B)', types: ['dungeon'],
    svg: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" opacity=".85"/></svg>' },
  { id: 'stamp',   name: 'Stamps (S)', types: ['world', 'region', 'town', 'dungeon'],
    svg: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L4 9h3v6h10V9h3zM4 19h16v2H4z"/></svg>' },
  { id: 'path',    name: 'Paths — roads, rivers, walls (P)', types: ['world', 'region', 'town', 'dungeon'],
    svg: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" d="M3 20c5-1 3-8 9-8s4-7 9-7"/><circle cx="3" cy="20" r="2.2" fill="currentColor"/><circle cx="21" cy="5" r="2.2" fill="currentColor"/></svg>' },
  { id: 'label',   name: 'Text Label (T)', types: ['world', 'region', 'town', 'dungeon'],
    svg: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v3h-2V6.5h-4.5V18H15v2H9v-2h1.5V6.5H6V7H4z"/></svg>' },
  { id: 'pin',     name: 'Lore Pin — link to codex (I)', types: ['world', 'region', 'town', 'dungeon'],
    svg: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>' }
];

export class MapEditor {
  constructor() {
    this.canvas = document.getElementById('map-canvas');
    this.host = document.getElementById('canvas-host');
    this.hint = document.getElementById('canvas-hint');
    this.ctx = this.canvas.getContext('2d');
    this.map = null;
    this.cam = { x: 0, y: 0, zoom: 1 };
    this.tool = 'select';
    this.selection = null;          // {kind:'object'|'path'|'label'|'pin', id}
    this.multi = [];                // additional multi-selection [{kind,id},...]
    this.layers = { terrain: true, grid: true, paths: true, objects: true, labels: true, pins: true };
    this.history = [];
    this.redoStack = [];
    this.pendingSnapshot = null;
    this.marquee = null;
    this.pathMode = 'points';       // 'points' | 'freehand'
    this.freehandDrawing = false;

    // tool options
    this.terrainId = 'grass';
    this.brushSize = 48;
    this.tileId = 'floor';
    this.tileBrush = 1;
    this.stampId = null;
    this.stampSize = 56;
    this.stampScatter = false;
    this.pathKind = 'road';
    this.pathWidth = null;          // null = kind default
    this.pathColor = null;

    // transient
    this.drawingPath = null;        // {points:[], kind}
    this.painting = false;
    this.dragging = null;
    this.panning = null;
    this.spaceHeld = false;
    this.pointerWorld = null;
    this.terrainDirty = false;

    this.bgCache = null;
    this.bgCacheKey = '';
    this.terrainCanvas = null;
    this.terrainURL = null;
    this._renderQueued = false;
    this._thumbTimer = null;
    this.onSelectionChange = null;  // set by app
    this.onOpenEntry = null;        // set by app

    this._bindEvents();
    const ro = new ResizeObserver(() => { this._resize(); this.requestRender(); });
    ro.observe(this.host);
  }

  /* ---------------- lifecycle ---------------- */

  loadMap(map) {
    this.map = map;
    this.selection = null;
    this.multi = [];
    this.marquee = null;
    this.layers = { terrain: true, grid: true, paths: true, objects: true, labels: true, pins: true };
    this.history = [];
    this.redoStack = [];
    this.drawingPath = null;
    this.terrainCanvas = document.createElement('canvas');
    this.terrainCanvas.width = map.width;
    this.terrainCanvas.height = map.height;
    this.terrainURL = map.terrain || null;
    if (map.terrain) {
      const img = new Image();
      img.onload = () => {
        this.terrainCanvas.getContext('2d').drawImage(img, 0, 0);
        this.requestRender();
      };
      img.src = map.terrain;
    }
    this.setTool(map.type === 'dungeon' ? 'tile' : 'terrain');
    const stamps = stampsForMapType(map.type);
    this.stampId = stamps.length ? stamps[0].id : null;
    this.stampSize = map.type === 'dungeon' ? map.gridSize * 0.9 : 56;
    this._resize();
    this.zoomFit();
    this.buildToolRail();
    this.buildContextPanel();
    this.buildInspector();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.host.clientWidth, h = this.host.clientHeight;
    this.canvas.width = Math.max(1, w * dpr);
    this.canvas.height = Math.max(1, h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.dpr = dpr;
  }

  /* ---------------- camera ---------------- */

  screenToWorld(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - this.cam.x) / this.cam.zoom,
      y: (e.clientY - r.top - this.cam.y) / this.cam.zoom
    };
  }

  zoomAt(factor, cx, cy) {
    const z = Math.min(6, Math.max(0.08, this.cam.zoom * factor));
    const k = z / this.cam.zoom;
    this.cam.x = cx - (cx - this.cam.x) * k;
    this.cam.y = cy - (cy - this.cam.y) * k;
    this.cam.zoom = z;
    this._updateZoomLabel();
    this.requestRender();
  }

  zoomFit() {
    if (!this.map) return;
    const w = this.host.clientWidth, h = this.host.clientHeight;
    const z = Math.min(w / this.map.width, h / this.map.height) * 0.92;
    this.cam.zoom = Math.min(2, Math.max(0.08, z));
    this.cam.x = (w - this.map.width * this.cam.zoom) / 2;
    this.cam.y = (h - this.map.height * this.cam.zoom) / 2;
    this._updateZoomLabel();
    this.requestRender();
  }

  _updateZoomLabel() {
    const el = document.getElementById('zoom-label');
    if (el) el.textContent = Math.round(this.cam.zoom * 100) + '%';
  }

  /* ---------------- history ---------------- */

  captureState() {
    const m = this.map;
    return {
      vector: JSON.stringify({ objects: m.objects, paths: m.paths, labels: m.labels, pins: m.pins, tiles: m.tiles }),
      terrain: this.terrainURL
    };
  }

  commit(snapshot) {
    this.history.push(snapshot);
    if (this.history.length > 40) this.history.shift();
    this.redoStack = [];
    markDirty();
    this._scheduleThumb();
    this.requestRender();
  }

  _restore(snap) {
    const v = JSON.parse(snap.vector);
    Object.assign(this.map, v);
    if (snap.terrain !== this.terrainURL) {
      this.terrainURL = snap.terrain;
      this.map.terrain = snap.terrain;
      const tctx = this.terrainCanvas.getContext('2d');
      tctx.clearRect(0, 0, this.terrainCanvas.width, this.terrainCanvas.height);
      if (snap.terrain) {
        const img = new Image();
        img.onload = () => { tctx.drawImage(img, 0, 0); this.requestRender(); };
        img.src = snap.terrain;
      }
    }
    this.selection = null;
    markDirty();
    this._scheduleThumb();
    this.buildInspector();
    this.requestRender();
  }

  undo() {
    if (!this.history.length) return;
    this.redoStack.push(this.captureState());
    this._restore(this.history.pop());
  }

  redo() {
    if (!this.redoStack.length) return;
    this.history.push(this.captureState());
    this._restore(this.redoStack.pop());
  }

  /* Replace the map's contents with randomly generated ones (undoable).
     Returns the generation report (settlements, rooms, seed…). */
  generateRandom(opts = {}) {
    if (!this.map) return null;
    const snap = this.captureState();
    const report = generateMap(this.map, this.terrainCanvas.getContext('2d'), this.terrainCanvas, opts);
    if (this.map.type === 'dungeon') {
      this.terrainURL = null;
      this.map.terrain = null;
    } else {
      this.terrainURL = this.terrainCanvas.toDataURL('image/png');
      this.map.terrain = this.terrainURL;
    }
    this.selection = null;
    this.multi = [];
    this.bgCacheKey = ''; // generator may change the background style
    this.commit(snap);
    this.zoomFit();
    this.buildContextPanel();
    this.buildInspector();
    return report;
  }

  /* ---------------- selection helpers ---------------- */

  selected() {
    if (!this.selection || !this.map) return null;
    const { kind, id } = this.selection;
    const arr = { object: this.map.objects, path: this.map.paths, label: this.map.labels, pin: this.map.pins }[kind];
    return arr ? arr.find((o) => o.id === id) : null;
  }

  select(kind, id) {
    this.selection = kind ? { kind, id } : null;
    this.multi = [];
    this.buildInspector();
    this.requestRender();
  }

  /* Every selected ref (multi if present, else the single selection). */
  allSelected() {
    if (this.multi.length) return this.multi;
    return this.selection ? [this.selection] : [];
  }

  _itemFor(ref) {
    const arr = { object: this.map.objects, path: this.map.paths, label: this.map.labels, pin: this.map.pins }[ref.kind];
    return arr ? arr.find((o) => o.id === ref.id) : null;
  }

  deleteSelection() {
    const refs = this.allSelected();
    if (!refs.length) return;
    const snap = this.captureState();
    for (const ref of refs) {
      const arrName = { object: 'objects', path: 'paths', label: 'labels', pin: 'pins' }[ref.kind];
      this.map[arrName] = this.map[arrName].filter((o) => o.id !== ref.id);
    }
    this.selection = null;
    this.multi = [];
    this.commit(snap);
    this.buildInspector();
  }

  duplicateSelection() {
    const refs = this.allSelected();
    if (!refs.length) return;
    const snap = this.captureState();
    const newRefs = [];
    for (const ref of refs) {
      const item = this._itemFor(ref);
      if (!item) continue;
      const copy = JSON.parse(JSON.stringify(item));
      copy.id = uid();
      if (copy.points) copy.points = copy.points.map((p) => ({ x: p.x + 30, y: p.y + 30 }));
      else { copy.x += 30; copy.y += 30; }
      const arrName = { object: 'objects', path: 'paths', label: 'labels', pin: 'pins' }[ref.kind];
      this.map[arrName].push(copy);
      newRefs.push({ kind: ref.kind, id: copy.id });
    }
    if (newRefs.length === 1) { this.selection = newRefs[0]; this.multi = []; }
    else { this.multi = newRefs; this.selection = null; }
    this.commit(snap);
    this.buildInspector();
  }

  copySelection() {
    const refs = this.allSelected();
    if (!refs.length) return;
    clipboard = refs.map((ref) => ({ kind: ref.kind, data: JSON.parse(JSON.stringify(this._itemFor(ref))) }))
      .filter((c) => c.data);
    toast(`Copied ${clipboard.length} item${clipboard.length === 1 ? '' : 's'} — Ctrl+V to paste (works across maps)`);
  }

  pasteClipboard() {
    if (!clipboard || !clipboard.length || !this.map) return;
    const snap = this.captureState();
    const newRefs = [];
    for (const c of clipboard) {
      const copy = JSON.parse(JSON.stringify(c.data));
      copy.id = uid();
      if (copy.points) copy.points = copy.points.map((p) => ({ x: p.x + 40, y: p.y + 40 }));
      else { copy.x += 40; copy.y += 40; }
      if (c.kind === 'pin') copy.entryId = copy.entryId || null;
      const arrName = { object: 'objects', path: 'paths', label: 'labels', pin: 'pins' }[c.kind];
      this.map[arrName].push(copy);
      newRefs.push({ kind: c.kind, id: copy.id });
    }
    if (newRefs.length === 1) { this.selection = newRefs[0]; this.multi = []; }
    else { this.multi = newRefs; this.selection = null; }
    this.commit(snap);
    this.buildInspector();
  }

  /* ---------------- hit testing ---------------- */

  hitTest(pt) {
    const m = this.map;
    const tol = 8 / this.cam.zoom;
    if (this.layers.pins) {
      for (let i = m.pins.length - 1; i >= 0; i--) {
        const p = m.pins[i];
        if (Math.hypot(pt.x - p.x, pt.y - (p.y - 18)) < 20) return { kind: 'pin', id: p.id };
      }
    }
    if (this.layers.labels) {
      for (let i = m.labels.length - 1; i >= 0; i--) {
        const l = m.labels[i];
        const w = l.text.length * l.size * 0.52;
        if (pt.x > l.x - w / 2 - 6 && pt.x < l.x + w / 2 + 6 && pt.y > l.y - l.size * 0.75 && pt.y < l.y + l.size * 0.4) {
          return { kind: 'label', id: l.id };
        }
      }
    }
    if (this.layers.objects) {
      for (let i = m.objects.length - 1; i >= 0; i--) {
        const o = m.objects[i];
        const r = (o.size || 48) * 0.55;
        if (Math.abs(pt.x - o.x) < r && Math.abs(pt.y - o.y) < r) return { kind: 'object', id: o.id };
      }
    }
    if (this.layers.paths) {
      for (let i = m.paths.length - 1; i >= 0; i--) {
        const p = m.paths[i];
        const r = Math.max((p.width || 6) / 2 + tol, tol);
        for (let j = 0; j < p.points.length - 1; j++) {
          if (distToSegment(pt, p.points[j], p.points[j + 1]) < r) return { kind: 'path', id: p.id };
        }
      }
    }
    return null;
  }

  /* ---------------- events ---------------- */

  _bindEvents() {
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => this._onDown(e));
    c.addEventListener('pointermove', (e) => this._onMove(e));
    window.addEventListener('pointerup', (e) => this._onUp(e));
    c.addEventListener('dblclick', (e) => this._onDbl(e));
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = c.getBoundingClientRect();
      this.zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      if (document.getElementById('screen-editor').classList.contains('hidden')) return;
      const inField = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
      if (e.code === 'Space' && !inField) { this.spaceHeld = true; c.style.cursor = 'grab'; e.preventDefault(); }
      if (inField) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { this.deleteSelection(); }
      else if (e.key === 'Escape') {
        if (this.drawingPath) { this.drawingPath = null; this.freehandDrawing = false; this.requestRender(); }
        else this.select(null);
      }
      else if (e.key === 'Enter') { this._finishPath(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); this.duplicateSelection(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') { e.preventDefault(); this.copySelection(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') { e.preventDefault(); this.pasteClipboard(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const all = [];
        if (this.layers.objects) this.map.objects.forEach((o) => all.push({ kind: 'object', id: o.id }));
        if (this.layers.labels) this.map.labels.forEach((l) => all.push({ kind: 'label', id: l.id }));
        if (this.layers.pins) this.map.pins.forEach((p) => all.push({ kind: 'pin', id: p.id }));
        if (this.layers.paths) this.map.paths.forEach((p) => all.push({ kind: 'path', id: p.id }));
        this.multi = all;
        this.selection = null;
        this.buildInspector();
        this.requestRender();
      }
      else if (!e.ctrlKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 'v') this.setTool('select');
        else if (k === 'h') this.setTool('pan');
        else if (k === 'b') this.setTool(this.map?.type === 'dungeon' ? 'tile' : 'terrain');
        else if (k === 's') this.setTool('stamp');
        else if (k === 'p') this.setTool('path');
        else if (k === 't') this.setTool('label');
        else if (k === 'i') this.setTool('pin');
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') { this.spaceHeld = false; c.style.cursor = ''; }
    });
  }

  _onDown(e) {
    if (!this.map) return;
    try { this.canvas.setPointerCapture(e.pointerId); } catch { /* synthetic events */ }
    const pt = this.screenToWorld(e);

    if (e.button === 1 || this.spaceHeld || this.tool === 'pan') {
      this.panning = { sx: e.clientX, sy: e.clientY, cx: this.cam.x, cy: this.cam.y };
      return;
    }
    if (e.button === 2) return;

    switch (this.tool) {
      case 'select': {
        const hit = this.hitTest(pt);
        if (hit && e.shiftKey) {
          // shift-click: toggle item in the multi-selection
          if (this.selection && !this.multi.length) this.multi = [this.selection];
          this.selection = null;
          const at = this.multi.findIndex((r) => r.id === hit.id);
          if (at >= 0) this.multi.splice(at, 1);
          else this.multi.push(hit);
          if (this.multi.length === 1) { this.selection = this.multi[0]; this.multi = []; }
          this.buildInspector();
          this.requestRender();
        } else if (hit && this.multi.some((r) => r.id === hit.id)) {
          // drag the whole group
          this.pendingSnapshot = this.captureState();
          this.dragging = {
            start: pt, moved: false,
            group: this.multi.map((r) => ({ ref: r, orig: JSON.parse(JSON.stringify(this._itemFor(r))) }))
          };
        } else if (hit) {
          this.select(hit.kind, hit.id);
          const item = this.selected();
          this.pendingSnapshot = this.captureState();
          this.dragging = { start: pt, moved: false, orig: JSON.parse(JSON.stringify(item)) };
        } else {
          // drag on empty space: marquee selection (pan with Space / middle mouse / Pan tool)
          this.selection = null;
          if (!e.shiftKey) this.multi = [];
          this.marquee = { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y, add: e.shiftKey };
          this.buildInspector();
          this.requestRender();
        }
        break;
      }
      case 'terrain': {
        this.pendingSnapshot = this.captureState();
        this.painting = true;
        this.lastPaint = pt;
        paintStroke(this.terrainCanvas.getContext('2d'), pt.x, pt.y, pt.x, pt.y, this.terrainId, this.brushSize);
        this.terrainDirty = true;
        this.requestRender();
        break;
      }
      case 'tile': {
        this.pendingSnapshot = this.captureState();
        this.painting = true;
        this._paintTiles(pt);
        break;
      }
      case 'stamp': {
        if (!this.stampId) break;
        const snap = this.captureState();
        const jitter = this.stampScatter;
        const obj = {
          id: uid(),
          stamp: this.stampId,
          x: pt.x + (jitter ? (Math.random() - 0.5) * this.stampSize * 0.4 : 0),
          y: pt.y + (jitter ? (Math.random() - 0.5) * this.stampSize * 0.4 : 0),
          size: this.stampSize * (jitter ? 0.75 + Math.random() * 0.5 : 1),
          rot: jitter ? (Math.random() - 0.5) * 24 : 0,
          flip: jitter && Math.random() > 0.5
        };
        this.map.objects.push(obj);
        this.commit(snap);
        break;
      }
      case 'path': {
        if (!this.drawingPath) {
          this.pendingSnapshot = this.captureState();
          const kind = PATH_KINDS[this.pathKind];
          this.drawingPath = {
            id: uid(), kind: this.pathKind,
            width: this.pathWidth || kind.width,
            color: this.pathColor || kind.color,
            points: [pt]
          };
          if (this.pathMode === 'freehand') this.freehandDrawing = true;
        } else if (this.pathMode === 'points') {
          this.drawingPath.points.push(pt);
        }
        this.requestRender();
        break;
      }
      case 'label': {
        const snap = this.captureState();
        const label = {
          id: uid(), text: 'New Label', x: pt.x, y: pt.y,
          size: this.map.type === 'dungeon' ? 22 : 34,
          color: this.map.background === 'dungeon' ? '#e8ddc8' : '#2e2417',
          font: 'Georgia', rot: 0
        };
        this.map.labels.push(label);
        this.selection = { kind: 'label', id: label.id };
        this.commit(snap);
        this.buildInspector(true);
        break;
      }
      case 'pin': {
        const snap = this.captureState();
        const pin = { id: uid(), x: pt.x, y: pt.y, color: PIN_COLORS[0], entryId: null };
        this.map.pins.push(pin);
        this.selection = { kind: 'pin', id: pin.id };
        this.commit(snap);
        this.buildInspector();
        pickEntryModal({ allowCreate: true, title: 'Link pin to a codex entry' }).then((entryId) => {
          if (entryId) {
            pin.entryId = entryId;
            markDirty();
            this.buildInspector();
            this.requestRender();
          }
        });
        break;
      }
    }
  }

  _onMove(e) {
    const pt = this.screenToWorld(e);
    this.pointerWorld = pt;

    if (this.panning) {
      this.cam.x = this.panning.cx + (e.clientX - this.panning.sx);
      this.cam.y = this.panning.cy + (e.clientY - this.panning.sy);
      this.requestRender();
      return;
    }
    if (this.painting && this.tool === 'terrain') {
      paintStroke(this.terrainCanvas.getContext('2d'), this.lastPaint.x, this.lastPaint.y, pt.x, pt.y, this.terrainId, this.brushSize);
      this.lastPaint = pt;
      this.terrainDirty = true;
      this.requestRender();
      return;
    }
    if (this.painting && this.tool === 'tile') {
      this._paintTiles(pt);
      return;
    }
    if (this.freehandDrawing && this.drawingPath) {
      const last = this.drawingPath.points[this.drawingPath.points.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) > 10 / this.cam.zoom) {
        this.drawingPath.points.push(pt);
        this.requestRender();
      }
      return;
    }
    if (this.marquee) {
      this.marquee.x1 = pt.x;
      this.marquee.y1 = pt.y;
      this.requestRender();
      return;
    }
    if (this.dragging) {
      const dx = pt.x - this.dragging.start.x;
      const dy = pt.y - this.dragging.start.y;
      if (Math.abs(dx) + Math.abs(dy) > 1) this.dragging.moved = true;
      const applyMove = (item, orig) => {
        if (item.points) item.points = orig.points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
        else { item.x = orig.x + dx; item.y = orig.y + dy; }
      };
      if (this.dragging.group) {
        for (const g of this.dragging.group) {
          const item = this._itemFor(g.ref);
          if (item) applyMove(item, g.orig);
        }
      } else {
        const item = this.selected();
        if (item) applyMove(item, this.dragging.orig);
      }
      this.requestRender();
      return;
    }
    if (this.tool === 'terrain' || this.tool === 'tile' || (this.tool === 'stamp') || (this.tool === 'path' && this.drawingPath)) {
      this.requestRender(); // cursor preview
    }
  }

  _onUp() {
    if (this.panning) { this.panning = null; return; }
    if (this.painting) {
      this.painting = false;
      if (this.terrainDirty) {
        this.terrainURL = this.terrainCanvas.toDataURL('image/png');
        this.map.terrain = this.terrainURL;
        this.terrainDirty = false;
      }
      if (this.pendingSnapshot) { this.commit(this.pendingSnapshot); this.pendingSnapshot = null; }
      return;
    }
    if (this.freehandDrawing) {
      this.freehandDrawing = false;
      if (this.drawingPath) this.drawingPath.points = simplifyPoints(this.drawingPath.points, 4 / this.cam.zoom);
      this._finishPath();
      return;
    }
    if (this.marquee) {
      const mq = this.marquee;
      this.marquee = null;
      const x0 = Math.min(mq.x0, mq.x1), x1 = Math.max(mq.x0, mq.x1);
      const y0 = Math.min(mq.y0, mq.y1), y1 = Math.max(mq.y0, mq.y1);
      if (x1 - x0 > 4 || y1 - y0 > 4) {
        const inRect = (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
        const found = mq.add ? [...this.multi] : [];
        const addRef = (kind, id) => { if (!found.some((r) => r.id === id)) found.push({ kind, id }); };
        if (this.layers.objects) for (const o of this.map.objects) if (inRect(o.x, o.y)) addRef('object', o.id);
        if (this.layers.labels) for (const l of this.map.labels) if (inRect(l.x, l.y)) addRef('label', l.id);
        if (this.layers.pins) for (const p of this.map.pins) if (inRect(p.x, p.y)) addRef('pin', p.id);
        if (this.layers.paths) for (const p of this.map.paths) if (p.points.some((pt) => inRect(pt.x, pt.y))) addRef('path', p.id);
        if (found.length === 1) { this.selection = found[0]; this.multi = []; }
        else { this.multi = found; this.selection = null; }
      }
      this.buildInspector();
      this.requestRender();
      return;
    }
    if (this.dragging) {
      if (this.dragging.moved && this.pendingSnapshot) {
        this.commit(this.pendingSnapshot);
        this.buildInspector();
      }
      this.pendingSnapshot = null;
      this.dragging = null;
    }
  }

  _onDbl(e) {
    const pt = this.screenToWorld(e);
    if (this.tool === 'path' && this.drawingPath) { this._finishPath(); return; }
    const hit = this.hitTest(pt);
    if (hit && hit.kind === 'pin') {
      const pin = this.map.pins.find((p) => p.id === hit.id);
      if (pin?.entryId && this.onOpenEntry) this.onOpenEntry(pin.entryId);
    } else if (hit && hit.kind === 'label') {
      this.select('label', hit.id);
      this.buildInspector(true);
    }
  }

  _finishPath() {
    if (!this.drawingPath) return;
    if (this.drawingPath.points.length >= 2) {
      this.map.paths.push(this.drawingPath);
      const id = this.drawingPath.id;
      this.drawingPath = null;
      if (this.pendingSnapshot) { this.commit(this.pendingSnapshot); this.pendingSnapshot = null; }
      this.select('path', id);
    } else {
      this.drawingPath = null;
      this.pendingSnapshot = null;
      this.requestRender();
    }
  }

  _paintTiles(pt) {
    const g = this.map.gridSize;
    const cx = Math.floor(pt.x / g), cy = Math.floor(pt.y / g);
    const r = this.tileBrush - 1;
    let changed = false;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const key = (cx + dx) + ',' + (cy + dy);
        if (this.tileId === 'erase') {
          if (this.map.tiles[key]) { delete this.map.tiles[key]; changed = true; }
        } else if (this.map.tiles[key] !== this.tileId) {
          this.map.tiles[key] = this.tileId;
          changed = true;
        }
      }
    }
    if (changed) this.requestRender();
  }

  /* ---------------- tools UI ---------------- */

  setTool(id) {
    this.tool = id;
    this.drawingPath = null;
    document.querySelectorAll('.tool-btn').forEach((b) => b.classList.toggle('active', b.dataset.tool === id));
    this.buildContextPanel();
    this._updateHint();
    this.requestRender();
  }

  _updateHint() {
    const hints = {
      select: 'Click to select • Drag empty ground to box-select • Shift-click to add • Double-click a pin for its lore',
      pan: 'Drag to pan • Scroll to zoom',
      terrain: 'Paint terrain • Pick a biome on the left • Scroll to zoom',
      tile: 'Paint dungeon tiles • Walls appear automatically around floors',
      stamp: 'Click to place • Enable Scatter for natural variation • Tint via the Inspector',
      path: this.pathMode === 'freehand'
        ? 'Press and drag to draw • Release to finish • Esc to cancel'
        : 'Click to add points • Double-click or Enter to finish • Esc to cancel',
      label: 'Click the map to place a text label',
      pin: 'Click the map to drop a lore pin and link it to your codex'
    };
    this.hint.textContent = hints[this.tool] || '';
  }

  buildToolRail() {
    const rail = document.getElementById('tool-rail');
    rail.innerHTML = '';
    for (const t of TOOL_DEFS) {
      if (!t.types.includes(this.map.type)) continue;
      const b = document.createElement('button');
      b.className = 'tool-btn' + (this.tool === t.id ? ' active' : '');
      b.dataset.tool = t.id;
      b.title = t.name;
      b.innerHTML = t.svg;
      b.onclick = () => this.setTool(t.id);
      rail.appendChild(b);
    }
  }

  buildContextPanel() {
    const panel = document.getElementById('context-panel');
    panel.innerHTML = '';
    const add = (html) => { panel.insertAdjacentHTML('beforeend', html); };

    if (this.tool === 'terrain') {
      add('<div class="panel-title">Terrain</div>');
      const grid = document.createElement('div');
      grid.className = 'swatch-grid';
      for (const t of TERRAINS) {
        const cell = document.createElement('div');
        cell.className = 'swatch-cell';
        const sw = document.createElement('div');
        sw.className = 'swatch' + (this.terrainId === t.id ? ' active' : '');
        sw.style.background = t.base || 'repeating-linear-gradient(45deg,#444,#444 4px,#666 4px,#666 8px)';
        sw.title = t.name;
        sw.onclick = () => { this.terrainId = t.id; this.buildContextPanel(); };
        const nm = document.createElement('div');
        nm.className = 'swatch-name';
        nm.textContent = t.name;
        cell.append(sw, nm);
        grid.appendChild(cell);
      }
      panel.appendChild(grid);
      add('<div class="panel-block" style="margin-top:14px"></div>');
      this._slider(panel, 'Brush', 8, 200, this.brushSize, (v) => { this.brushSize = v; });
    }

    if (this.tool === 'tile') {
      add('<div class="panel-title">Dungeon Tiles</div>');
      const grid = document.createElement('div');
      grid.className = 'swatch-grid';
      for (const t of TILES) {
        const cell = document.createElement('div');
        cell.className = 'swatch-cell';
        const sw = document.createElement('div');
        sw.className = 'swatch' + (this.tileId === t.id ? ' active' : '');
        sw.style.background = t.color || 'repeating-linear-gradient(45deg,#444,#444 4px,#666 4px,#666 8px)';
        sw.title = t.name;
        sw.onclick = () => { this.tileId = t.id; this.buildContextPanel(); };
        const nm = document.createElement('div');
        nm.className = 'swatch-name';
        nm.textContent = t.name;
        cell.append(sw, nm);
        grid.appendChild(cell);
      }
      panel.appendChild(grid);
      add('<div class="panel-block" style="margin-top:14px"></div>');
      this._slider(panel, 'Brush', 1, 4, this.tileBrush, (v) => { this.tileBrush = v; });
    }

    if (this.tool === 'stamp') {
      const stamps = stampsForMapType(this.map.type);
      const groups = [...new Set(stamps.map((s) => s.group))];
      for (const gname of groups) {
        add(`<div class="panel-title">${gname}</div>`);
        const grid = document.createElement('div');
        grid.className = 'stamp-grid';
        for (const st of stamps.filter((s) => s.group === gname)) {
          const cell = document.createElement('div');
          cell.className = 'stamp-cell' + (this.stampId === st.id ? ' active' : '');
          cell.title = st.name;
          cell.appendChild(stampThumb(st.id));
          cell.onclick = () => { this.stampId = st.id; this.setTool('stamp'); };
          grid.appendChild(cell);
        }
        panel.appendChild(grid);
        add('<div style="height:12px"></div>');
      }
      // custom imported stamps
      add('<div class="panel-title">Custom Images</div>');
      const customs = getCustomStamps();
      if (customs.length) {
        const grid = document.createElement('div');
        grid.className = 'stamp-grid';
        for (const cs of customs) {
          const cell = document.createElement('div');
          cell.className = 'stamp-cell' + (this.stampId === 'custom:' + cs.id ? ' active' : '');
          cell.title = cs.name;
          cell.appendChild(stampThumb('custom:' + cs.id));
          cell.onclick = () => { this.stampId = 'custom:' + cs.id; this.setTool('stamp'); };
          grid.appendChild(cell);
        }
        panel.appendChild(grid);
        add('<div style="height:8px"></div>');
      }
      const importBtn = document.createElement('button');
      importBtn.className = 'btn small';
      importBtn.style.width = '100%';
      importBtn.textContent = '+ Import image…';
      importBtn.title = 'Import a PNG/JPG as a stamp — saved inside your project file';
      importBtn.onclick = () => this._importCustomStamp();
      panel.appendChild(importBtn);
      add('<div style="height:12px"></div>');

      this._slider(panel, 'Size', 14, 220, this.stampSize, (v) => { this.stampSize = v; });
      const scat = document.createElement('label');
      scat.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-dim);margin-top:6px;cursor:pointer';
      scat.innerHTML = `<input type="checkbox" ${this.stampScatter ? 'checked' : ''}> Scatter (random size / tilt)`;
      scat.querySelector('input').onchange = (e) => { this.stampScatter = e.target.checked; };
      panel.appendChild(scat);
    }

    if (this.tool === 'path') {
      add('<div class="panel-title">Draw Mode</div>');
      const modeRow = document.createElement('div');
      modeRow.className = 'seg-row';
      for (const [mode, label] of [['points', 'Click Points'], ['freehand', 'Freehand']]) {
        const b = document.createElement('button');
        b.className = 'seg-btn' + (this.pathMode === mode ? ' active' : '');
        b.textContent = label;
        b.onclick = () => { this.pathMode = mode; this.drawingPath = null; this.buildContextPanel(); this._updateHint(); };
        modeRow.appendChild(b);
      }
      panel.appendChild(modeRow);
      add('<div style="height:12px"></div>');
      add('<div class="panel-title">Path Type</div>');
      const seg = document.createElement('div');
      seg.className = 'seg-row';
      seg.style.flexDirection = 'column';
      for (const [k, def] of Object.entries(PATH_KINDS)) {
        const b = document.createElement('button');
        b.className = 'seg-btn' + (this.pathKind === k ? ' active' : '');
        b.textContent = def.name;
        b.onclick = () => { this.pathKind = k; this.pathWidth = null; this.pathColor = null; this.buildContextPanel(); };
        seg.appendChild(b);
      }
      panel.appendChild(seg);
      add('<div style="height:14px"></div>');
      this._slider(panel, 'Width', 2, 40, this.pathWidth || PATH_KINDS[this.pathKind].width, (v) => { this.pathWidth = v; });
      add('<div class="panel-title" style="margin-top:12px">Color</div>');
      const row = document.createElement('div');
      row.className = 'color-row';
      for (const c of PATH_COLORS) {
        const d = document.createElement('div');
        d.className = 'color-dot' + ((this.pathColor || PATH_KINDS[this.pathKind].color) === c ? ' active' : '');
        d.style.background = c;
        d.onclick = () => { this.pathColor = c; this.buildContextPanel(); };
        row.appendChild(d);
      }
      panel.appendChild(row);
    }

    if (this.tool === 'select') {
      add('<div class="panel-title">Map Settings</div>');
      const wrap = document.createElement('div');
      // background
      const bgRow = document.createElement('div');
      bgRow.className = 'insp-row';
      bgRow.innerHTML = '<label>Background</label>';
      const sel = document.createElement('select');
      for (const [k, b] of Object.entries(BACKGROUNDS)) {
        const o = document.createElement('option');
        o.value = k; o.textContent = b.name;
        if (this.map.background === k) o.selected = true;
        sel.appendChild(o);
      }
      sel.onchange = () => { this.map.background = sel.value; this.bgCacheKey = ''; markDirty(); this._scheduleThumb(); this.requestRender(); };
      bgRow.appendChild(sel);
      wrap.appendChild(bgRow);
      // grid
      const gridRow = document.createElement('label');
      gridRow.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-dim);margin:8px 0;cursor:pointer';
      gridRow.innerHTML = `<input type="checkbox" ${this.map.gridVisible ? 'checked' : ''}> Show grid`;
      gridRow.querySelector('input').onchange = (e) => { this.map.gridVisible = e.target.checked; markDirty(); this.requestRender(); };
      wrap.appendChild(gridRow);
      // grid style
      const gsRow = document.createElement('div');
      gsRow.className = 'insp-row';
      gsRow.innerHTML = '<label>Grid style</label>';
      const gsSel = document.createElement('select');
      for (const [k, n] of [['square', 'Square'], ['hex', 'Hex (flat-top)']]) {
        const o = document.createElement('option');
        o.value = k; o.textContent = n;
        if ((this.map.gridStyle || 'square') === k) o.selected = true;
        gsSel.appendChild(o);
      }
      gsSel.onchange = () => { this.map.gridStyle = gsSel.value; markDirty(); this.requestRender(); };
      gsRow.appendChild(gsSel);
      wrap.appendChild(gsRow);
      // theme
      const thRow = document.createElement('div');
      thRow.className = 'insp-row';
      thRow.innerHTML = '<label>Map theme</label>';
      const thSel = document.createElement('select');
      for (const [k, t] of Object.entries(THEMES)) {
        const o = document.createElement('option');
        o.value = k; o.textContent = t.name;
        if ((this.map.theme || 'classic') === k) o.selected = true;
        thSel.appendChild(o);
      }
      thSel.onchange = () => { this.map.theme = thSel.value; markDirty(); this._scheduleThumb(); this.requestRender(); };
      thRow.appendChild(thSel);
      wrap.appendChild(thRow);
      panel.appendChild(wrap);
      this._slider(panel, 'Grid size', 16, 128, this.map.gridSize, (v) => { this.map.gridSize = v; markDirty(); this.requestRender(); });

      // layers
      add('<div class="panel-title" style="margin-top:16px">Layers</div>');
      const layerWrap = document.createElement('div');
      for (const [k, n] of [['terrain', 'Terrain & tiles'], ['grid', 'Grid'], ['paths', 'Paths'], ['objects', 'Stamps'], ['labels', 'Labels'], ['pins', 'Pins']]) {
        const lr = document.createElement('label');
        lr.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-dim);margin:5px 0;cursor:pointer';
        lr.innerHTML = `<input type="checkbox" ${this.layers[k] ? 'checked' : ''}> ${n}`;
        lr.querySelector('input').onchange = (e) => {
          this.layers[k] = e.target.checked;
          this.requestRender();
        };
        layerWrap.appendChild(lr);
      }
      panel.appendChild(layerWrap);
      add('<div style="font-size:11px;color:var(--text-faint);line-height:1.5;margin-top:2px">Hidden layers can\'t be selected. Exports always include every layer.</div>');

      add(`<div class="panel-block" style="margin-top:16px"><div class="panel-title">Map</div>
        <div style="font-size:12px;color:var(--text-dim);line-height:1.7">
        ${this.map.width} × ${this.map.height} px<br>
        ${this.map.objects.length} stamps • ${this.map.paths.length} paths<br>
        ${this.map.labels.length} labels • ${this.map.pins.length} pins</div></div>`);
    }

    if (this.tool === 'label') {
      add('<div class="panel-title">Labels</div><div style="font-size:12px;color:var(--text-dim);line-height:1.7">Click the map to place a label, then edit its text, size and color in the right panel.</div>');
    }
    if (this.tool === 'pin') {
      add('<div class="panel-title">Lore Pins</div><div style="font-size:12px;color:var(--text-dim);line-height:1.7">Pins connect places on the map to entries in your World Codex.<br><br>Players\' handouts stay pretty; your secrets stay organized.</div>');
    }
    if (this.tool === 'pan') {
      add('<div class="panel-title">Navigate</div><div style="font-size:12px;color:var(--text-dim);line-height:1.7">Drag to pan.<br>Mouse wheel to zoom.<br><br>Tip: hold <b>Space</b> in any tool to pan temporarily.</div>');
    }
  }

  _importCustomStamp() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp';
    input.onchange = () => {
      const f = input.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          // downscale big images so project files stay reasonable
          const MAX = 512;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          const cs = {
            id: uid(),
            name: f.name.replace(/\.[^.]+$/, ''),
            dataURL: c.toDataURL('image/png')
          };
          state.project.customStamps.push(cs);
          setCustomStamps(state.project.customStamps);
          this.stampId = 'custom:' + cs.id;
          markDirty();
          this.buildContextPanel();
          toast(`Imported “${cs.name}” — saved inside this project`);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(f);
    };
    input.click();
  }

  _slider(panel, label, min, max, value, onInput) {
    const row = document.createElement('div');
    row.className = 'slider-row';
    row.innerHTML = `<label>${label}</label><input type="range" min="${min}" max="${max}" value="${value}"><span class="val">${value}</span>`;
    const input = row.querySelector('input');
    const val = row.querySelector('.val');
    input.oninput = () => { val.textContent = input.value; onInput(Number(input.value)); };
    panel.appendChild(row);
  }

  /* ---------------- inspector ---------------- */

  buildInspector(focusText = false) {
    const insp = document.getElementById('inspector');
    insp.innerHTML = '';

    if (this.multi.length > 1) {
      insp.insertAdjacentHTML('beforeend', `<div class="insp-title">${this.multi.length} items selected</div>
        <div class="insp-empty">Drag any selected item to move the group.<br><br>
        Ctrl+C copy · Ctrl+V paste<br>Ctrl+D duplicate · Del delete</div>`);
      const actions = document.createElement('div');
      actions.className = 'insp-actions';
      const mk = (label, fn, danger) => {
        const b = document.createElement('button');
        b.className = 'btn small' + (danger ? ' danger' : '');
        b.textContent = label;
        b.onclick = fn;
        actions.appendChild(b);
      };
      mk('Copy', () => this.copySelection());
      mk('Duplicate', () => this.duplicateSelection());
      mk('Delete', () => this.deleteSelection(), true);
      insp.appendChild(actions);
      return;
    }

    const item = this.selected();
    if (!item) {
      insp.innerHTML = `<div class="insp-title">Inspector</div>
        <div class="insp-empty">Nothing selected.<br><br>Use the <b>Select</b> tool to click things — or drag on empty ground to box-select several at once.<br><br>
        <b>Shortcuts</b><br>V select · B brush · S stamps<br>P paths · T labels · I pins<br>Ctrl+Z undo · Ctrl+D duplicate<br>Ctrl+C/V copy & paste (across maps!)<br>Ctrl+A select all · Del delete<br>Space+drag pan</div>`;
      return;
    }
    const kind = this.selection.kind;
    const title = { object: 'Stamp', path: 'Path', label: 'Label', pin: 'Lore Pin' }[kind];
    insp.insertAdjacentHTML('beforeend', `<div class="insp-title">${title}</div>`);

    const commitChange = () => { markDirty(); this._scheduleThumb(); this.requestRender(); };

    if (kind === 'object') {
      const st = getStamp(item.stamp);
      const customName = item.stamp.startsWith('custom:')
        ? (getCustomStamps().find((cs) => 'custom:' + cs.id === item.stamp)?.name || 'Custom image') : null;
      insp.insertAdjacentHTML('beforeend', `<div class="insp-row"><label>Type</label><div>${customName || (st ? st.name : item.stamp)}</div></div>`);
      this._inspSlider(insp, 'Size', 10, 300, item.size || 48, (v) => { item.size = v; commitChange(); });
      this._inspSlider(insp, 'Rotation', -180, 180, item.rot || 0, (v) => { item.rot = v; commitChange(); });
      insp.insertAdjacentHTML('beforeend', '<div class="panel-title" style="margin-top:10px">Tint</div>');
      this._inspSlider(insp, 'Hue', -180, 180, item.hue || 0, (v) => { item.hue = v; commitChange(); });
      this._inspSlider(insp, 'Color', 0, 200, item.sat == null ? 100 : item.sat, (v) => { item.sat = v; commitChange(); });
      this._inspSlider(insp, 'Light', 50, 150, item.bri == null ? 100 : item.bri, (v) => { item.bri = v; commitChange(); });
      const flip = document.createElement('label');
      flip.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-dim);margin:8px 0;cursor:pointer';
      flip.innerHTML = `<input type="checkbox" ${item.flip ? 'checked' : ''}> Mirror`;
      flip.querySelector('input').onchange = (e) => { item.flip = e.target.checked; commitChange(); };
      insp.appendChild(flip);
      this._zOrderButtons(insp, 'objects', item);
    }

    if (kind === 'label') {
      const row = document.createElement('div');
      row.className = 'insp-row';
      row.innerHTML = '<label>Text</label>';
      const input = document.createElement('input');
      input.type = 'text';
      input.value = item.text;
      input.oninput = () => { item.text = input.value; commitChange(); };
      row.appendChild(input);
      insp.appendChild(row);
      const fontRow = document.createElement('div');
      fontRow.className = 'insp-row';
      fontRow.innerHTML = '<label>Font</label>';
      const fsel = document.createElement('select');
      for (const f of LABEL_FONTS) {
        const o = document.createElement('option');
        o.value = f;
        o.textContent = f;
        o.style.fontFamily = f;
        if ((item.font || 'Georgia') === f) o.selected = true;
        fsel.appendChild(o);
      }
      fsel.onchange = () => { item.font = fsel.value; commitChange(); };
      fontRow.appendChild(fsel);
      insp.appendChild(fontRow);
      this._inspSlider(insp, 'Size', 10, 120, item.size, (v) => { item.size = v; commitChange(); });
      this._inspSlider(insp, 'Rotation', -90, 90, item.rot || 0, (v) => { item.rot = v; commitChange(); });
      this._colorRow(insp, LABEL_COLORS, item.color, (c) => { item.color = c; commitChange(); this.buildInspector(); });
      this._customColor(insp, item.color, (c) => { item.color = c; commitChange(); });
      if (focusText) setTimeout(() => { input.focus(); input.select(); }, 30);
    }

    if (kind === 'path') {
      const kindRow = document.createElement('div');
      kindRow.className = 'insp-row';
      kindRow.innerHTML = '<label>Type</label>';
      const sel = document.createElement('select');
      for (const [k, def] of Object.entries(PATH_KINDS)) {
        const o = document.createElement('option');
        o.value = k; o.textContent = def.name;
        if (item.kind === k) o.selected = true;
        sel.appendChild(o);
      }
      sel.onchange = () => { item.kind = sel.value; commitChange(); };
      kindRow.appendChild(sel);
      insp.appendChild(kindRow);
      this._inspSlider(insp, 'Width', 2, 40, item.width, (v) => { item.width = v; commitChange(); });
      this._colorRow(insp, PATH_COLORS, item.color, (c) => { item.color = c; commitChange(); this.buildInspector(); });
      this._customColor(insp, item.color, (c) => { item.color = c; commitChange(); });
      insp.insertAdjacentHTML('beforeend', `<div class="insp-row"><label>Points</label><div style="font-size:12px">${item.points.length}</div></div>`);
    }

    if (kind === 'pin') {
      const entry = item.entryId ? getEntry(item.entryId) : null;
      const row = document.createElement('div');
      row.className = 'insp-row';
      row.innerHTML = '<label>Linked entry</label>';
      if (entry) {
        const chip = document.createElement('span');
        chip.className = 'entry-link-chip';
        chip.textContent = '📖 ' + entry.title;
        chip.title = 'Open in codex';
        chip.onclick = () => this.onOpenEntry && this.onOpenEntry(entry.id);
        row.appendChild(chip);
      } else {
        row.insertAdjacentHTML('beforeend', '<div class="insp-empty">Not linked yet.</div>');
      }
      insp.appendChild(row);
      const btn = document.createElement('button');
      btn.className = 'btn small';
      btn.textContent = entry ? 'Change link…' : 'Link to entry…';
      btn.onclick = () => {
        pickEntryModal({ allowCreate: true, title: 'Link pin to a codex entry' }).then((entryId) => {
          if (entryId) { item.entryId = entryId; commitChange(); this.buildInspector(); }
        });
      };
      insp.appendChild(btn);
      this._colorRow(insp, PIN_COLORS, item.color, (c) => { item.color = c; commitChange(); this.buildInspector(); });
    }

    const actions = document.createElement('div');
    actions.className = 'insp-actions';
    const dup = document.createElement('button');
    dup.className = 'btn small';
    dup.textContent = 'Duplicate';
    dup.onclick = () => this.duplicateSelection();
    const del = document.createElement('button');
    del.className = 'btn small danger';
    del.textContent = 'Delete';
    del.onclick = () => this.deleteSelection();
    actions.append(dup, del);
    insp.appendChild(actions);
  }

  _inspSlider(insp, label, min, max, value, onInput) {
    const row = document.createElement('div');
    row.className = 'insp-row';
    row.innerHTML = `<label>${label} <span style="float:right">${Math.round(value)}</span></label><input type="range" min="${min}" max="${max}" value="${value}">`;
    const input = row.querySelector('input');
    const span = row.querySelector('span');
    input.oninput = () => { span.textContent = input.value; onInput(Number(input.value)); };
    insp.appendChild(row);
  }

  _customColor(insp, current, onPick) {
    const row = document.createElement('div');
    row.className = 'insp-row';
    row.innerHTML = '<label>Custom color</label>';
    const input = document.createElement('input');
    input.type = 'color';
    input.style.cssText = 'width:100%;height:28px;padding:1px;cursor:pointer';
    try { input.value = /^#[0-9a-f]{6}$/i.test(current) ? current : '#8a6b42'; } catch { /* ignore */ }
    input.oninput = () => onPick(input.value);
    row.appendChild(input);
    insp.appendChild(row);
  }

  _colorRow(insp, colors, current, onPick) {
    const row = document.createElement('div');
    row.className = 'insp-row';
    row.innerHTML = '<label>Color</label>';
    const cr = document.createElement('div');
    cr.className = 'color-row';
    for (const c of colors) {
      const d = document.createElement('div');
      d.className = 'color-dot' + (current === c ? ' active' : '');
      d.style.background = c;
      d.onclick = () => onPick(c);
      cr.appendChild(d);
    }
    row.appendChild(cr);
    insp.appendChild(row);
  }

  _zOrderButtons(insp, arrName, item) {
    const row = document.createElement('div');
    row.className = 'insp-actions';
    const fwd = document.createElement('button');
    fwd.className = 'btn small';
    fwd.textContent = '▲ Forward';
    fwd.onclick = () => {
      const arr = this.map[arrName];
      const i = arr.indexOf(item);
      if (i < arr.length - 1) { arr.splice(i, 1); arr.splice(i + 1, 0, item); markDirty(); this.requestRender(); }
    };
    const back = document.createElement('button');
    back.className = 'btn small';
    back.textContent = '▼ Back';
    back.onclick = () => {
      const arr = this.map[arrName];
      const i = arr.indexOf(item);
      if (i > 0) { arr.splice(i, 1); arr.splice(i - 1, 0, item); markDirty(); this.requestRender(); }
    };
    row.append(fwd, back);
    insp.appendChild(row);
  }

  /* ---------------- rendering ---------------- */

  requestRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    requestAnimationFrame(() => { this._renderQueued = false; this.render(); });
  }

  render() {
    if (!this.map) return;
    const themeFilter = (THEMES[this.map.theme] || THEMES.classic).filter;
    if (this.canvas.style.filter !== themeFilter) this.canvas.style.filter = themeFilter;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    ctx.translate(this.cam.x, this.cam.y);
    ctx.scale(this.cam.zoom, this.cam.zoom);

    this._drawMapContent(ctx, this.map, false);

    // drawing-path preview
    if (this.drawingPath && this.pointerWorld) {
      const p = { ...this.drawingPath, points: [...this.drawingPath.points, this.pointerWorld] };
      ctx.globalAlpha = 0.65;
      drawPath(ctx, p);
      ctx.globalAlpha = 1;
      for (const pt of this.drawingPath.points) {
        ctx.fillStyle = '#e8b55a';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 / this.cam.zoom, 0, Math.PI * 2); ctx.fill();
      }
    }

    // marquee rectangle
    if (this.marquee) {
      const mq = this.marquee;
      ctx.strokeStyle = '#e8b55a';
      ctx.lineWidth = 1.5 / this.cam.zoom;
      ctx.setLineDash([6 / this.cam.zoom, 4 / this.cam.zoom]);
      ctx.strokeRect(Math.min(mq.x0, mq.x1), Math.min(mq.y0, mq.y1), Math.abs(mq.x1 - mq.x0), Math.abs(mq.y1 - mq.y0));
      ctx.fillStyle = 'rgba(232,181,90,0.07)';
      ctx.fillRect(Math.min(mq.x0, mq.x1), Math.min(mq.y0, mq.y1), Math.abs(mq.x1 - mq.x0), Math.abs(mq.y1 - mq.y0));
      ctx.setLineDash([]);
    }

    // multi-selection highlights
    if (this.multi.length) {
      ctx.strokeStyle = '#e8b55a';
      ctx.lineWidth = 2 / this.cam.zoom;
      ctx.setLineDash([5 / this.cam.zoom, 4 / this.cam.zoom]);
      for (const ref of this.multi) {
        const item = this._itemFor(ref);
        if (!item) continue;
        if (ref.kind === 'object') {
          const r = (item.size || 48) * 0.6;
          ctx.strokeRect(item.x - r, item.y - r, r * 2, r * 2);
        } else if (ref.kind === 'label') {
          const w = item.text.length * item.size * 0.52 + 14;
          ctx.strokeRect(item.x - w / 2, item.y - item.size * 0.8, w, item.size * 1.3);
        } else if (ref.kind === 'pin') {
          ctx.beginPath(); ctx.arc(item.x, item.y - 18, 22, 0, Math.PI * 2); ctx.stroke();
        } else if (ref.kind === 'path') {
          for (const pt of item.points) {
            ctx.beginPath(); ctx.arc(pt.x, pt.y, 4 / this.cam.zoom, 0, Math.PI * 2); ctx.stroke();
          }
        }
      }
      ctx.setLineDash([]);
    }

    // selection highlight
    const sel = this.selected();
    if (sel) {
      ctx.strokeStyle = '#e8b55a';
      ctx.lineWidth = 2 / this.cam.zoom;
      ctx.setLineDash([6 / this.cam.zoom, 4 / this.cam.zoom]);
      if (this.selection.kind === 'object') {
        const r = (sel.size || 48) * 0.6;
        ctx.strokeRect(sel.x - r, sel.y - r, r * 2, r * 2);
      } else if (this.selection.kind === 'label') {
        const w = sel.text.length * sel.size * 0.52 + 14;
        ctx.strokeRect(sel.x - w / 2, sel.y - sel.size * 0.8, w, sel.size * 1.3);
      } else if (this.selection.kind === 'pin') {
        ctx.beginPath(); ctx.arc(sel.x, sel.y - 18, 22, 0, Math.PI * 2); ctx.stroke();
      } else if (this.selection.kind === 'path') {
        for (const pt of sel.points) {
          ctx.beginPath(); ctx.arc(pt.x, pt.y, 5 / this.cam.zoom, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    // tool cursor previews
    if (this.pointerWorld) {
      if (this.tool === 'terrain') {
        ctx.strokeStyle = 'rgba(232,181,90,0.9)';
        ctx.lineWidth = 1.5 / this.cam.zoom;
        ctx.beginPath();
        ctx.arc(this.pointerWorld.x, this.pointerWorld.y, this.brushSize, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.tool === 'tile') {
        const g = this.map.gridSize;
        const cx = Math.floor(this.pointerWorld.x / g), cy = Math.floor(this.pointerWorld.y / g);
        const r = this.tileBrush - 1;
        ctx.strokeStyle = 'rgba(232,181,90,0.9)';
        ctx.lineWidth = 1.5 / this.cam.zoom;
        ctx.strokeRect((cx - r) * g, (cy - r) * g, g * (r * 2 + 1), g * (r * 2 + 1));
      } else if (this.tool === 'stamp' && this.stampId) {
        ctx.globalAlpha = 0.5;
        drawStampObject(ctx, { stamp: this.stampId, x: this.pointerWorld.x, y: this.pointerWorld.y, size: this.stampSize });
        ctx.globalAlpha = 1;
      }
    }
  }

  /* Draws full map content (shared by screen render + export). */
  _drawMapContent(ctx, map, forExport) {
    const L = forExport ? { terrain: true, grid: true, paths: true, objects: true, labels: true, pins: true } : this.layers;
    // background
    const key = map.id + '|' + map.background + '|' + map.width + 'x' + map.height;
    if (this.bgCacheKey !== key) {
      this.bgCache = makeBackground(map);
      this.bgCacheKey = key;
    }
    ctx.drawImage(this.bgCache, 0, 0);

    if (L.terrain && this.terrainCanvas) ctx.drawImage(this.terrainCanvas, 0, 0);
    if (L.terrain && map.type === 'dungeon') drawTiles(ctx, map);
    if (L.grid && map.gridVisible) drawGrid(ctx, map);
    if (L.paths) for (const p of map.paths) drawPath(ctx, p);
    if (L.objects) for (const o of map.objects) drawStampObject(ctx, o);
    if (L.labels) for (const l of map.labels) drawLabel(ctx, l, map);
    if (L.pins) for (const p of map.pins) drawPin(ctx, p, forExport);
  }

  /* Render the map to an offscreen canvas (for export / thumbnails). */
  renderToCanvas(scale = 1) {
    const c = document.createElement('canvas');
    c.width = Math.round(this.map.width * scale);
    c.height = Math.round(this.map.height * scale);
    const ctx = c.getContext('2d');
    const themeFilter = (THEMES[this.map.theme] || THEMES.classic).filter;
    if (themeFilter) ctx.filter = themeFilter;
    ctx.scale(scale, scale);
    this._drawMapContent(ctx, this.map, true);
    return c;
  }

  _scheduleThumb() {
    clearTimeout(this._thumbTimer);
    this._thumbTimer = setTimeout(() => {
      if (!this.map) return;
      const scale = 260 / this.map.width;
      const c = this.renderToCanvas(scale);
      this.map.thumb = c.toDataURL('image/jpeg', 0.72);
    }, 800);
  }
}

/* ---------------- shared drawing helpers ---------------- */

export function drawPath(ctx, p) {
  const def = PATH_KINDS[p.kind] || PATH_KINDS.road;
  const pts = p.points;
  if (pts.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const trace = () => {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  };

  if (p.kind === 'river') {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.width;
    trace(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = Math.max(1.5, p.width * 0.35);
    trace(); ctx.stroke();
  } else if (p.kind === 'wall') {
    ctx.strokeStyle = '#3b2e20';
    ctx.lineWidth = p.width + 3;
    trace(); ctx.stroke();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.width;
    trace(); ctx.stroke();
  } else {
    if (def.dot) ctx.setLineDash([0.5, p.width * 2.4]);
    else if (def.dash) ctx.setLineDash([p.width * 2.4, p.width * 1.8]);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.width;
    trace(); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

export function drawLabel(ctx, l, map) {
  ctx.save();
  ctx.translate(l.x, l.y);
  if (l.rot) ctx.rotate((l.rot * Math.PI) / 180);
  ctx.font = `${l.size}px "${l.font || 'Georgia'}", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const dark = map.background === 'dungeon';
  ctx.lineWidth = Math.max(2, l.size * 0.16);
  ctx.strokeStyle = dark ? 'rgba(10,8,6,0.85)' : 'rgba(238,228,200,0.85)';
  ctx.strokeText(l.text, 0, 0);
  ctx.fillStyle = l.color;
  ctx.fillText(l.text, 0, 0);
  ctx.restore();
}

export function drawPin(ctx, p, forExport) {
  ctx.save();
  ctx.translate(p.x, p.y);
  // teardrop
  ctx.beginPath();
  ctx.arc(0, -18, 12, Math.PI * 0.82, Math.PI * 0.18, false);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = p.color || '#c0503e';
  ctx.strokeStyle = '#2a2118';
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -18, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f3ead6';
  ctx.fill();
  // entry title
  const entry = p.entryId ? getEntry(p.entryId) : null;
  if (entry) {
    ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(238,228,200,0.85)';
    ctx.strokeText(entry.title, 0, 14);
    ctx.fillStyle = '#2e2417';
    ctx.fillText(entry.title, 0, 14);
  }
  ctx.restore();
}

function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/* Ramer–Douglas–Peucker simplification for freehand strokes. */
function simplifyPoints(pts, epsilon) {
  if (pts.length < 3) return pts;
  let maxD = 0, maxI = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = distToSegment(pts[i], pts[0], pts[pts.length - 1]);
    if (d > maxD) { maxD = d; maxI = i; }
  }
  if (maxD > epsilon) {
    const left = simplifyPoints(pts.slice(0, maxI + 1), epsilon);
    const right = simplifyPoints(pts.slice(maxI), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [pts[0], pts[pts.length - 1]];
}

/* Standalone renderer for maps that aren't open in the editor
   (thumbnails on load, codex export). Async because terrain loads from dataURL. */
export async function renderMapStandalone(map, scale = 1) {
  const c = document.createElement('canvas');
  c.width = Math.round(map.width * scale);
  c.height = Math.round(map.height * scale);
  const ctx = c.getContext('2d');
  const themeFilter = (THEMES[map.theme] || THEMES.classic).filter;
  if (themeFilter) ctx.filter = themeFilter;
  ctx.scale(scale, scale);
  ctx.drawImage(makeBackground(map), 0, 0);
  if (map.terrain) {
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0); resolve(); };
      img.onerror = resolve;
      img.src = map.terrain;
    });
  }
  if (map.type === 'dungeon') drawTiles(ctx, map);
  if (map.gridVisible) drawGrid(ctx, map);
  for (const p of map.paths) drawPath(ctx, p);
  for (const o of map.objects) drawStampObject(ctx, o);
  for (const l of map.labels) drawLabel(ctx, l, map);
  for (const p of map.pins) drawPin(ctx, p, true);
  return c;
}
