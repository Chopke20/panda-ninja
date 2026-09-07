import type { PandaBodyId, PandaPose } from '../types';
import { assetCandidates, assetUrl } from './assetUrl';
import { PANDA_SHEETS } from './constants';
import { evolutionSpriteRel, stageDef } from './evolution';
import { bodySheet } from './pandaCompose';

export const PANDA_POSES: readonly PandaPose[] = ['sleeping', 'training', 'hurry', 'celebrating'];

export function pandaArtSrc(sheet: (typeof PANDA_SHEETS)[number], pose: PandaPose): string {
  return assetUrl(`art/${sheet}/${pose}.png`);
}

/**
 * Sprite pandy: ewolucja (gdy ready) → flat panda-a/b.
 * Kilka URL-i, bo lokalny Vite bywa z VITE_BASE od Pages.
 */
export function pandaSpriteSrcs(
  body: PandaBodyId,
  pose: PandaPose,
  stage: number = 1,
): string[] {
  const sheet = bodySheet(body);
  const rels: string[] = [];
  const def = stageDef(body, stage);
  if (def?.ready) {
    rels.push(evolutionSpriteRel(body, stage, pose));
  }
  rels.push(`art/${sheet}/${pose}.png`);
  const urls: string[] = [];
  for (const rel of rels) {
    for (const url of assetCandidates(rel)) {
      if (!urls.includes(url)) urls.push(url);
    }
  }
  return urls;
}

/** Ciepły cache przeglądarki — zmiana stanu nie ma migać. */
export function preloadPandaArt(): void {
  if (typeof window === 'undefined') return;
  for (const sheet of PANDA_SHEETS) {
    for (const pose of PANDA_POSES) {
      const img = new Image();
      img.src = pandaArtSrc(sheet, pose);
    }
  }
  for (const body of ['round', 'agile'] as const) {
    for (let stage = 1; stage <= 6; stage++) {
      if (!stageDef(body, stage)?.ready) continue;
      for (const pose of PANDA_POSES) {
        const img = new Image();
        img.src = assetUrl(evolutionSpriteRel(body, stage, pose));
      }
    }
  }
}
