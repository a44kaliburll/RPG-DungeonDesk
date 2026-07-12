/* Stamp library — every icon is drawn in code (no image assets).
   Each stamp draws centered on (0,0) inside a s×s box. */

const INK = '#3b2e20';
const GREEN = '#5f7f42';
const GREEN_D = '#46612f';
const STONE = '#948b7c';
const STONE_D = '#6e675c';
const ROOF = '#9c5540';
const ROOF_B = '#5a6f8c';
const WOOD = '#8a6b42';
const WOOD_D = '#66502f';
const SNOW = '#e9e6da';
const SAND = '#d3bd8b';
const WATER = '#5f83a8';
const GOLD = '#c9973f';
const FIRE = '#d97b2e';

function ink(ctx, s, w = 0.06) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(0.75, s * w);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

function poly(ctx, pts, close = true) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (close) ctx.closePath();
}

function fillStroke(ctx, fill) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  ctx.stroke();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  fillStroke(ctx, fill);
}

function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  fillStroke(ctx, fill);
}

/* ---------- nature ---------- */

function drawMountain(ctx, s) {
  const h = s * 0.42;
  ink(ctx, s);
  poly(ctx, [[-s * 0.45, h], [0, -h], [s * 0.45, h]]);
  fillStroke(ctx, STONE);
  // snow cap
  poly(ctx, [[-s * 0.14, -h * 0.35], [0, -h], [s * 0.14, -h * 0.35], [s * 0.06, -h * 0.22], [-s * 0.04, -h * 0.38]]);
  fillStroke(ctx, SNOW);
  // shading ridge
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(s * 0.08, h * 0.9);
  ctx.stroke();
}

function drawMountains(ctx, s) {
  ctx.save();
  ctx.translate(-s * 0.18, s * 0.06);
  drawMountain(ctx, s * 0.75);
  ctx.restore();
  ctx.save();
  ctx.translate(s * 0.2, 0);
  drawMountain(ctx, s * 0.95);
  ctx.restore();
}

function drawHills(ctx, s) {
  ink(ctx, s);
  ctx.beginPath();
  ctx.arc(-s * 0.2, s * 0.25, s * 0.28, Math.PI, 0);
  ctx.closePath();
  fillStroke(ctx, GREEN);
  ctx.beginPath();
  ctx.arc(s * 0.18, s * 0.25, s * 0.34, Math.PI, 0);
  ctx.closePath();
  fillStroke(ctx, GREEN_D);
}

function drawPine(ctx, s) {
  ink(ctx, s);
  rect(ctx, -s * 0.05, s * 0.2, s * 0.1, s * 0.22, WOOD_D);
  poly(ctx, [[-s * 0.3, s * 0.25], [0, -s * 0.45], [s * 0.3, s * 0.25]]);
  fillStroke(ctx, GREEN_D);
  poly(ctx, [[-s * 0.24, 0], [0, -s * 0.5], [s * 0.24, 0]]);
  fillStroke(ctx, GREEN);
}

function drawOak(ctx, s) {
  ink(ctx, s);
  rect(ctx, -s * 0.05, s * 0.1, s * 0.1, s * 0.3, WOOD_D);
  circle(ctx, 0, -s * 0.1, s * 0.32, GREEN);
  circle(ctx, -s * 0.18, 0, s * 0.18, GREEN);
  circle(ctx, s * 0.18, 0, s * 0.18, GREEN);
}

function drawForest(ctx, s) {
  ctx.save(); ctx.translate(-s * 0.22, s * 0.1); drawPine(ctx, s * 0.6); ctx.restore();
  ctx.save(); ctx.translate(s * 0.22, s * 0.12); drawPine(ctx, s * 0.55); ctx.restore();
  ctx.save(); ctx.translate(0, -s * 0.12); drawPine(ctx, s * 0.7); ctx.restore();
}

function drawPalm(ctx, s) {
  ink(ctx, s);
  ctx.beginPath();
  ctx.moveTo(-s * 0.05, s * 0.4);
  ctx.quadraticCurveTo(s * 0.02, 0, s * 0.12, -s * 0.25);
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = s * 0.09;
  ctx.stroke();
  ink(ctx, s, 0.05);
  ctx.fillStyle = GREEN;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.55;
    ctx.beginPath();
    ctx.moveTo(s * 0.12, -s * 0.25);
    ctx.quadraticCurveTo(
      s * 0.12 + Math.cos(a) * s * 0.3, -s * 0.25 + Math.sin(a) * s * 0.32,
      s * 0.12 + Math.cos(a) * s * 0.42, -s * 0.25 + Math.sin(a) * s * 0.32 + s * 0.1
    );
    ctx.stroke();
  }
}

function drawSwamp(ctx, s) {
  ink(ctx, s, 0.05);
  ctx.fillStyle = '#5c6e4e';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.22, s * 0.42, s * 0.14, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#57755f');
  // reeds
  ctx.strokeStyle = GREEN_D;
  for (const [x, h] of [[-0.2, 0.5], [-0.08, 0.62], [0.05, 0.55], [0.18, 0.45]]) {
    ctx.beginPath();
    ctx.moveTo(s * x, s * 0.22);
    ctx.lineTo(s * x, s * 0.22 - s * h);
    ctx.stroke();
  }
}

function drawDunes(ctx, s) {
  ink(ctx, s);
  ctx.beginPath();
  ctx.arc(-s * 0.18, s * 0.2, s * 0.3, Math.PI, 0);
  ctx.closePath();
  fillStroke(ctx, SAND);
  ctx.beginPath();
  ctx.arc(s * 0.2, s * 0.22, s * 0.26, Math.PI, 0);
  ctx.closePath();
  fillStroke(ctx, '#c4ac77');
}

function drawVolcano(ctx, s) {
  const h = s * 0.4;
  ink(ctx, s);
  poly(ctx, [[-s * 0.45, h], [-s * 0.12, -h * 0.8], [s * 0.12, -h * 0.8], [s * 0.45, h]]);
  fillStroke(ctx, '#6b5147');
  ctx.fillStyle = FIRE;
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -h * 0.8);
  ctx.quadraticCurveTo(0, -h * 1.15, s * 0.12, -h * 0.8);
  ctx.closePath();
  ctx.fill();
}

/* ---------- world settlements & markers ---------- */

function drawCastle(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.38, -s * 0.1, s * 0.76, s * 0.5, STONE);
  // two towers
  rect(ctx, -s * 0.46, -s * 0.32, s * 0.2, s * 0.72, STONE_D);
  rect(ctx, s * 0.26, -s * 0.32, s * 0.2, s * 0.72, STONE_D);
  // crenellations
  ctx.fillStyle = STONE_D;
  for (const x of [-0.46, -0.38, -0.3, 0.26, 0.34, 0.42]) rect(ctx, s * x, -s * 0.4, s * 0.07, s * 0.09, STONE_D);
  // gate
  ctx.beginPath();
  ctx.arc(0, s * 0.4, s * 0.13, Math.PI, 0);
  ctx.lineTo(s * 0.13, s * 0.4);
  ctx.closePath();
  fillStroke(ctx, '#3a3128');
  // flag
  ctx.beginPath(); ctx.moveTo(0, -s * 0.1); ctx.lineTo(0, -s * 0.44); ctx.stroke();
  poly(ctx, [[0, -s * 0.44], [s * 0.16, -s * 0.38], [0, -s * 0.32]]);
  fillStroke(ctx, GOLD);
}

function drawTower(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.14, -s * 0.28, s * 0.28, s * 0.7, STONE);
  poly(ctx, [[-s * 0.2, -s * 0.28], [0, -s * 0.52], [s * 0.2, -s * 0.28]]);
  fillStroke(ctx, ROOF);
  rect(ctx, -s * 0.045, s * 0.18, s * 0.09, s * 0.24, '#3a3128');
  rect(ctx, -s * 0.045, -s * 0.18, s * 0.09, s * 0.12, '#3a3128');
}

function drawCity(ctx, s) {
  ctx.save(); ctx.translate(-s * 0.24, s * 0.1); drawTower(ctx, s * 0.55); ctx.restore();
  ctx.save(); ctx.translate(s * 0.24, s * 0.12); drawTower(ctx, s * 0.5); ctx.restore();
  ctx.save(); ctx.translate(0, -s * 0.02); drawCastle(ctx, s * 0.72); ctx.restore();
}

function drawVillage(ctx, s) {
  const hut = (x, y, k) => {
    ctx.save(); ctx.translate(x, y);
    ink(ctx, s, 0.05);
    rect(ctx, -k * 0.3, 0, k * 0.6, k * 0.34, '#a3927a');
    poly(ctx, [[-k * 0.38, 0], [0, -k * 0.34], [k * 0.38, 0]]);
    fillStroke(ctx, ROOF);
    ctx.restore();
  };
  hut(-s * 0.22, -s * 0.05, s * 0.6);
  hut(s * 0.22, 0, s * 0.55);
  hut(0, s * 0.16, s * 0.6);
}

function drawTemple(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.34, s * 0.28, s * 0.68, s * 0.12, STONE_D);
  for (const x of [-0.26, -0.09, 0.09, 0.26]) rect(ctx, s * x - s * 0.035, -s * 0.12, s * 0.07, s * 0.4, STONE);
  poly(ctx, [[-s * 0.4, -s * 0.12], [0, -s * 0.42], [s * 0.4, -s * 0.12]]);
  fillStroke(ctx, STONE);
}

function drawRuins(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.38, -s * 0.05, s * 0.14, s * 0.45, STONE_D);
  poly(ctx, [[-s * 0.1, s * 0.4], [-s * 0.1, -s * 0.25], [0, -s * 0.12], [0.04 * s, s * 0.4]]);
  fillStroke(ctx, STONE);
  rect(ctx, s * 0.2, s * 0.1, s * 0.16, s * 0.3, STONE_D);
  ctx.fillStyle = STONE;
  circle(ctx, s * 0.3, s * 0.44, s * 0.05, STONE);
  circle(ctx, -s * 0.18, s * 0.42, s * 0.04, STONE);
}

function drawMine(ctx, s) {
  ink(ctx, s, 0.05);
  poly(ctx, [[-s * 0.4, s * 0.4], [0, -s * 0.3], [s * 0.4, s * 0.4]]);
  fillStroke(ctx, '#7d7266');
  ctx.beginPath();
  ctx.arc(0, s * 0.4, s * 0.16, Math.PI, 0);
  ctx.closePath();
  fillStroke(ctx, '#2c261f');
  // pick axe
  ink(ctx, s, 0.05);
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.28); ctx.lineTo(-s * 0.06, -s * 0.05); ctx.stroke();
  ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.13, s * 0.2, -Math.PI * 0.62, -Math.PI * 0.1); ctx.stroke();
}

function drawAnchor(ctx, s) {
  ink(ctx, s, 0.08);
  circle(ctx, 0, -s * 0.3, s * 0.09, null);
  ctx.beginPath(); ctx.moveTo(0, -s * 0.21); ctx.lineTo(0, s * 0.32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.05); ctx.lineTo(s * 0.2, -s * 0.05); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.3, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
}

function drawBridge(ctx, s) {
  ink(ctx, s, 0.05);
  ctx.fillStyle = STONE;
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, -s * 0.05);
  ctx.lineTo(s * 0.45, -s * 0.05);
  ctx.lineTo(s * 0.45, s * 0.12);
  ctx.arc(s * 0.22, s * 0.12, s * 0.15, 0, Math.PI, true);
  ctx.arc(-s * 0.22, s * 0.12, s * 0.15, 0, Math.PI, true);
  ctx.lineTo(-s * 0.45, s * 0.12);
  ctx.closePath();
  fillStroke(ctx, STONE);
  ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.05); ctx.lineTo(s * 0.45, -s * 0.05); ctx.stroke();
}

function drawWindmill(ctx, s) {
  ink(ctx, s, 0.05);
  poly(ctx, [[-s * 0.16, s * 0.42], [-s * 0.1, -s * 0.1], [s * 0.1, -s * 0.1], [s * 0.16, s * 0.42]]);
  fillStroke(ctx, '#a3927a');
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(0, -s * 0.14);
    ctx.rotate(Math.PI / 4 + (i * Math.PI) / 2);
    rect(ctx, -s * 0.035, -s * 0.36, s * 0.07, s * 0.34, '#d8cdb4');
    ctx.restore();
  }
  circle(ctx, 0, -s * 0.14, s * 0.05, WOOD_D);
}

