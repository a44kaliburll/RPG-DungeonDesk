/* Map generation v2 — noise terrain, climate biomes, inked coasts, pathfinding
   roads, organic towns, and four dungeon algorithms. All seeded & reproducible. */

import { uid } from './state.js';
import { paintStroke } from './terrain.js';
import {
  rnd, randInt, pick, chance, setRandomSource, seededRandom, randomSeedString,
  worldName, townName, dungeonName, regionName, adjNoun
} from './generators.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function addObj(map, stamp, x, y, size, rot = 0, flip = false) {
  map.objects.push({ id: uid(), stamp, x, y, size, rot, flip });
}
function addLabel(map, text, x, y, size, color, font, rot) {
  map.labels.push({ id: uid(), text, x, y, size, color, font: font || 'Georgia', rot: rot || 0 });
}
function addPath(map, kind, points, width, color) {
  map.paths.push({ id: uid(), kind, points, width, color });
}

/* ---------------- value noise (seeded) ---------------- */

function makeNoise() {
  const perm = new Uint8Array(512);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd(0, 1) * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const hash = (x, y) => perm[(perm[x & 255] + y) & 255] / 255;
  const sm = (t) => t * t * (3 - 2 * t);
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    const u = sm(xf), v = sm(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x, y, oct = 4) => {
    let sum = 0, amp = 1, tot = 0, f = 1;
    for (let o = 0; o < oct; o++) { sum += n2(x * f, y * f) * amp; tot += amp; amp *= 0.5; f *= 2; }
    return sum / tot;
  };
}

/* ---------------- marching squares (coast ink) ---------------- */

