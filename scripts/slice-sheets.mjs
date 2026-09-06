#!/usr/bin/env node
/**
 * Tnie arkusze Gemini na osobne PNG z przezroczystym tłem.
 * Użycie: npm run art
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, 'scripts', 'sheets.config.json');

/** @typedef {{ r: number, g: number, b: number, a: number }} Pixel */

/**
 * @typedef {object} Sheet
 * @property {string} src
 * @property {number} cols
 * @property {number} rows
 * @property {string} out
 * @property {number} size
 * @property {'bottom' | 'center'} align
 * @property {string} [prefix]
 * @property {string[]} names
 * @property {boolean} [lockFrame] — bez crop do bbox (paper-doll: wspólna siatka)
 */

/**
 * @typedef {object} Config
 * @property {string} bgColor
 * @property {number} tolerance
 * @property {Sheet[]} sheets
 */

const config = /** @type {Config} */ (JSON.parse(fs.readFileSync(configPath, 'utf8')));

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

const bg = hexToRgb(config.bgColor);
const tolerance = config.tolerance;

function dist(a, b) {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
}

function idx(x, y, w) {
  return (y * w + x) * 4;
}

function floodClear(data, width, height) {
  const seen = new Uint8Array(width * height);
  const queue = [];

  const seeds = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  for (const [sx, sy] of seeds) {
    const i = idx(sx, sy, width);
    const seed = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (dist(seed, bg) > tolerance * 2) continue;
    queue.push([sx, sy]);
  }

  while (queue.length) {
    const [x, y] = queue.pop();
    const p = y * width + x;
    if (seen[p]) continue;
    seen[p] = 1;
    const i = idx(x, y, width);
    const px = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (dist(px, bg) > tolerance) continue;
    data[i + 3] = 0;
    if (x > 0) queue.push([x - 1, y]);
    if (x < width - 1) queue.push([x + 1, y]);
    if (y > 0) queue.push([x, y - 1]);
    if (y < height - 1) queue.push([x, y + 1]);
  }
}

