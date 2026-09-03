import type { Kid, Settings, Task, Weekday, AppState } from '../types';
import { BONUS, DEFAULT_PIN, SCHEMA_VERSION, SCHOOL_DAYS, TIME } from '../lib/constants';
import { defaultOwnedIds } from '../lib/cosmetics';
import { tasksForAgePreset } from '../lib/onboarding';
import { makeDefaultAppearance, ownedFromAppearance } from '../lib/wallet';

const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function emptySchedule(defaultHm: string): Record<Weekday, string | null> {
  const schedule = {} as Record<Weekday, string | null>;
  for (const day of WEEKDAYS) {
    schedule[day] = SCHOOL_DAYS.includes(day as (typeof SCHOOL_DAYS)[number])
      ? defaultHm
      : null;
  }
  return schedule;
}

function makeInventory(panda: ReturnType<typeof makeDefaultAppearance>): string[] {
  return [...new Set([...defaultOwnedIds(), ...ownedFromAppearance(panda)])];
}

export function makeKid1(): Kid {
  const panda = makeDefaultAppearance('kid-1');
  return {
    id: 'kid-1',
    name: 'Syn 1',
    panda,
    inventory: makeInventory(panda),
    tasks: tasksForAgePreset('k1', 8),
    totalPoints: 0,
    streak: 0,
  };
}

export function makeKid2(): Kid {
  const panda = makeDefaultAppearance('kid-2');
  return {
    id: 'kid-2',
    name: 'Syn 2',
    panda,
    inventory: makeInventory(panda),
    tasks: tasksForAgePreset('k2', 8),
    totalPoints: 0,
    streak: 0,
  };
}

export function makeDefaultSettings(): Settings {
  return {
    departure: emptySchedule(TIME.defaultDeparture),
    eveningTarget: emptySchedule(TIME.defaultEvening),
    routineWindowMin: TIME.defaultWindowMin,
    warningsMin: [...TIME.defaultWarningsMin],
    voiceLines: {
      t20: 'Zostało dwadzieścia minut.',
      t10: 'Dziesięć minut do wyjścia. Sprawdźcie plecaki.',
      t5: 'Pięć minut! Kurtki i buty.',
      t0: 'Czas wychodzić z mamą!',
      complete: '{name} gotowy! Świetny trening.',
      timerDone: 'Koniec timera. Świetnie Ci idzie.',
    },
    ttsEnabled: true,
    ttsVoiceURI: null,
    volume: 0.8,
    pin: DEFAULT_PIN,
    weeklyReward: {
      label: 'Wybór filmu w piątek',
      points: 400,
    },
    specialReward: '',
    bonuses: {
      ownComplete: BONUS.ownComplete,
      bothComplete: BONUS.bothComplete,
      earlyFinish: BONUS.earlyFinish,
    },
    nextMissionMode: false,
    activeRoutine: 'morning',
  };
}

export function makeDefaultState(): AppState {
  return {
    kids: [makeKid1(), makeKid2()],
    settings: makeDefaultSettings(),
    logs: [],
    transactions: [],
    purchaseRequests: [],
    weeklyClaims: [],
    dayExceptions: [],
    version: SCHEMA_VERSION,
  };
}

/** Pełna lista 7 zadań — do testów scoringu. */
export function makeTasksForTests(kidKey: string): Task[] {
  return tasksForAgePreset(kidKey, 8);
}
