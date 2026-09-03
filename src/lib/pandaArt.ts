import type { PandaPose } from '../types';
import { PANDA_SHEETS } from './constants';

export const PANDA_POSES: readonly PandaPose[] = ['sleeping', 'training', 'hurry', 'celebrating'];

export function pandaArtSrc(sheet: (typeof PANDA_SHEETS)[number], pose: PandaPose): string {
  return `/art/${sheet}/${pose}.png`;
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