function isoSegments(f, GW, GH, iso) {
  const segs = [];
  const v = (x, y) => f[y * GW + x];
  const L = (a, b) => (iso - a) / (b - a);
  for (let y = 0; y < GH - 1; y++) {
    for (let x = 0; x < GW - 1; x++) {
      const tl = v(x, y), tr = v(x + 1, y), br = v(x + 1, y + 1), bl = v(x, y + 1);
      const idx = (tl > iso ? 8 : 0) | (tr > iso ? 4 : 0) | (br > iso ? 2 : 0) | (bl > iso ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const T = [x + L(tl, tr), y], Rr = [x + 1, y + L(tr, br)], B = [x + L(bl, br), y + 1], Le = [x, y + L(tl, bl)];
      const put = (a, b) => segs.push([a[0], a[1], b[0], b[1]]);
      switch (idx) {
        case 1: put(Le, B); break;   case 2: put(B, Rr); break;
        case 3: put(Le, Rr); break;  case 4: put(T, Rr); break;
        case 5: put(T, Rr); put(Le, B); break;
        case 6: put(T, B); break;    case 7: put(T, Le); break;
        case 8: put(T, Le); break;   case 9: put(T, B); break;
        case 10: put(T, Le); put(B, Rr); break;
        case 11: put(T, Rr); break;  case 12: put(Le, Rr); break;
        case 13: put(B, Rr); break;  case 14: put(Le, B); break;
      }
    }
  }
  return segs;
}

/* ---------------- world & region ---------------- */

const WORLD_PRESETS = {
  continents:  { name: 'Continents',     centers: 2, sea: 0.5,  freq: 3.4 },
  pangea:      { name: 'Lone Continent', centers: 1, sea: 0.47, freq: 3.0 },
  archipelago: { name: 'Archipelago',    centers: 3, sea: 0.585, freq: 5.2 },
  inlandsea:   { name: 'Inland Sea',     centers: 1, sea: 0.52, freq: 3.4, invert: true },
  frozen:      { name: 'Frozen North',   centers: 2, sea: 0.5,  freq: 3.4, tempShift: -0.22, northCold: true },
  desert:      { name: 'Desert World',   centers: 2, sea: 0.48, freq: 3.4, tempShift: 0.2, moistShift: -0.22 }
};

const BIOME_COLORS = {
  grass: [138, 161, 95], forest: [95, 127, 66], jungle: [74, 112, 56], taiga: [85, 117, 105],
  sand: [211, 189, 139], rock: [148, 139, 124], snow: [227, 224, 212], swamp: [109, 122, 85],
  tundra: [168, 166, 142], shallows: [116, 160, 181], deep: [55, 83, 111]
};

const KINGDOM_TINTS = [[170, 60, 50], [60, 90, 170], [170, 140, 40], [90, 150, 70], [140, 70, 160], [60, 150, 150]];

function genWorldish(map, tctx, opts) {
  const W = map.width, H = map.height;
  const isRegion = map.type === 'region';
  map.background = 'ocean';
  const P = WORLD_PRESETS[opts.preset] || WORLD_PRESETS[isRegion ? 'pangea' : 'continents'];

  const GW = 168, GH = Math.max(24, Math.round((GW * H) / W));
  const N = GW * GH;
  const cw = W / GW, ch = H / GH;
  const fbm = makeNoise();
  const fbm2 = makeNoise();
  const fbm3 = makeNoise();

  /* elevation with continental falloff */
  const sea = clamp(P.sea - ((opts.land ?? 50) - 50) / 50 * 0.085, 0.3, 0.68);
  const centers = [];
  const nCent = isRegion ? 1 : P.centers;
  for (let i = 0; i < nCent; i++) centers.push({ x: rnd(0.28, 0.72), y: rnd(0.3, 0.7) });
  const e = new Float32Array(N);
  let eMin = 1e9, eMax = -1e9;
  for (let gy = 0; gy < GH; gy++) {
    for (let gx = 0; gx < GW; gx++) {
      const nx = gx / GW, ny = gy / GH;
      let v = fbm(nx * P.freq, ny * P.freq * 0.82, 5);
      let d = 1e9;
      for (const c of centers) d = Math.min(d, Math.hypot((nx - c.x) * 1.15, ny - c.y));
      d /= 0.58;
      v = P.invert ? v * 0.55 + clamp(d, 0, 1) * 0.5 : v * 0.72 + clamp(1 - d, 0, 1) * 0.42;
      e[gy * GW + gx] = v;
      if (v < eMin) eMin = v; if (v > eMax) eMax = v;
    }
  }
  for (let i = 0; i < N; i++) e[i] = (e[i] - eMin) / (eMax - eMin);

  const land = (i) => e[i] > sea;
  const idx = (x, y) => y * GW + x;
  const inB = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH;

  /* distance to sea (moisture) and distance to land (sea labels) */
  const distSea = new Int16Array(N).fill(-1);
  const distLand = new Int16Array(N).fill(-1);
  let q = [];
  for (let i = 0; i < N; i++) { if (!land(i)) { distSea[i] = 0; q.push(i); } else { distLand[i] = 0; } }
  const bfs = (dist) => {
    let head = 0;
    while (head < q.length) {
      const i = q[head++];
      const x = i % GW, y = (i / GW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!inB(x + dx, y + dy)) continue;
        const j = idx(x + dx, y + dy);
        if (dist[j] === -1) { dist[j] = dist[i] + 1; q.push(j); }
      }
    }
  };
  bfs(distSea);
  q = [];
  for (let i = 0; i < N; i++) if (land(i)) q.push(i);
  bfs(distLand);

  /* climate → biome */
  const tempShift = P.tempShift || 0, moistShift = P.moistShift || 0;
  const biome = new Array(N);
  for (let gy = 0; gy < GH; gy++) {
    for (let gx = 0; gx < GW; gx++) {
      const i = idx(gx, gy);
      if (!land(i)) {
        biome[i] = e[i] > sea - 0.05 ? 'shallows' : e[i] < sea - 0.2 ? 'deep' : null;
        continue;
      }
      const ny = gy / GH;
      let temp = P.northCold ? ny * 1.3 - 0.05 : 1 - Math.abs(ny - 0.5) * 1.9;
      temp += fbm2(gx / GW * 4, ny * 4, 3) * 0.2 - 0.1 + tempShift;
      temp -= Math.max(0, e[i] - sea) * 1.1;
      let moist = clamp(1 - distSea[i] / 26, 0, 1) * 0.6 + fbm3(gx / GW * 5, ny * 5, 3) * 0.4 + moistShift;
      const height = e[i] - sea;
      let b;
      if (height > 0.3) b = temp < 0.42 ? 'snow' : 'rock';
      else if (height < 0.02 && temp > 0.3) b = 'sand';
      else if (temp < 0.16) b = 'snow';
      else if (temp < 0.32) b = moist > 0.45 ? 'taiga' : 'tundra';
      else if (temp > 0.7) b = moist < 0.36 ? 'sand' : moist > 0.62 ? 'jungle' : 'grass';
      else if (moist > 0.68 && height < 0.1) b = 'swamp';
      else b = moist > 0.52 ? 'forest' : 'grass';
      biome[i] = b;
    }
  }

  /* rivers (traced downhill on the grid, drawn later as vector paths) */
  const riverCell = new Uint8Array(N);
  const rivers = [];
  const lakes = [];
  const nRivers = Math.round((opts.rivers ?? 50) / 100 * (isRegion ? 7 : 5));
  let tries = 0;
  while (rivers.length < nRivers && tries++ < 140) {
    const gx = randInt(2, GW - 3), gy = randInt(2, GH - 3);
    const i0 = idx(gx, gy);
    if (!land(i0) || e[i0] < sea + 0.17) continue;
    let x = gx, y = gy;
    const cells = [[x, y]];
    const been = new Set([idx(x, y)]);
    let lake = null;
    for (let s = 0; s < 220; s++) {
      let bx = x, by = y, be = 1e9;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          if (!inB(x + dx, y + dy)) continue;
          const j = idx(x + dx, y + dy);
          if (been.has(j)) continue;
          const ev = e[j] + rnd(0, 0.008);
          if (ev < be) { be = ev; bx = x + dx; by = y + dy; }
        }
      }
      if (bx === x && by === y) { lake = [x, y]; break; }
      const prevE = e[idx(x, y)];
      x = bx; y = by;
      cells.push([x, y]);
      been.add(idx(x, y));
      if (!land(idx(x, y))) break;
      if (be > prevE + 0.02) { lake = [x, y]; break; }
    }
    if (cells.length < 7) continue;
    for (const [cx2, cy2] of cells) riverCell[idx(cx2, cy2)] = 1;
    rivers.push(cells);
    if (lake) lakes.push(lake);
  }

  /* settlements (scored: flat lowland + coast + river) */
  const setts = [];
  const nSetts = opts.settlements ?? (isRegion ? 5 : 4);
  const cands = [];
  for (let gy = 2; gy < GH - 2; gy += 2) {
    for (let gx = 2; gx < GW - 2; gx += 2) {
      const i = idx(gx, gy);
      if (!land(i) || biome[i] === 'snow' || biome[i] === 'rock') continue;
      let score = 2 - Math.abs(e[i] - (sea + 0.07)) * 9 + rnd(0, 0.9);
      if (distSea[i] <= 2) score += 1.6;
      let nearRiver = false;
      for (let dy = -1; dy <= 1 && !nearRiver; dy++) for (let dx = -1; dx <= 1; dx++) if (inB(gx + dx, gy + dy) && riverCell[idx(gx + dx, gy + dy)]) { nearRiver = true; break; }
      if (nearRiver) score += 1.3;
      cands.push({ gx, gy, score, coastal: distSea[i] <= 2 });
    }
  }
  cands.sort((a, b) => b.score - a.score);
  for (const c of cands) {
    if (setts.length >= nSetts) break;
    if (setts.some((s) => Math.hypot(s.gx - c.gx, s.gy - c.gy) < GW * 0.11)) continue;
    setts.push(c);
  }

  /* kingdoms (nearest-capital regions, tinted + dashed borders) */
  const owner = new Int8Array(N).fill(-1);
  const nKingdoms = opts.borders && setts.length >= 2 ? Math.min(setts.length, 4) : 0;
  if (nKingdoms) {
    for (let gy = 0; gy < GH; gy++) {
      for (let gx = 0; gx < GW; gx++) {
        const i = idx(gx, gy);
        if (!land(i)) continue;
        let bo = 0, bd = 1e9;
        for (let k = 0; k < nKingdoms; k++) {
          const d = Math.hypot(gx - setts[k].gx, gy - setts[k].gy);
          if (d < bd) { bd = d; bo = k; }
        }
        owner[i] = bo;
      }
    }
  }

  /* paint biomes: 1px-per-cell canvas scaled up for soft blends */
  const sc = document.createElement('canvas');
  sc.width = GW; sc.height = GH;
  const sctx = sc.getContext('2d');
  const img = sctx.createImageData(GW, GH);
  for (let i = 0; i < N; i++) {
    const b = biome[i];
    if (!b) continue;
    const col = BIOME_COLORS[b];
    const j = rnd(-7, 7);
    let r = col[0] + j, g = col[1] + j, bl = col[2] + j;
    if (owner[i] >= 0) {
      const t = KINGDOM_TINTS[owner[i] % KINGDOM_TINTS.length];
      r = r * 0.93 + t[0] * 0.07; g = g * 0.93 + t[1] * 0.07; bl = bl * 0.93 + t[2] * 0.07;
    }
    img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = bl;
    img.data[i * 4 + 3] = b === 'shallows' ? 200 : b === 'deep' ? 110 : 255;
  }
  sctx.putImageData(img, 0, 0);
  tctx.imageSmoothingEnabled = true;
  tctx.drawImage(sc, -cw, -ch, W + cw * 2, H + ch * 2);

  /* speckle texture on land */
  const specks = Math.floor((W * H) / 800);
  for (let s = 0; s < specks; s++) {
    const x = rnd(0, W), y = rnd(0, H);
    const i = idx(clamp(Math.floor(x / cw), 0, GW - 1), clamp(Math.floor(y / ch), 0, GH - 1));
    if (!land(i)) continue;
    const col = BIOME_COLORS[biome[i]] || BIOME_COLORS.grass;
    const dark = chance(0.5);
    tctx.fillStyle = `rgba(${col[0] + (dark ? -22 : 20)},${col[1] + (dark ? -22 : 20)},${col[2] + (dark ? -22 : 18)},${rnd(0.25, 0.5).toFixed(2)})`;
    tctx.fillRect(x, y, rnd(1, 2.6), rnd(1, 2.6));
  }

  /* border dashes */
  if (nKingdoms) {
    tctx.strokeStyle = 'rgba(140,50,40,0.55)';
    tctx.lineWidth = 2.5;
    tctx.beginPath();
    for (let gy = 0; gy < GH - 1; gy++) {
      for (let gx = 0; gx < GW - 1; gx++) {
        const i = idx(gx, gy);
        if (owner[i] < 0) continue;
        if ((gx + gy) % 2) continue; // dash effect
        const rI = idx(gx + 1, gy), dI = idx(gx, gy + 1);
        if (owner[rI] >= 0 && owner[rI] !== owner[i]) {
          tctx.moveTo((gx + 1) * cw, gy * ch); tctx.lineTo((gx + 1) * cw, (gy + 1) * ch);
        }
        if (owner[dI] >= 0 && owner[dI] !== owner[i]) {
          tctx.moveTo(gx * cw, (gy + 1) * ch); tctx.lineTo((gx + 1) * cw, (gy + 1) * ch);
        }
      }
    }
    tctx.stroke();
  }

  /* inked coastline (marching squares) */
  const toWX = (gx) => gx * cw + cw / 2, toWY = (gy) => gy * ch + ch / 2;
  const drawSegs = (segs, style, width) => {
    tctx.strokeStyle = style;
    tctx.lineWidth = width;
    tctx.lineCap = 'round';
    tctx.beginPath();
    for (const [x1, y1, x2, y2] of segs) {
      tctx.moveTo(toWX(x1), toWY(y1));
      tctx.lineTo(toWX(x2), toWY(y2));
    }
    tctx.stroke();
  };
  const coast = isoSegments(e, GW, GH, sea);
  drawSegs(coast, 'rgba(196,218,216,0.35)', 11);           // shallow-water glow
  drawSegs(isoSegments(e, GW, GH, sea - 0.035), 'rgba(50,40,25,0.25)', 1.6); // offshore echo line
  drawSegs(coast, 'rgba(45,35,20,0.8)', 3);                 // ink line

  /* lakes at river dead-ends */
  for (const [lx, ly] of lakes) {
    const x = toWX(lx), y = toWY(ly), r = rnd(cw * 1.2, cw * 2.4);
    tctx.fillStyle = '#5f83a8';
    tctx.strokeStyle = 'rgba(45,35,20,0.8)';
    tctx.lineWidth = 2.5;
    tctx.beginPath();
    tctx.ellipse(x, y, r * 1.25, r, 0, 0, Math.PI * 2);
    tctx.fill(); tctx.stroke();
  }

  /* vector rivers */
  for (const cells of rivers) {
    const pts = [];
    for (let i2 = 0; i2 < cells.length; i2 += 2) {
      pts.push({ x: toWX(cells[i2][0]) + rnd(-4, 4), y: toWY(cells[i2][1]) + rnd(-4, 4) });
    }
    const last = cells[cells.length - 1];
    pts.push({ x: toWX(last[0]), y: toWY(last[1]) });
    if (pts.length > 2) addPath(map, 'river', pts, clamp(5 + cells.length * 0.12, 6, 13), '#5f83a8');
  }

  /* A* roads between settlements */
  const roadCells = new Set();
  const cellCost = (i) => {
    if (!land(i)) return Infinity;
    if (roadCells.has(i)) return 0.35;
    const b = biome[i];
    if (e[i] > sea + 0.28) return 6;
    if (b === 'swamp') return 3;
    if (b === 'forest' || b === 'jungle' || b === 'taiga') return 1.8;
    return 1;
  };
  const astar = (s, g2) => {
    const open = [{ i: idx(s.gx, s.gy), g: 0, f: 0, prev: -1 }];
    const best = new Map([[open[0].i, open[0]]]);
    const goal = idx(g2.gx, g2.gy);
    let iter = 0;
    while (open.length && iter++ < 26000) {
      open.sort((a, b) => a.f - b.f);
      const cur = open.shift();
      if (cur.i === goal) {
        const path = [];
        let n = cur;
        while (n) { path.push(n.i); n = best.get(n.prev); }
        return path.reverse();
      }
      const x = cur.i % GW, y = (cur.i / GW) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        if (!inB(x + dx, y + dy)) continue;
        const j = idx(x + dx, y + dy);
        const c = cellCost(j);
        if (!isFinite(c)) continue;
        const g3 = cur.g + c * (dx && dy ? 1.4 : 1);
        const ex = best.get(j);
        if (ex && ex.g <= g3) continue;
        const node = { i: j, g: g3, f: g3 + Math.hypot((j % GW) - g2.gx, ((j / GW) | 0) - g2.gy), prev: cur.i };
        best.set(j, node);
        open.push(node);
      }
    }
    return null;
  };
  const connected = [0];
  for (let i = 1; i < setts.length; i++) {
    let bestJ = connected[0], bd = 1e9;
    for (const j of connected) {
      const d = Math.hypot(setts[j].gx - setts[i].gx, setts[j].gy - setts[i].gy);
      if (d < bd) { bd = d; bestJ = j; }
    }
    const cellPath = astar(setts[i], setts[bestJ]);
    connected.push(i);
    if (!cellPath || cellPath.length < 4) continue;
    for (const ci of cellPath) roadCells.add(ci);
    const pts = [];
    for (let k = 0; k < cellPath.length; k += 2) {
      pts.push({ x: toWX(cellPath[k] % GW) + rnd(-6, 6), y: toWY((cellPath[k] / GW) | 0) + rnd(-6, 6) });
    }
    pts.push({ x: toWX(cellPath[cellPath.length - 1] % GW), y: toWY((cellPath[cellPath.length - 1] / GW) | 0) });
    const kind = isRegion && chance(0.45) ? 'trade' : 'road';
    addPath(map, kind, pts, kind === 'trade' ? 5 : 6, kind === 'trade' ? '#c9973f' : '#7d6142');
  }

  /* mountain stamps on high ground */
  const mCands = [];
  for (let gy = 1; gy < GH - 1; gy++) {
    for (let gx = 1; gx < GW - 1; gx++) {
      const i = idx(gx, gy);
      if (land(i) && e[i] > sea + 0.24) mCands.push({ gx, gy, e: e[i] });
    }
  }
  mCands.sort((a, b) => b.e - a.e);
  const mMax = Math.round((opts.mountains ?? 50) / 100 * (isRegion ? 80 : 64)) + 6;
  const mPlaced = [];
  for (const c of mCands) {
    if (mPlaced.length >= mMax) break;
    const x = toWX(c.gx) + rnd(-8, 8), y = toWY(c.gy) + rnd(-8, 8);
    if (mPlaced.some((p) => Math.hypot(p.x - x, p.y - y) < 52)) continue;
    addObj(map, chance(0.72) ? 'mountain' : 'mountains', x, y, rnd(46, 84), rnd(-6, 6));
    mPlaced.push({ x, y });
  }

  /* forests */
  const TREES = { forest: ['pine', 'oak', 'forest'], jungle: ['jungletree', 'palm'], taiga: ['snowpine', 'pine'], swamp: ['swamp'], grass: ['oak', 'pine'] };
  const fDensity = (opts.forests ?? 50) / 100;
  let treeCount = 0;
  const treeMax = Math.round(fDensity * 320) + 20;
  for (let gy = 1; gy < GH - 1 && treeCount < treeMax; gy += 2) {
    for (let gx = 1; gx < GW - 1 && treeCount < treeMax; gx += 2) {
      const i = idx(gx, gy);
      if (!land(i)) continue;
      const b = biome[i];
      const base = b === 'forest' || b === 'jungle' ? 0.62 : b === 'taiga' ? 0.5 : b === 'swamp' ? 0.3 : b === 'grass' ? 0.06 : 0;
      if (!base || !chance(base * fDensity * 1.25)) continue;
      addObj(map, pick(TREES[b] || TREES.grass), toWX(gx) + rnd(-12, 12), toWY(gy) + rnd(-12, 12), rnd(26, 46), rnd(-10, 10), chance(0.5));
      treeCount++;
    }
  }

  /* settlement stamps + labels + report */
  const report = [];
  setts.forEach((s, rank) => {
    const x = toWX(s.gx), y = toWY(s.gy);
    let stamp, kindName, size;
    if (rank === 0) { stamp = 'city'; kindName = 'Capital'; size = rnd(80, 96); }
    else if (s.coastal && chance(0.45)) { stamp = 'port'; kindName = 'Port'; size = rnd(48, 60); }
    else if (rank === 1) { stamp = 'castle'; kindName = 'Fortress'; size = rnd(62, 78); }
    else { stamp = pick(['village', 'village', 'tower', 'temple']); kindName = { village: 'Village', tower: 'Watchtower', temple: 'Temple' }[stamp]; size = rnd(44, 60); }
    addObj(map, stamp, x, y, size);
    const name = townName();
    if (opts.labels !== false) addLabel(map, name, x, y + size * 0.72, rank === 0 ? 32 : 25, '#2e2417');
    report.push({ name, x, y, kind: kindName });
  });

  /* markers + sea flavor */
  if (cands.length) {
    for (let i = 0; i < randInt(2, 4); i++) {
      const c = pick(cands.slice(0, Math.max(20, cands.length / 3 | 0)));
      if (c) addObj(map, pick(['ruins', 'cave', 'stones', 'skull', 'battle', 'camp', 'mine', 'obelisk', 'dragonskel']), toWX(c.gx) + rnd(-15, 15), toWY(c.gy) + rnd(-15, 15), rnd(36, 50));
    }
  }
  let seaBest = null;
  for (let i = 0; i < N; i++) {
    if (!land(i) && (!seaBest || distLand[i] > seaBest.d)) seaBest = { i, d: distLand[i] };
  }
  if (seaBest && seaBest.d > 5) {
    const sx = toWX(seaBest.i % GW), sy = toWY((seaBest.i / GW) | 0);
    addObj(map, pick(['ship', 'ship', 'seaserpent', 'kraken']), sx + rnd(-40, 40), sy + rnd(20, 60), rnd(44, 62));
    if (opts.labels !== false) addLabel(map, `Sea of ${pick(['the ' + adjNoun(), worldName()])}`, sx, sy, 34, '#33506b');
  }
  if (mPlaced.length >= 7 && opts.labels !== false) {
    const mc = mPlaced[Math.floor(mPlaced.length / 2)];
    addLabel(map, `The ${adjNoun().split(' ')[0]} ${pick(['Peaks', 'Spine', 'Teeth', 'Crags', 'Reach'])}`, mc.x, mc.y - 50, 26, '#4a4038');
  }

  const name = isRegion ? regionName() : worldName();
  map.name = name;
  if (opts.labels !== false) addLabel(map, name, W / 2, H * 0.085, isRegion ? 54 : 62, '#2e2417');
  addObj(map, 'compassrose', W * 0.92, H * 0.88, 110);

  return { name, settlements: report };
}

