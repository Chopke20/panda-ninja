#!/usr/bin/env node
/**
 * Kontaktówka QA — składa pandę tak samo jak PandaComposer, ale offline w PNG.
 * Dzięki temu widać wszystkie bronie/gadżety × 4 pozy bez klikania w apce.
 *
 * Wynik: art-qa/contact-<body>.png (+ warianty kolorów)
 * Użycie: npm run art:sheet [-- round|agile]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = process.env.PANDA_ROOT
  ? path.resolve(process.env.PANDA_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const v2Root = path.join(root, 'public', 'art', 'panda-v2');
const outDir = path.join(root, 'art-qa');
const cfg = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'data', 'panda-anchors.json'), 'utf8'),
);
const N = cfg.canvas;
const CELL = 320;

const GRIP = {
  bo: 'staff',
  bokken: 'staff',
  'dragon-staff': 'staff',
  naginata: 'staff',
  master: 'staff',
  nunchaku: 'dual',
  sai: 'dual',
  sticks: 'dual',
  fan: 'fan',
};

async function raw(file, w = N, h = N) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .resize(w, h, { fit: 'contain', position: 'bottom', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

async function rawNoResize(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

function hex(c) {
  const s = c.replace('#', '');
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

/** kolor × shade, ograniczone maską — to samo co CSS mask + multiply. */
function recolor(base, mask, shade, color) {
  const [r, g, b] = hex(color);
  for (let i = 0; i < N * N; i++) {
    const a = mask.data[i * 4 + 3] / 255;
    if (a <= 0) continue;
    const s = shade.data[i * 4 + 3] > 0 ? shade.data[i * 4] / 255 : 1;
    const o = i * 4;
    base.data[o] = base.data[o] * (1 - a) + r * s * a;
    base.data[o + 1] = base.data[o + 1] * (1 - a) + g * s * a;
    base.data[o + 2] = base.data[o + 2] * (1 - a) + b * s * a;
    base.data[o + 3] = Math.max(base.data[o + 3], Math.round(a * 255));
  }
}

function blit(base, layer, left, top) {
  for (let y = 0; y < layer.h; y++) {
    const by = top + y;
    if (by < 0 || by >= N) continue;
    for (let x = 0; x < layer.w; x++) {
      const bx = left + x;
      if (bx < 0 || bx >= N) continue;
      const lo = (y * layer.w + x) * 4;
      const a = layer.data[lo + 3] / 255;
      if (a <= 0) continue;
      const bo = (by * N + bx) * 4;
      base.data[bo] = base.data[bo] * (1 - a) + layer.data[lo] * a;
      base.data[bo + 1] = base.data[bo + 1] * (1 - a) + layer.data[lo + 1] * a;
      base.data[bo + 2] = base.data[bo + 2] * (1 - a) + layer.data[lo + 2] * a;
      base.data[bo + 3] = Math.max(base.data[bo + 3], Math.round(a * 255));
    }
  }
}

function toBody(bodyId, p) {
  const tf = cfg.bodies[bodyId];
  return {
    x: 50 + (p.x - 50) * tf.sx,
    y: 100 - (100 - p.y) * tf.sy,
    w: p.w * tf.sx,
    rotate: p.rotate,
  };
}

function withItem(p, key) {
  const fit = cfg.items[key] ?? {};
  return {
    x: p.x + (fit.dx ?? 0),
    y: p.y + (fit.dy ?? 0),
    w: p.w * (fit.wMul ?? 1),
    rotate: p.rotate + (fit.rotate ?? 0),
  };
}

function placement(kind, pose, grip) {
  const a = cfg.anchors[pose];
  const s = cfg.slots;
  if (kind === 'weapon') {
    if (grip === 'empty') return null;
    if (grip === 'fan') return { x: a.handMain.x, y: a.handMain.y, w: s.weaponFan.w, rotate: s.weaponFan.rotate };
    const d = grip === 'dual' ? s.weaponDual : s.weaponStaff;
    return { x: a.grip.x, y: a.grip.y, w: Math.max(a.grip.span * d.wFromSpan, d.wMin), rotate: a.grip.angle };
  }
  if (kind === 'fistOff') return a.handOff ? { x: a.handOff.x, y: a.handOff.y, w: s.fist.w, rotate: a.grip.angle } : null;
  if (kind === 'fistMain') return { x: a.handMain.x, y: a.handMain.y, w: s.fist.w, rotate: a.grip.angle };
  if (kind === 'back') return { x: a.back.x, y: a.back.y, w: a.back.w, rotate: 0 };
  if (kind === 'head') return { x: a.face.x, y: a.face.y, w: a.face.w * s.head.wFromAnchor, rotate: 0 };
  if (kind === 'belt') return { x: a.belt.x, y: a.belt.y, w: a.belt.w, rotate: 0 };
  if (kind === 'logo') return { x: a.plate.x, y: a.plate.y, w: a.plate.w * s.logo.wFromAnchor, rotate: a.plate.angle ?? 0 };
  if (kind === 'aura') return { x: a.aura.x, y: a.aura.y, w: a.aura.w, rotate: 0 };
  return null;
}