function drawCamp(ctx, s) {
  ink(ctx, s, 0.05);
  poly(ctx, [[-s * 0.35, s * 0.3], [0, -s * 0.3], [s * 0.35, s * 0.3]]);
  fillStroke(ctx, '#b09466');
  poly(ctx, [[-s * 0.08, s * 0.3], [0, s * 0.05], [s * 0.08, s * 0.3]]);
  fillStroke(ctx, '#3a3128');
  // camp fire
  ctx.fillStyle = FIRE;
  ctx.beginPath();
  ctx.moveTo(s * 0.28, s * 0.32);
  ctx.quadraticCurveTo(s * 0.34, s * 0.1, s * 0.4, s * 0.32);
  ctx.closePath();
  ctx.fill();
}

function drawCave(ctx, s) {
  ink(ctx, s, 0.05);
  ctx.beginPath();
  ctx.arc(0, s * 0.32, s * 0.4, Math.PI, 0);
  ctx.closePath();
  fillStroke(ctx, '#6e6155');
  ctx.beginPath();
  ctx.arc(0, s * 0.32, s * 0.2, Math.PI, 0);
  ctx.closePath();
  fillStroke(ctx, '#211c17');
}

function drawSkull(ctx, s) {
  ink(ctx, s, 0.05);
  circle(ctx, 0, -s * 0.08, s * 0.3, SNOW);
  rect(ctx, -s * 0.14, s * 0.1, s * 0.28, s * 0.18, SNOW);
  ctx.fillStyle = INK;
  circle(ctx, -s * 0.12, -s * 0.1, s * 0.08, INK);
  circle(ctx, s * 0.12, -s * 0.1, s * 0.08, INK);
  poly(ctx, [[0, 0], [-s * 0.045, s * 0.08], [s * 0.045, s * 0.08]]);
  ctx.fill();
}

function drawBattle(ctx, s) {
  ink(ctx, s, 0.07);
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.3); ctx.lineTo(-s * 0.3, s * 0.3); ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.beginPath(); ctx.moveTo(-s * 0.34, -s * 0.18); ctx.lineTo(-s * 0.18, -s * 0.34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.34, -s * 0.18); ctx.lineTo(s * 0.18, -s * 0.34); ctx.stroke();
}

function drawStones(ctx, s) {
  ink(ctx, s, 0.05);
  for (const [x, h] of [[-0.3, 0.34], [-0.11, 0.42], [0.08, 0.4], [0.27, 0.32]]) {
    rect(ctx, s * x, s * (0.35 - h), s * 0.13, s * h, STONE);
  }
  rect(ctx, -s * 0.2, -s * 0.2, s * 0.32, s * 0.1, STONE_D);
}

function drawLighthouse(ctx, s) {
  ink(ctx, s, 0.05);
  poly(ctx, [[-s * 0.16, s * 0.4], [-s * 0.09, -s * 0.2], [s * 0.09, -s * 0.2], [s * 0.16, s * 0.4]]);
  fillStroke(ctx, SNOW);
  ctx.fillStyle = ROOF;
  rect(ctx, -s * 0.16, s * 0.1, s * 0.32, s * 0.1, ROOF);
  rect(ctx, -s * 0.11, -s * 0.32, s * 0.22, s * 0.12, GOLD);
  poly(ctx, [[-s * 0.13, -s * 0.32], [0, -s * 0.46], [s * 0.13, -s * 0.32]]);
  fillStroke(ctx, ROOF);
}

function drawTreasure(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.3, -s * 0.05, s * 0.6, s * 0.35, WOOD);
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, -s * 0.05);
  ctx.quadraticCurveTo(0, -s * 0.35, s * 0.3, -s * 0.05);
  ctx.closePath();
  fillStroke(ctx, WOOD_D);
  rect(ctx, -s * 0.05, -s * 0.02, s * 0.1, s * 0.14, GOLD);
}

/* ---------- town ---------- */

function drawHouseTD(ctx, s) { // top-down gable roof
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.34, -s * 0.24, s * 0.68, s * 0.48, ROOF);
  ctx.beginPath();
  ctx.moveTo(-s * 0.34, 0); ctx.lineTo(s * 0.34, 0);
  ctx.stroke();
}

function drawHouseTD2(ctx, s) { // L-shaped
  ink(ctx, s, 0.05);
  ctx.beginPath();
  ctx.moveTo(-s * 0.36, -s * 0.36);
  ctx.lineTo(s * 0.1, -s * 0.36);
  ctx.lineTo(s * 0.1, 0);
  ctx.lineTo(s * 0.36, 0);
  ctx.lineTo(s * 0.36, s * 0.36);
  ctx.lineTo(-s * 0.36, s * 0.36);
  ctx.closePath();
  fillStroke(ctx, ROOF_B);
  ctx.beginPath(); ctx.moveTo(-s * 0.13, -s * 0.36); ctx.lineTo(-s * 0.13, s * 0.36); ctx.stroke();
}

function drawLonghouse(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.45, -s * 0.16, s * 0.9, s * 0.32, '#7d6a4a');
  ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(s * 0.45, 0); ctx.stroke();
}

function drawRoundTower(ctx, s) {
  ink(ctx, s, 0.05);
  circle(ctx, 0, 0, s * 0.32, STONE);
  circle(ctx, 0, 0, s * 0.13, STONE_D);
}

function drawTownTemple(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.26, -s * 0.4, s * 0.52, s * 0.66, '#b0a794');
  ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.lineTo(0, s * 0.26); ctx.stroke();
  circle(ctx, 0, s * 0.33, s * 0.14, STONE);
  // cross-ish sigil
  ink(ctx, s, 0.04);
  ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.lineTo(0, -s * 0.12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.24); ctx.lineTo(s * 0.08, -s * 0.24); ctx.stroke();
}

function drawMarket(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.32, -s * 0.22, s * 0.64, s * 0.44, '#c8b184');
  ctx.strokeStyle = ROOF;
  ctx.lineWidth = s * 0.1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * s * 0.128, -s * 0.22);
    ctx.lineTo(i * s * 0.128, s * 0.22);
    ctx.stroke();
  }
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.32, -s * 0.22, s * 0.64, s * 0.44, null);
}

function drawWell(ctx, s) {
  ink(ctx, s, 0.05);
  circle(ctx, 0, 0, s * 0.3, STONE);
  circle(ctx, 0, 0, s * 0.16, '#31404f');
  ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.lineTo(s * 0.3, 0); ctx.stroke();
}

function drawFountain(ctx, s) {
  ink(ctx, s, 0.045);
  circle(ctx, 0, 0, s * 0.38, '#5f83a8');
  circle(ctx, 0, 0, s * 0.22, '#7fa3c8');
  circle(ctx, 0, 0, s * 0.08, STONE);
}

function drawTreeTD(ctx, s) {
  ink(ctx, s, 0.045);
  circle(ctx, 0, 0, s * 0.34, GREEN);
  ctx.strokeStyle = GREEN_D;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.2, 0.5, 2.2); ctx.stroke();
  circle(ctx, 0, 0, s * 0.045, WOOD_D);
}

function drawDock(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.1, -s * 0.45, s * 0.2, s * 0.9, WOOD);
  ctx.strokeStyle = WOOD_D;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, i * s * 0.12);
    ctx.lineTo(s * 0.1, i * s * 0.12);
    ctx.stroke();
  }
}

function drawCart(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.3, -s * 0.16, s * 0.6, s * 0.32, WOOD);
  circle(ctx, -s * 0.18, s * 0.22, s * 0.1, WOOD_D);
  circle(ctx, s * 0.18, s * 0.22, s * 0.1, WOOD_D);
  ctx.beginPath(); ctx.moveTo(s * 0.3, 0); ctx.lineTo(s * 0.46, 0); ctx.stroke();
}

function drawField(ctx, s) {
  ink(ctx, s, 0.04);
  rect(ctx, -s * 0.4, -s * 0.3, s * 0.8, s * 0.6, '#a8945c');
  ctx.strokeStyle = '#8a794a';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, i * s * 0.12);
    ctx.lineTo(s * 0.4, i * s * 0.12);
    ctx.stroke();
  }
}

/* ---------- dungeon furniture ---------- */

function drawTable(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.34, -s * 0.2, s * 0.68, s * 0.4, WOOD);
  ctx.strokeStyle = WOOD_D;
  ctx.beginPath(); ctx.moveTo(-s * 0.34, -s * 0.06); ctx.lineTo(s * 0.34, -s * 0.06); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.34, s * 0.07); ctx.lineTo(s * 0.34, s * 0.07); ctx.stroke();
}

function drawChest(ctx, s) {
  ink(ctx, s, 0.055);
  rect(ctx, -s * 0.28, -s * 0.18, s * 0.56, s * 0.36, WOOD);
  ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 0.02); ctx.lineTo(s * 0.28, -s * 0.02); ctx.stroke();
  rect(ctx, -s * 0.05, -s * 0.06, s * 0.1, s * 0.1, GOLD);
}

function drawBarrel(ctx, s) {
  ink(ctx, s, 0.05);
  circle(ctx, 0, 0, s * 0.3, WOOD);
  circle(ctx, 0, 0, s * 0.18, null);
  circle(ctx, 0, 0, s * 0.04, WOOD_D);
}

function drawCrate(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.28, -s * 0.28, s * 0.56, s * 0.56, '#9c7d4e');
  ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 0.28); ctx.lineTo(s * 0.28, s * 0.28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.28, -s * 0.28); ctx.lineTo(-s * 0.28, s * 0.28); ctx.stroke();
}

function drawAltar(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.3, -s * 0.18, s * 0.6, s * 0.36, STONE);
  rect(ctx, -s * 0.2, -s * 0.1, s * 0.4, s * 0.2, STONE_D);
  ctx.fillStyle = '#7a2f2f';
  circle(ctx, 0, 0, s * 0.05, '#7a2f2f');
}

function drawStatue(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.24, s * 0.12, s * 0.48, s * 0.2, STONE_D);
  circle(ctx, 0, -s * 0.2, s * 0.12, STONE);
  poly(ctx, [[-s * 0.14, s * 0.12], [-s * 0.08, -s * 0.1], [s * 0.08, -s * 0.1], [s * 0.14, s * 0.12]]);
  fillStroke(ctx, STONE);
}

function drawPillar(ctx, s) {
  ink(ctx, s, 0.05);
  circle(ctx, 0, 0, s * 0.26, STONE);
  circle(ctx, 0, 0, s * 0.15, STONE_D);
}

function drawBed(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.24, -s * 0.36, s * 0.48, s * 0.72, '#8a4a3d');
  rect(ctx, -s * 0.24, -s * 0.36, s * 0.48, s * 0.2, SNOW);
}

function drawBookshelf(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.4, -s * 0.14, s * 0.8, s * 0.28, WOOD_D);
  const cols = ['#7a4a3a', '#4a5a7a', '#5a7a4a', '#7a6a3a', '#6a3a5a'];
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = cols[i];
    ctx.fillRect(-s * 0.36 + i * s * 0.145, -s * 0.1, s * 0.115, s * 0.2);
  }
}

function drawTorch(ctx, s) {
  ink(ctx, s, 0.06);
  ctx.beginPath(); ctx.moveTo(0, s * 0.35); ctx.lineTo(0, -s * 0.05); ctx.stroke();
  ctx.fillStyle = FIRE;
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, -s * 0.02);
  ctx.quadraticCurveTo(0, -s * 0.5, s * 0.12, -s * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f0c04a';
  ctx.beginPath();
  ctx.moveTo(-s * 0.05, -s * 0.04);
  ctx.quadraticCurveTo(0, -s * 0.28, s * 0.05, -s * 0.04);
  ctx.closePath();
  ctx.fill();
}

function drawBrazier(ctx, s) {
  ink(ctx, s, 0.05);
  circle(ctx, 0, 0, s * 0.26, '#4a4038');
  ctx.fillStyle = FIRE;
  circle(ctx, 0, 0, s * 0.15, FIRE);
  ctx.fillStyle = '#f0c04a';
  circle(ctx, 0, 0, s * 0.07, '#f0c04a');
}