/* ---------------- town v2 ---------------- */

const TOWN_PRESETS = {
  village: { name: 'Fishing Village', buildings: 15, walls: 0.1, sides: 2, castle: false, river: 0.7 },
  market:  { name: 'Market Town',     buildings: 30, walls: 0.6, sides: 3, castle: false, river: 0.5 },
  capital: { name: 'Capital City',    buildings: 52, walls: 1,   sides: 5, castle: true,  river: 0.5 },
  outpost: { name: 'Mountain Outpost', buildings: 10, walls: 0.8, sides: 1, castle: false, river: 0.15 }
};

function segInt(a, b, c, d) {
  const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  if (!den) return null;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  const u = ((c.x - a.x) * r.y - (c.y - a.y) * r.x) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: a.x + t * r.x, y: a.y + t * r.y, ang: Math.atan2(r.y, r.x) };
}

function genTown(map, tctx, opts) {
  const W = map.width, H = map.height;
  map.background = opts.townPreset === 'outpost' ? 'stone' : 'field';
  const P = TOWN_PRESETS[opts.townPreset] || TOWN_PRESETS.market;
  const placed = [];
  const collide = (x, y, r) => placed.some((p) => Math.hypot(p.x - x, p.y - y) < p.r + r);
  const put = (stamp, x, y, size, rot = 0) => {
    placed.push({ x, y, r: size * 0.6 });
    addObj(map, stamp, x, y, size, rot);
  };

  /* curved main street */
  const main = [];
  let my = H * rnd(0.42, 0.58);
  for (let i = 0; i <= 8; i++) {
    main.push({ x: (W * i) / 8, y: clamp(my, H * 0.28, H * 0.72) });
    my += rnd(-H * 0.07, H * 0.07);
  }
  const streets = [main];

  /* branch streets */
  for (let s = 0; s < P.sides; s++) {
    const bi = randInt(2, 6);
    const base = main[bi];
    const dir = chance(0.5) ? -1 : 1;
    const len = rnd(H * 0.18, H * 0.34);
    const street = [];
    const steps = 4;
    let bx = base.x, by = base.y;
    const ang = Math.PI / 2 * dir + rnd(-0.35, 0.35);
    for (let i = 0; i <= steps; i++) {
      street.push({ x: bx, y: by });
      bx += Math.cos(ang + rnd(-0.2, 0.2)) * (len / steps);
      by += Math.sin(ang + rnd(-0.2, 0.2)) * (len / steps);
    }
    streets.push(street);
  }
  for (const st of streets) {
    addPath(map, 'road', st, st === main ? 14 : 10, '#7d6142');
    for (const p of st) paintStroke(tctx, p.x, p.y, p.x, p.y, 'road', 26);
  }

  /* river with bridges */
  let river = null;
  if (opts.river ?? chance(P.river)) {
    river = [];
    let rx = W * rnd(0.2, 0.8);
    for (let i = 0; i <= 6; i++) {
      river.push({ x: clamp(rx, W * 0.08, W * 0.92), y: (H * i) / 6 });
      rx += rnd(-W * 0.06, W * 0.06);
    }
    for (const p of river) paintStroke(tctx, p.x, p.y, p.x, p.y, 'water', 34);
    addPath(map, 'river', river, 26, '#5f83a8');
    for (const st of streets) {
      for (let i = 0; i < st.length - 1; i++) {
        for (let j = 0; j < river.length - 1; j++) {
          const hit = segInt(st[i], st[i + 1], river[j], river[j + 1]);
          if (hit) put('bridge', hit.x, hit.y, 54, (hit.ang * 180) / Math.PI);
        }
      }
    }
    if (P.name === 'Fishing Village' || chance(0.4)) {
      const rp = river[randInt(1, river.length - 2)];
      put('dock', rp.x + rnd(-20, 20), rp.y, 46, 90);
      put('ship', rp.x + rnd(-40, 40), rp.y + rnd(-40, 40), 46);
    }
  }

  /* walk streets placing buildings */
  const houses = ['house', 'house', 'house2', 'longhouse'];
  let buildings = 0;
  const tangent = (st, i) => Math.atan2(st[Math.min(i + 1, st.length - 1)].y - st[i].y, st[Math.min(i + 1, st.length - 1)].x - st[i].x);
  for (const st of streets) {
    for (let i = 0; i < st.length - 1 && buildings < P.buildings; i++) {
      const seg = Math.hypot(st[i + 1].x - st[i].x, st[i + 1].y - st[i].y);
      const nSlots = Math.max(1, Math.floor(seg / 95));
      for (let k = 0; k < nSlots && buildings < P.buildings; k++) {
        const t = (k + 0.5) / nSlots;
        const px = st[i].x + (st[i + 1].x - st[i].x) * t;
        const py = st[i].y + (st[i + 1].y - st[i].y) * t;
        const ang = tangent(st, i);
        for (const side of [-1, 1]) {
          if (!chance(0.72) || buildings >= P.buildings) continue;
          const off = rnd(48, 72);
          const bx = px + Math.cos(ang + Math.PI / 2) * off * side;
          const by = py + Math.sin(ang + Math.PI / 2) * off * side;
          const size = rnd(42, 60);
          if (bx < W * 0.04 || bx > W * 0.96 || by < H * 0.05 || by > H * 0.95) continue;
          if (collide(bx, by, size * 0.6)) continue;
          put(pick(houses), bx, by, size, (ang * 180) / Math.PI + rnd(-5, 5));
          buildings++;
        }
      }
    }
  }

  /* districts */
  const mid = main[4];
  if (!collide(mid.x, mid.y - 60, 40)) put(pick(['fountain', 'well', 'statue']), mid.x, mid.y - 60, 42);
  const districts = [
    ['market', main[randInt(3, 5)]],
    ['towntemple', main[randInt(1, 3)]],
    ['smithy', main[randInt(4, 7)]],
    ['inn', main[randInt(2, 6)]]
  ];
  for (const [stamp, at] of districts) {
    const ang = rnd(0, Math.PI * 2);
    const x = at.x + Math.cos(ang) * rnd(70, 120), y = at.y + Math.sin(ang) * rnd(70, 120);
    if (!collide(x, y, 44) && x > W * 0.05 && x < W * 0.95 && y > H * 0.08 && y < H * 0.92) put(stamp, x, y, rnd(58, 70), rnd(-4, 4));
  }
  if (P.castle) {
    const cp = main[randInt(5, 7)];
    put('castle', cp.x + rnd(-40, 40), cp.y - rnd(90, 130), 100);
    put('banner', cp.x + rnd(-90, 90), cp.y - rnd(60, 90), 34);
  }
  if (opts.townPreset === 'outpost') {
    for (let i = 0; i < 7; i++) {
      const x = rnd(W * 0.08, W * 0.92), y = pick([rnd(H * 0.08, H * 0.24), rnd(H * 0.76, H * 0.92)]);
      if (!collide(x, y, 30)) put(pick(['pine', 'pine', 'snowpine']), x, y, rnd(34, 50));
    }
    put('watchtower', main[1].x, main[1].y - 80, 60);
  }

  /* walls with gatehouses where the main street exits */
  if (chance(P.walls)) {
    let cx2 = 0, cy2 = 0;
    placed.forEach((p) => { cx2 += p.x; cy2 += p.y; });
    cx2 /= placed.length; cy2 /= placed.length;
    let maxR = 0;
    placed.forEach((p) => { maxR = Math.max(maxR, Math.hypot(p.x - cx2, p.y - cy2)); });
    const rr = Math.min(maxR + 80, Math.min(W, H) * 0.44);
    const pts = [];
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 15) {
      pts.push({ x: cx2 + Math.cos(a) * rr * rnd(0.97, 1.03), y: cy2 + Math.sin(a) * rr * 0.82 * rnd(0.97, 1.03) });
    }
    addPath(map, 'wall', pts, opts.townPreset === 'outpost' ? 7 : 10, opts.townPreset === 'outpost' ? '#8a6b42' : '#655e52');
    put('gatehouse', cx2 - rr, cy2, 58, 90);
    put('gatehouse', cx2 + rr, cy2, 58, 90);
  }

  /* outskirts */
  for (let i = 0; i < randInt(3, 6); i++) {
    const x = pick([rnd(W * 0.05, W * 0.16), rnd(W * 0.84, W * 0.95)]);
    const y = rnd(H * 0.12, H * 0.88);
    if (!collide(x, y, 55)) put(pick(['fieldplot', 'fieldplot', 'barn']), x, y, rnd(66, 96), pick([0, 90]));
  }
  for (let i = 0; i < randInt(6, 12); i++) {
    const x = rnd(W * 0.05, W * 0.95), y = pick([rnd(H * 0.05, H * 0.18), rnd(H * 0.82, H * 0.95)]);
    if (!collide(x, y, 26)) put('treetd', x, y, rnd(26, 40));
  }
  if (chance(0.4)) { const x = pick([W * 0.13, W * 0.87]); if (!collide(x, H * 0.83, 44)) put('graveyard', x, H * 0.83, 52); }
  if (chance(0.4)) { const x = pick([W * 0.15, W * 0.85]); if (!collide(x, H * 0.16, 44)) put('windmill', x, H * 0.16, 56); }

  const name = townName();
  map.name = name;
  if (opts.labels !== false) addLabel(map, name, W / 2, H * 0.07, 46, '#2e2417');
  return { name, settlements: [{ name, x: W / 2, y: H / 2, kind: TOWN_PRESETS[opts.townPreset]?.name || 'Town' }] };
}

