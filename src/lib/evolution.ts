/**
 * Linie ewolucji pand — gotowe sprite’y stadiów, nie paper-doll.
 * Panda A (round): spokojniejsza, ścieżka bokkena.
 * Panda B (agile): żywiołowa, ścieżka nunchaku.
 */
import type { PandaBodyId } from '../types';
import { assetUrl } from './assetUrl';

export const EVOLUTION_STAGE_COUNT = 6;

export type EvolutionStageId = 1 | 2 | 3 | 4 | 5 | 6;

export type EvolutionStageDef = {
  id: EvolutionStageId;
  /** Klucz katalogu assetów: 01…06 */
  folder: string;
  label: string;
  /** Krótki opis dla dziecka — po polsku. */
  blurb: string;
  /** Cena awansu DO tego stadium (0 = start). */
  price: number;
  /** Czy logo na płytce ma sens (hełm / maska może zakryć). */
  showLogo: boolean;
  /**
   * true = pliki gotowe w public/art/evo.
   * false = dziura na przyszłość (UI: „wkrótce”).
   */
  ready: boolean;
};

export type EvolutionLine = {
  body: PandaBodyId;
  name: string;
  temperament: string;
  weaponPath: string;
  defaultOutfit: string;
  defaultLogoId: string;
  accent: string;
  stages: EvolutionStageDef[];
};

const ROUND_STAGES: EvolutionStageDef[] = [
  {
    id: 1,
    folder: '01',
    label: 'Nowicjusz',
    blurb: 'Puste dłonie, samo kimono — początek treningu.',
    price: 0,
    showLogo: true,
    ready: true,
  },
  {
    id: 2,
    folder: '02',
    label: 'Uczeń',
    blurb: 'Drewniany bokken do ćwiczeń w dojo.',
    price: 20,
    showLogo: true,
    ready: true,
  },
  {
    id: 3,
    folder: '03',
    label: 'Wojownik',
    blurb: 'Metalowa katana — poważniejszy trening.',
    price: 40,
    showLogo: true,
    ready: true,
  },
  {
    id: 4,
    folder: '04',
    label: 'Strażnik',
    blurb: 'Katana i prosty naramiennik.',
    price: 70,
    showLogo: true,
    ready: true,
  },
  {
    id: 5,
    folder: '05',
    label: 'Mistrz',
    blurb: 'Zawsze dwie katany i lekki plecak na misje.',
    price: 110,
    showLogo: true,
    ready: true,
  },
  {
    id: 6,
    folder: '06',
    label: 'Legenda dojo',
    blurb: 'Legendarny strój: złote detale, dwie katany, herb.',
    price: 160,
    showLogo: true,
    ready: true,
  },
];

const AGILE_STAGES: EvolutionStageDef[] = [
  {
    id: 1,
    folder: '01',
    label: 'Nowicjusz',
    blurb: 'Puste dłonie, czerwona opaska — start.',
    price: 0,
    showLogo: true,
    ready: true,
  },
  {
    id: 2,
    folder: '02',
    label: 'Uczeń',
    blurb: 'Pierwsze nunchaku z łańcuchem.',
    price: 20,
    showLogo: true,
    ready: true,
  },
  {
    id: 3,
    folder: '03',
    label: 'Wojownik',
    blurb: 'Lepsze nunchaku — jeden łańcuch, szybszy chwyt.',
    price: 40,
    showLogo: true,
    ready: true,
  },
  {
    id: 4,
    folder: '04',
    label: 'Strażnik',
    blurb: 'Naginata — długa pika z ostrzem — i peleryna.',
    price: 70,
    showLogo: true,
    ready: true,
  },
  {
    id: 5,
    folder: '05',
    label: 'Mistrz',
    blurb: 'Mistrzowska naginata i sakwa na pasie.',
    price: 110,
    showLogo: true,
    ready: true,
  },
  {
    id: 6,
    folder: '06',
    label: 'Legenda dojo',
    blurb: 'Złota włócznia, peleryna i talizman.',
    price: 160,
    showLogo: true,
    ready: true,
  },
];

/** Dziury na przyszłe stadia (7+) — UI może je pokazać jako zamknięte. */
export const FUTURE_STAGE_SLOTS = [7, 8] as const;