function drawTrap(ctx, s) {
  ink(ctx, s, 0.045);
  rect(ctx, -s * 0.3, -s * 0.3, s * 0.6, s * 0.6, null);
  ctx.fillStyle = STONE_D;
  for (let y = -1; y <= 1; y++) {
    for (let x = -1; x <= 1; x++) {
      poly(ctx, [
        [x * s * 0.18 - s * 0.05, y * s * 0.18 + s * 0.07],
        [x * s * 0.18, y * s * 0.18 - s * 0.08],
        [x * s * 0.18 + s * 0.05, y * s * 0.18 + s * 0.07]
      ]);
      ctx.fill();
    }
  }
}

function drawRubble(ctx, s) {
  ink(ctx, s, 0.045);
  circle(ctx, -s * 0.15, s * 0.08, s * 0.14, STONE);
  circle(ctx, s * 0.12, s * 0.12, s * 0.11, STONE_D);
  circle(ctx, 0.02 * s, -s * 0.12, s * 0.16, '#7d7266');
  circle(ctx, s * 0.24, -s * 0.1, s * 0.08, STONE);
}

function drawStairsUp(ctx, s) {
  ink(ctx, s, 0.045);
  for (let i = 0; i < 4; i++) {
    const w = s * (0.7 - i * 0.15);
    rect(ctx, -w / 2, s * 0.28 - i * s * 0.16, w, s * 0.14, i % 2 ? STONE : STONE_D);
  }
  // up arrow
  ink(ctx, s, 0.06);
  ctx.strokeStyle = GOLD;
  ctx.beginPath(); ctx.moveTo(0, s * 0.12); ctx.lineTo(0, -s * 0.3); ctx.stroke();
  poly(ctx, [[-s * 0.08, -s * 0.18], [0, -s * 0.32], [s * 0.08, -s * 0.18]], false);
  ctx.stroke();
}

function drawStairsDown(ctx, s) {
  ink(ctx, s, 0.045);
  for (let i = 0; i < 4; i++) {
    const w = s * (0.25 + i * 0.15);
    rect(ctx, -w / 2, s * 0.28 - i * s * 0.16, w, s * 0.14, i % 2 ? STONE_D : STONE);
  }
  ink(ctx, s, 0.06);
  ctx.strokeStyle = '#7a4a8a';
  ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.lineTo(0, s * 0.12); ctx.stroke();
  poly(ctx, [[-s * 0.08, 0], [0, s * 0.14], [s * 0.08, 0]], false);
  ctx.stroke();
}

function drawThrone(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.26, -s * 0.32, s * 0.52, s * 0.18, GOLD);
  rect(ctx, -s * 0.22, -s * 0.14, s * 0.44, s * 0.42, '#7a2f2f');
  rect(ctx, -s * 0.3, -s * 0.14, s * 0.08, s * 0.42, WOOD_D);
  rect(ctx, s * 0.22, -s * 0.14, s * 0.08, s * 0.42, WOOD_D);
}

function drawBones(ctx, s) {
  ink(ctx, s, 0.055);
  ctx.strokeStyle = SNOW;
  ctx.beginPath(); ctx.moveTo(-s * 0.25, -s * 0.15); ctx.lineTo(s * 0.2, s * 0.22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.22, -s * 0.18); ctx.lineTo(-s * 0.18, s * 0.2); ctx.stroke();
  ctx.fillStyle = SNOW;
  for (const [x, y] of [[-0.25, -0.15], [0.2, 0.22], [0.22, -0.18], [-0.18, 0.2]]) {
    circle(ctx, s * x - s * 0.04, s * y, s * 0.05, SNOW);
    circle(ctx, s * x + s * 0.04, s * y, s * 0.05, SNOW);
  }
}

/* ---------- world nature II ---------- */

function drawSnowPine(ctx, s) {
  drawPine(ctx, s);
  ink(ctx, s, 0.04);
  poly(ctx, [[-s * 0.16, -s * 0.12], [0, -s * 0.5], [s * 0.16, -s * 0.12], [s * 0.08, -s * 0.16], [0, -s * 0.32], [-s * 0.08, -s * 0.16]]);
  fillStroke(ctx, SNOW);
}

function drawJungleTree(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.04, -s * 0.05, s * 0.08, s * 0.45, WOOD_D);
  circle(ctx, -s * 0.18, -s * 0.18, s * 0.2, '#4a7038');
  circle(ctx, s * 0.16, -s * 0.2, s * 0.22, '#578045');
  circle(ctx, 0, -s * 0.32, s * 0.22, '#4a7038');
  // hanging vines
  ctx.strokeStyle = GREEN_D;
  ctx.lineWidth = Math.max(0.8, s * 0.03);
  for (const [x, len] of [[-0.3, 0.22], [-0.02, 0.3], [0.3, 0.2]]) {
    ctx.beginPath();
    ctx.moveTo(s * x, -s * 0.12);
    ctx.quadraticCurveTo(s * x + s * 0.03, 0, s * x, -s * 0.12 + s * len);
    ctx.stroke();
  }
}

function drawCactus(ctx, s) {
  const arm = (x0, y0, x1, y1) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = s * 0.2;
  arm(0, s * 0.4, 0, -s * 0.35);
  arm(-s * 0.22, -s * 0.02, -s * 0.22, -s * 0.2); arm(-s * 0.2, 0, 0, 0);
  arm(s * 0.22, s * 0.12, s * 0.22, -s * 0.1); arm(s * 0.2, s * 0.14, 0, s * 0.14);
  ctx.strokeStyle = '#5f8f4a';
  ctx.lineWidth = s * 0.13;
  arm(0, s * 0.38, 0, -s * 0.34);
  arm(-s * 0.22, -s * 0.02, -s * 0.22, -s * 0.19); arm(-s * 0.21, 0, 0, 0);
  arm(s * 0.22, s * 0.12, s * 0.22, -s * 0.09); arm(s * 0.21, s * 0.14, 0, s * 0.14);
}

function drawIceberg(ctx, s) {
  ink(ctx, s, 0.045);
  ctx.fillStyle = '#5f83a8';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.28, s * 0.44, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  poly(ctx, [[-s * 0.38, s * 0.26], [-s * 0.2, -s * 0.1], [-s * 0.05, s * 0.02], [s * 0.1, -s * 0.42], [s * 0.24, -s * 0.05], [s * 0.38, s * 0.26]]);
  fillStroke(ctx, SNOW);
  poly(ctx, [[s * 0.1, -s * 0.42], [s * 0.24, -s * 0.05], [s * 0.38, s * 0.26], [s * 0.14, s * 0.26]]);
  fillStroke(ctx, '#bccdd4');
}

function drawShip(ctx, s) {
  ink(ctx, s, 0.05);
  // hull
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, s * 0.05);
  ctx.lineTo(s * 0.4, s * 0.05);
  ctx.lineTo(s * 0.26, s * 0.3);
  ctx.lineTo(-s * 0.28, s * 0.3);
  ctx.closePath();
  fillStroke(ctx, WOOD_D);
  // mast + sail
  ctx.beginPath(); ctx.moveTo(0, s * 0.05); ctx.lineTo(0, -s * 0.45); ctx.stroke();
  poly(ctx, [[0, -s * 0.45], [s * 0.3, -s * 0.05], [0, -s * 0.05]]);
  fillStroke(ctx, SNOW);
  poly(ctx, [[0, -s * 0.4], [-s * 0.24, -s * 0.05], [0, -s * 0.05]]);
  fillStroke(ctx, '#d8cdb4');
  // pennant
  poly(ctx, [[0, -s * 0.45], [s * 0.12, -s * 0.41], [0, -s * 0.37]]);
  fillStroke(ctx, GOLD);
}

function drawSeaSerpent(ctx, s) {
  ink(ctx, s, 0.05);
  const body = '#4a7a6a';
  // humps
  ctx.beginPath(); ctx.arc(-s * 0.05, s * 0.15, s * 0.16, Math.PI, 0); ctx.closePath(); fillStroke(ctx, body);
  ctx.beginPath(); ctx.arc(s * 0.28, s * 0.15, s * 0.12, Math.PI, 0); ctx.closePath(); fillStroke(ctx, body);
  // neck + head
  ctx.beginPath();
  ctx.moveTo(-s * 0.28, s * 0.15);
  ctx.quadraticCurveTo(-s * 0.42, -s * 0.1, -s * 0.32, -s * 0.28);
  ctx.quadraticCurveTo(-s * 0.28, -s * 0.36, -s * 0.18, -s * 0.32);
  ctx.quadraticCurveTo(-s * 0.22, -s * 0.18, -s * 0.14, s * 0.15);
  ctx.closePath();
  fillStroke(ctx, body);
  ctx.fillStyle = '#f0e6c8';
  circle(ctx, -s * 0.27, -s * 0.29, s * 0.025, '#f0e6c8');
  // waves
  ctx.strokeStyle = '#7fa3c8';
  ctx.lineWidth = s * 0.03;
  ctx.beginPath(); ctx.moveTo(-s * 0.42, s * 0.24); ctx.quadraticCurveTo(-s * 0.3, s * 0.18, -s * 0.2, s * 0.24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.12, s * 0.24); ctx.quadraticCurveTo(s * 0.24, s * 0.18, s * 0.36, s * 0.24); ctx.stroke();
}

/* ---------- town II ---------- */

function drawInn(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.3, -s * 0.05, s * 0.6, s * 0.42, '#a3927a');
  poly(ctx, [[-s * 0.38, -s * 0.05], [0, -s * 0.38], [s * 0.38, -s * 0.05]]);
  fillStroke(ctx, ROOF);
  rect(ctx, -s * 0.07, s * 0.12, s * 0.14, s * 0.25, '#3a3128');
  // hanging sign
  ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.02); ctx.lineTo(s * 0.46, s * 0.02); ctx.stroke();
  rect(ctx, s * 0.36, s * 0.04, s * 0.13, s * 0.13, GOLD);
}

function drawSmithy(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.32, -s * 0.02, s * 0.64, s * 0.36, STONE);
  poly(ctx, [[-s * 0.4, -s * 0.02], [0, -s * 0.3], [s * 0.4, -s * 0.02]]);
  fillStroke(ctx, '#4a4038');
  // chimney + smoke
  rect(ctx, s * 0.14, -s * 0.34, s * 0.12, s * 0.16, STONE_D);
  ctx.strokeStyle = '#9a9488';
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.moveTo(s * 0.2, -s * 0.38);
  ctx.quadraticCurveTo(s * 0.28, -s * 0.46, s * 0.22, -s * 0.52);
  ctx.stroke();
  // anvil out front
  ink(ctx, s, 0.04);
  ctx.fillStyle = '#3a352f';
  rect(ctx, -s * 0.2, s * 0.2, s * 0.16, s * 0.05, '#3a352f');
  rect(ctx, -s * 0.165, s * 0.25, s * 0.09, s * 0.08, '#3a352f');
}

function drawStable(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.42, -s * 0.02, s * 0.84, s * 0.34, WOOD);
  poly(ctx, [[-s * 0.48, -s * 0.02], [0, -s * 0.32], [s * 0.48, -s * 0.02]]);
  fillStroke(ctx, WOOD_D);
  // open stalls
  ctx.fillStyle = '#2c261f';
  rect(ctx, -s * 0.32, s * 0.08, s * 0.18, s * 0.24, '#2c261f');
  rect(ctx, s * 0.14, s * 0.08, s * 0.18, s * 0.24, '#2c261f');
  // hay
  circle(ctx, -s * 0.02, s * 0.24, s * 0.09, '#c9b45a');
}

function drawGatehouse(ctx, s) {
  ink(ctx, s, 0.05);
  // wall
  rect(ctx, -s * 0.28, -s * 0.1, s * 0.56, s * 0.4, STONE);
  // towers
  rect(ctx, -s * 0.46, -s * 0.3, s * 0.2, s * 0.6, STONE_D);
  rect(ctx, s * 0.26, -s * 0.3, s * 0.2, s * 0.6, STONE_D);
  ctx.fillStyle = STONE_D;
  for (const x of [-0.46, -0.38, -0.3, 0.26, 0.34, 0.42]) rect(ctx, s * x, -s * 0.38, s * 0.07, s * 0.09, STONE_D);
  // gate arch
  ctx.beginPath();
  ctx.arc(0, s * 0.3, s * 0.15, Math.PI, 0);
  ctx.lineTo(s * 0.15, s * 0.3);
  ctx.closePath();
  fillStroke(ctx, '#2c261f');
  // portcullis bars
  ctx.strokeStyle = '#6e675c';
  ctx.lineWidth = s * 0.025;
  for (const x of [-0.08, 0, 0.08]) {
    ctx.beginPath(); ctx.moveTo(s * x, s * 0.3); ctx.lineTo(s * x, s * 0.17); ctx.stroke();
  }
}

