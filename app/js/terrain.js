/* Terrain painting, procedural backgrounds and dungeon tiles. */

/* ---------------- terrain brushes ---------------- */

export const TERRAINS = [
  { id: 'grass',    name: 'Grassland', base: '#8aa15f', speckle: ['#7a9152', '#99b06e', '#6f8549'] },
  { id: 'forest',   name: 'Forest',    base: '#5f7f42', speckle: ['#4e6b35', '#6f8f50', '#435d2e'] },
  { id: 'jungle',   name: 'Jungle',    base: '#4a7038', speckle: ['#3d6030', '#578045', '#33512a'] },
  { id: 'taiga',    name: 'Taiga',     base: '#557569', speckle: ['#48685c', '#628578', '#3e5b50'] },
  { id: 'sand',     name: 'Desert',    base: '#d3bd8b', speckle: ['#c4ac77', '#e0cc9e', '#b89f6c'] },
  { id: 'rock',     name: 'Rock',      base: '#948b7c', speckle: ['#847b6c', '#a49b8c', '#6e675c'] },
  { id: 'snow',     name: 'Snow',      base: '#e3e0d4', speckle: ['#d4d1c4', '#efece0', '#c8c5b8'] },
  { id: 'ice',      name: 'Ice',       base: '#ccdbe0', speckle: ['#bccdd4', '#dceaef', '#adc0c9'] },
  { id: 'swamp',    name: 'Swamp',     base: '#6d7a55', speckle: ['#5c6a48', '#7d8a63', '#515e40'] },
  { id: 'tundra',   name: 'Tundra',    base: '#a8a68e', speckle: ['#98967e', '#b8b69e', '#8a8874'] },
  { id: 'water',    name: 'Water',     base: '#5f83a8', speckle: ['#54779b', '#6c90b5', '#4a6b8d'] },
  { id: 'shallows', name: 'Shallows',  base: '#74a0b5', speckle: ['#6794aa', '#82adc1', '#5c889e'] },
  { id: 'deepsea',  name: 'Deep Ocean', base: '#37536f', speckle: ['#2f4962', '#3f5d7c', '#284056'] },
  { id: 'lava',     name: 'Scorched',  base: '#4a3a32', speckle: ['#5c453a', '#3a2d26', '#6b4a35'] },
  { id: 'ash',      name: 'Ashlands',  base: '#5c574f', speckle: ['#4f4a43', '#69645c', '#443f39'] },
  { id: 'farm',     name: 'Farmland',  base: '#b3a06a', speckle: ['#a3905a', '#c3b07a', '#94824e'] },
  { id: 'road',     name: 'Dirt',      base: '#a08a62', speckle: ['#907a52', '#b09a72', '#846f4c'] },
  { id: 'erase',    name: 'Erase',     base: null, speckle: [] }
];

export function getTerrain(id) { return TERRAINS.find((t) => t.id === id); }

