import type {
  AppState,
  DayException,
  DayLog,
  Kid,
  PointTransaction,
  PurchaseRequest,
  PurchaseRequestStatus,
  RoutineId,
  Settings,
  Task,
  TaskSnapshot,
  Weekday,
  WeeklyClaim,
} from '../types';
import { makeDefaultSettings, makeDefaultState } from '../store/defaults';
import { TASK_ICONS } from './catalog';
import { SCHEMA_VERSION, TIME } from './constants';
import { eveningTasksForKey, kidKeyFromId, replaceMorningTasks } from './onboarding';
import { snapshotTasks, tasksForToday } from './tasks';
import { todayIso, weekdayFromIso } from './time';
import {
  makeOpeningBalance,
  normalizeAppearance,
  ownedFromAppearance,
  syncKidWalletCache,
  walletBalance,
} from './wallet';

const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const REQUEST_STATUSES: PurchaseRequestStatus[] = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'expired',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeWeekdays(raw: unknown, fallback: Weekday[]): Weekday[] {
  if (!Array.isArray(raw)) return fallback;
  const days = raw.filter(
    (item): item is Weekday => typeof item === 'string' && WEEKDAYS.includes(item as Weekday),
  );
  return days.length > 0 ? days : fallback;
}

function normalizeRoutineId(raw: unknown): RoutineId {
  return raw === 'evening' ? 'evening' : 'morning';
}

function normalizeTimerSec(raw: unknown, icon: string): number | null {
  if (raw === null || raw === undefined) {
    return icon === 'toothbrush' ? TIME.defaultToothTimerSec : null;
  }
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return null;
  return Math.max(30, Math.min(1800, Math.round(raw)));
}

function normalizeTask(raw: unknown, index: number, kidId: string): Task | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id, `${kidId}-task-${index + 1}`);
  const label = asString(raw.label, 'Zadanie').trim().slice(0, 40) || 'Zadanie';
  const iconRaw = asString(raw.icon, 'bed');
  const icon = (TASK_ICONS as readonly string[]).includes(iconRaw) ? iconRaw : 'bed';
  return {
    id,
    label,
    icon,
    points: asNumber(raw.points, 10, 1, 99),
    order: asNumber(raw.order, index, 0, 999),
    days: normalizeWeekdays(raw.days, ['mon', 'tue', 'wed', 'thu', 'fri']),
    enabled: asBool(raw.enabled, true),
    routine: normalizeRoutineId(raw.routine),
    timerSec: normalizeTimerSec(raw.timerSec, icon),
  };
}

function kidKeyFromPersistedId(kidId: string): string {
  return kidId === 'kid-2' ? 'k2' : 'k1';
}

function ensureEveningTasks(tasks: Task[], kidId: string): Task[] {
  if (tasks.some((task) => task.routine === 'evening')) return tasks;
  const evening = eveningTasksForKey(kidKeyFromPersistedId(kidId));
  const orderBase =
    tasks.length === 0 ? 0 : Math.max(...tasks.map((task) => task.order)) + 1;
  return [
    ...tasks,
    ...evening.map((task, index) => ({ ...task, order: orderBase + index })),
  ];
}

function normalizeInventory(raw: unknown, fromAppearance: string[]): string[] {
  const base = new Set(fromAppearance);
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id === 'string' && id.length > 0) base.add(id);
    }
  }
  return [...base];
}

function normalizeKid(raw: unknown, fallback: Kid, seed: 'kid-1' | 'kid-2'): Kid | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string') return null;
  const tasksRaw = Array.isArray(raw.tasks) ? raw.tasks : [];
  const tasks = ensureEveningTasks(
    tasksRaw
      .map((task, index) => normalizeTask(task, index, raw.id as string))
      .filter((task): task is Task => task !== null),
    raw.id,
  );
  const panda = normalizeAppearance(raw.panda, seed);
  const inventory = normalizeInventory(raw.inventory, ownedFromAppearance(panda));
  return {
    id: raw.id,
    name: raw.name.trim().slice(0, 24) || fallback.name,
    panda,
    inventory,
    tasks: tasks.length > 0 ? tasks : fallback.tasks,
    totalPoints: asNumber(raw.totalPoints, 0, 0, 1_000_000),
    streak: asNumber(raw.streak, 0, 0, 10_000),
  };
}

function normalizeSnapshot(raw: unknown): TaskSnapshot | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string') return null;
  return {
    id: raw.id,
    label: asString(raw.label, 'Zadanie').slice(0, 40),
    points: asNumber(raw.points, 10, 1, 99),
    icon: asString(raw.icon, 'bed'),
    timerSec: normalizeTimerSec(raw.timerSec, asString(raw.icon, 'bed')),
  };
}