function drawHedge(ctx, s) {
  ink(ctx, s, 0.045);
  circle(ctx, -s * 0.26, 0, s * 0.18, GREEN_D);
  circle(ctx, s * 0.26, 0, s * 0.18, GREEN_D);
  circle(ctx, 0, 0, s * 0.2, GREEN);
}

function drawGraveyard(ctx, s) {
  ink(ctx, s, 0.045);
  // mound
  ctx.beginPath();
  ctx.ellipse(0, s * 0.3, s * 0.42, s * 0.1, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#6d7a55');
  // tombstones
  const stone = (x, k) => {
    ctx.beginPath();
    ctx.moveTo(x - k, s * 0.28);
    ctx.lineTo(x - k, s * 0.02);
    ctx.arc(x, s * 0.02, k, Math.PI, 0);
    ctx.lineTo(x + k, s * 0.28);
    ctx.closePath();
    fillStroke(ctx, STONE);
  };
  stone(-s * 0.2, s * 0.1);
  stone(s * 0.22, s * 0.08);
  // cross
  ink(ctx, s, 0.055);
  ctx.beginPath(); ctx.moveTo(0, s * 0.26); ctx.lineTo(0, -s * 0.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.09, -s * 0.08); ctx.lineTo(s * 0.09, -s * 0.08); ctx.stroke();
}

/* ---------- dungeon furniture II ---------- */

function drawChair(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.2, -s * 0.14, s * 0.4, s * 0.38, WOOD);
  rect(ctx, -s * 0.2, -s * 0.26, s * 0.4, s * 0.12, WOOD_D);
}

function drawBench(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.42, -s * 0.1, s * 0.84, s * 0.2, WOOD);
  ctx.strokeStyle = WOOD_D;
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.1); ctx.lineTo(-s * 0.3, s * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.1); ctx.lineTo(s * 0.3, s * 0.1); ctx.stroke();
}

function drawRug(ctx, s) {
  ink(ctx, s, 0.04);
  rect(ctx, -s * 0.42, -s * 0.28, s * 0.84, s * 0.56, '#7c3038');
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(1, s * 0.03);
  ctx.strokeRect(-s * 0.34, -s * 0.2, s * 0.68, s * 0.4);
  ctx.fillStyle = GOLD;
  circle(ctx, 0, 0, s * 0.06, GOLD);
  // fringe
  ctx.strokeStyle = '#c9b45a';
  ctx.lineWidth = Math.max(0.8, s * 0.02);
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(-s * 0.42, i * s * 0.07); ctx.lineTo(-s * 0.48, i * s * 0.07); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.42, i * s * 0.07); ctx.lineTo(s * 0.48, i * s * 0.07); ctx.stroke();
  }
}

function drawForge(ctx, s) {
  // glow
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.45);
  g.addColorStop(0, 'rgba(217,123,46,0.5)');
  g.addColorStop(1, 'rgba(217,123,46,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); ctx.fill();
  // anvil
  ink(ctx, s, 0.05);
  ctx.fillStyle = '#3a352f';
  ctx.beginPath();
  ctx.moveTo(-s * 0.34, -s * 0.14);
  ctx.lineTo(s * 0.2, -s * 0.14);
  ctx.quadraticCurveTo(s * 0.4, -s * 0.14, s * 0.36, -s * 0.02);
  ctx.quadraticCurveTo(s * 0.22, 0, s * 0.14, -s * 0.02);
  ctx.lineTo(s * 0.1, s * 0.12);
  ctx.lineTo(s * 0.18, s * 0.24);
  ctx.lineTo(-s * 0.26, s * 0.24);
  ctx.lineTo(-s * 0.18, s * 0.12);
  ctx.lineTo(-s * 0.22, -s * 0.02);
  ctx.lineTo(-s * 0.34, -s * 0.02);
  ctx.closePath();
  fillStroke(ctx, '#3a352f');
}

function drawCauldron(ctx, s) {
  ink(ctx, s, 0.05);
  circle(ctx, 0, 0, s * 0.3, '#33302a');
  circle(ctx, 0, 0, s * 0.22, '#5c7a3a');
  ctx.fillStyle = '#7d9c50';
  circle(ctx, -s * 0.08, -s * 0.05, s * 0.035, '#7d9c50');
  circle(ctx, s * 0.06, s * 0.07, s * 0.045, '#7d9c50');
  circle(ctx, s * 0.09, -s * 0.08, s * 0.025, '#7d9c50');
}

function drawSarcophagus(ctx, s) {
  ink(ctx, s, 0.05);
  poly(ctx, [
    [-s * 0.16, -s * 0.42], [s * 0.16, -s * 0.42], [s * 0.22, -s * 0.2],
    [s * 0.16, s * 0.42], [-s * 0.16, s * 0.42], [-s * 0.22, -s * 0.2]
  ]);
  fillStroke(ctx, STONE);
  // carved figure
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.beginPath(); ctx.arc(0, -s * 0.22, s * 0.08, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -s * 0.14); ctx.lineTo(0, s * 0.22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.12, 0); ctx.lineTo(s * 0.12, 0); ctx.stroke();
}

function drawCage(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.3, -s * 0.3, s * 0.6, s * 0.6, 'rgba(30,26,20,0.4)');
  ctx.strokeStyle = '#55504a';
  ctx.lineWidth = Math.max(1, s * 0.045);
  for (const x of [-0.15, 0, 0.15]) {
    ctx.beginPath(); ctx.moveTo(s * x, -s * 0.3); ctx.lineTo(s * x, s * 0.3); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.lineTo(s * 0.3, 0); ctx.stroke();
}

function drawRack(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.4, -s * 0.1, s * 0.8, s * 0.2, WOOD);
  // spears
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = Math.max(1, s * 0.04);
  for (const x of [-0.26, -0.02, 0.22]) {
    ctx.beginPath(); ctx.moveTo(s * x, s * 0.1); ctx.lineTo(s * x + s * 0.06, -s * 0.32); ctx.stroke();
  }
  ctx.fillStyle = STONE_D;
  for (const x of [-0.26, -0.02, 0.22]) {
    poly(ctx, [[s * x + s * 0.02, -s * 0.3], [s * x + s * 0.1, -s * 0.34], [s * x + s * 0.06, -s * 0.42]]);
    ctx.fill();
  }
}

function drawLadder(ctx, s) {
  ink(ctx, s, 0.06);
  ctx.strokeStyle = WOOD;
  ctx.beginPath(); ctx.moveTo(-s * 0.14, -s * 0.42); ctx.lineTo(-s * 0.14, s * 0.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.14, -s * 0.42); ctx.lineTo(s * 0.14, s * 0.42); ctx.stroke();
  ctx.strokeStyle = WOOD_D;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(-s * 0.14, i * s * 0.12); ctx.lineTo(s * 0.14, i * s * 0.12); ctx.stroke();
  }
}

function drawWeb(ctx, s) {
  ctx.strokeStyle = 'rgba(230,225,210,0.75)';
  ctx.lineWidth = Math.max(0.8, s * 0.025);
  const cx = -s * 0.4, cy = -s * 0.4;
  for (let i = 0; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * s * 0.85, cy + Math.sin(a) * s * 0.85);
    ctx.stroke();
  }
  for (const r of [0.3, 0.55, 0.8]) {
    ctx.beginPath();
    ctx.arc(cx, cy, s * r, 0, Math.PI / 2);
    ctx.stroke();
  }
}

function drawCrystals(ctx, s) {
  ink(ctx, s, 0.045);
  const shard = (x, h, w, col) => {
    poly(ctx, [[x - w, s * 0.3], [x, s * 0.3 - h], [x + w, s * 0.3]]);
    fillStroke(ctx, col);
    ctx.strokeStyle = 'rgba(240,235,255,0.6)';
    ctx.lineWidth = Math.max(0.8, s * 0.025);
    ctx.beginPath(); ctx.moveTo(x, s * 0.3 - h); ctx.lineTo(x - w * 0.3, s * 0.3); ctx.stroke();
    ink(ctx, s, 0.045);
  };
  shard(-s * 0.18, s * 0.5, s * 0.12, '#7a5a9c');
  shard(s * 0.16, s * 0.62, s * 0.13, '#9a7ac0');
  shard(0, s * 0.36, s * 0.1, '#8a6aae');
}

function drawCampfire(ctx, s) {
  ink(ctx, s, 0.06);
  ctx.strokeStyle = WOOD_D;
  ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.24); ctx.lineTo(s * 0.3, s * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.3, s * 0.24); ctx.lineTo(-s * 0.3, s * 0.1); ctx.stroke();
  ctx.fillStyle = FIRE;
  ctx.beginPath();
  ctx.moveTo(-s * 0.16, s * 0.14);
  ctx.quadraticCurveTo(-s * 0.02, -s * 0.42, 0, -s * 0.44);
  ctx.quadraticCurveTo(s * 0.05, -s * 0.3, s * 0.16, s * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f0c04a';
  ctx.beginPath();
  ctx.moveTo(-s * 0.08, s * 0.14);
  ctx.quadraticCurveTo(0, -s * 0.16, s * 0.08, s * 0.14);
  ctx.closePath();
  ctx.fill();
}

/* ---------- world nature III ---------- */

function drawWaterfall(ctx, s) {
  ink(ctx, s, 0.05);
  poly(ctx, [[-s * 0.4, -s * 0.3], [-s * 0.1, -s * 0.42], [s * 0.12, -s * 0.3], [s * 0.4, -s * 0.36], [s * 0.34, s * 0.1], [-s * 0.34, s * 0.06]]);
  fillStroke(ctx, STONE);
  ctx.fillStyle = '#7fa3c8';
  rect(ctx, -s * 0.1, -s * 0.32, s * 0.2, s * 0.5, '#7fa3c8');
  ctx.strokeStyle = SNOW;
  ctx.lineWidth = s * 0.03;
  for (const x of [-0.06, 0, 0.06]) {
    ctx.beginPath(); ctx.moveTo(s * x, -s * 0.3); ctx.lineTo(s * x, s * 0.16); ctx.stroke();
  }
  ctx.fillStyle = '#5f83a8';
  ctx.beginPath(); ctx.ellipse(0, s * 0.28, s * 0.3, s * 0.12, 0, 0, Math.PI * 2); ctx.fill();
  ink(ctx, s, 0.04); ctx.beginPath(); ctx.ellipse(0, s * 0.28, s * 0.3, s * 0.12, 0, 0, Math.PI * 2); ctx.stroke();
}

