/** Paleta i wymiary — żadnych magicznych liczb w JSX. */

export const COLORS = {
  paper: '#F3F1EC',
  ink: '#2A2926',
  muted: '#6B6860',
  dojo: '#2C3A4A',
  belt: '#C44536',
  gold: '#E0B84D',
  panel: '#FFFCF7',
  green: '#3F8F62',
  amber: '#D4A017',
  red: '#C45C4A',
  placeholder: {
    sleeping: '#A8B4C0',
    training: '#4A7C6F',
    hurry: '#C4783A',
    celebrating: '#D4A84B',
  },
} as const;

export const TOUCH = {
  minTilePx: 72,
} as const;

/** Tła rutyn (bambus) — niska opacity na paper. */
export const BG = {
  routineOpacity: 0.22,
  /** Wieczór: mocniejsze tło przy ciemnym theme. */
  routineOpacityEvening: 0.32,
  /** Od tej godziny ekran startowy pokazuje tło wieczorne. */
  eveningFromHour: 15,
} as const;

export const TYPE = {
  basePx: 18,
  clockPx: 96,
} as const;

export const STORAGE_KEY = 'pandaninja.v1';

export const SCHEMA_VERSION = 8;

/**
 * Paper-doll v2 — wyłączone. Produkt = gotowe sprite’y ewolucji + kolor/logo.
 * Zostawione w kodzie na wypadek powrotu do warstw.
 */
export const USE_PANDA_V2 = false;

export const ROUTINE_IDS = ['morning', 'evening'] as const;

export const TIME = {
  defaultWindowMin: 90,
  defaultWarningsMin: [20, 10, 5, 0] as const,
  defaultDeparture: '07:40',
  defaultEvening: '20:00',
  earlyFinishMin: 10,
  pinLockSeconds: 60,
  pinMaxAttempts: 5,
  summaryVisibleMs: 3 * 60 * 1000,
  uncheckHoldMs: 1000,
  persistDebounceMs: 500,
  blinkMinMs: 4000,
  blinkMaxMs: 7000,
  historyDays: 365,
  t0GongCount: 3,
  tickMs: 1000,
  purchaseExpireMs: 48 * 60 * 60 * 1000,
  refundWindowMs: 24 * 60 * 60 * 1000,
  defaultToothTimerSec: 120,
  /** Poranny timer zębów — 1 minuta. */
  morningToothTimerSec: 60,
} as const;

export const BONUS = {
  ownComplete: 20,
  bothComplete: 50,
  earlyFinish: 15,
  defaultTaskPoints: 10,
} as const;

export const WEEKDAYS: readonly {
  id: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  short: string;
  long: string;
}[] = [
  { id: 'mon', short: 'Pn', long: 'Poniedziałek' },
  { id: 'tue', short: 'Wt', long: 'Wtorek' },
  { id: 'wed', short: 'Śr', long: 'Środa' },
  { id: 'thu', short: 'Cz', long: 'Czwartek' },
  { id: 'fri', short: 'Pt', long: 'Piątek' },
  { id: 'sat', short: 'Sb', long: 'Sobota' },
  { id: 'sun', short: 'Nd', long: 'Niedziela' },
];

export const SCHOOL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;

export const PANDA_SHEETS = ['panda-a', 'panda-b'] as const;

export const DEFAULT_PIN = '1111';

/**
 * Uniwersalny PIN admina: panel rodzica + reset fabryczny.
 * Działa zawsze, nawet gdy PIN rodzica jest pusty / zapomniany.
 */
export const ADMIN_FACTORY_PIN = '1608';

/** PIN rodzica do porównania — pusty / śmieci → domyślny. */
export function effectiveParentPin(pin: string): string {
  return /^\d{4}$/.test(pin) ? pin : DEFAULT_PIN;
}

/** Czy wpisany kod otwiera panel (PIN rodzica albo PIN admina). */
export function acceptsParentPin(input: string, storedPin: string): boolean {
  if (!/^\d{4}$/.test(input)) return false;
  if (input === ADMIN_FACTORY_PIN) return true;
  return input === effectiveParentPin(storedPin);
}

export const MOTION = {
  crossfadeSec: 0.25,
  sleepScale: 1.025,
  sleepSec: 3.6,
  bouncePx: 7,
  trainSec: 1.6,
  hurrySec: 0.55,
  celebrateBouncePx: 18,
  celebrateRotateDeg: 6,
  celebrateSec: 0.7,
  pulseScale: 1.07,
  pulseSec: 0.35,
  zzzSec: 2.4,
  zzzDelaySec: 0.45,
  zzzFromY: 8,
  zzzRisePx: 12,
  zzzRiseStepPx: 6,
  zzzSizePx: 14,
  zzzSizeStepPx: 4,
  starSec: 1.8,
} as const;

export const PANDA_STAGE = {
  width: '88%',
  startSizePx: 140,
} as const;

export const CELEBRATE_STARS: readonly { x: number; y: number; delay: number; size: number }[] = [
  { x: -42, y: -8, delay: 0, size: 18 },
  { x: 38, y: -18, delay: 0.12, size: 16 },
  { x: -18, y: -36, delay: 0.24, size: 14 },
  { x: 12, y: -44, delay: 0.08, size: 20 },
  { x: -52, y: 16, delay: 0.3, size: 12 },
  { x: 48, y: 10, delay: 0.18, size: 14 },
  { x: 0, y: -22, delay: 0.36, size: 12 },
  { x: 22, y: 24, delay: 0.22, size: 11 },
];