/* ---------------- dungeons: shared bits ---------------- */

const key = (x, y) => x + ',' + y;

function furnishRoom(map, tiles, r, theme, g) {
  const interior = [];
  for (let yy = r.y + 1; yy < r.y + r.h - 1; yy++) {
    for (let xx = r.x + 1; xx < r.x + r.w - 1; xx++) {
      if (tiles[key(xx, yy)] === 'floor' || tiles[key(xx, yy)] === 'wood') interior.push({ x: xx, y: yy });
    }
  }
  interior.sort(() => rnd(-1, 1));
  const cc = (c) => ({ x: (c.x + 0.5) * g, y: (c.y + 0.5) * g });
  const drop = (stamp, size = g * 0.72) => {
    const c = interior.pop();
    if (!c) return;
    const p = cc(c);
    addObj(map, stamp, p.x, p.y, size, pick([0, 90, 180, 270]));
  };
  switch (theme) {
    case 'quarters':
      for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++) if (tiles[key(xx, yy)] === 'floor') tiles[key(xx, yy)] = 'wood';
      drop('bed'); drop('table'); drop('chair', g * 0.55);
      if (chance(0.5)) drop('bookshelf');
      break;
    case 'throne': {
      const cx2 = Math.floor(r.x + r.w / 2);
      for (let yy = r.y; yy < r.y + r.h; yy++) if (tiles[key(cx2, yy)] === 'floor') tiles[key(cx2, yy)] = 'carpet';
      addObj(map, 'throne', (cx2 + 0.5) * g, (r.y + 1.5) * g, g * 0.85, 0);
      drop('brazier', g * 0.55); drop('brazier', g * 0.55);
      if (r.w >= 5) { drop('pillar', g * 0.6); drop('pillar', g * 0.6); }
      if (chance(0.5)) drop('banner', g * 0.6);
      break;
    }
    case 'crypt':
      drop('sarcophagus', g * 0.8);
      if (chance(0.7)) drop('sarcophagus', g * 0.8);
      drop('bones', g * 0.6);
      if (chance(0.5)) drop('web', g * 0.8);
      if (chance(0.3)) drop('tombstone', g * 0.5);
      break;
    case 'storage':
      drop('barrel', g * 0.6); drop('crate', g * 0.6);
      if (chance(0.6)) drop('kegstack', g * 0.7);
      if (chance(0.4)) drop('chest', g * 0.6);
      break;
    case 'library':
      drop('bookshelf', g * 0.75); drop('bookshelf', g * 0.75); drop('scrolldesk', g * 0.7); drop('chair', g * 0.5);
      if (chance(0.4)) drop('candles', g * 0.4);
      break;
    case 'shrine':
      drop('altar', g * 0.75); drop('brazier', g * 0.55);
      if (chance(0.5)) drop('statue', g * 0.7);
      if (chance(0.35)) drop('pentagram', g * 1.1);
      break;
    case 'prison':
      drop('cage', g * 0.75);
      if (chance(0.6)) drop('cage', g * 0.75);
      drop('bones', g * 0.55);
      if (chance(0.35)) drop('torturerack', g * 0.8);
      break;
    case 'lair':
      drop('campfire', g * 0.65); drop('bones', g * 0.55);
      if (chance(0.5)) drop('skull', g * 0.5);
      if (chance(0.5)) drop('web', g * 0.8);
      if (chance(0.35)) drop('eggclutch', g * 0.6);
      break;
    case 'flooded':
      for (const c of [...interior]) if (chance(0.55)) tiles[key(c.x, c.y)] = 'water';
      if (chance(0.5)) drop('fountain', g * 0.8);
      if (chance(0.3)) drop('slime', g * 0.6);
      break;
    default: // hall
      if (r.w >= 5) { drop('pillar', g * 0.6); drop('pillar', g * 0.6); }
      if (chance(0.5)) drop('rug', g * 1.2);
      if (chance(0.3)) drop('feasttable', g * 0.9);
  }
  if (chance(0.7)) drop('torch', g * 0.45);
}