function drawGeyser(ctx, s) {
  ink(ctx, s, 0.045);
  ctx.beginPath(); ctx.ellipse(0, s * 0.3, s * 0.3, s * 0.12, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#9db3b5');
  ctx.strokeStyle = '#bcd4d6';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath(); ctx.moveTo(0, s * 0.24); ctx.quadraticCurveTo(-s * 0.04, -s * 0.1, 0, -s * 0.38); ctx.stroke();
  ctx.fillStyle = 'rgba(220,235,235,0.8)';
  circle(ctx, -s * 0.08, -s * 0.34, s * 0.07, 'rgba(220,235,235,0.8)');
  circle(ctx, s * 0.08, -s * 0.4, s * 0.09, 'rgba(220,235,235,0.8)');
  circle(ctx, 0, -s * 0.46, s * 0.06, 'rgba(220,235,235,0.8)');
}

function drawOasis(ctx, s) {
  ink(ctx, s, 0.045);
  ctx.beginPath(); ctx.ellipse(0, s * 0.18, s * 0.34, s * 0.16, 0, 0, Math.PI * 2);
  fillStroke(ctx, WATER);
  ctx.save(); ctx.translate(-s * 0.18, -s * 0.14); drawPalm(ctx, s * 0.6); ctx.restore();
  ctx.save(); ctx.translate(s * 0.2, -s * 0.1); ctx.scale(-1, 1); drawPalm(ctx, s * 0.5); ctx.restore();
}

function drawIceSpikes(ctx, s) {
  ink(ctx, s, 0.045);
  const spike = (x, h, w) => {
    poly(ctx, [[x - w, s * 0.35], [x, s * 0.35 - h], [x + w, s * 0.35]]);
    fillStroke(ctx, '#dceaef');
    ctx.strokeStyle = 'rgba(150,180,195,0.7)';
    ctx.beginPath(); ctx.moveTo(x, s * 0.35 - h); ctx.lineTo(x - w * 0.3, s * 0.35); ctx.stroke();
    ink(ctx, s, 0.045);
  };
  spike(-s * 0.22, s * 0.5, s * 0.13);
  spike(s * 0.16, s * 0.68, s * 0.15);
  spike(0, s * 0.34, s * 0.1);
}

function drawWhirlpool(ctx, s) {
  ctx.strokeStyle = '#7fa3c8';
  ctx.lineWidth = Math.max(1, s * 0.05);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const r0 = s * (0.12 + i * 0.12);
    for (let a = 0; a < Math.PI * 1.7; a += 0.25) {
      const r = r0 + a * s * 0.03;
      const x = Math.cos(a + i * 2.1) * r, y = Math.sin(a + i * 2.1) * r * 0.8;
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#43647f';
  circle(ctx, 0, 0, s * 0.08, '#43647f');
}

function drawCrater(ctx, s) {
  ink(ctx, s, 0.05);
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.3, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#6b5c50');
  ctx.beginPath(); ctx.ellipse(0, s * 0.03, s * 0.26, s * 0.17, 0, 0, Math.PI * 2);
  fillStroke(ctx, '#3a3128');
}

/* ---------- world settlements & markers III ---------- */

function drawMonastery(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.36, -s * 0.02, s * 0.72, s * 0.34, STONE);
  poly(ctx, [[-s * 0.42, -s * 0.02], [-s * 0.18, -s * 0.26], [s * 0.06, -s * 0.02]]);
  fillStroke(ctx, ROOF);
  rect(ctx, s * 0.1, -s * 0.34, s * 0.18, s * 0.32, STONE_D);
  poly(ctx, [[s * 0.06, -s * 0.34], [s * 0.19, -s * 0.5], [s * 0.32, -s * 0.34]]);
  fillStroke(ctx, ROOF);
  ink(ctx, s, 0.04);
  ctx.beginPath(); ctx.moveTo(s * 0.19, -s * 0.5); ctx.lineTo(s * 0.19, -s * 0.62); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.14, -s * 0.57); ctx.lineTo(s * 0.24, -s * 0.57); ctx.stroke();
}

function drawWizardTower(ctx, s) {
  ink(ctx, s, 0.05);
  ctx.beginPath();
  ctx.moveTo(-s * 0.14, s * 0.42);
  ctx.quadraticCurveTo(-s * 0.22, 0, -s * 0.08, -s * 0.3);
  ctx.lineTo(s * 0.14, -s * 0.3);
  ctx.quadraticCurveTo(s * 0.2, 0, s * 0.18, s * 0.42);
  ctx.closePath();
  fillStroke(ctx, '#6d5f7d');
  poly(ctx, [[-s * 0.16, -s * 0.3], [s * 0.06, -s * 0.56], [s * 0.22, -s * 0.3]]);
  fillStroke(ctx, '#4a3a5c');
  ctx.fillStyle = '#c9e04a';
  circle(ctx, s * 0.05, -s * 0.6, s * 0.06, '#c9e04a');
  rect(ctx, -s * 0.02, -s * 0.1, s * 0.09, s * 0.12, '#3a3128');
}

function drawWatchtower(ctx, s) {
  ink(ctx, s, 0.05);
  poly(ctx, [[-s * 0.16, s * 0.42], [-s * 0.1, -s * 0.2], [s * 0.1, -s * 0.2], [s * 0.16, s * 0.42]]);
  fillStroke(ctx, WOOD);
  rect(ctx, -s * 0.2, -s * 0.36, s * 0.4, s * 0.18, WOOD_D);
  ctx.fillStyle = FIRE;
  circle(ctx, 0, -s * 0.44, s * 0.07, FIRE);
  ctx.strokeStyle = WOOD_D;
  ctx.beginPath(); ctx.moveTo(-s * 0.13, s * 0.1); ctx.lineTo(s * 0.13, -s * 0.05); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.13, s * 0.1); ctx.lineTo(-s * 0.13, -s * 0.05); ctx.stroke();
}

function drawObelisk(ctx, s) {
  ink(ctx, s, 0.05);
  poly(ctx, [[-s * 0.1, s * 0.4], [-s * 0.06, -s * 0.34], [s * 0.06, -s * 0.34], [s * 0.1, s * 0.4]]);
  fillStroke(ctx, STONE_D);
  poly(ctx, [[-s * 0.06, -s * 0.34], [0, -s * 0.48], [s * 0.06, -s * 0.34]]);
  fillStroke(ctx, GOLD);
  ctx.strokeStyle = 'rgba(30,24,16,0.6)';
  ctx.lineWidth = s * 0.025;
  for (const y of [-0.15, 0, 0.15]) {
    ctx.beginPath(); ctx.moveTo(-s * 0.05, s * y); ctx.lineTo(s * 0.05, s * y); ctx.stroke();
  }
  rect(ctx, -s * 0.16, s * 0.4, s * 0.32, s * 0.06, STONE);
}

function drawPortalArch(ctx, s) {
  ink(ctx, s, 0.055);
  ctx.beginPath();
  ctx.arc(0, s * 0.05, s * 0.3, Math.PI, 0);
  ctx.lineTo(s * 0.42, s * 0.4); ctx.lineTo(s * 0.24, s * 0.4);
  ctx.arc(0, s * 0.05, s * 0.18, 0, Math.PI, true);
  ctx.lineTo(-s * 0.24, s * 0.4); ctx.lineTo(-s * 0.42, s * 0.4);
  ctx.closePath();
  fillStroke(ctx, STONE_D);
  const grad = ctx.createRadialGradient(0, s * 0.08, 0, 0, s * 0.08, s * 0.2);
  grad.addColorStop(0, 'rgba(140,220,190,0.9)');
  grad.addColorStop(1, 'rgba(140,220,190,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, s * 0.08, s * 0.2, 0, Math.PI * 2); ctx.fill();
}

function drawTentCamp(ctx, s) {
  const tent = (x, y, k, col) => {
    ctx.save(); ctx.translate(x, y);
    ink(ctx, s, 0.045);
    poly(ctx, [[-k, k * 0.7], [0, -k * 0.7], [k, k * 0.7]]);
    fillStroke(ctx, col);
    poly(ctx, [[-k * 0.18, k * 0.7], [0, k * 0.1], [k * 0.18, k * 0.7]]);
    fillStroke(ctx, '#3a3128');
    ctx.restore();
  };
  tent(-s * 0.22, s * 0.05, s * 0.22, '#b09466');
  tent(s * 0.22, s * 0.1, s * 0.18, '#8c7454');
  tent(s * 0.02, -s * 0.18, s * 0.2, '#a3865c');
  ctx.fillStyle = FIRE;
  circle(ctx, 0, s * 0.3, s * 0.06, FIRE);
}

function drawBanner(ctx, s) {
  ink(ctx, s, 0.06);
  ctx.beginPath(); ctx.moveTo(0, s * 0.45); ctx.lineTo(0, -s * 0.45); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.45);
  ctx.lineTo(s * 0.36, -s * 0.38);
  ctx.lineTo(s * 0.28, -s * 0.26);
  ctx.lineTo(s * 0.36, -s * 0.14);
  ctx.lineTo(0, -s * 0.07);
  ctx.closePath();
  fillStroke(ctx, '#7a2f2f');
  ctx.fillStyle = GOLD;
  circle(ctx, s * 0.15, -s * 0.26, s * 0.05, GOLD);
}

function drawShipwreck(ctx, s) {
  ink(ctx, s, 0.05);
  ctx.save();
  ctx.rotate(-0.28);
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, 0);
  ctx.lineTo(s * 0.28, 0);
  ctx.lineTo(s * 0.16, s * 0.22);
  ctx.lineTo(-s * 0.3, s * 0.22);
  ctx.closePath();
  fillStroke(ctx, WOOD_D);
  ctx.beginPath(); ctx.moveTo(-s * 0.05, 0); ctx.lineTo(s * 0.1, -s * 0.4); ctx.stroke();
  poly(ctx, [[s * 0.1, -s * 0.4], [s * 0.3, -s * 0.16], [s * 0.12, -s * 0.2]]);
  fillStroke(ctx, '#b3a08a');
  ctx.restore();
  ctx.strokeStyle = '#7fa3c8';
  ctx.lineWidth = s * 0.04;
  ctx.beginPath(); ctx.moveTo(-s * 0.42, s * 0.3); ctx.quadraticCurveTo(-s * 0.3, s * 0.24, -s * 0.18, s * 0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.14, s * 0.32); ctx.quadraticCurveTo(s * 0.26, s * 0.26, s * 0.38, s * 0.32); ctx.stroke();
}

function drawKraken(ctx, s) {
  ink(ctx, s, 0.05);
  ctx.fillStyle = '#5c4a6b';
  const arm = (x0, amp, h) => {
    ctx.beginPath();
    ctx.moveTo(x0, s * 0.3);
    ctx.quadraticCurveTo(x0 + amp, 0, x0, -h);
    ctx.quadraticCurveTo(x0 + amp * 0.4, -h - s * 0.08, x0 + amp * 0.55, -h + s * 0.02);
    ctx.quadraticCurveTo(x0 + amp * 0.5, 0, x0 + s * 0.09, s * 0.3);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  };
  arm(-s * 0.3, s * 0.12, s * 0.3);
  arm(-s * 0.08, -s * 0.14, s * 0.42);
  arm(s * 0.14, s * 0.13, s * 0.34);
  ctx.strokeStyle = '#7fa3c8';
  ctx.lineWidth = s * 0.04;
  ctx.beginPath(); ctx.moveTo(-s * 0.42, s * 0.34); ctx.quadraticCurveTo(0, s * 0.26, s * 0.42, s * 0.34); ctx.stroke();
}

function drawDragonSkel(ctx, s) {
  ctx.strokeStyle = SNOW;
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, s * 0.1);
  ctx.quadraticCurveTo(0, -s * 0.3, s * 0.34, s * 0.02);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const x = -s * 0.4 + t * s * 0.68;
    const y = s * 0.08 - Math.sin(t * Math.PI) * s * 0.26;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - s * 0.03, y + s * 0.18 * (1 - t * 0.4));
    ctx.stroke();
  }
  // skull
  ink(ctx, s, 0.04);
  ctx.fillStyle = SNOW;
  poly(ctx, [[s * 0.3, -s * 0.02], [s * 0.5, s * 0.02], [s * 0.42, s * 0.1], [s * 0.3, s * 0.1]]);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK;
  circle(ctx, s * 0.37, s * 0.03, s * 0.025, INK);
}

function drawLumberCamp(ctx, s) {
  ink(ctx, s, 0.05);
  // stacked logs
  for (const [x, y] of [[-0.12, 0.26], [0.02, 0.26], [0.16, 0.26], [-0.05, 0.14], [0.09, 0.14]]) {
    circle(ctx, s * x, s * y, s * 0.07, WOOD);
    circle(ctx, s * x, s * y, s * 0.03, '#c8a878');
  }
  // crossed axes
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = s * 0.05;
  ctx.beginPath(); ctx.moveTo(-s * 0.2, 0); ctx.lineTo(s * 0.08, -s * 0.34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.2, 0); ctx.lineTo(-s * 0.08, -s * 0.34); ctx.stroke();
  ctx.fillStyle = STONE;
  poly(ctx, [[s * 0.02, -s * 0.42], [s * 0.16, -s * 0.36], [s * 0.06, -s * 0.28]]);
  ctx.fill(); ctx.stroke();
  poly(ctx, [[-s * 0.02, -s * 0.42], [-s * 0.16, -s * 0.36], [-s * 0.06, -s * 0.28]]);
  ctx.fill(); ctx.stroke();
}

function drawVineyard(ctx, s) {
  ink(ctx, s, 0.04);
  rect(ctx, -s * 0.42, -s * 0.3, s * 0.84, s * 0.6, '#9aa06a');
  ctx.strokeStyle = GREEN_D;
  ctx.lineWidth = s * 0.05;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo(i * s * 0.16, -s * 0.26); ctx.lineTo(i * s * 0.16, s * 0.26); ctx.stroke();
  }
  ctx.fillStyle = '#6b3a5c';
  for (let i = -2; i <= 2; i++) {
    for (const y of [-0.15, 0.05, 0.2]) circle(ctx, i * s * 0.16 + s * 0.03, s * y, s * 0.025, '#6b3a5c');
  }
}

