#!/usr/bin/env node
/**
 * Przycięcie warstw do bbox + normalizacja osi broni + rozbicie dłoni na pięści.
 *
 * Dlaczego: generator rysuje każdy przedmiot na pełną klatkę 512×512 (ładny
 * close-up). Composer stackował to 1:1, więc pięść wielkości tułowia lądowała
 * na pandzie. Po przycięciu przedmiot ma własne proporcje i sadza go kotwica
 * z src/data/panda-anchors.json — bez ControlNet i bez regeneracji grafiki.
 *
 * Robi:
 *  1. bbox alfy → ciasny PNG (mniejsze pliki, iPad wdzięczny)
 *  2. bronie z normalizeAxis → obrót osi głównej do poziomu (rotację ustawia
 *     potem kotwica pozy, nie przypadkowy kadr z generatora)
 *  3. hands/<grip>/<pose>.png → <pose>-l.png, <pose>-r.png, <pose>-solo.png
 *
 * Idempotentny: plik już ciasny (bbox == cała klatka) jest pomijany.
 *
 * Użycie: npm run art:anchor
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

/** Warstwy sadzane kotwicą. Reszta (body, maski, wzory, sklep) zostaje 512. */
const TRIM_DIRS = ['hands', 'weapons', 'gadgets', 'logos', 'auras'];
const ALPHA_MIN = 40;
const SPLIT_MIN_SHARE = 0.08;
const SPLIT_SUFFIX = /-(l|r|solo)\.png$/i;

async function loadRgba(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function bbox({ data, w, h }) {
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_MIN) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** Kąt osi głównej plamy alfy (stopnie, y w dół). */
function principalAngle({ data, w, h }) {
  let n = 0;
  let sx = 0;
  let sy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_MIN) {
        n++;
        sx += x;
        sy += y;
      }
    }
  }
  if (n < 20) return 0;
  const mx = sx / n;
  const my = sy / n;
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_MIN) {
        const dx = x - mx;
        const dy = y - my;
        xx += dx * dx;
        yy += dy * dy;
        xy += dx * dy;
      }
    }
  }
  const theta = 0.5 * Math.atan2(2 * xy, xx - yy);
  return (theta * 180) / Math.PI;
}

function components({ data, w, h }) {
  const ok = new Uint8Array(w * h);
  let total = 0;
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] > ALPHA_MIN) {
      ok[i] = 1;
      total++;
    }
  }
  const seen = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  const out = [];
  for (let s = 0; s < w * h; s++) {
    if (!ok[s] || seen[s]) continue;
    let head = 0;
    let tail = 0;
    seen[s] = 1;
    queue[tail++] = s;
    let area = 0;
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    let sumx = 0;
    while (head < tail) {
      const i = queue[head++];
      const x = i % w;
      const y = (i / w) | 0;
      area++;
      sumx += x;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && ok[i - 1] && !seen[i - 1]) (seen[i - 1] = 1), (queue[tail++] = i - 1);
      if (x < w - 1 && ok[i + 1] && !seen[i + 1]) (seen[i + 1] = 1), (queue[tail++] = i + 1);
      if (y > 0 && ok[i - w] && !seen[i - w]) (seen[i - w] = 1), (queue[tail++] = i - w);
      if (y < h - 1 && ok[i + w] && !seen[i + w]) (seen[i + w] = 1), (queue[tail++] = i + w);
    }
    out.push({
      area,
      cx: sumx / area,
      box: { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 },
    });
  }
  return { comps: out, total };
}

function assetKeyOf(rel) {
  const parts = rel.split(path.sep);
  // <body>/<kind>/<key>/<pose>.png  albo  <body>/logos/<key>.png
  if (parts[1] === 'logos') return path.basename(parts[2], '.png');
  return parts[2] ?? '';
}

