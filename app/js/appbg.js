/* Subtle cartographic background texture behind the app UI —
   contour lines, a faint graticule, mountain glyphs and a compass rose. */

export function applyGeoBackground() {
  const W = 1920, H = 1200;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#141210';
  ctx.fillRect(0, 0, W, H);

  // faint curved graticule (lat/long lines)
  ctx.strokeStyle = 'rgba(232,221,200,0.035)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 110) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 16, H / 2, x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 110) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(W / 2, y + 14, W, y);
    ctx.stroke();
  }

  // topographic contour clusters
  for (let i = 0; i < 10; i++) {
    const cx = Math.random() * W, cy = Math.random() * H;
    const base = 26 + Math.random() * 60;
    const segs = 14;
    const wob = [];
    for (let k = 0; k < segs; k++) wob.push(0.7 + Math.random() * 0.6);
    const rings = 3 + Math.floor(Math.random() * 3);
    for (let ring = 1; ring <= rings; ring++) {
      ctx.strokeStyle = `rgba(201,151,63,${(0.045 + 0.015 * (rings - ring)).toFixed(3)})`;
      ctx.beginPath();
      for (let k = 0; k <= segs; k++) {
        const a = (k / segs) * Math.PI * 2;
        const r = base * ring * 0.55 * wob[k % segs];
        const x = cx + Math.cos(a) * r * 1.3;
        const y = cy + Math.sin(a) * r;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  // dotted sea routes
  ctx.setLineDash([2, 9]);
  ctx.strokeStyle = 'rgba(232,221,200,0.05)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * W, Math.random() * H);
    ctx.quadraticCurveTo(Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // scattered mountain glyphs
  ctx.strokeStyle = 'rgba(201,151,63,0.06)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 16; i++) {
    const x = Math.random() * W, y = Math.random() * H, s = 8 + Math.random() * 13;
    ctx.beginPath();
    ctx.moveTo(x - s, y + s * 0.6);
    ctx.lineTo(x, y - s * 0.6);
    ctx.lineTo(x + s, y + s * 0.6);
    ctx.stroke();
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(x + s * 0.5, y);
      ctx.lineTo(x + s * 1.3, y - s * 0.4);
      ctx.lineTo(x + s * 2.1, y + s * 0.6);
      ctx.stroke();
    }
  }

  drawCompass(ctx, W - 170, H - 170, 95, 0.09);

  document.body.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center';
  document.body.style.backgroundAttachment = 'fixed';
}

function drawCompass(ctx, x, y, r, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = `rgba(201,151,63,${alpha})`;
  ctx.fillStyle = `rgba(201,151,63,${alpha})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const len = i % 2 === 0 ? r : r * 0.55;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a - 0.07) * r * 0.16, Math.sin(a - 0.07) * r * 0.16);
    ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
    ctx.lineTo(Math.cos(a + 0.07) * r * 0.16, Math.sin(a + 0.07) * r * 0.16);
    ctx.closePath();
    if (i % 2 === 0) ctx.fill(); else ctx.stroke();
  }
  ctx.font = `${Math.round(r * 0.24)}px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.fillText('N', 0, -r - 8);
  ctx.restore();
}
