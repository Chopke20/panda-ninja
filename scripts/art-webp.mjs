#!/usr/bin/env node
/**
 * Konwertuje PNG w public/art/panda-v2 na WebP (obok PNG).
 * Użycie: node scripts/art-webp.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v2Root = path.join(root, 'public', 'art', 'panda-v2');
const QUALITY = 82;

function listPng(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) listPng(full, acc);
    else if (name.endsWith('.png') && !name.startsWith('.')) acc.push(full);
  }
  return acc;
}

async function main() {
  const files = listPng(v2Root);
  let n = 0;
  for (const src of files) {
    const dest = src.replace(/\.png$/i, '.webp');
    await sharp(src).webp({ quality: QUALITY, alphaQuality: 90 }).toFile(dest);
    n++;
  }
  console.log(`webp: ${n} plików (quality=${QUALITY})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