function sprinkleLoot(map, tiles, opts, g) {
  const floors = Object.keys(tiles).filter((k) => tiles[k] === 'floor');
  const lootN = Math.round((opts.loot ?? 40) / 100 * 6);
  const trapN = Math.round((opts.traps ?? 30) / 100 * 5);
  for (let i = 0; i < lootN && floors.length; i++) {
    const [x, y] = pick(floors).split(',').map(Number);
    addObj(map, pick(['chest', 'treasure', 'mimic']), (x + 0.5) * g, (y + 0.5) * g, g * 0.65, pick([0, 90]));
  }
  for (let i = 0; i < trapN && floors.length; i++) {
    const [x, y] = pick(floors).split(',').map(Number);
    addObj(map, pick(['trap', 'trap', 'bloodstain']), (x + 0.5) * g, (y + 0.5) * g, g * 0.7);
  }
}

function numberRooms(map, rooms, g) {
  rooms.forEach((r, i) => {
    r.n = i + 1;
    addLabel(map, String(i + 1), (r.x + 0.7) * g, (r.y + 0.85) * g, Math.round(g * 0.5), '#e8b55a');
  });
}

/* ---------------- dungeon: rooms & corridors ---------------- */

function genRoomsDungeon(map, opts) {
  const g = map.gridSize;
  const cols = Math.floor(map.width / g), rows = Math.floor(map.height / g);
  const rooms = [];
  const target = opts.roomCount ?? randInt(7, 11);
  for (let tries = 0; tries < 300 && rooms.length < target; tries++) {
    const round = chance(0.28);
    const w = round ? randInt(4, 7) : randInt(3, 8);
    const h = round ? w : randInt(3, 7);
    const x = randInt(2, cols - w - 3), y = randInt(2, rows - h - 3);
    if (rooms.some((r) => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
    rooms.push({ x, y, w, h, round });
  }
  rooms.sort((a, b) => (a.x + a.y) - (b.x + b.y));

  const tiles = {};
  const roomCells = new Set();
  rooms.forEach((r) => {
    r.cx = Math.floor(r.x + r.w / 2);
    r.cy = Math.floor(r.y + r.h / 2);
    for (let yy = r.y; yy < r.y + r.h; yy++) {
      for (let xx = r.x; xx < r.x + r.w; xx++) {
        if (r.round) {
          const d = Math.hypot(xx - r.cx + 0.5 - (r.w % 2 ? 0.5 : 0), yy - r.cy + 0.5 - (r.h % 2 ? 0.5 : 0));
          if (d > r.w / 2 + 0.15) continue;
        }
        tiles[key(xx, yy)] = 'floor';
        roomCells.add(key(xx, yy));
      }
    }
  });

  const corridor = [];
  for (let i = 0; i < rooms.length - 1; i++) {
    const a = rooms[i], b = rooms[i + 1];
    const wide = chance(0.25);
    let x = a.cx, y = a.cy;
    const carve = () => {
      const k = key(x, y);
      if (!tiles[k]) { tiles[k] = 'floor'; corridor.push({ x, y }); }
      if (wide) { const k2 = key(x + 1, y); if (!tiles[k2]) { tiles[k2] = 'floor'; corridor.push({ x: x + 1, y }); } }
    };
    if (chance(0.5)) {
      while (x !== b.cx) { x += Math.sign(b.cx - x); carve(); }
      while (y !== b.cy) { y += Math.sign(b.cy - y); carve(); }
    } else {
      while (y !== b.cy) { y += Math.sign(b.cy - y); carve(); }
      while (x !== b.cx) { x += Math.sign(b.cx - x); carve(); }
    }
  }

  const carved = (x, y) => !!tiles[key(x, y)];
  for (const c of corridor) {
    const nRoom = roomCells.has(key(c.x + 1, c.y)) || roomCells.has(key(c.x - 1, c.y)) || roomCells.has(key(c.x, c.y + 1)) || roomCells.has(key(c.x, c.y - 1));
    if (!nRoom) continue;
    const horiz = carved(c.x - 1, c.y) && carved(c.x + 1, c.y) && !carved(c.x, c.y - 1) && !carved(c.x, c.y + 1);
    const vert = carved(c.x, c.y - 1) && carved(c.x, c.y + 1) && !carved(c.x - 1, c.y) && !carved(c.x + 1, c.y);
    if ((horiz || vert) && chance(0.8)) {
      tiles[key(c.x, c.y)] = opts.secretDoors && chance(0.22) ? 'secretdoor' : 'door';
    }
  }
  for (const k of Object.keys(tiles)) {
    if (tiles[k] !== 'door') continue;
    const [x, y] = k.split(',').map(Number);
    if (tiles[key(x + 1, y)] === 'door' || tiles[key(x, y + 1)] === 'door') tiles[k] = 'floor';
  }

  const themes = ['crypt', 'storage', 'library', 'shrine', 'prison', 'lair', 'quarters', 'hall', 'flooded'];
  rooms.forEach((r, i2) => {
    r.theme = i2 === 0 ? 'entry' : i2 === rooms.length - 1 ? pick(['throne', 'crypt', 'shrine']) : pick(themes);
    furnishRoom(map, tiles, r, r.theme, g);
  });

  map.tiles = tiles;
  sprinkleLoot(map, tiles, opts, g);
  addObj(map, 'stairsup', (rooms[0].cx + 0.5) * g, (rooms[0].cy + 0.5) * g, g * 0.85);
  const last = rooms[rooms.length - 1];
  addObj(map, 'stairsdown', (last.cx + 0.5) * g, (last.cy + 0.5) * g, g * 0.85);
  return rooms;
}

/* ---------------- dungeon: caves ---------------- */

function genCaves(map, opts) {
  const g = map.gridSize;
  const cols = Math.min(Math.floor(map.width / g) - 2, 64);
  const rows = Math.min(Math.floor(map.height / g) - 2, 48);
  const ox = 1, oy = 1;
  let grid = new Uint8Array(cols * rows);
  for (let i = 0; i < grid.length; i++) grid[i] = chance(0.46) ? 1 : 0;
  const gi = (x, y) => y * cols + x;
  for (let it = 0; it < 5; it++) {
    const next = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || grid[gi(nx, ny)]) n++;
          }
        }
        next[gi(x, y)] = n >= 5 ? 1 : 0;
      }
    }
    grid = next;
  }
  /* keep largest open region */
  const region = new Int32Array(cols * rows).fill(-1);
  let bestR = -1, bestSize = 0, rc = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] || region[i] >= 0) continue;
    const qq = [i];
    region[i] = rc;
    let size = 0, head = 0;
    while (head < qq.length) {
      const j = qq[head++];
      size++;
      const x = j % cols, y = (j / cols) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const k2 = gi(nx, ny);
        if (!grid[k2] && region[k2] < 0) { region[k2] = rc; qq.push(k2); }
      }
    }
    if (size > bestSize) { bestSize = size; bestR = rc; }
    rc++;
  }
  const tiles = {};
  const open = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (region[gi(x, y)] === bestR) {
        tiles[key(x + ox, y + oy)] = 'floor';
        open.push({ x: x + ox, y: y + oy });
      }
    }
  }
  /* moss + pools */
  const noise = makeNoise();
  for (const c of open) {
    const nv = noise(c.x / 9, c.y / 9, 3);
    if (nv > 0.62) tiles[key(c.x, c.y)] = 'grass';
  }
  const waterAmt = (opts.water ?? 40) / 100;
  for (let p = 0; p < Math.round(waterAmt * 4); p++) {
    const c = pick(open);
    const rr = randInt(2, 4);
    for (const o of open) {
      if (Math.hypot(o.x - c.x, o.y - c.y) <= rr) tiles[key(o.x, o.y)] = 'water';
    }
  }
  map.tiles = tiles;
  /* cave dressing */
  const deco = ['stalagmites', 'mushrooms', 'crystals', 'bones', 'rubble', 'web'];
  for (let i = 0; i < Math.min(26, open.length / 14 | 0); i++) {
    const c = pick(open);
    if (tiles[key(c.x, c.y)] !== 'floor') continue;
    addObj(map, pick(deco), (c.x + 0.5) * g, (c.y + 0.5) * g, g * rnd(0.55, 0.85), pick([0, 90, 180, 270]));
  }
  if (chance(0.6)) {
    const c = pick(open);
    addObj(map, 'campfire', (c.x + 0.5) * g, (c.y + 0.5) * g, g * 0.6);
  }
  /* entrance near edge, exit farthest away (BFS) */
  let entry = open[0];
  for (const c of open) if (Math.min(c.x, c.y, cols - c.x, rows - c.y) < Math.min(entry.x, entry.y, cols - entry.x, rows - entry.y)) entry = c;
  const dist = new Map([[key(entry.x, entry.y), 0]]);
  const qq = [entry];
  let far = entry, head = 0;
  while (head < qq.length) {
    const c = qq[head++];
    const d = dist.get(key(c.x, c.y));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k2 = key(c.x + dx, c.y + dy);
      if (tiles[k2] && !dist.has(k2)) {
        dist.set(k2, d + 1);
        const nc = { x: c.x + dx, y: c.y + dy };
        qq.push(nc);
        if (d + 1 > dist.get(key(far.x, far.y))) far = nc;
      }
    }
  }
  addObj(map, 'stairsup', (entry.x + 0.5) * g, (entry.y + 0.5) * g, g * 0.85);
  addObj(map, 'stairsdown', (far.x + 0.5) * g, (far.y + 0.5) * g, g * 0.85);
  sprinkleLoot(map, tiles, opts, g);
  /* pseudo-rooms for the key */
  const rooms = [];
  const themePool = ['cavern', 'grotto', 'pool', 'cavern', 'lair'];
  for (let i = 0; i < 6 && open.length; i++) {
    const c = open[Math.floor((i + 0.5) / 6 * open.length)];
    rooms.push({ x: c.x, y: c.y, w: 2, h: 2, theme: themePool[i % themePool.length] });
  }
  return rooms;
}

