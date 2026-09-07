import type { PandaAppearance, PandaBodyId } from '../types';
import { getCosmetic, LOGO_GLYPHS } from './cosmetics';
import { STARTER_LOGOS } from './evolution';

export function bodySheet(body: PandaBodyId): 'panda-a' | 'panda-b' {
  return body === 'agile' ? 'panda-b' : 'panda-a';
}

export function logoGlyph(logoId: string): string {
  const fromStarter = STARTER_LOGOS.find((l) => l.id === logoId);
  if (fromStarter) return LOGO_GLYPHS[fromStarter.assetKey] ?? '🐾';
  const item = getCosmetic(logoId);
  const key = item?.assetKey ?? 'paw';
  return LOGO_GLYPHS[key] ?? '🐾';
}

export function outfitLabelColor(hex: string): string {
  return hex;
}

/** Lekki tint całego sprite’u póki nie ma chroma-key na kimono. */
export function outfitPreviewFilter(appearance: PandaAppearance): string {
  // Bez chroma w pliku nie da się uczciwie przefarbować samego gi —
  // zostawiamy naturalny kolor arkusza. Filtr nie kłamie „kolorem futra”.
  void appearance;
  return 'none';
}