function normalizeLog(raw: unknown): DayLog | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.date !== 'string' || typeof raw.kidId !== 'string') return null;
  const planned = Array.isArray(raw.plannedTasks)
    ? raw.plannedTasks.map(normalizeSnapshot).filter((item): item is TaskSnapshot => item !== null)
    : undefined;
  return {
    date: raw.date,
    kidId: raw.kidId,
    routineId: normalizeRoutineId(raw.routineId),
    completedTaskIds: Array.isArray(raw.completedTaskIds)
      ? raw.completedTaskIds.filter((id): id is string => typeof id === 'string')
      : [],
    pointsEarned: asNumber(raw.pointsEarned, 0, 0, 1_000_000),
    finishedAt: typeof raw.finishedAt === 'string' ? raw.finishedAt : null,
    onTime: asBool(raw.onTime, false),
    plannedTasks: planned,
  };
}

function normalizeTransaction(raw: unknown): PointTransaction | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.kidId !== 'string') return null;
  const kind = asString(raw.kind, '');
  if (
    kind !== 'opening-balance' &&
    kind !== 'earn' &&
    kind !== 'purchase' &&
    kind !== 'refund' &&
    kind !== 'adjustment'
  ) {
    return null;
  }
  return {
    id: raw.id,
    kidId: raw.kidId,
    kind,
    amount: asNumber(raw.amount, 0, -1_000_000, 1_000_000),
    itemId: typeof raw.itemId === 'string' ? raw.itemId : null,
    dayLogKey: typeof raw.dayLogKey === 'string' ? raw.dayLogKey : null,
    createdAt: asString(raw.createdAt, new Date().toISOString()),
    note: typeof raw.note === 'string' ? raw.note : undefined,
  };
}

function normalizeRequest(raw: unknown): PurchaseRequest | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || typeof raw.kidId !== 'string' || typeof raw.itemId !== 'string') {
    return null;
  }
  const status = asString(raw.status, 'pending') as PurchaseRequestStatus;
  if (!REQUEST_STATUSES.includes(status)) return null;
  return {
    id: raw.id,
    kidId: raw.kidId,
    itemId: raw.itemId,
    priceSnapshot: asNumber(raw.priceSnapshot, 0, 0, 100_000),
    status,
    createdAt: asString(raw.createdAt, new Date().toISOString()),
    expiresAt: asString(raw.expiresAt, new Date().toISOString()),
  };
}

function normalizeClaim(raw: unknown): WeeklyClaim | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.weekStart !== 'string' || typeof raw.kidId !== 'string') return null;
  return {
    weekStart: raw.weekStart,
    kidId: raw.kidId,
    earnedAt: asString(raw.earnedAt, new Date().toISOString()),
    redeemedAt: typeof raw.redeemedAt === 'string' ? raw.redeemedAt : null,
    label: asString(raw.label, 'Nagroda'),
    points: asNumber(raw.points, 0, 0, 100_000),
  };
}

function normalizeDayException(raw: unknown): DayException | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.date !== 'string') return null;
  const override = raw.departureOverride;
  return {
    date: raw.date,
    freeDay: raw.freeDay === true,
    departureOverride:
      typeof override === 'string' && /^\d{2}:\d{2}$/.test(override) ? override : null,
    note: asString(raw.note, '').slice(0, 80),
  };
}

/** Migracja v2→v3: opening-balance z totalPoints minus dzisiejsze prowizoryczne. */
function ensureOpeningBalances(
  kids: [Kid, Kid],
  logs: DayLog[],
  transactions: PointTransaction[],
): { kids: [Kid, Kid]; transactions: PointTransaction[] } {
  if (transactions.length > 0) {
    const synced = kids.map((kid) => syncKidWalletCache(kid, transactions)) as [Kid, Kid];
    // Zachowaj prowizoryczne: wallet + dziś
    const today = todayIso();
    return {
      transactions,
      kids: synced.map((kid) => {
        const todayPts =
          logs.find((log) => log.date === today && log.kidId === kid.id)?.pointsEarned ?? 0;
        return { ...kid, totalPoints: walletBalance(transactions, kid.id) + todayPts };
      }) as [Kid, Kid],
    };
  }

  const today = todayIso();
  const createdAt = new Date().toISOString();
  const txs: PointTransaction[] = [];
  const nextKids = kids.map((kid) => {
    const todayPts =
      logs.find((log) => log.date === today && log.kidId === kid.id)?.pointsEarned ?? 0;
    const opening = Math.max(0, kid.totalPoints - todayPts);
    if (opening > 0) {
      txs.push(makeOpeningBalance(kid.id, opening, createdAt));
    }
    return { ...kid, totalPoints: opening + todayPts };
  }) as [Kid, Kid];

  return { kids: nextKids, transactions: txs };
}