/* Paint one brush dab. */
function dab(ctx, x, y, r, terrain) {
  if (terrain.id === 'erase') {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  const g = ctx.createRadialGradient(x, y, r * 0.55, x, y, r);
  g.addColorStop(0, terrain.base);
  g.addColorStop(1, terrain.base + '00');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // speckle texture
  const n = Math.max(3, Math.floor(r / 4));
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * r * 0.75;
    const sr = 1 + Math.random() * Math.max(1.5, r * 0.06);
    ctx.fillStyle = terrain.speckle[(Math.random() * terrain.speckle.length) | 0];
    ctx.globalAlpha = 0.5 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, sr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/* Paint a stroke segment onto the terrain layer context. */
export function paintStroke(ctx, x0, y0, x1, y1, terrainId, radius) {
  const t = getTerrain(terrainId);
  if (!t) return;
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const step = Math.max(2, radius * 0.35);
  const steps = Math.max(1, Math.ceil(dist / step));
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps;
    const y = y0 + ((y1 - y0) * i) / steps;
    dab(ctx, x, y, radius, t);
  }
}

/* ---------------- procedural backgrounds ---------------- */

export const BACKGROUNDS = {
  ocean:     { name: 'Ocean',     base: '#43647f', dark: '#3a586f', light: '#4f7290' },
  parchment: { name: 'Parchment', base: '#cbb98d', dark: '#bda97c', light: '#d8c79c' },
  field:     { name: 'Meadow',    base: '#8aa15f', dark: '#7d9354', light: '#96ad6b' },
  dungeon:   { name: 'Darkness',  base: '#191512', dark: '#120f0d', light: '#221d18' },
  stone:     { name: 'Stone',     base: '#6e675c', dark: '#615a50', light: '#7b7468' },
  snowfield: { name: 'Snowfield', base: '#dcd9cc', dark: '#cfccbf', light: '#e9e6d9' }
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* Render a stable textured background canvas for a map. */
export function makeBackground(map) {
  const bg = BACKGROUNDS[map.background] || BACKGROUNDS.ocean;
  const c = document.createElement('canvas');
  c.width = map.width; c.height = map.height;
  const ctx = c.getContext('2d');
  const rand = mulberry32(hashStr(map.id));

  ctx.fillStyle = bg.base;
  ctx.fillRect(0, 0, c.width, c.height);

  // blotches
  const blotches = Math.floor((c.width * c.height) / 26000);
  for (let i = 0; i < blotches; i++) {
    const x = rand() * c.width, y = rand() * c.height;
    const r = 24 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const col = rand() > 0.5 ? bg.light : bg.dark;
    g.addColorStop(0, col + '33');
    g.addColorStop(1, col + '00');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // speckle
  const specks = Math.floor((c.width * c.height) / 900);
  for (let i = 0; i < specks; i++) {
    ctx.fillStyle = rand() > 0.5 ? bg.light : bg.dark;
    ctx.globalAlpha = 0.12 + rand() * 0.2;
    const x = rand() * c.width, y = rand() * c.height;
    ctx.fillRect(x, y, 1 + rand() * 2, 1 + rand() * 2);
  }
  ctx.globalAlpha = 1;

  // ocean gets subtle wave strokes
  if (map.background === 'ocean') {
    ctx.strokeStyle = bg.light + '2e';
    ctx.lineWidth = 1.5;
    const waves = Math.floor((c.width * c.height) / 60000);
    for (let i = 0; i < waves; i++) {
      const x = rand() * c.width, y = rand() * c.height;
      const w = 16 + rand() * 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w / 2, y - 5, x + w, y);
      ctx.stroke();
    }
  }

  // vignette / aged edges for non-dungeon maps
  if (map.background !== 'dungeon') {
    const vg = ctx.createRadialGradient(
      c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.42,
      c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.75
    );
    vg.addColorStop(0, 'rgba(40,28,12,0)');
    vg.addColorStop(1, 'rgba(40,28,12,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, c.width, c.height);
  }

  // border frame
  ctx.strokeStyle = 'rgba(30,22,10,0.8)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, c.width - 4, c.height - 4);

  return c;
}

/* ---------------- dungeon tiles ---------------- */

export const TILES = [
  { id: 'floor',  name: 'Stone Floor', color: '#9a9081' },
  { id: 'wood',   name: 'Wood Floor',  color: '#8a6b42' },
  { id: 'carpet', name: 'Carpet',      color: '#7c3038' },
  { id: 'door',   name: 'Door',        color: '#a5824f' },
  { id: 'water',  name: 'Water',       color: '#5f83a8' },
  { id: 'lava',   name: 'Lava',        color: '#c05a2e' },
  { id: 'pit',    name: 'Pit',         color: '#2c2620' },
  { id: 'grass',  name: 'Cave Moss',   color: '#6d7a55' },
  { id: 'sand',   name: 'Sand Floor',  color: '#c4ac77' },
  { id: 'secretdoor', name: 'Secret Door', color: '#4a4038' },
  { id: 'erase',  name: 'Erase',       color: null }
];

export function getTile(id) { return TILES.find((t) => t.id === id); }

const CARVED = new Set(['floor', 'wood', 'carpet', 'door', 'water', 'lava', 'pit', 'grass', 'sand']);

function tileAt(tiles, cx, cy) { return tiles[cx + ',' + cy]; }
function isCarved(tiles, cx, cy) { return CARVED.has(tileAt(tiles, cx, cy)); }

/* Draw the whole dungeon tile layer (floors, then auto walls, then doors). */
export function drawTiles(ctx, map) {
  const g = map.gridSize;
  const tiles = map.tiles;
  const keys = Object.keys(tiles);
  if (!keys.length) return;

  // floors
  for (const key of keys) {
    const [cx, cy] = key.split(',').map(Number);
    const t = tiles[key];
    const x = cx * g, y = cy * g;
    const h = (hash2(cx, cy) % 1000) / 1000;

    if (t === 'secretdoor') {
      // looks like solid wall; marked for the GM after the wall pass
      ctx.fillStyle = '#241e18';
      ctx.fillRect(x, y, g, g);
      continue;
    }
    if (t === 'pit') {
      ctx.fillStyle = '#2c2620';
      ctx.fillRect(x, y, g, g);
      ctx.strokeStyle = '#171310';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + g * 0.15, y + g * 0.15, g * 0.7, g * 0.7);
      continue;
    }
    let base = '#9a9081';
    if (t === 'water') base = h > 0.5 ? '#5f83a8' : '#587ba0';
    else if (t === 'lava') base = h > 0.5 ? '#c05a2e' : '#b35228';
    else if (t === 'grass') base = h > 0.5 ? '#6d7a55' : '#65724e';
    else if (t === 'sand') base = h > 0.5 ? '#c4ac77' : '#bca470';
    else if (t === 'wood') base = h > 0.5 ? '#8a6b42' : '#83653e';
    else if (t === 'carpet') base = h > 0.5 ? '#7c3038' : '#762d35';
    else base = h > 0.66 ? '#9a9081' : h > 0.33 ? '#948a7b' : '#a0968a';
    ctx.fillStyle = base;
    ctx.fillRect(x, y, g, g);

    // stone joint lines
    if (t === 'floor' || t === 'door' || t === 'sand') {
      ctx.strokeStyle = 'rgba(60,50,40,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, g - 1, g - 1);
    }
    // wood planks
    if (t === 'wood') {
      ctx.strokeStyle = 'rgba(50,35,20,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y + g / 3); ctx.lineTo(x + g, y + g / 3);
      ctx.moveTo(x, y + (2 * g) / 3); ctx.lineTo(x + g, y + (2 * g) / 3);
      ctx.stroke();
    }
    // carpet trim (drawn on edge tiles where the neighbor isn't carpet)
    if (t === 'carpet') {
      ctx.strokeStyle = 'rgba(201,151,63,0.75)';
      ctx.lineWidth = 1.5;
      const inset = g * 0.14;
      ctx.beginPath();
      if (tileAt(tiles, cx, cy - 1) !== 'carpet') { ctx.moveTo(x + 1, y + inset); ctx.lineTo(x + g - 1, y + inset); }
      if (tileAt(tiles, cx, cy + 1) !== 'carpet') { ctx.moveTo(x + 1, y + g - inset); ctx.lineTo(x + g - 1, y + g - inset); }
      if (tileAt(tiles, cx - 1, cy) !== 'carpet') { ctx.moveTo(x + inset, y + 1); ctx.lineTo(x + inset, y + g - 1); }
      if (tileAt(tiles, cx + 1, cy) !== 'carpet') { ctx.moveTo(x + g - inset, y + 1); ctx.lineTo(x + g - inset, y + g - 1); }
      ctx.stroke();
    }
    if (t === 'water' || t === 'lava') {
      ctx.strokeStyle = t === 'water' ? 'rgba(120,160,200,0.4)' : 'rgba(240,150,60,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + g * 0.2, y + g * (0.3 + h * 0.4));
      ctx.quadraticCurveTo(x + g * 0.5, y + g * (0.2 + h * 0.4), x + g * 0.8, y + g * (0.3 + h * 0.4));
      ctx.stroke();
    }
  }

  // auto walls at carved boundaries
  ctx.strokeStyle = '#2a2118';
  ctx.lineWidth = Math.max(3, g * 0.14);
  ctx.lineCap = 'square';
  ctx.beginPath();
  for (const key of keys) {
    if (!CARVED.has(tiles[key])) continue;
    const [cx, cy] = key.split(',').map(Number);
    const x = cx * g, y = cy * g;
    if (!isCarved(tiles, cx, cy - 1)) { ctx.moveTo(x, y); ctx.lineTo(x + g, y); }
    if (!isCarved(tiles, cx, cy + 1)) { ctx.moveTo(x, y + g); ctx.lineTo(x + g, y + g); }
    if (!isCarved(tiles, cx - 1, cy)) { ctx.moveTo(x, y); ctx.lineTo(x, y + g); }
    if (!isCarved(tiles, cx + 1, cy)) { ctx.moveTo(x + g, y); ctx.lineTo(x + g, y + g); }
  }
  ctx.stroke();

  // secret door GM markers
  for (const key of keys) {
    if (tiles[key] !== 'secretdoor') continue;
    const [cx, cy] = key.split(',').map(Number);
    ctx.fillStyle = 'rgba(232,221,200,0.45)';
    ctx.font = `${Math.round(g * 0.5)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', (cx + 0.5) * g, (cy + 0.55) * g);
  }

  // doors on top
  for (const key of keys) {
    if (tiles[key] !== 'door') continue;
    const [cx, cy] = key.split(',').map(Number);
    const x = cx * g, y = cy * g;
    const horizPassage = isCarved(tiles, cx - 1, cy) && isCarved(tiles, cx + 1, cy);
    ctx.fillStyle = '#8a6b42';
    ctx.strokeStyle = '#3b2e20';
    ctx.lineWidth = 2;
    if (horizPassage) {
      ctx.fillRect(x + g * 0.32, y + g * 0.08, g * 0.36, g * 0.84);
      ctx.strokeRect(x + g * 0.32, y + g * 0.08, g * 0.36, g * 0.84);
    } else {
      ctx.fillRect(x + g * 0.08, y + g * 0.32, g * 0.84, g * 0.36);
      ctx.strokeRect(x + g * 0.08, y + g * 0.32, g * 0.84, g * 0.36);
    }
  }
}

function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/* ---------------- grid overlay (square or hex) ---------------- */

export function drawGrid(ctx, map) {
  const g = map.gridSize;
  ctx.strokeStyle = map.background === 'dungeon' ? 'rgba(200,190,170,0.08)' : 'rgba(40,30,15,0.13)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (map.gridStyle === 'hex') {
    // flat-top hexes, edge length derived from gridSize
    const s = g * 0.58;
    const hw = s * 1.5, hh = s * Math.sqrt(3);
    for (let col = 0; col * hw < map.width + hw; col++) {
      const cx = col * hw;
      const yOff = (col % 2) * (hh / 2);
      for (let row = 0; row * hh < map.height + hh; row++) {
        const cy = row * hh + yOff;
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i, a2 = (Math.PI / 3) * (i + 1);
          ctx.moveTo(cx + Math.cos(a1) * s, cy + Math.sin(a1) * s);
          ctx.lineTo(cx + Math.cos(a2) * s, cy + Math.sin(a2) * s);
        }
      }
    }
  } else {
    for (let x = 0; x <= map.width; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, map.height); }
    for (let y = 0; y <= map.height; y += g) { ctx.moveTo(0, y); ctx.lineTo(map.width, y); }
  }
  ctx.stroke();
}

/* Map-wide render themes (CSS/canvas filter strings). */
export const THEMES = {
  classic:   { name: 'Classic',        filter: '' },
  parchment: { name: 'Aged Parchment', filter: 'sepia(0.45) saturate(0.85) contrast(1.04)' },
  grimdark:  { name: 'Grimdark',       filter: 'saturate(0.62) brightness(0.86) contrast(1.14)' },
  vibrant:   { name: 'Vibrant',        filter: 'saturate(1.35) contrast(1.05)' }
};
