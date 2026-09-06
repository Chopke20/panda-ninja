#!/usr/bin/env node
/**
 * Buduje sylwetkę agile z round: lekko wyższa + węższa (brat).
 * Użycie: node scripts/art-agile-from-round.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const roundRoot = path.join(root, 'public', 'art', 'panda-v2', 'round');
const agileRoot = path.join(root, 'public', 'art', 'panda-v2', 'agile');

/** Smuklejszy brat: wyższy, węższy, wyrównanie do dołu. */
const SCALE_X = 0.9;
const SCALE_Y = 1.07;

function listPngFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) listPngFiles(full, acc);
    else if (name.endsWith('.png') && !name.startsWith('.')) acc.push(full);
  }
  return acc;
}

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

  // Przytnij / wstaw z powrotem na płótno w×h, dół wyśrodkowany
  const left = Math.round((w - tw) / 2);
  const top = h - th;
  let pipeline = sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  if (th > h || tw > w) {
    // za duże — najpierw contain w ramce
    const fitted = await sharp(resized)
      .resize(w, h, {
        fit: 'contain',
        position: 'bottom',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    await sharp(fitted).png().toFile(dest);
    return;
  }

  await pipeline
    .composite([{ input: resized, left: Math.max(0, left), top: Math.max(0, top) }])
    .png()
    .toFile(dest);
}

async function main() {
  if (!fs.existsSync(roundRoot)) {
    console.error('Brak round — najpierw npm run art:v2');
    process.exit(1);
  }

  const files = listPngFiles(roundRoot);
  if (files.length === 0) {
    console.error('Brak PNG w round/');
    process.exit(1);
  }

  let n = 0;
  for (const src of files) {
    const rel = path.relative(roundRoot, src);
    const dest = path.join(agileRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    // Logo: bez smuklenia (emblematy)
    if (rel.startsWith(`logos${path.sep}`) || rel.startsWith('logos/')) {
      fs.copyFileSync(src, dest);
    } else {
      await slenderize(src, dest);
    }
    n++;
  }

  // .gitkeep w pustych katalogach round nie kopiujemy — ok
  console.log(`agile: ${n} plików z round (scaleX=${SCALE_X}, scaleY=${SCALE_Y})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
