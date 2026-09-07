import type { RoutineId, Task, Weekday } from '../types';
import { BONUS, SCHOOL_DAYS, TIME } from './constants';

export type AgePreset = 6 | 8;

/** Wspólna lista poranka dla obu synów (kolejność = kolejność dnia). */
const SHARED_MORNING: { label: string; icon: string; timerSec: number | null }[] = [
  { label: 'Wstać z łóżka', icon: 'bed', timerSec: null },
  { label: 'Śniadanie', icon: 'chopsticks', timerSec: null },
  { label: 'Umyć zęby', icon: 'toothbrush', timerSec: TIME.morningToothTimerSec },
  { label: 'Ubranie się', icon: 'clothes', timerSec: null },
  { label: 'Spakowanie plecaka', icon: 'backpack', timerSec: null },
];

const EVENING_LABELS: { label: string; icon: string; timerSec: number | null }[] = [
  { label: 'Umyć się', icon: 'soap', timerSec: null },
  { label: 'Zęby', icon: 'toothbrush', timerSec: TIME.defaultToothTimerSec },
  { label: 'Piżama', icon: 'clothes', timerSec: null },
  { label: 'Książka', icon: 'book', timerSec: 300 },
  { label: 'Do łóżka', icon: 'bed', timerSec: null },
];

function schoolDays(): Weekday[] {
  return [...SCHOOL_DAYS];
}

function mapTasks(
  kidKey: string,
  routine: RoutineId,
  labels: { label: string; icon: string; timerSec: number | null }[],
): Task[] {
  return labels.map((item, index) => ({
    id: `${kidKey}-${routine}-${index + 1}`,
    label: item.label,
    icon: item.icon,
    points: BONUS.defaultTaskPoints,
    order: index,
    days: schoolDays(),
    enabled: true,
    routine,
    timerSec: item.timerSec,
  }));
}

export function morningTasksForKey(kidKey: string): Task[] {
  return mapTasks(kidKey, 'morning', SHARED_MORNING);
}

export function eveningTasksForKey(kidKey: string): Task[] {
  return mapTasks(kidKey, 'evening', EVENING_LABELS);
}

/** AgePreset zostaje w API (onboarding), lista poranka jest wspólna. */
export function tasksForAgePreset(kidKey: string, _age: AgePreset): Task[] {
  return [...morningTasksForKey(kidKey), ...eveningTasksForKey(kidKey)];
}

/** Podmiana tylko poranka — wieczór i punkty zostają (migracja schematu). */
export function replaceMorningTasks(tasks: Task[], kidKey: string): Task[] {
  const evening = tasks.filter((task) => task.routine === 'evening');
  const morning = morningTasksForKey(kidKey);
  const orderBase = morning.length;
  return [
    ...morning,
    ...evening.map((task, index) => ({ ...task, order: orderBase + index })),
  ];
}

export function kidKeyFromId(kidId: string): string {
  return kidId === 'kid-2' ? 'k2' : 'k1';
}

export const ONBOARDING_STEPS = [
  'welcome',
  'kids',
  'pandas',
  'timing',
  'pin',
  'sound',
  'ipad',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  welcome: 'Witaj',
  kids: 'Dzieci',
  pandas: 'Pandy',
  timing: 'Poranek',
  pin: 'PIN',
  sound: 'Dźwięk',
  ipad: 'iPad',
};

export const ROUTINE_LABELS: Record<RoutineId, string> = {
  morning: 'Poranek',
  evening: 'Wieczór',
};