/* ---------------- dungeon: catacombs (maze) ---------------- */

function genCatacombs(map, opts) {
  const g = map.gridSize;
  const cols = Math.min(Math.floor(map.width / g) - 2, 55) | 1;
  const rows = Math.min(Math.floor(map.height / g) - 2, 41) | 1;
  const tiles = {};
  const inMaze = (x, y) => x > 0 && y > 0 && x < cols && y < rows;
  /* recursive backtracker on odd cells */
  const stack = [[1, 1]];
  const visited = new Set(['1,1']);
  tiles[key(1, 1)] = 'floor';
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const dirs = [[2, 0], [-2, 0], [0, 2], [0, -2]].sort(() => rnd(-1, 1));
    let moved = false;
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (!inMaze(nx, ny) || visited.has(key(nx, ny))) continue;
      visited.add(key(nx, ny));
      tiles[key(x + dx / 2, y + dy / 2)] = 'floor';
      tiles[key(nx, ny)] = 'floor';
      stack.push([nx, ny]);
      moved = true;
      break;
    }
    if (!moved) stack.pop();
  }
  /* braid: open some dead ends */
  const floorKeys = Object.keys(tiles);
  for (const k of floorKeys) {
    const [x, y] = k.split(',').map(Number);
    const nbs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => tiles[key(x + dx, y + dy)]);
    if (nbs.length === 1 && chance(0.35)) {
      const opts2 = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => inMaze(x + dx * 2, y + dy * 2) && !tiles[key(x + dx, y + dy)]);
      if (opts2.length) {
        const [dx, dy] = pick(opts2);
        tiles[key(x + dx, y + dy)] = 'floor';
      }
    }
  }
  /* burial chambers carved into the maze */
  const rooms = [];
  for (let i = 0; i < 90 && rooms.length < randInt(8, 13); i++) {
    const w = randInt(2, 3), h = randInt(2, 3);
    const x = randInt(1, cols - w - 1), y = randInt(1, rows - h - 1);
    if (rooms.some((r) => Math.abs(r.x - x) + Math.abs(r.y - y) < 8)) continue;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) tiles[key(xx, yy)] = 'floor';
    rooms.push({ x, y, w, h, theme: pick(['alcove', 'crypt', 'alcove', 'shrine']) });
    addObj(map, pick(['sarcophagus', 'tombstone', 'bones']), (x + w / 2) * g, (y + h / 2) * g, g * 0.75, pick([0, 90]));
  }
  /* secret shortcuts */
  if (opts.secretDoors !== false) {
    let placedS = 0;
    for (let i = 0; i < 400 && placedS < 6; i++) {
      const x = randInt(2, cols - 2), y = randInt(2, rows - 2);
      if (tiles[key(x, y)]) continue;
      const h2 = tiles[key(x - 1, y)] && tiles[key(x + 1, y)] && !tiles[key(x, y - 1)] && !tiles[key(x, y + 1)];
      const v2 = tiles[key(x, y - 1)] && tiles[key(x, y + 1)] && !tiles[key(x - 1, y)] && !tiles[key(x + 1, y)];
      if (h2 || v2) { tiles[key(x, y)] = 'secretdoor'; placedS++; }
    }
  }
  map.tiles = tiles;
  /* scatter */
  const fl = Object.keys(tiles).filter((k) => tiles[k] === 'floor');
  for (let i = 0; i < 16; i++) {
    const [x, y] = pick(fl).split(',').map(Number);
    addObj(map, pick(['bones', 'web', 'rubble', 'candles', 'skull']), (x + 0.5) * g, (y + 0.5) * g, g * rnd(0.4, 0.7), pick([0, 90, 180, 270]));
  }
  addObj(map, 'stairsup', 1.5 * g, 1.5 * g, g * 0.85);
  addObj(map, 'stairsdown', (cols - 1.5) * g, (rows - 1.5) * g, g * 0.85);
  sprinkleLoot(map, tiles, opts, g);
  return rooms;
}