/* ---------- map dressing ---------- */

function drawCompassRose(ctx, s) {
  ink(ctx, s, 0.02);
  ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    const len = i % 2 === 0 ? s * 0.44 : s * 0.24;
    ctx.fillStyle = i % 2 === 0 ? INK : GOLD;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - 0.09) * s * 0.07, Math.sin(a - 0.09) * s * 0.07);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.lineTo(Math.cos(a + 0.09) * s * 0.07, Math.sin(a + 0.09) * s * 0.07);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = GOLD;
  circle(ctx, 0, 0, s * 0.05, GOLD);
  ctx.fillStyle = INK;
  ctx.font = `bold ${Math.round(s * 0.16)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -s * 0.48);
}

function drawScaleBar(ctx, s) {
  ink(ctx, s, 0.03);
  const w = s * 0.9, h = s * 0.08;
  for (let i = 0; i < 4; i++) {
    rect(ctx, -w / 2 + (i * w) / 4, -h / 2, w / 4, h, i % 2 ? '#e8ddc8' : INK);
  }
  ctx.fillStyle = INK;
  ctx.font = `${Math.round(s * 0.13)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('0', -w / 2, -h);
  ctx.fillText('100 mi', w / 2, -h);
}

function drawCartouche(ctx, s) {
  ink(ctx, s, 0.035);
  ctx.beginPath();
  ctx.moveTo(-s * 0.42, -s * 0.16);
  ctx.quadraticCurveTo(-s * 0.48, 0, -s * 0.42, s * 0.16);
  ctx.lineTo(s * 0.42, s * 0.16);
  ctx.quadraticCurveTo(s * 0.48, 0, s * 0.42, -s * 0.16);
  ctx.closePath();
  fillStroke(ctx, '#e2d5b4');
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = s * 0.02;
  ctx.strokeRect(-s * 0.38, -s * 0.12, s * 0.76, s * 0.24);
  // scroll ends
  ink(ctx, s, 0.035);
  circle(ctx, -s * 0.44, 0, s * 0.05, '#c9b98d');
  circle(ctx, s * 0.44, 0, s * 0.05, '#c9b98d');
}

function drawFlourish(ctx, s) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1, s * 0.04);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, 0);
  ctx.quadraticCurveTo(-s * 0.1, -s * 0.22, s * 0.1, 0);
  ctx.quadraticCurveTo(s * 0.3, s * 0.18, s * 0.45, 0);
  ctx.stroke();
  ctx.beginPath(); ctx.arc(-s * 0.45, 0, s * 0.05, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = GOLD;
  circle(ctx, s * 0.45, 0, s * 0.04, GOLD);
}

/* ---------- town III ---------- */

function drawBarn(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.36, -s * 0.3, s * 0.72, s * 0.6, '#8a4a3d');
  ctx.strokeStyle = 'rgba(40,25,18,0.5)';
  ctx.beginPath(); ctx.moveTo(-s * 0.36, 0); ctx.lineTo(s * 0.36, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.3); ctx.lineTo(-s * 0.2, s * 0.3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.3); ctx.lineTo(s * 0.2, s * 0.3); ctx.stroke();
}

function drawGuardpost(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.2, -s * 0.2, s * 0.4, s * 0.4, STONE_D);
  circle(ctx, 0, 0, s * 0.1, STONE);
  ctx.strokeStyle = '#7a2f2f';
  ctx.lineWidth = s * 0.05;
  ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.2); ctx.lineTo(s * 0.34, -s * 0.34); ctx.stroke();
  poly(ctx, [[s * 0.34, -s * 0.34], [s * 0.46, -s * 0.3], [s * 0.36, -s * 0.24]]);
  ctx.fillStyle = '#7a2f2f';
  ctx.fill();
}

function drawShrine(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.16, -s * 0.05, s * 0.32, s * 0.35, STONE);
  poly(ctx, [[-s * 0.24, -s * 0.05], [0, -s * 0.3], [s * 0.24, -s * 0.05]]);
  fillStroke(ctx, ROOF_B);
  ctx.fillStyle = GOLD;
  circle(ctx, 0, s * 0.1, s * 0.06, GOLD);
}

function drawGallows(ctx, s) {
  ink(ctx, s, 0.06);
  ctx.strokeStyle = WOOD_D;
  ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.4); ctx.lineTo(-s * 0.2, -s * 0.38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.38); ctx.lineTo(s * 0.22, -s * 0.38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2); ctx.lineTo(-s * 0.02, -s * 0.38); ctx.stroke();
  ctx.lineWidth = s * 0.035;
  ctx.beginPath(); ctx.moveTo(s * 0.16, -s * 0.38); ctx.lineTo(s * 0.16, -s * 0.16); ctx.stroke();
  circle(ctx, s * 0.16, -s * 0.1, s * 0.06, null);
  rect(ctx, -s * 0.3, s * 0.4, s * 0.6, s * 0.06, WOOD);
}

function drawStocks(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.3, -s * 0.1, s * 0.6, s * 0.16, WOOD);
  circle(ctx, -s * 0.12, -s * 0.02, s * 0.05, '#2c261f');
  circle(ctx, s * 0.12, -s * 0.02, s * 0.05, '#2c261f');
  rect(ctx, -s * 0.06, 0.06 * s, s * 0.12, s * 0.3, WOOD_D);
}

function drawSignpost(ctx, s) {
  ink(ctx, s, 0.055);
  ctx.strokeStyle = WOOD_D;
  ctx.beginPath(); ctx.moveTo(0, s * 0.42); ctx.lineTo(0, -s * 0.4); ctx.stroke();
  ink(ctx, s, 0.04);
  poly(ctx, [[0, -s * 0.4], [s * 0.34, -s * 0.4], [s * 0.42, -s * 0.32], [s * 0.34, -s * 0.24], [0, -s * 0.24]]);
  fillStroke(ctx, WOOD);
  poly(ctx, [[0, -s * 0.16], [-s * 0.3, -s * 0.16], [-s * 0.38, -s * 0.08], [-s * 0.3, 0], [0, 0]]);
  fillStroke(ctx, WOOD);
}

function drawAnimalPen(ctx, s) {
  ink(ctx, s, 0.045);
  ctx.strokeStyle = WOOD_D;
  ctx.lineWidth = s * 0.05;
  ctx.strokeRect(-s * 0.4, -s * 0.3, s * 0.8, s * 0.6);
  for (const x of [-0.4, -0.13, 0.13, 0.4]) {
    circle(ctx, s * x, -s * 0.3, s * 0.03, WOOD_D);
    circle(ctx, s * x, s * 0.3, s * 0.03, WOOD_D);
  }
  ctx.fillStyle = '#d8c7a8';
  ctx.beginPath(); ctx.ellipse(-s * 0.1, 0, s * 0.12, s * 0.08, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s * 0.15, s * 0.1, s * 0.1, s * 0.07, -0.3, 0, Math.PI * 2); ctx.fill();
}

function drawPond(ctx, s) {
  ink(ctx, s, 0.04);
  ctx.beginPath();
  ctx.moveTo(-s * 0.4, 0);
  ctx.quadraticCurveTo(-s * 0.34, -s * 0.3, 0, -s * 0.26);
  ctx.quadraticCurveTo(s * 0.42, -s * 0.2, s * 0.36, s * 0.08);
  ctx.quadraticCurveTo(s * 0.28, s * 0.3, -s * 0.08, s * 0.26);
  ctx.quadraticCurveTo(-s * 0.42, s * 0.2, -s * 0.4, 0);
  ctx.closePath();
  fillStroke(ctx, WATER);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = s * 0.03;
  ctx.beginPath(); ctx.moveTo(-s * 0.15, -s * 0.05); ctx.quadraticCurveTo(0, -s * 0.1, s * 0.15, -s * 0.05); ctx.stroke();
}

function drawWoodBridge(ctx, s) {
  ink(ctx, s, 0.045);
  rect(ctx, -s * 0.4, -s * 0.18, s * 0.8, s * 0.36, WOOD);
  ctx.strokeStyle = WOOD_D;
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(i * s * 0.11, -s * 0.18); ctx.lineTo(i * s * 0.11, s * 0.18); ctx.stroke();
  }
  ctx.lineWidth = s * 0.05;
  ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.22); ctx.lineTo(s * 0.4, -s * 0.22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.22); ctx.lineTo(s * 0.4, s * 0.22); ctx.stroke();
}

/* ---------- dungeon furniture III ---------- */

function drawLever(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.18, -s * 0.08, s * 0.36, s * 0.2, STONE_D);
  ctx.strokeStyle = WOOD;
  ctx.lineWidth = s * 0.06;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.18, -s * 0.3); ctx.stroke();
  circle(ctx, s * 0.18, -s * 0.3, s * 0.06, '#7a2f2f');
}

function drawMimic(ctx, s) {
  drawChest(ctx, s);
  ctx.fillStyle = SNOW;
  for (let i = -2; i <= 2; i++) {
    poly(ctx, [[i * s * 0.1 - s * 0.03, -s * 0.02], [i * s * 0.1, s * 0.06], [i * s * 0.1 + s * 0.03, -s * 0.02]]);
    ctx.fill();
  }
  ctx.fillStyle = '#c04a3e';
  circle(ctx, -s * 0.16, -s * 0.1, s * 0.035, '#c04a3e');
  circle(ctx, s * 0.16, -s * 0.1, s * 0.035, '#c04a3e');
}

function drawPentagram(ctx, s) {
  ctx.strokeStyle = '#8a3a3a';
  ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    const x = Math.cos(a) * s * 0.42, y = Math.sin(a) * s * 0.42;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(200,90,60,0.5)';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    circle(ctx, Math.cos(a) * s * 0.42, Math.sin(a) * s * 0.42, s * 0.04, 'rgba(200,90,60,0.5)');
  }
}

function drawTortureRack(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.2, -s * 0.4, s * 0.4, s * 0.8, WOOD_D);
  circle(ctx, 0, -s * 0.32, s * 0.06, WOOD);
  circle(ctx, 0, s * 0.32, s * 0.06, WOOD);
  ctx.strokeStyle = '#8a8578';
  ctx.lineWidth = s * 0.03;
  ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.26); ctx.lineTo(-s * 0.1, s * 0.26); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.1, -s * 0.26); ctx.lineTo(s * 0.1, s * 0.26); ctx.stroke();
}

function drawIronMaiden(ctx, s) {
  ink(ctx, s, 0.05);
  ctx.beginPath();
  ctx.moveTo(-s * 0.18, s * 0.35);
  ctx.lineTo(-s * 0.18, -s * 0.1);
  ctx.quadraticCurveTo(-s * 0.18, -s * 0.38, 0, -s * 0.42);
  ctx.quadraticCurveTo(s * 0.18, -s * 0.38, s * 0.18, -s * 0.1);
  ctx.lineTo(s * 0.18, s * 0.35);
  ctx.closePath();
  fillStroke(ctx, '#4a4640');
  ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.lineTo(0, s * 0.35); ctx.stroke();
  ctx.fillStyle = '#8a8578';
  circle(ctx, 0, -s * 0.2, s * 0.05, '#8a8578');
}

function drawFeastTable(ctx, s) {
  ink(ctx, s, 0.045);
  rect(ctx, -s * 0.45, -s * 0.16, s * 0.9, s * 0.32, WOOD);
  ctx.fillStyle = '#c8a850';
  circle(ctx, -s * 0.25, 0, s * 0.07, '#c8a850');
  ctx.fillStyle = '#a34a3a';
  circle(ctx, 0, -s * 0.04, s * 0.06, '#a34a3a');
  ctx.fillStyle = '#d8cdb4';
  circle(ctx, s * 0.22, s * 0.02, s * 0.055, '#d8cdb4');
  ctx.fillStyle = STONE;
  circle(ctx, s * 0.38, -s * 0.06, s * 0.035, STONE);
}

function drawKegStack(ctx, s) {
  ink(ctx, s, 0.05);
  circle(ctx, -s * 0.16, s * 0.12, s * 0.16, WOOD);
  circle(ctx, s * 0.16, s * 0.12, s * 0.16, WOOD);
  circle(ctx, 0, -s * 0.14, s * 0.16, '#9c7d4e');
  for (const [x, y] of [[-0.16, 0.12], [0.16, 0.12], [0, -0.14]]) {
    circle(ctx, s * x, s * y, s * 0.05, WOOD_D);
  }
}