export const EVOLUTION_LINES: Record<PandaBodyId, EvolutionLine> = {
  round: {
    body: 'round',
    name: 'Panda spokojna',
    temperament: 'Spokojna i solidna — lubi pewny chwyt i bokken.',
    weaponPath: 'bokken → katana',
    defaultOutfit: '#3A3F46',
    defaultLogoId: 'logo-paw',
    accent: '#3D6B8A',
    stages: ROUND_STAGES,
  },
  agile: {
    body: 'agile',
    name: 'Panda zwinna',
    temperament: 'Żywiołowa i szybka — lubi łańcuch i ruch.',
    weaponPath: 'nunchaku → naginata → złota włócznia',
    defaultOutfit: '#3D4F8A',
    defaultLogoId: 'logo-bolt',
    accent: '#C44536',
    stages: AGILE_STAGES,
  },
};

export function evolutionLine(body: PandaBodyId): EvolutionLine {
  return EVOLUTION_LINES[body];
}

export function stageDef(body: PandaBodyId, stage: number): EvolutionStageDef | null {
  return evolutionLine(body).stages.find((s) => s.id === stage) ?? null;
}

export function clampStage(stage: number): EvolutionStageId {
  const n = Math.floor(stage);
  if (n < 1) return 1;
  if (n > EVOLUTION_STAGE_COUNT) return EVOLUTION_STAGE_COUNT as EvolutionStageId;
  return n as EvolutionStageId;
}

/** Id przedmiotu w ledgerze zakupów — awans DO stadium. */
export function evolutionItemId(body: PandaBodyId, stage: EvolutionStageId): string {
  return `evo-${body}-${stage}`;
}

export function parseEvolutionItemId(
  itemId: string,
): { body: PandaBodyId; stage: EvolutionStageId } | null {
  const m = /^evo-(round|agile)-([1-6])$/.exec(itemId);
  if (!m) return null;
  return { body: m[1] as PandaBodyId, stage: Number(m[2]) as EvolutionStageId };
}

/** Następne stadium do kupienia, albo null jeśli max / następne niegotowe. */
export function nextPurchasableStage(
  body: PandaBodyId,
  currentStage: number,
): EvolutionStageDef | null {
  const next = stageDef(body, currentStage + 1);
  if (!next || !next.ready) return null;
  return next;
}

export function canUnlockStage(
  body: PandaBodyId,
  currentStage: number,
  targetStage: number,
): { ok: true } | { ok: false; reason: string } {
  const target = stageDef(body, targetStage);
  if (!target) return { ok: false, reason: 'Nie ma takiego stadium.' };
  if (!target.ready) return { ok: false, reason: 'To stadium będzie wkrótce.' };
  if (targetStage !== currentStage + 1) {
    return { ok: false, reason: 'Najpierw odblokuj poprzednie stadium.' };
  }
  if (target.price <= 0) return { ok: false, reason: 'To stadium jest już startowe.' };
  return { ok: true };
}

/**
 * Ścieżka sprite’u ewolucji.
 * Na razie drafty są w art-qa; runtime używa public/art/evo gdy ready.
 */
export function evolutionSpriteRel(
  body: PandaBodyId,
  stage: number,
  pose: string,
): string {
  const def = stageDef(body, stage);
  const folder = def?.folder ?? '01';
  return `art/evo/${body}/${folder}/${pose}.webp`;
}

export function evolutionSpriteUrl(
  body: PandaBodyId,
  stage: number,
  pose: string,
): string {
  return assetUrl(evolutionSpriteRel(body, stage, pose));
}

/** Logo dostępne od startu — bez sklepu kosmetyków. */
export const STARTER_LOGOS: { id: string; label: string; assetKey: string }[] = [
  { id: 'logo-paw', label: 'Łapa', assetKey: 'paw' },
  { id: 'logo-bamboo', label: 'Bambus', assetKey: 'bamboo' },
  { id: 'logo-bolt', label: 'Piorun', assetKey: 'bolt' },
  { id: 'logo-wave', label: 'Fala', assetKey: 'wave' },
  { id: 'logo-moon', label: 'Księżyc', assetKey: 'moon' },
  { id: 'logo-dragon', label: 'Smok', assetKey: 'dragon' },
];

export const OUTFIT_SWATCHES: { id: string; label: string; hex: string }[] = [
  { id: 'color-charcoal', label: 'Grafit', hex: '#3A3F46' },
  { id: 'color-indigo', label: 'Indygo', hex: '#3D4F8A' },
  { id: 'color-crimson', label: 'Karmazyn', hex: '#A83B3B' },
  { id: 'color-forest', label: 'Las', hex: '#3F6B4A' },
  { id: 'color-sand', label: 'Piasek', hex: '#C4A574' },
  { id: 'color-sky', label: 'Niebo', hex: '#5B8FB8' },
];
