import type { PandaBodyId, PandaPose } from '../types';
import { assetCandidates, assetUrl } from './assetUrl';
import { PANDA_SHEETS } from './constants';
import { bodySheet } from './pandaCompose';

export const PANDA_POSES: readonly PandaPose[] = ['sleeping', 'training', 'hurry', 'celebrating'];

export function pandaArtSrc(sheet: (typeof PANDA_SHEETS)[number], pose: PandaPose): string {
  return assetUrl(`art/${sheet}/${pose}.png`);
}

/**
 * Jeden kompletny sprite: najpierw flat panda-a/b, potem body v2.
 * Kilka URL-i, bo lokalny Vite bywa odpalony z VITE_BASE od Pages.
 */
export function pandaSpriteSrcs(body: PandaBodyId, pose: PandaPose): string[] {
  const sheet = bodySheet(body);
  const v2 = body === 'agile' ? 'agile' : 'round';
  const rels = [`art/${sheet}/${pose}.png`, `art/panda-v2/${v2}/body/${pose}.png`];
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
}