function drawScrollDesk(ctx, s) {
  ink(ctx, s, 0.05);
  rect(ctx, -s * 0.34, -s * 0.2, s * 0.68, s * 0.4, WOOD_D);
  rect(ctx, -s * 0.22, -s * 0.1, s * 0.3, s * 0.2, '#e2d5b4');
  ctx.strokeStyle = '#8a7a5c';
  ctx.lineWidth = s * 0.02;
  for (const y of [-0.04, 0.01, 0.06]) {
    ctx.beginPath(); ctx.moveTo(-s * 0.18, s * y); ctx.lineTo(s * 0.02, s * y); ctx.stroke();
  }
  ctx.fillStyle = FIRE;
  circle(ctx, s * 0.24, -s * 0.08, s * 0.035, FIRE);
}

function drawPedestal(ctx, s) {
  ink(ctx, s, 0.05);
  circle(ctx, 0, 0, s * 0.22, STONE_D);
  circle(ctx, 0, 0, s * 0.14, STONE);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.12);
  grad.addColorStop(0, 'rgba(140,200,240,0.95)');
  grad.addColorStop(1, 'rgba(140,200,240,0.15)');
  ctx.fillStyle = grad;
  circle(ctx, 0, 0, s * 0.1, null);
  ctx.fill();
}

function drawCandles(ctx, s) {
  for (const [x, y, h] of [[-0.15, 0.1, 0.3], [0.05, 0.16, 0.22], [0.18, 0.02, 0.26], [-0.02, -0.08, 0.18]]) {
    ink(ctx, s, 0.035);
    rect(ctx, s * x - s * 0.035, s * y - s * h, s * 0.07, s * h, '#e2d5b4');
    ctx.fillStyle = FIRE;
    circle(ctx, s * x, s * y - s * h - s * 0.04, s * 0.035, FIRE);
  }
}

/* ---------- dungeon extras III ---------- */

function drawMushrooms(ctx, s) {
  const shroom = (x, y, k, col) => {
    ink(ctx, s, 0.04);
    rect(ctx, x - k * 0.12, y - k * 0.3, k * 0.24, k * 0.32, '#d8cdb4');
    ctx.beginPath();
    ctx.arc(x, y - k * 0.28, k * 0.34, Math.PI, 0);
    ctx.closePath();
    fillStroke(ctx, col);
    ctx.fillStyle = 'rgba(240,235,220,0.8)';
    circle(ctx, x - k * 0.12, y - k * 0.38, k * 0.05, 'rgba(240,235,220,0.8)');
  };
  shroom(-s * 0.18, s * 0.3, s * 0.5, '#8a4a5c');
  shroom(s * 0.16, s * 0.32, s * 0.66, '#6d5f7d');
  shroom(s * 0.02, s * 0.34, s * 0.3, '#8a6b42');
}

function drawStalagmites(ctx, s) {
  ink(ctx, s, 0.045);
  const spike = (x, h, w) => {
    poly(ctx, [[x - w, s * 0.35], [x - w * 0.2, s * 0.35 - h], [x + w * 0.15, s * 0.35]]);
    fillStroke(ctx, STONE_D);
  };
  spike(-s * 0.2, s * 0.5, s * 0.14);
  spike(s * 0.12, s * 0.64, s * 0.16);
  spike(s * 0.3, s * 0.3, s * 0.1);
  spike(-s * 0.02, s * 0.32, s * 0.09);
}

function drawBloodstain(ctx, s) {
  ctx.fillStyle = 'rgba(122,32,28,0.65)';
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, 0);
  ctx.quadraticCurveTo(-s * 0.25, -s * 0.25, 0, -s * 0.2);
  ctx.quadraticCurveTo(s * 0.32, -s * 0.16, s * 0.26, s * 0.08);
  ctx.quadraticCurveTo(s * 0.18, s * 0.26, -s * 0.06, s * 0.2);
  ctx.quadraticCurveTo(-s * 0.32, s * 0.14, -s * 0.3, 0);
  ctx.closePath();
  ctx.fill();
  circle(ctx, s * 0.32, s * 0.2, s * 0.05, 'rgba(122,32,28,0.65)');
  circle(ctx, s * 0.4, s * 0.05, s * 0.03, 'rgba(122,32,28,0.6)');
  circle(ctx, -s * 0.36, s * 0.22, s * 0.04, 'rgba(122,32,28,0.55)');
}

function drawSlime(ctx, s) {
  ctx.fillStyle = 'rgba(110,160,60,0.7)';
  ctx.strokeStyle = 'rgba(70,110,35,0.8)';
  ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 0.1);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.28, 0, -s * 0.24);
  ctx.quadraticCurveTo(s * 0.32, -s * 0.2, s * 0.28, s * 0.1);
  ctx.quadraticCurveTo(s * 0.1, s * 0.24, -s * 0.3, s * 0.1);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(200,230,150,0.8)';
  circle(ctx, -s * 0.08, -s * 0.08, s * 0.05, 'rgba(200,230,150,0.8)');
  circle(ctx, s * 0.1, -s * 0.02, s * 0.03, 'rgba(200,230,150,0.7)');
}

function drawEggClutch(ctx, s) {
  ink(ctx, s, 0.04);
  ctx.fillStyle = 'rgba(90,80,60,0.5)';
  ctx.beginPath(); ctx.ellipse(0, s * 0.15, s * 0.4, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  for (const [x, y, k] of [[-0.16, 0.05, 0.14], [0.1, 0.02, 0.16], [0.02, 0.2, 0.12], [-0.05, -0.12, 0.11], [0.25, 0.18, 0.1]]) {
    ctx.beginPath();
    ctx.ellipse(s * x, s * y, s * k * 0.8, s * k, 0, 0, Math.PI * 2);
    fillStroke(ctx, '#c8bfa0');
  }
}

function drawTombstone(ctx, s) {
  ink(ctx, s, 0.05);
  ctx.beginPath();
  ctx.moveTo(-s * 0.16, s * 0.32);
  ctx.lineTo(-s * 0.16, -s * 0.12);
  ctx.arc(0, -s * 0.12, s * 0.16, Math.PI, 0);
  ctx.lineTo(s * 0.16, s * 0.32);
  ctx.closePath();
  fillStroke(ctx, STONE);
  ctx.strokeStyle = STONE_D;
  ctx.lineWidth = s * 0.03;
  ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.1); ctx.lineTo(s * 0.08, -s * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.08, 0); ctx.lineTo(s * 0.06, 0); ctx.stroke();
  ctx.fillStyle = GREEN_D;
  ctx.beginPath(); ctx.ellipse(0, s * 0.34, s * 0.24, s * 0.06, 0, 0, Math.PI * 2); ctx.fill();
}

function drawPortalCircle(ctx, s) {
  ctx.strokeStyle = '#7ac8b0';
  ctx.lineWidth = Math.max(1, s * 0.04);
  ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([s * 0.06, s * 0.05]);
  ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.24);
  grad.addColorStop(0, 'rgba(122,200,176,0.8)');
  grad.addColorStop(1, 'rgba(122,200,176,0)');
  ctx.fillStyle = grad;
  circle(ctx, 0, 0, s * 0.24, null);
  ctx.fill();
  ctx.fillStyle = '#7ac8b0';
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    circle(ctx, Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4, s * 0.035, '#7ac8b0');
  }
}

/* ---------- registry ---------- */