export function serializeAppState(state: AppState): string {
  return `${JSON.stringify(
    {
      kids: state.kids,
      settings: state.settings,
      logs: state.logs,
      transactions: state.transactions,
      purchaseRequests: state.purchaseRequests,
      weeklyClaims: state.weeklyClaims,
      dayExceptions: state.dayExceptions,
      version: state.version,
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`;
}

export function normalizeSettings(raw: unknown): Settings {
  const defaults = makeDefaultSettings();
  if (!isRecord(raw)) return defaults;
  const s = raw as Partial<Settings>;
  const departure = { ...defaults.departure };
  if (isRecord(s.departure)) {
    for (const day of WEEKDAYS) {
      const value = s.departure[day];
      if (value === null) departure[day] = null;
      else if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) departure[day] = value;
    }
  }
  const eveningTarget = { ...defaults.eveningTarget };
  if (isRecord(s.eveningTarget)) {
    for (const day of WEEKDAYS) {
      const value = s.eveningTarget[day];
      if (value === null) eveningTarget[day] = null;
      else if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) eveningTarget[day] = value;
    }
  }
  return {
    ...defaults,
    departure,
    eveningTarget,
    routineWindowMin: asNumber(s.routineWindowMin, defaults.routineWindowMin, 15, 180),
    warningsMin:
      Array.isArray(s.warningsMin) && s.warningsMin.length > 0
        ? s.warningsMin.map((mark) => asNumber(mark, 0, 0, 180))
        : defaults.warningsMin,
    voiceLines: {
      ...defaults.voiceLines,
      ...(isRecord(s.voiceLines) ? (s.voiceLines as Settings['voiceLines']) : {}),
    },
    ttsEnabled: asBool(s.ttsEnabled, defaults.ttsEnabled),
    ttsVoiceURI: typeof s.ttsVoiceURI === 'string' ? s.ttsVoiceURI : null,
    volume: asNumber(s.volume, defaults.volume, 0, 1),
    pin: typeof s.pin === 'string' && /^\d{4}$/.test(s.pin) ? s.pin : defaults.pin,
    weeklyReward:
      s.weeklyReward === null
        ? null
        : isRecord(s.weeklyReward)
          ? {
              label: asString(s.weeklyReward.label, defaults.weeklyReward?.label ?? ''),
              points: asNumber(
                s.weeklyReward.points,
                defaults.weeklyReward?.points ?? 400,
                0,
                100_000,
              ),
            }
          : defaults.weeklyReward,
    specialReward: typeof s.specialReward === 'string' ? s.specialReward : '',
    bonuses: {
      ownComplete: asNumber(
        isRecord(s.bonuses) ? s.bonuses.ownComplete : undefined,
        defaults.bonuses.ownComplete,
        0,
        500,
      ),
      bothComplete: asNumber(
        isRecord(s.bonuses) ? s.bonuses.bothComplete : undefined,
        defaults.bonuses.bothComplete,
        0,
        500,
      ),
      earlyFinish: asNumber(
        isRecord(s.bonuses) ? s.bonuses.earlyFinish : undefined,
        defaults.bonuses.earlyFinish,
        0,
        500,
      ),
    },
    nextMissionMode: asBool(s.nextMissionMode, defaults.nextMissionMode),
    activeRoutine: normalizeRoutineId(s.activeRoutine),
  };
}

