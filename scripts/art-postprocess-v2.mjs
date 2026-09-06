#!/usr/bin/env node
/**
 * Tnie arkusze masek z ciasnym kluczem koloru (#F2F2F2 ± few),
 * bo biały siluet nie może wpaść w tolerance 18 jak zwykłe sprite'y.
 * Dodatkowo: shade/gadżety − body.
 *
 * Użycie: node scripts/art-postprocess-v2.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const round = path.join(root, 'public', 'art', 'panda-v2', 'round');
const poses = ['sleeping', 'training', 'hurry', 'celebrating'];
const BG = { r: 0xf2, g: 0xf2, b: 0xf2 };
/** Ciasny próg — biały (#FFF) zostaje, #F2F2F2 znika. */
const MASK_TOL = 6;

function idx(x, y, w) {
  return (y * w + x) * 4;
}

function dist(a, b) {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
}

async function loadRgba(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data: new Uint8ClampedArray(data), width: info.width, height: info.height };
}

async function saveRgba(file, data, width, height) {
  await sharp(Buffer.from(data), { raw: { width, height, channels: 4 } })
    .png()
    .toFile(file);
}

/**
 * Wycinanie 2×2 z arkusza maski → 512 PNG (biała alfa, align bottom jak body).
 */
async function sliceMaskSheet(srcRel, outDir) {
  const src = path.join(root, srcRel);
  if (!fs.existsSync(src)) {
    console.warn(`brak: ${srcRel}`);
    return;
  }
  fs.mkdirSync(outDir, { recursive: true });
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const cols = 2;
  const rows = 2;
  const size = 512;
  const pad = Math.round(size * 0.06);
  const inner = size - pad * 2;

  /** @type {{ name: string, buf: Buffer, bw: number, bh: number }[]} */
  const cells = [];

  for (let i = 0; i < poses.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = Math.round((col * W) / cols);
    const top = Math.round((row * H) / rows);
    const right = Math.round(((col + 1) * W) / cols);
    const bottom = Math.round(((row + 1) * H) / rows);
    const cw = right - left;
    const ch = bottom - top;

    let minX = cw;
    let minY = ch;
    let maxX = 0;
    let maxY = 0;
    const cell = new Uint8ClampedArray(cw * ch * 4);

    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const si = idx(left + x, top + y, W);
        const di = idx(x, y, cw);
        const px = { r: data[si], g: data[si + 1], b: data[si + 2] };
        const lum = (px.r + px.g + px.b) / 3;
        // tylko jasna biel kimona — szare zaślepki głowy/rąk odrzucamy
        const keep = dist(px, BG) > MASK_TOL && lum >= 235 && dist(px, { r: 255, g: 255, b: 255 }) <= 30;
        if (keep) {
          cell[di] = 255;
          cell[di + 1] = 255;
          cell[di + 2] = 255;
          cell[di + 3] = 255;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        } else {
          cell[di + 3] = 0;
        }
      }
    }

    if (maxX < minX) {
      console.warn(`  pusta komórka: ${poses[i]}`);
      continue;
    }
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const cropped = Buffer.alloc(bw * bh * 4);
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const si = idx(minX + x, minY + y, cw);
        const di = idx(x, y, bw);
        cropped[di] = cell[si];
        cropped[di + 1] = cell[si + 1];
        cropped[di + 2] = cell[si + 2];
        cropped[di + 3] = cell[si + 3];
      }
    }
    const png = await sharp(cropped, { raw: { width: bw, height: bh, channels: 4 } })
      .png()
      .toBuffer();
    cells.push({ name: poses[i], buf: png, bw, bh });
  }

  let sharedScale = Infinity;
  for (const c of cells) {
    sharedScale = Math.min(sharedScale, inner / c.bw, inner / c.bh);
  }

  for (const c of cells) {
    const tw = Math.max(1, Math.round(c.bw * sharedScale));
    const th = Math.max(1, Math.round(c.bh * sharedScale));
    const resized = await sharp(c.buf)
      .resize(tw, th, { fit: 'fill', kernel: 'lanczos3' })
      .ensureAlpha()
      .png()
      .toBuffer();
    const left = Math.round((size - tw) / 2);
    const top = size - pad - th;
    const out = await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: resized, left, top }])
      .png()
      .toBuffer();
    // Ponownie wymuś czystą biel (lanczos miesza z alfą)
    const { data: od, info: oi } = await sharp(out).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let p = 0; p < od.length; p += 4) {
      if (od[p + 3] < 24) {
        od[p + 3] = 0;
        continue;
      }
      od[p] = 255;
      od[p + 1] = 255;
      od[p + 2] = 255;
      od[p + 3] = 255;
    }
    await saveRgba(path.join(outDir, `${c.name}.png`), od, oi.width, oi.height);
    // usuń szum tła: zostaw tylko duże składowe
    await dropSpeckles(path.join(outDir, `${c.name}.png`), 80);
    console.log(`  mask ${path.basename(outDir)}/${c.name}.png`);
  }
}

/** Usuwa małe białe plamki (szum z arkusza). */
async function dropSpeckles(file, minSize) {
  const { data, width, height } = await loadRgba(file);
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x;
      if (seen[start]) continue;
      const i0 = start * 4;
      if (data[i0 + 3] < 24) {
        seen[start] = 1;
        continue;
      }
      let qh = 0;
      let qt = 0;
      queue[qt++] = start;
      seen[start] = 1;
      const comp = [];
      while (qh < qt) {
        const p = queue[qh++];
        comp.push(p);
        const px = p % width;
        const py = (p / width) | 0;
        for (const [ox, oy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const nx = px + ox;
          const ny = py + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const np = ny * width + nx;
          if (seen[np]) continue;
          const ni = np * 4;
          if (data[ni + 3] < 24) {
            seen[np] = 1;
            continue;
          }
          seen[np] = 1;
          queue[qt++] = np;
        }
      }
      if (comp.length < minSize) {
        for (const p of comp) {
          const i = p * 4;
          data[i + 3] = 0;
        }
      }
    }
  }
  await saveRgba(file, data, width, height);
}

