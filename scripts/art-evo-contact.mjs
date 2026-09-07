/**
 * Kontaktówka draftów ewolucji — BEZ wycinania poz.
 * Składa 2×6 arkuszy (round / agile) do art-qa/ dla oceny.
 *
 *   node scripts/art-evo-contact.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = process.env.PANDA_ROOT
  ? path.resolve(process.env.PANDA_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const drafts = path.join(root, 'art-qa', 'evo-drafts');
const outDir = path.join(root, 'art-qa');

const ROUND = [
  'evo-round-01-novice.png',
  'evo-round-02-student.png',
  'evo-round-03-warrior.png',
  'evo-round-04-guard.png',
  'evo-round-05-master.png',
  'evo-round-06-legend.png',
];

const AGILE = [
  'evo-agile-01-novice.png',
  'evo-agile-02-student.png',
  'evo-agile-03-warrior.png',
  'evo-agile-04-guard.png',
  'evo-agile-05-master.png',
  'evo-agile-06-legend.png',
];

const LABELS = ['1 Nowicjusz', '2 Uczeń', '3 Wojownik', '4 Strażnik', '5 Mistrz', '6 Legenda'];

const CELL = 420;
const PAD = 24;
const LABEL_H = 36;
const COLS = 3;
const ROWS = 2;

async function sheet(files, title, outName) {
  const width = PAD + COLS * (CELL + PAD);
  const height = 64 + PAD + ROWS * (CELL + LABEL_H + PAD);
  const composites = [];

  const titleSvg = Buffer.from(
    `<svg width="${width}" height="56" xmlns="http://www.w3.org/2000/svg">
      <text x="24" y="40" font-family="Segoe UI, sans-serif" font-size="28" fill="#2A2926">${title}</text>
    </svg>`,
  );
  composites.push({ input: await sharp(titleSvg).png().toBuffer(), left: 0, top: 8 });

  for (let i = 0; i < files.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const left = PAD + col * (CELL + PAD);
    const top = 64 + PAD + row * (CELL + LABEL_H + PAD);
    const file = path.join(drafts, files[i]);
    if (!fs.existsSync(file)) {
      console.warn('Brak:', files[i]);
      continue;
    }
    const img = await sharp(file)
      .resize(CELL, CELL, { fit: 'contain', background: { r: 240, g: 238, b: 232, alpha: 1 } })
      .png()
      .toBuffer();
    composites.push({ input: img, left, top });
    const labelSvg = Buffer.from(
      `<svg width="${CELL}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="26" font-family="Segoe UI, sans-serif" font-size="20" fill="#6B6860">${LABELS[i]}</text>
      </svg>`,
    );
    composites.push({
      input: await sharp(labelSvg).png().toBuffer(),
      left,
      top: top + CELL,
    });
  }

  const out = path.join(outDir, outName);
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 243, g: 241, b: 236 },
    },
  })
    .composite(composites)
    .png()
    .toFile(out);
  console.log('Zapisano', out);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  await sheet(ROUND, 'Panda spokojna (round) — 6 stadiów · draft przed wycięciem', 'evo-contact-round.png');
  await sheet(AGILE, 'Panda zwinna (agile) — 6 stadiów · draft przed wycięciem', 'evo-contact-agile.png');
  // Jedna mega-kontaktówka: obie linie pod sobą
  const a = path.join(outDir, 'evo-contact-round.png');
  const b = path.join(outDir, 'evo-contact-agile.png');
  const metaA = await sharp(a).metadata();
  const metaB = await sharp(b).metadata();
  const w = Math.max(metaA.width ?? 0, metaB.width ?? 0);
  const h = (metaA.height ?? 0) + (metaB.height ?? 0) + 24;
  await sharp({
    create: { width: w, height: h, channels: 3, background: { r: 243, g: 241, b: 236 } },
  })
    .composite([
      { input: a, left: 0, top: 0 },
      { input: b, left: 0, top: (metaA.height ?? 0) + 24 },
    ])
    .png()
    .toFile(path.join(outDir, 'evo-contact-all.png'));
  console.log('Zapisano art-qa/evo-contact-all.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