function featherAlpha(data, width, height) {
  const copy = new Uint8ClampedArray(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y, width);
      let sum = 0;
      let n = 0;
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = x + ox;
          const ny = y + oy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          sum += copy[idx(nx, ny, width) + 3];
          n++;
        }
      }
      data[i + 3] = Math.round(sum / n);
    }
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
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function extractCell(img, left, top, width, height) {
  const { data, info } = await img
    .clone()
    .extract({ left, top, width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = new Uint8ClampedArray(data);
  floodClear(pixels, info.width, info.height);
  featherAlpha(pixels, info.width, info.height);
  const box = boundingBox(pixels, info.width, info.height);
  return { pixels, width: info.width, height: info.height, box };
}

async function pixelsToPng(pixels, width, height) {
  return sharp(Buffer.from(pixels), {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function fitSquare(pngBuffer, size, align, sharedScale, sharedHeight) {
  const meta = await sharp(pngBuffer).metadata();
  const tw = meta.width ?? size;
  const th = meta.height ?? size;
  const margin = Math.round(size * 0.06);
  const inner = size - margin * 2;
  const scale =
    sharedScale ??
    Math.min(inner / Math.max(tw, 1), inner / Math.max(th, 1));
  const nw = Math.max(1, Math.round(tw * scale));
  const nh = Math.max(1, Math.round(th * scale));
  const left = Math.round((size - nw) / 2);
  let top;
  if (align === 'bottom') {
    const ground = size - margin;
    const tall = Math.round((sharedHeight ?? th) * scale);
    top = ground - tall + (tall - nh);
  } else {
    top = Math.round((size - nh) / 2);
  }

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

async function sliceSheet(sheet) {
  const src = path.join(root, sheet.src);
  if (!fs.existsSync(src)) {
    console.warn(`⚠  pomijam brakujący arkusz: ${sheet.src}`);
    return { saved: 0, warnings: [] };
  }

  fs.mkdirSync(path.join(root, sheet.out), { recursive: true });
  const img = sharp(src);
  const meta = await img.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const names = sheet.names;
  const prefix = sheet.prefix ?? '';
  const warnings = [];
  let saved = 0;
  const lockFrame = sheet.lockFrame === true;

  /** @type {Array<{ name: string, png: Buffer, boxH: number, cellH: number }>} */
  const cells = [];

  for (let i = 0; i < names.length; i++) {
    const col = i % sheet.cols;
    const row = Math.floor(i / sheet.cols);
    if (row >= sheet.rows) break;
    const left = Math.round((col * w) / sheet.cols);
    const top = Math.round((row * h) / sheet.rows);
    const right = Math.round(((col + 1) * w) / sheet.cols);
    const bottom = Math.round(((row + 1) * h) / sheet.rows);
    const cw = right - left;
    const ch = bottom - top;
    const cell = await extractCell(img, left, top, cw, ch);
    if (!cell.box) {
      warnings.push(`${names[i]}: pusta komórka`);
      continue;
    }
    const ratio = cell.box.h / ch;
    if (!lockFrame && ratio < 0.2) {
      warnings.push(
        `${names[i]}: podejrzanie mała po przycięciu (${Math.round(ratio * 100)}% wysokości komórki)`,
      );
    }

    let png;
    let boxH;
    if (lockFrame) {
      // Pełna komórka — dłonie/broń zostają w tej samej siatce co body.
      png = await pixelsToPng(cell.pixels, cell.width, cell.height);
      boxH = ch;
    } else {
      const cropped = Buffer.alloc(cell.box.w * cell.box.h * 4);
      for (let y = 0; y < cell.box.h; y++) {
        for (let x = 0; x < cell.box.w; x++) {
          const si = idx(cell.box.minX + x, cell.box.minY + y, cell.width);
          const di = idx(x, y, cell.box.w);
          cropped[di] = cell.pixels[si];
          cropped[di + 1] = cell.pixels[si + 1];
          cropped[di + 2] = cell.pixels[si + 2];
          cropped[di + 3] = cell.pixels[si + 3];
        }
      }
      png = await pixelsToPng(cropped, cell.box.w, cell.box.h);
      boxH = cell.box.h;
    }
    cells.push({ name: names[i], png, boxH, cellH: ch });
  }

  if (lockFrame) {
    for (const cell of cells) {
      const fitted = await sharp(cell.png)
        .resize(sheet.size, sheet.size, { fit: 'fill', kernel: 'lanczos3' })
        .png()
        .toBuffer();
      const dest = path.join(root, sheet.out, `${prefix}${cell.name}.png`);
      fs.writeFileSync(dest, fitted);
      saved += 1;
    }
    return { saved, warnings, out: sheet.out };
  }

  const maxH = Math.max(...cells.map((c) => c.boxH), 1);

  let sharedScale;
  if (sheet.align === 'bottom') {
    const metas = await Promise.all(cells.map((c) => sharp(c.png).metadata()));
    const inner = sheet.size - Math.round(sheet.size * 0.06) * 2;
    let s = Infinity;
    for (const m of metas) {
      s = Math.min(s, inner / Math.max(m.width ?? 1, 1), inner / Math.max(m.height ?? 1, 1));
    }
    sharedScale = s;
  }

  for (const cell of cells) {
    const fitted = await fitSquare(cell.png, sheet.size, sheet.align, sharedScale, maxH);
    const dest = path.join(root, sheet.out, `${prefix}${cell.name}.png`);
    fs.writeFileSync(dest, fitted);
    saved += 1;
  }

  return { saved, warnings, out: sheet.out };
}

async function writePwaIcons() {
  const dir = path.join(root, 'public', 'icons');
  fs.mkdirSync(dir, { recursive: true });
  const face = path.join(root, 'public', 'art', 'icons', 'task-panda-happy.png');
  const source = fs.existsSync(face)
    ? face
    : await (async () => {
        return sharp({
          create: {
            width: 512,
            height: 512,
            channels: 4,
            background: { r: 44, g: 58, b: 74, alpha: 1 },
          },
        })
          .png()
          .toBuffer();
      })();

  const make = async (size, pad, dest) => {
    const inner = Math.round(size * (1 - pad * 2));
    const img = await sharp(source)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 243, g: 241, b: 236, alpha: 1 },
      },
    })
      .composite([{ input: img, gravity: 'center' }])
      .png()
      .toFile(dest);
  };

  await make(192, 0.08, path.join(dir, 'icon-192.png'));
  await make(512, 0.08, path.join(dir, 'icon-512.png'));
  await make(512, 0.18, path.join(dir, 'maskable-512.png'));
  await make(180, 0.08, path.join(dir, 'apple-touch-icon.png'));
}

async function main() {
  let total = 0;
  const allWarnings = [];
  for (const sheet of config.sheets) {
    const result = await sliceSheet(sheet);
    total += result.saved;
    if (result.out) {
      console.log(`✓  ${result.saved} plików → ${sheet.out}`);
    }
    for (const w of result.warnings) {
      console.warn(`   ⚠ ${sheet.src}: ${w}`);
      allWarnings.push(w);
    }
  }
  await writePwaIcons();
  console.log(`\nGotowe: ${total} sprite'ów. Ikony PWA w public/icons/.`);
  if (allWarnings.length) {
    console.log(`Ostrzeżeń: ${allWarnings.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
