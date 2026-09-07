/**
 * Kotwice paper-doll v2.
 *
 * Warstwy w public/art/panda-v2 są przycięte do bbox (npm run art:anchor),
 * więc nie mają już wspólnej klatki 512 — pozycję i rozmiar nadaje kotwica pozy.
 * Szerokość podajemy w % płótna, wysokość zostawiamy `auto`, żeby przeglądarka
 * trzymała naturalne proporcje przedmiotu.
 *
 * Źródło danych: src/data/panda-anchors.json (czytają je też skrypty w scripts/).
 */
import raw from '../data/panda-anchors.json';
import type { PandaBodyId, PandaPose } from '../types';
import type { GripFamily } from './cosmetics';

type Point = { x: number; y: number };
type Grip = { x: number; y: number; angle: number; span: number };
type Sized = { x: number; y: number; w: number; angle?: number };

type PoseAnchors = {
  handMain: Point;
  handOff: Point | null;
  grip: Grip;
  plate: Sized;
  face: Sized;
  back: Sized;
  belt: Sized;
  aura: Sized;
};

type ItemFit = {
  normalizeAxis?: boolean;
  wMul?: number;
  dx?: number;
  dy?: number;
  rotate?: number;
};

export type AnchorConfig = {
  canvas: number;
  poses: PandaPose[];
  bodies: Record<PandaBodyId, { sx: number; sy: number }>;
  anchors: Record<PandaPose, PoseAnchors>;
  slots: {
    weaponStaff: { wFromSpan: number; wMin: number };
    weaponDual: { wFromSpan: number; wMin: number };
    weaponFan: { w: number; rotate: number };
    fist: { w: number };
    head: { wFromAnchor: number };
    logo: { wFromAnchor: number };
  };
  items: Record<string, ItemFit>;
  masks: Record<string, unknown>;
};

const BASE = raw as unknown as AnchorConfig;

/**
 * Podmiana kotwic w locie — używa tego wyłącznie edytor `#kotwice` (dev),
 * żeby podgląd składał się tym samym kodem co aplikacja.
 */
let override: AnchorConfig | null = null;

export function setAnchorOverride(next: AnchorConfig | null): void {
  override = next;
}

function cfg(): AnchorConfig {
  return override ?? BASE;
}

export const BASE_ANCHORS = BASE;
export const PANDA_CANVAS = BASE.canvas;
export const PANDA_POSES = BASE.poses;

/** Gdzie i jak duży — wszystko w % płótna, wysokość z proporcji obrazka. */
export type Placement = { x: number; y: number; w: number; rotate: number };

export type PlacementKind =
  | 'weapon'
  | 'fistOff'
  | 'fistMain'
  | 'back'
  | 'head'
  | 'belt'
  | 'logo'
  | 'aura';

function anchorsFor(pose: PandaPose): PoseAnchors {
  return cfg().anchors[pose];
}

/** Kotwice opisano na sylwetce round; agile jest węższy o stały współczynnik. */
function toBody(body: PandaBodyId, p: Placement): Placement {
  const tf = cfg().bodies[body] ?? { sx: 1, sy: 1 };
  return {
    x: 50 + (p.x - 50) * tf.sx,
    y: 100 - (100 - p.y) * tf.sy,
    w: p.w * tf.sx,
    rotate: p.rotate,
  };
}

function withItem(p: Placement, assetKey: string | null): Placement {
  const fit: ItemFit = (assetKey && cfg().items[assetKey]) || {};
  return {
    x: p.x + (fit.dx ?? 0),
    y: p.y + (fit.dy ?? 0),
    w: p.w * (fit.wMul ?? 1),
    rotate: p.rotate + (fit.rotate ?? 0),
  };
}

function basePlacement(
  kind: PlacementKind,
  pose: PandaPose,
  grip: GripFamily,
): Placement | null {
  const a = anchorsFor(pose);
  const s = cfg().slots;
  switch (kind) {
    case 'weapon': {
      if (grip === 'empty') return null;
      if (grip === 'fan') {
        return { x: a.handMain.x, y: a.handMain.y, w: s.weaponFan.w, rotate: s.weaponFan.rotate };
      }
      const d = grip === 'dual' ? s.weaponDual : s.weaponStaff;
      return {
        x: a.grip.x,
        y: a.grip.y,
        w: Math.max(a.grip.span * d.wFromSpan, d.wMin),
        rotate: a.grip.angle,
      };
    }
    case 'fistOff':
      if (!a.handOff) return null;
      return { x: a.handOff.x, y: a.handOff.y, w: s.fist.w, rotate: a.grip.angle };
    case 'fistMain':
      return { x: a.handMain.x, y: a.handMain.y, w: s.fist.w, rotate: a.grip.angle };
    case 'back':
      return { x: a.back.x, y: a.back.y, w: a.back.w, rotate: 0 };
    case 'head':
      return { x: a.face.x, y: a.face.y, w: a.face.w * s.head.wFromAnchor, rotate: 0 };
    case 'belt':
      return { x: a.belt.x, y: a.belt.y, w: a.belt.w, rotate: 0 };
    case 'logo':
      return { x: a.plate.x, y: a.plate.y, w: a.plate.w * s.logo.wFromAnchor, rotate: a.plate.angle ?? 0 };
    case 'aura':
      return { x: a.aura.x, y: a.aura.y, w: a.aura.w, rotate: 0 };
    default:
      return null;
  }
}

/** Kotwica dla warstwy: null = w tej pozie warstwy nie ma (np. druga ręka w hurry). */
export function placementFor(
  kind: PlacementKind,
  body: PandaBodyId,
  pose: PandaPose,
  assetKey: string | null = null,
  grip: GripFamily = 'staff',
): Placement | null {
  const base = basePlacement(kind, pose, grip);
  if (!base) return null;
  return toBody(body, withItem(base, assetKey));
}

/** Czy poza pokazuje obie ręce (hurry ma jedną). */
export function hasOffHand(pose: PandaPose): boolean {
  return anchorsFor(pose).handOff != null;
}