export function validateAppState(raw: unknown): AppState | null {
  if (!isRecord(raw)) return null;
  const defaults = makeDefaultState();
  if (!Array.isArray(raw.kids) || raw.kids.length !== 2) return null;
  const kid0 = normalizeKid(raw.kids[0], defaults.kids[0], 'kid-1');
  const kid1 = normalizeKid(raw.kids[1], defaults.kids[1], 'kid-2');
  if (!kid0 || !kid1) return null;
  const logs = Array.isArray(raw.logs)
    ? raw.logs.map(normalizeLog).filter((log): log is DayLog => log !== null)
    : [];
  const rawTx = Array.isArray(raw.transactions)
    ? raw.transactions.map(normalizeTransaction).filter((tx): tx is PointTransaction => tx !== null)
    : [];
  const { kids, transactions } = ensureOpeningBalances([kid0, kid1], logs, rawTx);
  const purchaseRequests = Array.isArray(raw.purchaseRequests)
    ? raw.purchaseRequests
        .map(normalizeRequest)
        .filter((req): req is PurchaseRequest => req !== null)
    : [];
  const weeklyClaims = Array.isArray(raw.weeklyClaims)
    ? raw.weeklyClaims.map(normalizeClaim).filter((c): c is WeeklyClaim => c !== null)
    : [];
  const dayExceptions = Array.isArray(raw.dayExceptions)
    ? raw.dayExceptions
        .map(normalizeDayException)
        .filter((item): item is DayException => item !== null)
    : [];

  return {
    kids,
    settings: normalizeSettings(raw.settings),
    logs,
    transactions,
    purchaseRequests,
    weeklyClaims,
    dayExceptions,
    version: SCHEMA_VERSION,
  };
}

export function parseAppState(json: string): AppState | null {
  try {
    return validateAppState(JSON.parse(json) as unknown);
  } catch {
    return null;
  }
}

export function logsToCsv(
  logs: AppState['logs'],
  kids: [Kid, Kid],
  limitDays: number = TIME.historyDays,
): string {
  const names = new Map(kids.map((kid) => [kid.id, kid.name]));
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limitDays * 2);
  const header = 'Data;Rutyna;Dziecko;Punkty;Zadań;Na czas';
  const rows = sorted.map((log) => {
    const name = names.get(log.kidId) ?? log.kidId;
    const onTime = log.onTime ? 'tak' : 'nie';
    const planned = log.plannedTasks?.length ?? log.completedTaskIds.length;
    const routine = (log.routineId ?? 'morning') === 'evening' ? 'wieczór' : 'poranek';
    return `${log.date};${routine};${escapeCsv(name)};${log.pointsEarned};${log.completedTaskIds.length}/${planned};${onTime}`;
  });
  return [header, ...rows].join('\n');
}

function escapeCsv(value: string): string {
  if (!/[;"\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/** Pola trzymane w localStorage obok AppState — stare kopie mogą ich nie mieć. */
export type PersistedSlice = AppState & {
  mutedToday: boolean;
  mutedDate: string | null;
  playedWarnings: number[];
  summaryDismissedDate: string | null;
  lastBackupAt: string | null;
  onboardingDone: boolean;
};

export function mergePersistedSlice(raw: unknown, fallback: PersistedSlice): PersistedSlice {
  const validated = validateAppState(raw);
  if (!validated) return fallback;
  if (!isRecord(raw)) return { ...fallback, ...validated };
  const warningsRaw = raw.playedWarnings;
  // Brak flagi = stara kopia → kreator pomijamy.
  const onboardingDone =
    raw.onboardingDone === false
      ? false
      : raw.onboardingDone === true
        ? true
        : true;

  const prevVersion = typeof raw.version === 'number' ? raw.version : 0;
  let kids = validated.kids;
  let logs = validated.logs;

  // v8: wspólna lista poranka (5 zadań) dla obu chłopców.
  if (prevVersion < 8) {
    kids = [
      {
        ...kids[0],
        tasks: replaceMorningTasks(kids[0].tasks, kidKeyFromId(kids[0].id)),
      },
      {
        ...kids[1],
        tasks: replaceMorningTasks(kids[1].tasks, kidKeyFromId(kids[1].id)),
      },
    ];
    const today = todayIso();
    const weekday = weekdayFromIso(today);
    logs = logs.map((log) => {
      if (log.date !== today) return log;
      const kid = kids.find((item) => item.id === log.kidId);
      if (!kid) return log;
      const routineId = log.routineId ?? 'morning';
      const planned = snapshotTasks(tasksForToday(kid, weekday, routineId));
      const allowed = new Set(planned.map((task) => task.id));
      return {
        ...log,
        plannedTasks: planned,
        completedTaskIds: log.completedTaskIds.filter((id) => allowed.has(id)),
      };
    });
  }

  return {
    ...validated,
    kids,
    logs,
    mutedToday: raw.mutedToday === true,
    mutedDate: typeof raw.mutedDate === 'string' ? raw.mutedDate : null,
    playedWarnings: Array.isArray(warningsRaw)
      ? warningsRaw.filter((mark): mark is number => typeof mark === 'number')
      : [],
    summaryDismissedDate:
      typeof raw.summaryDismissedDate === 'string' ? raw.summaryDismissedDate : null,
    lastBackupAt: typeof raw.lastBackupAt === 'string' ? raw.lastBackupAt : null,
    onboardingDone,
  };
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
