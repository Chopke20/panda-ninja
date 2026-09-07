#!/usr/bin/env node
/**
 * Maski koloru kimona i opaski — liczone Z RYSUNKU body, bez AI.
 *
 * Dlaczego: warstwy mask/shade z generatora były progowaniem po całym kadrze
 * (szum w tle, maska opaski na oczach). Grafika jest cel-shade z czystym
 * konturem, więc region da się wziąć flood fillem od kilku ziaren.
 *
 * Wynik (nadpisuje stare pliki):
 *   <body>/kimono/mask|shade/<pose>.png
 *   <body>/headband/mask|shade/<pose>.png
 *
 * mask  = alfa regionu (CSS mask-image pod płaski kolor)
 * shade = szarość znormalizowanej luminancji regionu (CSS multiply — fałdy)
 *
 * Użycie: npm run art:masks
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = process.env.PANDA_ROOT
  ? path.resolve(process.env.PANDA_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v2Root = path.join(root, 'public', 'art', 'panda-v2');
const cfg = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'panda-anchors.json'), 'utf8'),
);

const ROBE_TOL = 44;
const ROBE_MIN_LUMA = 26;
const ROBE_MAX_LUMA = 150;
const BAND_MIN_LUMA = 196;
const BAND_MAX_SAT = 26;
const BAND_MIN_AREA = 150;
const BAND_MIN_ASPECT = 1.6;
/** Shade nie gasi koloru do czerni — 0.30 to najciemniejsza fałda. */
const SHADE_FLOOR = 0.3;

function luma(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Kotwice/ziarna z round → dane body (agile jest węższy). */
function mapX(x, sx) {
  return 50 + (x - 50) * sx;
}

async function loadRgba(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function bfs(ok, seeds, w, h) {
  const out = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  for (const [sx, sy] of seeds) {
    const i = sy * w + sx;
    if (ok[i] && !out[i]) {
      out[i] = 1;
      queue[tail++] = i;
    }
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % w;
    const y = (i / w) | 0;
    if (x > 0 && ok[i - 1] && !out[i - 1]) (out[i - 1] = 1), (queue[tail++] = i - 1);
    if (x < w - 1 && ok[i + 1] && !out[i + 1]) (out[i + 1] = 1), (queue[tail++] = i + 1);
    if (y > 0 && ok[i - w] && !out[i - w]) (out[i - w] = 1), (queue[tail++] = i - w);
    if (y < h - 1 && ok[i + w] && !out[i + w]) (out[i + w] = 1), (queue[tail++] = i + w);
  }
  return out;
}

function robeMask({ data, w, h }, seedsPct, sx) {
  const seeds = seedsPct.map(([px, py]) => [
    Math.min(w - 1, Math.round((mapX(px, sx) / 100) * w)),
    Math.min(h - 1, Math.round((py / 100) * h)),
  ]);
  const ok = new Uint8Array(w * h);
  const refs = seeds.map(([x, y]) => {
    const o = (y * w + x) * 4;
    return [data[o], data[o + 1], data[o + 2]];
  });
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (data[o + 3] < 128) continue;
    const L = luma(data[o], data[o + 1], data[o + 2]);
    if (L <= ROBE_MIN_LUMA || L >= ROBE_MAX_LUMA) continue;
    for (const [r, g, b] of refs) {
      if (
        Math.abs(data[o] - r) + Math.abs(data[o + 1] - g) + Math.abs(data[o + 2] - b) <
        ROBE_TOL * 3
      ) {
        ok[i] = 1;
        break;
      }
    }
  }
  return bfs(ok, seeds, w, h);
}

/** Biały pasek opaski: jasne komponenty w boxie, tylko szerokie i płaskie. */
function bandMask({ data, w, h }, boxPct, sx) {
  const [bx0, by0, bx1, by1] = boxPct;
  const x0 = Math.round((mapX(bx0, sx) / 100) * w);
  const x1 = Math.round((mapX(bx1, sx) / 100) * w);
  const y0 = Math.round((by0 / 100) * h);
  const y1 = Math.round((by1 / 100) * h);
  const ok = new Uint8Array(w * h);
  for (let y = Math.max(0, y0); y < Math.min(h, y1); y++) {
    for (let x = Math.max(0, x0); x < Math.min(w, x1); x++) {
      const i = y * w + x;
      const o = i * 4;
      if (data[o + 3] < 128) continue;
      const mx = Math.max(data[o], data[o + 1], data[o + 2]);
      const mn = Math.min(data[o], data[o + 1], data[o + 2]);
      if (luma(data[o], data[o + 1], data[o + 2]) > BAND_MIN_LUMA && mx - mn < BAND_MAX_SAT) {
        ok[i] = 1;
      }
    }
  }
  const out = new Uint8Array(w * h);
  const seen = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!ok[i] || seen[i]) continue;
    const comp = bfs(ok, [[i % w, (i / w) | 0]], w, h);
    let area = 0;
    let minx = w;
    let maxx = -1;
    let miny = h;
    let maxy = -1;
    for (let j = 0; j < w * h; j++) {
      if (!comp[j]) continue;
      seen[j] = 1;
      area++;
      const x = j % w;
      const y = (j / w) | 0;
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
    }
    if (area < BAND_MIN_AREA) continue;
    if ((maxx - minx + 1) / (maxy - miny + 1) < BAND_MIN_ASPECT) continue;
    for (let j = 0; j < w * h; j++) if (comp[j]) out[j] = 1;
  }
  return out;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const s = Float64Array.from(values).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))];
}

