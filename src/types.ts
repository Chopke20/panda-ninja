export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type RoutineId = 'morning' | 'evening';

export type PandaBodyId = 'round' | 'agile';

/**
 * Wygląd pandy po uproszczeniu: linia ewolucji + kolor kimona + logo.
 * Futro, oczy, broń z warstw i gadżety — usunięte (były niewidoczne / kłamliwe).
 */
export type PandaAppearance = {
  body: PandaBodyId;
  /** Stadium ewolucji 1…6 (najwyższe odblokowane). */
  stage: number;
  /** Hex koloru kimona (recolor chroma w runtime). */
  outfitColor: string;
  logoId: string;
  /** Kolor ramki panelu i pasków UI — nie panda. */
  accent: string;
};

/** @deprecated — tylko migracja starych zapisów. */
export type FurTone = 'classic' | 'snow' | 'bamboo';
/** @deprecated — tylko migracja starych zapisów. */
export type FaceMark = 'classic' | 'round' | 'bolt' | 'mask';
/** @deprecated — paper-doll slots. */
export type CosmeticSlot =
  | 'hand'
  | 'head'
  | 'back'
  | 'belt'
  | 'aura'
  | 'headbandLogo'
  | 'outfitPattern';

/** @deprecated — tylko do migracji starych kopii. */
export type LegacyPandaConfig = {
  weapon?: string;
  headband?: string;
  outfit?: string;
  accent?: string;
};

export type Task = {
  id: string;
  label: string;
  icon: string;
  points: number;
  order: number;
  days: Weekday[];
  enabled: boolean;
  routine: RoutineId;
  /** Spokojny timer misji w sekundach; null = bez timera. */
  timerSec: number | null;
};

export type Kid = {
  id: string;
  name: string;
  panda: PandaAppearance;
  inventory: string[];
  tasks: Task[];
  /** Cache salda z ledgeru — źródłem prawdy jest PointTransaction[]. */
  totalPoints: number;
  streak: number;
};

export type TaskSnapshot = {
  id: string;
  label: string;
  points: number;
  icon: string;
  timerSec?: number | null;
};

export type DayLog = {
  date: string;
  kidId: string;
  routineId: RoutineId;
  completedTaskIds: string[];
  pointsEarned: number;
  finishedAt: string | null;
  onTime: boolean;
  plannedTasks?: TaskSnapshot[];
};

export type PointTransactionKind =
  | 'opening-balance'
  | 'earn'
  | 'purchase'
  | 'refund'
  | 'adjustment';

export type PointTransaction = {
  id: string;
  kidId: string;
  kind: PointTransactionKind;
  amount: number;
  itemId: string | null;
  dayLogKey: string | null;
  createdAt: string;
  note?: string;
};

export type PurchaseRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type PurchaseRequest = {
  id: string;
  kidId: string;
  itemId: string;
  priceSnapshot: number;
  status: PurchaseRequestStatus;
  createdAt: string;
  expiresAt: string;
};

export type WeeklyClaim = {
  weekStart: string;
  kidId: string;
  earnedAt: string;
  redeemedAt: string | null;
  label: string;
  points: number;
};

export type Settings = {
  departure: Record<Weekday, string | null>;
  routineWindowMin: number;
  warningsMin: number[];
  voiceLines: Record<string, string>;
  ttsEnabled: boolean;
  ttsVoiceURI: string | null;
  volume: number;
  pin: string;
  weeklyReward: { label: string; points: number } | null;
  specialReward: string;
  bonuses: { ownComplete: number; bothComplete: number; earlyFinish: number };
  /** Duży kafel bieżącego zadania zamiast pełnej listy. */
  nextMissionMode: boolean;
  /** Godzina snu / koniec wieczoru per dzień. */
  eveningTarget: Record<Weekday, string | null>;
  /** Która rutyna jest teraz na ekranie. */
  activeRoutine: RoutineId;
};

/** Jednorazowy wyjątek kalendarzowy (choroba, wycieczka, wolne). */
export type DayException = {
  date: string;
  /** Dzień wolny — bez rutyny, seria bez kary. */
  freeDay: boolean;
  /** Jednorazowa godzina wyjścia HH:MM; null = wg tygodnia. */
  departureOverride: string | null;
  note: string;
};

export type AppState = {
  kids: [Kid, Kid];
  settings: Settings;
  logs: DayLog[];
  transactions: PointTransaction[];
  purchaseRequests: PurchaseRequest[];
  weeklyClaims: WeeklyClaim[];
  dayExceptions: DayException[];
  version: number;
};

export type PandaPose = 'sleeping' | 'training' | 'hurry' | 'celebrating';

export type RoutinePhase = 'before' | 'active' | 'past';

export type TimelineColor = 'green' | 'amber' | 'red';

export type UiScreen = 'start' | 'main' | 'summary' | 'parent' | 'shop' | 'onboarding';