export const STAMPS = [
  // world / region nature
  { id: 'mountain', name: 'Mountain', group: 'Terrain', cats: ['world', 'region'], draw: drawMountain },
  { id: 'mountains', name: 'Mountain Range', group: 'Terrain', cats: ['world', 'region'], draw: drawMountains },
  { id: 'hills', name: 'Hills', group: 'Terrain', cats: ['world', 'region'], draw: drawHills },
  { id: 'volcano', name: 'Volcano', group: 'Terrain', cats: ['world', 'region'], draw: drawVolcano },
  { id: 'pine', name: 'Pine Tree', group: 'Terrain', cats: ['world', 'region'], draw: drawPine },
  { id: 'oak', name: 'Oak Tree', group: 'Terrain', cats: ['world', 'region'], draw: drawOak },
  { id: 'forest', name: 'Forest', group: 'Terrain', cats: ['world', 'region'], draw: drawForest },
  { id: 'palm', name: 'Palm', group: 'Terrain', cats: ['world', 'region'], draw: drawPalm },
  { id: 'swamp', name: 'Swamp', group: 'Terrain', cats: ['world', 'region'], draw: drawSwamp },
  { id: 'dunes', name: 'Dunes', group: 'Terrain', cats: ['world', 'region'], draw: drawDunes },
  { id: 'snowpine', name: 'Taiga Pine', group: 'Terrain', cats: ['world', 'region'], draw: drawSnowPine },
  { id: 'jungletree', name: 'Jungle Tree', group: 'Terrain', cats: ['world', 'region'], draw: drawJungleTree },
  { id: 'cactus', name: 'Cactus', group: 'Terrain', cats: ['world', 'region'], draw: drawCactus },
  { id: 'iceberg', name: 'Iceberg', group: 'Terrain', cats: ['world', 'region'], draw: drawIceberg },
  { id: 'waterfall', name: 'Waterfall', group: 'Terrain', cats: ['world', 'region'], draw: drawWaterfall },
  { id: 'geyser', name: 'Geyser', group: 'Terrain', cats: ['world', 'region'], draw: drawGeyser },
  { id: 'oasis', name: 'Oasis', group: 'Terrain', cats: ['world', 'region'], draw: drawOasis },
  { id: 'icespikes', name: 'Ice Spikes', group: 'Terrain', cats: ['world', 'region'], draw: drawIceSpikes },
  { id: 'whirlpool', name: 'Whirlpool', group: 'Terrain', cats: ['world', 'region'], draw: drawWhirlpool },
  { id: 'crater', name: 'Crater', group: 'Terrain', cats: ['world', 'region'], draw: drawCrater },
  // world / region settlements
  { id: 'castle', name: 'Castle', group: 'Settlements', cats: ['world', 'region'], draw: drawCastle },
  { id: 'city', name: 'City', group: 'Settlements', cats: ['world', 'region'], draw: drawCity },
  { id: 'village', name: 'Village', group: 'Settlements', cats: ['world', 'region'], draw: drawVillage },
  { id: 'tower', name: 'Tower', group: 'Settlements', cats: ['world', 'region'], draw: drawTower },
  { id: 'temple', name: 'Temple', group: 'Settlements', cats: ['world', 'region'], draw: drawTemple },
  { id: 'ruins', name: 'Ruins', group: 'Settlements', cats: ['world', 'region'], draw: drawRuins },
  { id: 'mine', name: 'Mine', group: 'Settlements', cats: ['world', 'region'], draw: drawMine },
  { id: 'port', name: 'Port', group: 'Settlements', cats: ['world', 'region'], draw: drawAnchor },
  { id: 'bridge', name: 'Bridge', group: 'Settlements', cats: ['world', 'region', 'town'], draw: drawBridge },
  { id: 'windmill', name: 'Windmill', group: 'Settlements', cats: ['world', 'region', 'town'], draw: drawWindmill },
  { id: 'lighthouse', name: 'Lighthouse', group: 'Settlements', cats: ['world', 'region', 'town'], draw: drawLighthouse },
  { id: 'monastery', name: 'Monastery', group: 'Settlements', cats: ['world', 'region'], draw: drawMonastery },
  { id: 'wizardtower', name: 'Wizard Tower', group: 'Settlements', cats: ['world', 'region'], draw: drawWizardTower },
  { id: 'watchtower', name: 'Watchtower', group: 'Settlements', cats: ['world', 'region', 'town'], draw: drawWatchtower },
  { id: 'lumbercamp', name: 'Lumber Camp', group: 'Settlements', cats: ['world', 'region'], draw: drawLumberCamp },
  { id: 'vineyard', name: 'Vineyard', group: 'Settlements', cats: ['world', 'region', 'town'], draw: drawVineyard },
  // world markers
  { id: 'camp', name: 'Camp', group: 'Markers', cats: ['world', 'region'], draw: drawCamp },
  { id: 'cave', name: 'Cave', group: 'Markers', cats: ['world', 'region'], draw: drawCave },
  { id: 'skull', name: 'Danger', group: 'Markers', cats: ['world', 'region', 'dungeon'], draw: drawSkull },
  { id: 'battle', name: 'Battlefield', group: 'Markers', cats: ['world', 'region'], draw: drawBattle },
  { id: 'stones', name: 'Standing Stones', group: 'Markers', cats: ['world', 'region'], draw: drawStones },
  { id: 'treasure', name: 'Treasure', group: 'Markers', cats: ['world', 'region', 'dungeon'], draw: drawTreasure },
  { id: 'ship', name: 'Ship', group: 'Markers', cats: ['world', 'region', 'town'], draw: drawShip },
  { id: 'seaserpent', name: 'Sea Serpent', group: 'Markers', cats: ['world', 'region'], draw: drawSeaSerpent },
  { id: 'graveyard', name: 'Graveyard', group: 'Markers', cats: ['world', 'region', 'town'], draw: drawGraveyard },
  { id: 'obelisk', name: 'Obelisk', group: 'Markers', cats: ['world', 'region', 'town', 'dungeon'], draw: drawObelisk },
  { id: 'portalarch', name: 'Ancient Portal', group: 'Markers', cats: ['world', 'region', 'dungeon'], draw: drawPortalArch },
  { id: 'tentcamp', name: 'War Camp', group: 'Markers', cats: ['world', 'region'], draw: drawTentCamp },
  { id: 'banner', name: 'Banner', group: 'Markers', cats: ['world', 'region', 'town', 'dungeon'], draw: drawBanner },
  { id: 'shipwreck', name: 'Shipwreck', group: 'Markers', cats: ['world', 'region'], draw: drawShipwreck },
  { id: 'kraken', name: 'Kraken', group: 'Markers', cats: ['world', 'region'], draw: drawKraken },
  { id: 'dragonskel', name: 'Dragon Bones', group: 'Markers', cats: ['world', 'region', 'dungeon'], draw: drawDragonSkel },
  // map dressing, available everywhere
  { id: 'compassrose', name: 'Compass Rose', group: 'Map Dressing', cats: ['world', 'region', 'town', 'dungeon'], draw: drawCompassRose },
  { id: 'scalebar', name: 'Scale Bar', group: 'Map Dressing', cats: ['world', 'region', 'town', 'dungeon'], draw: drawScaleBar },
  { id: 'cartouche', name: 'Title Cartouche', group: 'Map Dressing', cats: ['world', 'region', 'town', 'dungeon'], draw: drawCartouche },
  { id: 'flourish', name: 'Flourish', group: 'Map Dressing', cats: ['world', 'region', 'town', 'dungeon'], draw: drawFlourish },
  // town
  { id: 'house', name: 'House', group: 'Buildings', cats: ['town'], draw: drawHouseTD },
  { id: 'house2', name: 'L-House', group: 'Buildings', cats: ['town'], draw: drawHouseTD2 },
  { id: 'longhouse', name: 'Longhouse', group: 'Buildings', cats: ['town'], draw: drawLonghouse },
  { id: 'roundtower', name: 'Round Tower', group: 'Buildings', cats: ['town'], draw: drawRoundTower },
  { id: 'towntemple', name: 'Temple', group: 'Buildings', cats: ['town'], draw: drawTownTemple },
  { id: 'market', name: 'Market', group: 'Buildings', cats: ['town'], draw: drawMarket },
  { id: 'inn', name: 'Inn / Tavern', group: 'Buildings', cats: ['town'], draw: drawInn },
  { id: 'smithy', name: 'Smithy', group: 'Buildings', cats: ['town'], draw: drawSmithy },
  { id: 'stable', name: 'Stable', group: 'Buildings', cats: ['town'], draw: drawStable },
  { id: 'gatehouse', name: 'Gatehouse', group: 'Buildings', cats: ['town'], draw: drawGatehouse },
  { id: 'well', name: 'Well', group: 'Town Extras', cats: ['town'], draw: drawWell },
  { id: 'fountain', name: 'Fountain', group: 'Town Extras', cats: ['town', 'dungeon'], draw: drawFountain },
  { id: 'treetd', name: 'Tree', group: 'Town Extras', cats: ['town'], draw: drawTreeTD },
  { id: 'dock', name: 'Dock', group: 'Town Extras', cats: ['town'], draw: drawDock },
  { id: 'cart', name: 'Cart', group: 'Town Extras', cats: ['town'], draw: drawCart },
  { id: 'fieldplot', name: 'Field', group: 'Town Extras', cats: ['town'], draw: drawField },
  { id: 'hedge', name: 'Hedge', group: 'Town Extras', cats: ['town'], draw: drawHedge },
  { id: 'barn', name: 'Barn', group: 'Buildings', cats: ['town'], draw: drawBarn },
  { id: 'guardpost', name: 'Guard Post', group: 'Buildings', cats: ['town'], draw: drawGuardpost },
  { id: 'shrine', name: 'Shrine', group: 'Buildings', cats: ['town'], draw: drawShrine },
  { id: 'gallows', name: 'Gallows', group: 'Town Extras', cats: ['town'], draw: drawGallows },
  { id: 'stocks', name: 'Stocks', group: 'Town Extras', cats: ['town'], draw: drawStocks },
  { id: 'signpost', name: 'Signpost', group: 'Town Extras', cats: ['town', 'world', 'region'], draw: drawSignpost },
  { id: 'animalpen', name: 'Animal Pen', group: 'Town Extras', cats: ['town'], draw: drawAnimalPen },
  { id: 'pond', name: 'Pond', group: 'Town Extras', cats: ['town'], draw: drawPond },
  { id: 'woodbridge', name: 'Wood Bridge', group: 'Town Extras', cats: ['town', 'dungeon'], draw: drawWoodBridge },
  // dungeon
  { id: 'table', name: 'Table', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawTable },
  { id: 'chest', name: 'Chest', group: 'Furniture', cats: ['dungeon'], draw: drawChest },
  { id: 'barrel', name: 'Barrel', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawBarrel },
  { id: 'crate', name: 'Crate', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawCrate },
  { id: 'altar', name: 'Altar', group: 'Furniture', cats: ['dungeon'], draw: drawAltar },
  { id: 'statue', name: 'Statue', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawStatue },
  { id: 'pillar', name: 'Pillar', group: 'Furniture', cats: ['dungeon'], draw: drawPillar },
  { id: 'bed', name: 'Bed', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawBed },
  { id: 'bookshelf', name: 'Bookshelf', group: 'Furniture', cats: ['dungeon'], draw: drawBookshelf },
  { id: 'throne', name: 'Throne', group: 'Furniture', cats: ['dungeon'], draw: drawThrone },
  { id: 'chair', name: 'Chair', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawChair },
  { id: 'bench', name: 'Bench', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawBench },
  { id: 'rug', name: 'Rug / Carpet', group: 'Furniture', cats: ['dungeon'], draw: drawRug },
  { id: 'forge', name: 'Forge & Anvil', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawForge },
  { id: 'cauldron', name: 'Cauldron', group: 'Furniture', cats: ['dungeon'], draw: drawCauldron },
  { id: 'sarcophagus', name: 'Sarcophagus', group: 'Furniture', cats: ['dungeon'], draw: drawSarcophagus },
  { id: 'cage', name: 'Cage', group: 'Furniture', cats: ['dungeon'], draw: drawCage },
  { id: 'rack', name: 'Weapon Rack', group: 'Furniture', cats: ['dungeon'], draw: drawRack },
  { id: 'lever', name: 'Lever', group: 'Furniture', cats: ['dungeon'], draw: drawLever },
  { id: 'mimic', name: 'Mimic', group: 'Furniture', cats: ['dungeon'], draw: drawMimic },
  { id: 'pentagram', name: 'Summoning Circle', group: 'Furniture', cats: ['dungeon'], draw: drawPentagram },
  { id: 'torturerack', name: 'Torture Rack', group: 'Furniture', cats: ['dungeon'], draw: drawTortureRack },
  { id: 'ironmaiden', name: 'Iron Maiden', group: 'Furniture', cats: ['dungeon'], draw: drawIronMaiden },
  { id: 'feasttable', name: 'Feast Table', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawFeastTable },
  { id: 'kegstack', name: 'Keg Stack', group: 'Furniture', cats: ['dungeon', 'town'], draw: drawKegStack },
  { id: 'scrolldesk', name: 'Scroll Desk', group: 'Furniture', cats: ['dungeon'], draw: drawScrollDesk },
  { id: 'pedestal', name: 'Orb Pedestal', group: 'Furniture', cats: ['dungeon'], draw: drawPedestal },
  { id: 'candles', name: 'Candles', group: 'Furniture', cats: ['dungeon'], draw: drawCandles },
  { id: 'torch', name: 'Torch', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawTorch },
  { id: 'brazier', name: 'Brazier', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawBrazier },
  { id: 'trap', name: 'Spike Trap', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawTrap },
  { id: 'rubble', name: 'Rubble', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawRubble },
  { id: 'bones', name: 'Bones', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawBones },
  { id: 'stairsup', name: 'Stairs Up', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawStairsUp },
  { id: 'stairsdown', name: 'Stairs Down', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawStairsDown },
  { id: 'ladder', name: 'Ladder', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawLadder },
  { id: 'web', name: 'Spider Web', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawWeb },
  { id: 'crystals', name: 'Crystals', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawCrystals },
  { id: 'campfire', name: 'Campfire', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawCampfire },
  { id: 'mushrooms', name: 'Mushrooms', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawMushrooms },
  { id: 'stalagmites', name: 'Stalagmites', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawStalagmites },
  { id: 'bloodstain', name: 'Bloodstain', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawBloodstain },
  { id: 'slime', name: 'Slime', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawSlime },
  { id: 'eggclutch', name: 'Egg Clutch', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawEggClutch },
  { id: 'tombstone', name: 'Tombstone', group: 'Dungeon Extras', cats: ['dungeon', 'town'], draw: drawTombstone },
  { id: 'portalcircle', name: 'Portal Circle', group: 'Dungeon Extras', cats: ['dungeon'], draw: drawPortalCircle }
];

const byId = new Map(STAMPS.map((st) => [st.id, st]));

export function getStamp(id) { return byId.get(id); }

/* ---------------- custom (imported PNG) stamps ---------------- */

let customList = [];
const customImages = new Map(); // id -> HTMLImageElement

export function setCustomStamps(list) {
  customList = list || [];
  customImages.clear();
  for (const cs of customList) {
    const img = new Image();
    img.src = cs.dataURL;
    customImages.set(cs.id, img);
  }
}

export function getCustomStamps() { return customList; }

export function stampsForMapType(type) {
  return STAMPS.filter((st) => st.cats.includes(type));
}

function tintFilter(obj) {
  const hue = obj.hue || 0;
  const sat = obj.sat == null ? 100 : obj.sat;
  const bri = obj.bri == null ? 100 : obj.bri;
  if (!hue && sat === 100 && bri === 100) return null;
  return `hue-rotate(${hue}deg) saturate(${sat}%) brightness(${bri}%)`;
}

/* Draw a placed stamp object onto the map. */
export function drawStampObject(ctx, obj) {
  ctx.save();
  ctx.translate(obj.x, obj.y);
  ctx.rotate(((obj.rot || 0) * Math.PI) / 180);
  if (obj.flip) ctx.scale(-1, 1);
  const f = tintFilter(obj);
  if (f) ctx.filter = f;
  const s = obj.size || 48;
  if (obj.stamp.startsWith('custom:')) {
    const img = customImages.get(obj.stamp.slice(7));
    if (img && img.complete && img.naturalWidth) {
      const ar = img.naturalWidth / img.naturalHeight;
      const w = ar >= 1 ? s : s * ar;
      const h = ar >= 1 ? s / ar : s;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    }
  } else {
    const st = byId.get(obj.stamp);
    if (st) st.draw(ctx, s);
  }
  ctx.restore();
}

/* Render a thumbnail canvas for palettes. */
export function stampThumb(id, px = 44) {
  const c = document.createElement('canvas');
  c.width = px * 2; c.height = px * 2;
  const ctx = c.getContext('2d');
  ctx.translate(px, px);
  if (String(id).startsWith('custom:')) {
    const img = customImages.get(String(id).slice(7));
    const drawIt = () => {
      const ar = img.naturalWidth / img.naturalHeight || 1;
      const s = px * 1.7;
      const w = ar >= 1 ? s : s * ar;
      const h = ar >= 1 ? s / ar : s;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    };
    if (img) { if (img.complete && img.naturalWidth) drawIt(); else img.addEventListener('load', drawIt); }
  } else {
    const st = byId.get(id);
    if (st) st.draw(ctx, px * 1.5);
  }
  return c;
}