async function subtractBody(layerFile, bodyFile, similarity = 42, keepOnlyDarker = false) {
  const layer = await loadRgba(layerFile);
  const body = await loadRgba(bodyFile);
  if (layer.width !== body.width || layer.height !== body.height) {
    console.warn(`  pomijam (rozmiar): ${path.relative(root, layerFile)}`);
    return;
  }
  const { data: L, width, height } = layer;
  const B = body.data;
  let kept = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y, width);
      if (L[i + 3] < 16) {
        L[i + 3] = 0;
        continue;
      }
      const lp = { r: L[i], g: L[i + 1], b: L[i + 2] };
      const ba = B[i + 3];
      if (ba < 16) {
        kept++;
        continue;
      }
      const bp = { r: B[i], g: B[i + 1], b: B[i + 2] };
      const d = dist(lp, bp);
      const layerLum = (lp.r + lp.g + lp.b) / 3;
      const bodyLum = (bp.r + bp.g + bp.b) / 3;
      if (keepOnlyDarker) {
        if (layerLum >= bodyLum - 8 || d < similarity * 0.5) {
          L[i + 3] = 0;
          continue;
        }
        L[i + 3] = Math.min(L[i + 3], 140);
        kept++;
        continue;
      }
      if (d < similarity) {
        L[i + 3] = 0;
        continue;
      }
      kept++;
    }
  }
  await saveRgba(layerFile, L, width, height);
  console.log(`  ${path.relative(root, layerFile)} — ~${kept} px`);
}

/**
 * Maskę opaski: wąski pasek w poziomie w strefie czoła (bez oczu / uszu).
 * Heurystyka względem bbox futra body.
 */
async function deriveHeadbandMasksFromBody() {
  const outDir = path.join(round, 'headband', 'mask');
  fs.mkdirSync(outDir, { recursive: true });
  for (const pose of poses) {
    const bodyFile = path.join(round, 'body', `${pose}.png`);
    const { data, width, height } = await loadRgba(bodyFile);
    let minY = height;
    let maxY = 0;
    let minX = width;
    let maxX = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = idx(x, y, width);
        if (data[i + 3] < 200) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const bh = Math.max(1, maxY - minY);
    const bw = Math.max(1, maxX - minX);
    // czoło: ~12–28% wysokości sylwetki od góry
    const y0 = minY + Math.round(bh * 0.12);
    const y1 = minY + Math.round(bh * 0.28);
    const x0 = minX + Math.round(bw * 0.18);
    const x1 = minX + Math.round(bw * 0.82);

    const out = new Uint8ClampedArray(width * height * 4);
    let kept = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = idx(x, y, width);
        if (data[i + 3] < 200) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = (r + g + b) / 3;
        // opaska + płytka: średni/ciemny szary, nie czarne łatki oczu, nie białe futro
        if (lum < 35 || lum > 170) continue;
        if (Math.abs(r - g) > 30 || Math.abs(g - b) > 30) continue;
        out[i] = 255;
        out[i + 1] = 255;
        out[i + 2] = 255;
        out[i + 3] = 255;
        kept++;
      }
    }
    await saveRgba(path.join(outDir, `${pose}.png`), out, width, height);
    console.log(`  headband/mask/${pose}.png — ${kept} px`);
  }
}

async function main() {
  console.log('Maski kimona (ciasny klucz z arkusza)...');
  await sliceMaskSheet(
    'art-sheets/panda-v2-kimono-mask.png',
    path.join(round, 'kimono', 'mask'),
  );
  console.log('Maski opaski (z body)...');
  await deriveHeadbandMasksFromBody();

  const onlyMasks = process.argv.includes('--masks-only');
  if (onlyMasks) {
    console.log('Gotowe (--masks-only).');
    return;
  }

  console.log('Shade − body...');
  for (const pose of poses) {
    const body = path.join(round, 'body', `${pose}.png`);
    const k = path.join(round, 'kimono', 'shade', `${pose}.png`);
    const h = path.join(round, 'headband', 'shade', `${pose}.png`);
    if (fs.existsSync(k)) await subtractBody(k, body, 36, true);
    if (fs.existsSync(h)) await subtractBody(h, body, 36, true);
  }

  console.log('Gadżety − body (jeśli jeszcze pełne)...');
  for (const gadget of [
    'pack',
    'glasses',
    'cape',
    'talisman',
    'bottle',
    'pouch',
    'scarf',
    'mask',
    'dragon-pack',
  ]) {
    for (const pose of poses) {
      const f = path.join(round, 'gadgets', gadget, `${pose}.png`);
      if (!fs.existsSync(f)) continue;
      await subtractBody(f, path.join(round, 'body', `${pose}.png`), 38, false);
    }
  }

  console.log('Aury − body...');
  for (const aura of ['leaves', 'cloud', 'sparks']) {
    for (const pose of poses) {
      const f = path.join(round, 'auras', aura, `${pose}.png`);
      if (!fs.existsSync(f)) continue;
      await subtractBody(f, path.join(round, 'body', `${pose}.png`), 38, false);
    }
  }

  console.log('Gotowe.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