/* ---------------- dungeon: temple (symmetric) ---------------- */

function genTemple(map, opts) {
  const g = map.gridSize;
  const cols = Math.floor(map.width / g), rows = Math.floor(map.height / g);
  const cx = Math.floor(cols / 2);
  const tiles = {};
  const rooms = [];
  const carveRect = (x, y, w, h) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) tiles[key(xx, yy)] = 'floor';
  };
  const naveW = 5 + 2 * randInt(0, 1);
  const naveH = randInt(12, Math.min(18, rows - 12));
  const naveY = Math.floor((rows - naveH) / 2);
  carveRect(cx - (naveW >> 1), naveY, naveW, naveH);
  rooms.push({ x: cx - (naveW >> 1), y: naveY, w: naveW, h: naveH, theme: 'nave' });
  /* apse */
  const apseR = 3;
  const apseCy = naveY - 1;
  for (let yy = apseCy - apseR; yy <= apseCy + apseR; yy++) {
    for (let xx = cx - apseR; xx <= cx + apseR; xx++) {
      if (Math.hypot(xx - cx, yy - apseCy) <= apseR + 0.2 && yy >= 2) tiles[key(xx, yy)] = 'floor';
    }
  }
  rooms.push({ x: cx - apseR, y: apseCy - apseR, w: apseR * 2 + 1, h: apseR * 2 + 1, theme: 'apse' });
  /* entry antechamber below */
  carveRect(cx - 2, naveY + naveH + 1, 5, 3);
  tiles[key(cx, naveY + naveH)] = 'door';
  rooms.unshift({ x: cx - 2, y: naveY + naveH + 1, w: 5, h: 3, theme: 'entry' });
  /* mirrored side chapels */
  const hw = naveW >> 1;
  const pairs = randInt(2, 3);
  for (let p = 0; p < pairs; p++) {
    const w = randInt(3, 4), h = randInt(3, 4);
    const yy = naveY + 2 + Math.floor((naveH - h - 3) * (pairs > 1 ? p / (pairs - 1) : 0.5));
    const gap = 2;
    const lx = cx - hw - gap - w;
    const rx = cx + hw + gap + 1;
    if (lx < 1 || rx + w > cols - 1) continue;
    carveRect(lx, yy, w, h);
    carveRect(rx, yy, w, h);
    for (let i = 1; i <= gap; i++) {
      tiles[key(cx - hw - i, yy + (h >> 1))] = i === 1 ? 'door' : 'floor';
      tiles[key(cx + hw + i, yy + (h >> 1))] = i === 1 ? 'door' : 'floor';
    }
    rooms.push({ x: lx, y: yy, w, h, theme: 'chapel' });
    rooms.push({ x: rx, y: yy, w, h, theme: 'chapel' });
  }
  /* carpet down the nave + pillars */
  for (let yy = naveY; yy < naveY + naveH; yy++) tiles[key(cx, yy)] = 'carpet';
  for (let yy = naveY + 1; yy < naveY + naveH - 1; yy += 2) {
    addObj(map, 'pillar', (cx - hw + 1.5) * g, (yy + 0.5) * g, g * 0.55);
    addObj(map, 'pillar', (cx + hw - 0.5) * g, (yy + 0.5) * g, g * 0.55);
  }
  /* apse dressing */
  addObj(map, 'altar', (cx + 0.5) * g, (apseCy + 0.5) * g, g * 0.8);
  addObj(map, 'statue', (cx - 1.5) * g, (apseCy - 0.5) * g, g * 0.7);
  addObj(map, 'statue', (cx + 2.5) * g, (apseCy - 0.5) * g, g * 0.7, 0, true);
  addObj(map, 'brazier', (cx - 1.5) * g, (apseCy + 1.5) * g, g * 0.5);
  addObj(map, 'brazier', (cx + 2.5) * g, (apseCy + 1.5) * g, g * 0.5);
  map.tiles = tiles;
  for (const r of rooms) {
    if (r.theme === 'chapel') furnishRoom(map, tiles, r, pick(['shrine', 'crypt', 'library', 'quarters']), g);
  }
  addObj(map, 'stairsup', (cx + 0.5) * g, (naveY + naveH + 2.5) * g, g * 0.85);
  sprinkleLoot(map, tiles, opts, g);
  return rooms;
}

