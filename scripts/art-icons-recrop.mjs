#!/usr/bin/env node
/**
 * Przekrawa ikony zadań z art-sheets/icons.png:
 * - overlap między komórkami (ikony wystają poza siatkę),
 * - wybór komponentu najbliżej środka komórki (bez „duchów” sąsiadów),
 * - większy margines w kwadracie 128.
 *
 * Użycie: node scripts/art-icons-recrop.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'art-sheets', 'icons.png');
const OUT = path.join(root, 'public', 'art', 'icons');
const SIZE = 128;
const COLS = 6;
const ROWS = 5;
const MARGIN_RATIO = 0.14;
const OVERLAP_X = 0.2;
const OVERLAP_Y = 0.1;
const BG = { r: 232, g: 232, b: 236 };
const TOLERANCE = 28;

const NAMES = [
  'bed',
  'clothes',
  'shirt',
  'cereal',
  'milk',
  'toothbrush',
  'hairbrush',
  'soap',
  'toilet',
  'backpack',
  'lunchbox',
  'notebook',
  'book',
  'shoes',
  'jacket',
  'cap',
  'bottle',
  'dogbowl',
  'plant',
  'toys',
  'dishes',
  'panda',
  'curtains',
  'panda-smile',
  'panda-wink',
  'panda-happy',
  'dishes-clean',
  'curtains-closed',
  'keys',
  'clock',
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
    [Math.floor(width / 2), height - 1],
    [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)],
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

/** @returns {{ id: number, area: number, cx: number, cy: number, minX: number, minY: number, maxX: number, maxY: number }[]} */
function connectedComponents(data, width, height) {
  const label = new Int32Array(width * height);
  /** @type {{ id: number, area: number, sumX: number, sumY: number, minX: number, minY: number, maxX: number, maxY: number }[]} */
  const comps = [];
  let nextId = 1;
  const stack = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (label[p] || data[idx(x, y, width) + 3] < 16) continue;
      const id = nextId++;
      let area = 0;
      let sumX = 0;
      let sumY = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      stack.push([x, y]);
      label[p] = id;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        area += 1;
        sumX += cx;
        sumY += cy;
        if (cx < minX) minX = cx;
        if (cy < minY) minY = cy;
        if (cx > maxX) maxX = cx;
        if (cy > maxY) maxY = cy;
        for (const [nx, ny] of [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1],
        ]) {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const np = ny * width + nx;
          if (label[np] || data[idx(nx, ny, width) + 3] < 16) continue;
          label[np] = id;
          stack.push([nx, ny]);
        }
      }
      comps.push({
        id,
        area,
        sumX,
        sumY,
        minX,
        minY,
        maxX,
        maxY,
        cx: sumX / area,
        cy: sumY / area,
      });
    }
  }
  return { comps, label };
}

async function fitSquare(pngBuffer, size) {
  const meta = await sharp(pngBuffer).metadata();
  const tw = meta.width ?? size;
  const th = meta.height ?? size;
  const margin = Math.round(size * MARGIN_RATIO);
  const inner = size - margin * 2;
  const scale = Math.min(inner / Math.max(tw, 1), inner / Math.max(th, 1));
  const nw = Math.max(1, Math.round(tw * scale));
  const nh = Math.max(1, Math.round(th * scale));
  const left = Math.round((size - nw) / 2);
  const top = Math.round((size - nh) / 2);
  const resized = await sharp(pngBuffer).resize(nw, nh).png().toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Brak arkusza:', SRC);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const img = sharp(SRC);
  const meta = await img.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  let saved = 0;

  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    if (row >= ROWS) break;

    const cellLeft = Math.round((col * w) / COLS);
    const cellTop = Math.round((row * h) / ROWS);
    const cellRight = Math.round(((col + 1) * w) / COLS);
    const cellBottom = Math.round(((row + 1) * h) / ROWS);
    const cw = cellRight - cellLeft;
    const ch = cellBottom - cellTop;
    const ox = Math.round(cw * OVERLAP_X);
    const oy = Math.round(ch * OVERLAP_Y);

    const left = Math.max(0, cellLeft - ox);
    const top = Math.max(0, cellTop - oy);
    const right = Math.min(w, cellRight + ox);
    const bottom = Math.min(h, cellBottom + oy);
    const rw = right - left;
    const rh = bottom - top;

    const { data, info } = await img
      .clone()
      .extract({ left, top, width: rw, height: rh })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixels = new Uint8ClampedArray(data);
    floodClear(pixels, info.width, info.height);

    const { comps, label } = connectedComponents(pixels, info.width, info.height);
    if (comps.length === 0) {
      console.warn('pusty:', name);
      continue;
    }

    // Środek nominalnej komórki w układzie wyciętego overlapu
    const targetCx = cellLeft + cw / 2 - left;
    const targetCy = cellTop + ch / 2 - top;
    const minArea = Math.max(80, Math.round(cw * ch * 0.01));
    const candidates = comps.filter((c) => c.area >= minArea);
    const pool = candidates.length > 0 ? candidates : comps;
    pool.sort((a, b) => {
      const da = (a.cx - targetCx) ** 2 + (a.cy - targetCy) ** 2;
      const db = (b.cx - targetCx) ** 2 + (b.cy - targetCy) ** 2;
      if (da !== db) return da - db;
      return b.area - a.area;
    });
    const best = pool[0];
    if (!best) continue;

    const pad = 2;
    const minX = Math.max(0, best.minX - pad);
    const minY = Math.max(0, best.minY - pad);
    const maxX = Math.min(info.width - 1, best.maxX + pad);
    const maxY = Math.min(info.height - 1, best.maxY + pad);
    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;
    const cropped = Buffer.alloc(bw * bh * 4);
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const sx = minX + x;
        const sy = minY + y;
        const si = idx(sx, sy, info.width);
        const di = idx(x, y, bw);
        if (label[sy * info.width + sx] === best.id) {
          cropped[di] = pixels[si];
          cropped[di + 1] = pixels[si + 1];
          cropped[di + 2] = pixels[si + 2];
          cropped[di + 3] = pixels[si + 3];
        }
      }
    }

    const png = await sharp(cropped, {
      raw: { width: bw, height: bh, channels: 4 },
    })
      .png()
      .toBuffer();
    const fitted = await fitSquare(png, SIZE);
    fs.writeFileSync(path.join(OUT, `task-${name}.png`), fitted);
    saved += 1;
    console.log(`✓ task-${name}.png (${best.area}px)`);
  }

  console.log(`Gotowe: ${saved}/${NAMES.length} → ${path.relative(root, OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
