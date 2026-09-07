#!/usr/bin/env node
/**
 * Krojenie zaakceptowanych draftów ewolucji (2×2) → public/art/evo.
 *
 *   node scripts/art-evo-slice.mjs
 *
 * Wejście: art-qa/evo-drafts/evo-{round|agile}-0N-*.png
 * Wyjście: public/art/evo/{body}/{01..06}/{pose}.webp (+ .png zapas)
 *
 * Kolejność poz w arkuszu: TL sleeping, TR training, BL hurry, BR celebrating.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = process.env.PANDA_ROOT
  ? path.resolve(process.env.PANDA_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const draftsDir = path.join(root, 'art-qa', 'evo-drafts');
const outRoot = path.join(root, 'public', 'art', 'evo');
const SIZE = 512;
const WEB_QUALITY = 84;
const BG = { r: 232, g: 232, b: 236 };
const TOLERANCE = 42;

const POSES = ['sleeping', 'training', 'hurry', 'celebrating'];

const SHEETS = [
  { body: 'round', stage: '01', file: 'evo-round-01-novice.png' },
  { body: 'round', stage: '02', file: 'evo-round-02-student.png' },
  { body: 'round', stage: '03', file: 'evo-round-03-warrior.png' },
  { body: 'round', stage: '04', file: 'evo-round-04-guard.png' },
  { body: 'round', stage: '05', file: 'evo-round-05-master.png' },
  { body: 'round', stage: '06', file: 'evo-round-06-legend.png' },
  { body: 'agile', stage: '01', file: 'evo-agile-01-novice.png' },
  { body: 'agile', stage: '02', file: 'evo-agile-02-student.png' },
  { body: 'agile', stage: '03', file: 'evo-agile-03-warrior.png' },
  { body: 'agile', stage: '04', file: 'evo-agile-04-guard.png' },
  { body: 'agile', stage: '05', file: 'evo-agile-05-master.png' },
  { body: 'agile', stage: '06', file: 'evo-agile-06-legend.png' },
];

function idx(x, y, w) {
  return (y * w + x) * 4;
}

function dist(a, b) {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
}

function floodClear(data, width, height) {
  const seen = new Uint8Array(width * height);
  const queue = [];
  const seeds = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
    [Math.floor(width / 2), 0],
    [0, Math.floor(height / 2)],
  ];
  for (const [sx, sy] of seeds) {
    const i = idx(sx, sy, width);
    const seed = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (dist(seed, BG) > TOLERANCE * 2) continue;
    queue.push([sx, sy]);
  }
  while (queue.length) {
    const [x, y] = queue.pop();
    const p = y * width + x;
    if (seen[p]) continue;
    seen[p] = 1;
    const i = idx(x, y, width);
    const px = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (dist(px, BG) > TOLERANCE) continue;
    data[i + 3] = 0;
    if (x > 0) queue.push([x - 1, y]);
    if (x < width - 1) queue.push([x + 1, y]);
    if (y > 0) queue.push([x, y - 1]);
    if (y < height - 1) queue.push([x, y + 1]);
  }
}

function boundingBox(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[idx(x, y, width) + 3] < 8) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function extractCell(raw, left, top, cw, ch) {
  const { data, info } = await sharp(raw)
    .extract({ left, top, width: cw, height: ch })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = new Uint8ClampedArray(data);
  floodClear(pixels, info.width, info.height);
  return { pixels, width: info.width, height: info.height };
}

async function cellToPng(pixels, width, height) {
  const box = boundingBox(pixels, width, height);
  if (!box) return null;
  const pad = 4;
  const minX = Math.max(0, box.minX - pad);
  const minY = Math.max(0, box.minY - pad);
  const maxX = Math.min(width - 1, box.minX + box.w - 1 + pad);
  const maxY = Math.min(height - 1, box.minY + box.h - 1 + pad);
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const cropped = Buffer.alloc(bw * bh * 4);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const si = idx(minX + x, minY + y, width);
      const di = idx(x, y, bw);
      cropped[di] = pixels[si];
      cropped[di + 1] = pixels[si + 1];
      cropped[di + 2] = pixels[si + 2];
      cropped[di + 3] = pixels[si + 3];
    }
  }
  const croppedPng = await sharp(cropped, { raw: { width: bw, height: bh, channels: 4 } })
    .png()
    .toBuffer();

  // Wspólna skala do kwadratu 512, wyrównanie do dołu.
  const meta = await sharp(croppedPng).metadata();
  const mw = meta.width ?? 1;
  const mh = meta.height ?? 1;
  const margin = Math.round(SIZE * 0.04);
  const inner = SIZE - margin * 2;
  const scale = Math.min(inner / mw, inner / mh);
  const rw = Math.max(1, Math.round(mw * scale));
  const rh = Math.max(1, Math.round(mh * scale));
  const left = Math.round((SIZE - rw) / 2);
  const top = SIZE - margin - rh;

  return sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(croppedPng).resize(rw, rh, { fit: 'fill' }).png().toBuffer(),
        left,
        top,
      },
    ])
    .png()
    .toBuffer();
}

async function sliceSheet(sheet) {
  const src = path.join(draftsDir, sheet.file);
  if (!fs.existsSync(src)) {
    console.warn('Brak draftu:', sheet.file);
    return 0;
  }
  const img = sharp(src);
  const meta = await img.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 10 || h < 10) throw new Error(`Pusty arkusz ${sheet.file}`);

  const outDir = path.join(outRoot, sheet.body, sheet.stage);
  fs.mkdirSync(outDir, { recursive: true });

  let saved = 0;
  for (let i = 0; i < POSES.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const left = Math.round((col * w) / 2);
    const top = Math.round((row * h) / 2);
    const right = Math.round(((col + 1) * w) / 2);
    const bottom = Math.round(((row + 1) * h) / 2);
    const cell = await extractCell(
      await img.clone().toBuffer(),
      left,
      top,
      right - left,
      bottom - top,
    );
    const png = await cellToPng(cell.pixels, cell.width, cell.height);
    if (!png) {
      console.warn(`Pusta komórka ${sheet.file} ${POSES[i]}`);
      continue;
    }
    const pose = POSES[i];
    const pngPath = path.join(outDir, `${pose}.png`);
    const webpPath = path.join(outDir, `${pose}.webp`);
    fs.writeFileSync(pngPath, png);
    await sharp(png).webp({ quality: WEB_QUALITY, alphaQuality: 92 }).toFile(webpPath);
    saved += 1;
  }
  console.log(`${sheet.body}/${sheet.stage}: ${saved}/4`);
  return saved;
}

async function main() {
  let total = 0;
  for (const sheet of SHEETS) {
    total += await sliceSheet(sheet);
  }
  console.log(`Gotowe: ${total} sprite’ów w public/art/evo`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