async function writePair({ data, w, h }, mask, dirMask, dirShade, pose) {
  const lumas = [];
  for (let i = 0; i < w * h; i++) if (mask[i]) lumas.push(luma(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]));
  const lo = percentile(lumas, 4);
  const hi = Math.max(lo + 1, percentile(lumas, 92));

  const maskBuf = Buffer.alloc(w * h * 4);
  const shadeBuf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (!mask[i]) continue;
    const o = i * 4;
    maskBuf[o] = 255;
    maskBuf[o + 1] = 255;
    maskBuf[o + 2] = 255;
    maskBuf[o + 3] = 255;
    const L = luma(data[o], data[o + 1], data[o + 2]);
    const n = Math.min(1.25, Math.max(0, (L - lo) / (hi - lo)));
    const g = Math.round(255 * Math.min(1, SHADE_FLOOR + (1 - SHADE_FLOOR) * n));
    shadeBuf[o] = g;
    shadeBuf[o + 1] = g;
    shadeBuf[o + 2] = g;
    shadeBuf[o + 3] = 255;
  }
  fs.mkdirSync(dirMask, { recursive: true });
  fs.mkdirSync(dirShade, { recursive: true });
  await sharp(maskBuf, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(path.join(dirMask, `${pose}.png`));
  await sharp(shadeBuf, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(path.join(dirShade, `${pose}.png`));
}

async function main() {
  const report = {};
  for (const [bodyId, tf] of Object.entries(cfg.bodies)) {
    const bodyRoot = path.join(v2Root, bodyId);
    if (!fs.existsSync(bodyRoot)) continue;
    report[bodyId] = {};
    for (const pose of cfg.poses) {
      const src = path.join(bodyRoot, 'body', `${pose}.png`);
      if (!fs.existsSync(src)) {
        console.warn(`  brak body: ${bodyId}/${pose}`);
        continue;
      }
      const img = await loadRgba(src);
      const robe = robeMask(img, cfg.masks[pose].robe, tf.sx);
      const band = bandMask(img, cfg.masks[pose].bandBox, tf.sx);
      const robePx = robe.reduce((a, b) => a + b, 0);
      const bandPx = band.reduce((a, b) => a + b, 0);
      await writePair(
        img,
        robe,
        path.join(bodyRoot, 'kimono', 'mask'),
        path.join(bodyRoot, 'kimono', 'shade'),
        pose,
      );
      await writePair(
        img,
        band,
        path.join(bodyRoot, 'headband', 'mask'),
        path.join(bodyRoot, 'headband', 'shade'),
        pose,
      );
      report[bodyId][pose] = { kimonoPx: robePx, headbandPx: bandPx };
      const warn = robePx < 8000 ? '  ⚠ mała maska kimona' : '';
      console.log(`  ${bodyId}/${pose}: kimono ${robePx}px, opaska ${bandPx}px${warn}`);
    }
  }
  fs.writeFileSync(
    path.join(v2Root, 'masks.json'),
    `${JSON.stringify({ builtAt: new Date().toISOString(), report }, null, 2)}\n`,
    'utf8',
  );
  console.log('maski gotowe → public/art/panda-v2/masks.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