async function placeLayer(base, file, place) {
  if (!place || !fs.existsSync(file)) return;
  const meta = await sharp(file).metadata();
  const tw = Math.max(1, Math.round((place.w / 100) * N));
  const th = Math.max(1, Math.round((meta.height / meta.width) * tw));
  let buf = await sharp(file).ensureAlpha().resize(tw, th, { fit: 'fill' }).png().toBuffer();
  if (Math.abs(place.rotate) > 0.01) {
    buf = await sharp(buf).rotate(place.rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  }
  const layer = await rawNoResize(buf);
  blit(base, layer, Math.round((place.x / 100) * N - layer.w / 2), Math.round((place.y / 100) * N - layer.h / 2));
}

async function compose(bodyId, pose, opts) {
  const B = path.join(v2Root, bodyId);
  const grip = opts.weapon ? GRIP[opts.weapon] ?? 'staff' : 'empty';
  const base = { data: Buffer.alloc(N * N * 4), w: N, h: N };

  if (opts.back) {
    await placeLayer(base, path.join(B, 'gadgets', opts.back, `${pose}.png`), toBody(bodyId, withItem(placement('back', pose, grip), opts.back)));
  }
  blit(base, await raw(path.join(B, 'body', `${pose}.png`)), 0, 0);
  recolor(base, await raw(path.join(B, 'kimono', 'mask', `${pose}.png`)), await raw(path.join(B, 'kimono', 'shade', `${pose}.png`)), opts.outfit);
  recolor(base, await raw(path.join(B, 'headband', 'mask', `${pose}.png`)), await raw(path.join(B, 'headband', 'shade', `${pose}.png`)), opts.headband);

  if (opts.weapon) {
    await placeLayer(base, path.join(B, 'weapons', opts.weapon, `${pose}.png`), toBody(bodyId, withItem(placement('weapon', pose, grip), opts.weapon)));
  }
  const gripDir = grip === 'empty' ? 'empty' : grip;
  const off = placement('fistOff', pose, grip);
  if (off) {
    await placeLayer(base, path.join(B, 'hands', gripDir, `${pose}-l.png`), toBody(bodyId, off));
    await placeLayer(base, path.join(B, 'hands', gripDir, `${pose}-r.png`), toBody(bodyId, placement('fistMain', pose, grip)));
  } else {
    await placeLayer(base, path.join(B, 'hands', gripDir, `${pose}-solo.png`), toBody(bodyId, placement('fistMain', pose, grip)));
  }
  if (opts.head) {
    await placeLayer(base, path.join(B, 'gadgets', opts.head, `${pose}.png`), toBody(bodyId, withItem(placement('head', pose, grip), opts.head)));
  }
  if (opts.belt) {
    await placeLayer(base, path.join(B, 'gadgets', opts.belt, `${pose}.png`), toBody(bodyId, withItem(placement('belt', pose, grip), opts.belt)));
  }
  if (opts.logo) {
    await placeLayer(base, path.join(B, 'logos', `${opts.logo}.png`), toBody(bodyId, withItem(placement('logo', pose, grip), opts.logo)));
  }
  return sharp(Buffer.from(base.data), { raw: { width: N, height: N, channels: 4 } })
    .flatten({ background: '#ffffff' })
    .resize(CELL, CELL)
    .png()
    .toBuffer();
}

const ROWS = [
  { weapon: 'bo', outfit: '#A83B3B', headband: '#C44536', back: 'pack', logo: 'dragon' },
  { weapon: 'bokken', outfit: '#3D4F8A', headband: '#D4A017', head: 'glasses', logo: 'star' },
  { weapon: 'dragon-staff', outfit: '#3F6B4A', headband: '#F2F0EA', back: 'cape', logo: 'paw' },
  { weapon: 'naginata', outfit: '#C4A574', headband: '#2A2926', belt: 'bottle', logo: 'moon' },
  { weapon: 'master', outfit: '#5B8FB8', headband: '#D4A017', back: 'dragon-pack', logo: 'bolt' },
  { weapon: 'nunchaku', outfit: '#3A3F46', headband: '#C44536', head: 'mask', logo: 'bamboo' },
  { weapon: 'sai', outfit: '#A83B3B', headband: '#3D6B8A', belt: 'pouch', logo: 'wave' },
  { weapon: 'sticks', outfit: '#3F6B4A', headband: '#F2F0EA', head: 'scarf', logo: 'mountain' },
  { weapon: 'fan', outfit: '#3D4F8A', headband: '#C44536', belt: 'talisman', logo: 'star' },
];

async function main() {
  const bodyId = process.argv[2] ?? 'round';
  fs.mkdirSync(outDir, { recursive: true });
  const cells = [];
  for (let r = 0; r < ROWS.length; r++) {
    for (let c = 0; c < cfg.poses.length; c++) {
      cells.push({
        input: await compose(bodyId, cfg.poses[c], ROWS[r]),
        left: c * CELL,
        top: r * CELL,
      });
    }
    console.log(`  ${ROWS[r].weapon} ok`);
  }
  const dest = path.join(outDir, `contact-${bodyId}.png`);
  await sharp({
    create: {
      width: CELL * cfg.poses.length,
      height: CELL * ROWS.length,
      channels: 4,
      background: '#ffffff',
    },
  })
    .composite(cells)
    .png()
    .toFile(dest);
  console.log(`kontaktówka → ${path.relative(root, dest)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
