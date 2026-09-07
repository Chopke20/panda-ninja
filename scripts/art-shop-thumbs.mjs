#!/usr/bin/env node
/**
 * Miniatury sklepowe 128×128 z pose training (lub kafelek wzoru/logo).
 * Użycie: node scripts/art-shop-thumbs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = process.env.PANDA_ROOT
  ? path.resolve(process.env.PANDA_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const round = path.join(root, 'public', 'art', 'panda-v2', 'round');
const SIZE = 128;

/** @type {{ out: string, src: string }[]} */
const jobs = [
  ...['bo', 'bokken', 'dragon-staff', 'naginata', 'master', 'nunchaku', 'sai', 'sticks', 'fan'].map(
    (id) => ({
      out: path.join(round, 'shop', 'weapons', `${id}.png`),
      src: path.join(round, 'weapons', id, 'training.png'),
    }),
  ),
  ...[
    'pack',
    'glasses',
    'cape',
    'talisman',
    'bottle',
    'pouch',
    'scarf',
    'mask',
    'dragon-pack',
  ].map((id) => ({
    out: path.join(round, 'shop', 'gadgets', `${id}.png`),
    src: path.join(round, 'gadgets', id, 'training.png'),
  })),
  ...['leaves', 'cloud', 'sparks'].map((id) => ({
    out: path.join(round, 'shop', 'gadgets', `${id}.png`),
    src: path.join(round, 'auras', id, 'training.png'),
  })),
  ...['bamboo', 'waves', 'mountains', 'stars', 'scales', 'gold'].map((id) => ({
    out: path.join(round, 'shop', 'patterns', `${id}.png`),
    src: path.join(round, 'patterns', `${id}.png`),
  })),
  ...['paw', 'bamboo', 'mountain', 'wave', 'moon', 'bolt', 'dragon', 'star'].map((id) => ({
    out: path.join(round, 'shop', 'logos', `${id}.png`),
    src: path.join(round, 'logos', `${id}.png`),
  })),
];

async function thumb(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`  pomijam brak: ${path.relative(root, src)}`);
    return false;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(src)
    .resize(SIZE, SIZE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(dest);
  return true;
}

async function main() {
  let n = 0;
  for (const job of jobs) {
    if (await thumb(job.src, job.out)) n++;
  }
  console.log(`shop thumbs: ${n}/${jobs.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