/* ---------------- entry point ---------------- */

export function generateMap(map, tctx, tcanvas, opts = {}) {
  const seed = opts.seed || randomSeedString();
  setRandomSource(seededRandom(seed));
  let report = { seed, name: map.name, settlements: [], rooms: [] };
  try {
    map.objects = [];
    map.paths = [];
    map.labels = [];
    map.pins = [];
    map.tiles = {};
    tctx.clearRect(0, 0, tcanvas.width, tcanvas.height);

    if (map.type === 'dungeon') {
      map.background = 'dungeon';
      map.gridVisible = true;
      let rooms;
      const algo = opts.algo || 'rooms';
      if (algo === 'caves') rooms = genCaves(map, opts);
      else if (algo === 'catacombs') rooms = genCatacombs(map, opts);
      else if (algo === 'temple') rooms = genTemple(map, opts);
      else rooms = genRoomsDungeon(map, opts);
      const name = dungeonName();
      map.name = name;
      if (opts.roomKey !== false && rooms.length) numberRooms(map, rooms, map.gridSize);
      if (opts.labels !== false) addLabel(map, name, map.width / 2, map.gridSize * 1.2, 40, '#e8ddc8');
      report.name = name;
      report.rooms = rooms.map((r) => ({ n: r.n, theme: r.theme, x: (r.x + r.w / 2) * map.gridSize, y: (r.y + r.h / 2) * map.gridSize }));
      const up = map.objects.find((o) => o.stamp === 'stairsup');
      if (up) report.entrance = { x: up.x, y: up.y };
    } else if (map.type === 'town') {
      const r = genTown(map, tctx, opts);
      report.name = r.name;
      report.settlements = r.settlements;
    } else {
      const r = genWorldish(map, tctx, opts);
      report.name = r.name;
      report.settlements = r.settlements;
    }
  } finally {
    setRandomSource(null);
  }
  return report;
}
