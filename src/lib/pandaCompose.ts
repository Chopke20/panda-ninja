import type { PandaAppearance, PandaPose } from '../types';
import { getCosmetic, LOGO_GLYPHS } from './cosmetics';

/** Kotwice procentowe na płótnie 512 — przejściowe, do czasu pand-v2. */
export type Anchor = { x: number; y: number; scale: number; rotate: number };

export const POSE_ANCHORS: Record<
  PandaPose,
  {
    headband: Anchor;
    logo: Anchor;
    hand: Anchor;
    head: Anchor;
    back: Anchor;
    belt: Anchor;
    aura: Anchor;
    collar: Anchor;
  }
> = {
  sleeping: {
    headband: { x: 50, y: 28, scale: 1, rotate: 0 },
    logo: { x: 50, y: 27, scale: 0.9, rotate: 0 },
    hand: { x: 62, y: 68, scale: 0.7, rotate: -20 },
    head: { x: 50, y: 22, scale: 0.85, rotate: 0 },
    back: { x: 38, y: 55, scale: 0.8, rotate: 0 },
    belt: { x: 50, y: 62, scale: 0.75, rotate: 0 },
    aura: { x: 50, y: 40, scale: 1.1, rotate: 0 },
    collar: { x: 50, y: 52, scale: 1, rotate: 0 },
  },
  training: {
    headband: { x: 50, y: 22, scale: 1, rotate: 0 },
    logo: { x: 50, y: 21, scale: 0.95, rotate: 0 },
    hand: { x: 58, y: 55, scale: 0.85, rotate: -35 },
    head: { x: 50, y: 16, scale: 0.9, rotate: 0 },
    back: { x: 34, y: 48, scale: 0.85, rotate: -8 },
    belt: { x: 50, y: 58, scale: 0.8, rotate: 0 },
    aura: { x: 50, y: 36, scale: 1.15, rotate: 0 },
    collar: { x: 50, y: 46, scale: 1, rotate: 0 },
  },
  hurry: {
    headband: { x: 50, y: 20, scale: 1, rotate: -4 },
    logo: { x: 50, y: 19, scale: 0.95, rotate: -4 },
    hand: { x: 60, y: 52, scale: 0.85, rotate: -45 },
    head: { x: 50, y: 14, scale: 0.9, rotate: -4 },
    back: { x: 32, y: 46, scale: 0.85, rotate: -12 },
    belt: { x: 50, y: 56, scale: 0.8, rotate: 0 },
    aura: { x: 50, y: 34, scale: 1.2, rotate: 0 },
    collar: { x: 50, y: 44, scale: 1, rotate: 0 },
  },
  celebrating: {
    headband: { x: 50, y: 18, scale: 1, rotate: 0 },
    logo: { x: 50, y: 17, scale: 1, rotate: 0 },
    hand: { x: 30, y: 28, scale: 0.9, rotate: -70 },
    head: { x: 50, y: 12, scale: 0.95, rotate: 0 },
    back: { x: 36, y: 42, scale: 0.9, rotate: 0 },
    belt: { x: 50, y: 52, scale: 0.85, rotate: 0 },
    aura: { x: 50, y: 30, scale: 1.25, rotate: 0 },
    collar: { x: 50, y: 40, scale: 1, rotate: 0 },
  },
};

export function bodySheet(body: PandaAppearance['body']): 'panda-a' | 'panda-b' {
  return body === 'agile' ? 'panda-b' : 'panda-a';
}

export function furFilter(fur: PandaAppearance['fur']): string {
  if (fur === 'snow') return 'brightness(1.08) saturate(0.85)';
  if (fur === 'bamboo') return 'hue-rotate(-12deg) saturate(1.1)';
  return 'none';
}

export function logoGlyph(logoId: string): string {
  const item = getCosmetic(logoId);
  const key = item?.assetKey ?? 'paw';
  return LOGO_GLYPHS[key] ?? '🐾';
}

export function weaponPreview(_handId: string): string | null {
  // Faza 0: flat sprite ma broń wypaloną — nie doklejamy drugiej.
  // v2 wróci tu z warstwą z panda-v2.
  return null;
}

/** Gadżety na flat sprite wyłączone (emoji kłamały). Logo zostaje. */
export function gadgetGlyph(_itemId: string | null): string | null {
  return null;
}

export function outfitLabelColor(hex: string): string {
  return hex;
}
