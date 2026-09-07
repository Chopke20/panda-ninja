#!/usr/bin/env node
/**
 * Sylwetka agile (brat) z round.
 *
 * Zwężamy TYLKO body — reszta warstw jest kopiowana 1:1, bo pozycję i rozmiar
 * przedmiotu i tak liczy kotwica, a ta zna współczynnik agile
 * (src/data/panda-anchors.json → bodies.agile.sx). Skalowanie plików i kotwic
 * naraz zwężałoby wszystko dwa razy.
 *
 * Maski kimona/opaski nie są kopiowane — generuje je npm run art:masks
 * z już zwężonego body.
 *
 * Użycie: npm run art:agile
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = process.env.PANDA_ROOT
  ? path.resolve(process.env.PANDA_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v2Root = path.join(root, 'public', 'art', 'panda-v2');
const roundRoot = path.join(v2Root, 'round');
const agileRoot = path.join(v2Root, 'agile');
const cfg = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'panda-anchors.json'), 'utf8'),
);

const SCALE_X = cfg.bodies.agile.sx;
const SCALE_Y = cfg.bodies.agile.sy;
/** Regenerowane osobno — nie kopiujemy wersji round. */
const SKIP_DIRS = new Set(['kimono', 'headband']);

function listPngFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) listPngFiles(full, acc);
    else if (name.endsWith('.png') && !name.startsWith('.')) acc.push(full);
  }
  return acc;
}

/** Węższy brat: ta sama wysokość, wyrównanie do dołu, płótno bez zmian. */
async function slenderize(src, dest) {
  const meta = await sharp(src).metadata();
  const w = meta.width ?? 512;
  const h = meta.height ?? 512;
  const tw = Math.max(1, Math.round(w * SCALE_X));
  const th = Math.max(1, Math.round(h * SCALE_Y));
  const resized = await sharp(src)
    .resize(tw, th, { fit: 'fill', kernel: 'lanczos3' })
    .ensureAlpha()
    .png()
    .toBuffer();
  await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: resized, left: Math.max(0, Math.round((w - tw) / 2)), top: Math.max(0, h - th) },
    ])
    .png()
    .toFile(dest);
}

async function main() {
  if (!fs.existsSync(roundRoot)) {
    console.error('Brak round — najpierw npm run art:v2');
    process.exit(1);
  }
  let slim = 0;
  let copied = 0;
  for (const src of listPngFiles(roundRoot)) {
    const rel = path.relative(roundRoot, src);
    const kind = rel.split(path.sep)[0];
    if (SKIP_DIRS.has(kind)) continue;
    const dest = path.join(agileRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (kind === 'body') {
      await slenderize(src, dest);
      slim++;
    } else {
      fs.copyFileSync(src, dest);
      copied++;
    }
  }
  console.log(`agile: body ${slim} zwężone (sx=${SCALE_X}), ${copied} warstw skopiowanych 1:1`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
