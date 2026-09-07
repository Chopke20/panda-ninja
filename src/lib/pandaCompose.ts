import type { PandaAppearance } from '../types';
import { getCosmetic, LOGO_GLYPHS } from './cosmetics';

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
