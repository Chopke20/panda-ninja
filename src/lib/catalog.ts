import type { TaskIconId } from './cosmetics';
import {
  ACCENTS,
  TASK_ICONS,
  VOICE_LINE_FIELDS,
  taskIconSrc,
} from './cosmetics';

export type { TaskIconId };
export { ACCENTS, TASK_ICONS, VOICE_LINE_FIELDS, taskIconSrc };

/** @deprecated — użyj cosmetics / OUTFIT_COLORS. Zachowane jako puste aliasy dla starych importów. */
export const WEAPONS: { id: string; label: string; src: string }[] = [];
export const HEADBANDS: { id: string; label: string; src: string }[] = [];
export const OUTFITS: { id: string; label: string; src: string }[] = [];