async function processFile(full, rel, report) {
  const img = await loadRgba(full);
  const box = bbox(img);
  if (!box) {
    report.empty.push(rel);
    return;
  }
  if (box.left === 0 && box.top === 0 && box.width === img.w && box.height === img.h) {
    report.skipped.push(rel);
    return;
  }
  const key = assetKeyOf(rel);
  const item = cfg.items[key] ?? {};
  let pipeline = sharp(full).ensureAlpha();
  if (item.normalizeAxis) {
    const angle = principalAngle(img);
    if (Math.abs(angle) > 1.5) {
      pipeline = sharp(
        await sharp(full)
          .ensureAlpha()
          .rotate(-angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer(),
      );
      report.rotated[rel] = Math.round(angle * 10) / 10;
    }
  }
  const buf = await pipeline.png().toBuffer();
  const img2 = await loadRgba(buf);
  const box2 = bbox(img2) ?? box;
  await sharp(buf).extract(box2).png().toFile(full);
  report.trimmed[rel] = { w: box2.width, h: box2.height };
}

/** Najwęższe cięcie w środkowej części plamy — talia między dwiema pięściami. */
function narrowestCut({ data, w, h }, box, vertical) {
  const from = vertical ? box.top : box.left;
  const size = vertical ? box.height : box.width;
  const lo = from + Math.round(size * 0.3);
  const hi = from + Math.round(size * 0.7);
  let best = -1;
  let bestCount = Infinity;
  for (let k = lo; k <= hi; k++) {
    let count = 0;
    if (vertical) {
      for (let x = box.left; x < box.left + box.width; x++) {
        if (data[(k * w + x) * 4 + 3] > ALPHA_MIN) count++;
      }
    } else {
      for (let y = box.top; y < box.top + box.height; y++) {
        if (data[(y * w + k) * 4 + 3] > ALPHA_MIN) count++;
      }
    }
    if (count < bestCount) {
      bestCount = count;
      best = k;
    }
  }
  return best;
}

/**
 * hands/<grip>/<pose>.png → pięść lewa / prawa / największa.
 * Arkusz staff ma obie pięści zlepione w jedną plamę, więc gdy komponent jest
 * tylko jeden, tniemy go w najwęższym miejscu zamiast dublować całą parę.
 */
async function splitHands(full, rel, report) {
  const img = await loadRgba(full);
  const { comps, total } = components(img);
  let big = comps.filter((c) => c.area >= total * SPLIT_MIN_SHARE).sort((a, b) => a.cx - b.cx);
  if (big.length === 1) {
    const box = big[0].box;
    const vertical = box.height >= box.width;
    const cut = narrowestCut(img, box, vertical);
    if (cut > 0) {
      const a = vertical
        ? { left: box.left, top: box.top, width: box.width, height: cut - box.top }
        : { left: box.left, top: box.top, width: cut - box.left, height: box.height };
      const b = vertical
        ? { left: box.left, top: cut, width: box.width, height: box.top + box.height - cut }
        : { left: cut, top: box.top, width: box.left + box.width - cut, height: box.height };
      if (a.width > 4 && a.height > 4 && b.width > 4 && b.height > 4) {
        big = [
          { area: a.width * a.height, cx: a.left + a.width / 2, box: a },
          { area: b.width * b.height, cx: b.left + b.width / 2, box: b },
        ];
        report.cut.push(rel);
      }
    }
  }
  if (big.length === 0) return;
  const solo = [...big].sort((a, b) => b.area - a.area)[0];
  const left = big[0];
  const right = big[big.length - 1];
  const base = full.replace(/\.png$/i, '');
  const write = async (box, suffix) => {
    const buf = await sharp(full).extract(box).png().toBuffer();
    const piece = await loadRgba(buf);
    const tight = bbox(piece);
    await sharp(buf)
      .extract(tight ?? { left: 0, top: 0, width: piece.w, height: piece.h })
      .png()
      .toFile(`${base}${suffix}.png`);
  };
  await write(left.box, '-l');
  await write(right.box, '-r');
  await write(solo.box, '-solo');
  report.hands[rel] = { pieces: big.length };
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith('.png') && !name.startsWith('.')) acc.push(full);
  }
  return acc;
}

async function main() {
  const report = { trimmed: {}, rotated: {}, hands: {}, cut: [], skipped: [], empty: [] };
  for (const bodyId of Object.keys(cfg.bodies)) {
    const bodyRoot = path.join(v2Root, bodyId);
    if (!fs.existsSync(bodyRoot)) continue;
    for (const kind of TRIM_DIRS) {
      const dir = path.join(bodyRoot, kind);
      for (const full of walk(dir)) {
        const rel = path.relative(v2Root, full);
        if (SPLIT_SUFFIX.test(full)) continue;
        if (kind === 'hands') await splitHands(full, rel, report);
        await processFile(full, rel, report);
        if (kind === 'hands') {
          for (const suffix of ['-l', '-r', '-solo']) {
            const sub = full.replace(/\.png$/i, `${suffix}.png`);
            if (fs.existsSync(sub)) {
              const si = await loadRgba(sub);
              report.trimmed[path.relative(v2Root, sub)] = { w: si.w, h: si.h };
            }
          }
        }
      }
    }
  }
  fs.writeFileSync(
    path.join(v2Root, 'trim.json'),
    `${JSON.stringify({ builtAt: new Date().toISOString(), ...report }, null, 2)}\n`,
    'utf8',
  );
  console.log(
    `anchor: przycięte ${Object.keys(report.trimmed).length}, ` +
      `obrócone ${Object.keys(report.rotated).length}, ` +
      `dłonie ${Object.keys(report.hands).length}, pominięte ${report.skipped.length}`,
  );
  if (report.empty.length) console.warn(`  puste warstwy: ${report.empty.join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
