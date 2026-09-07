import type { RoutineId, Task, Weekday } from '../types';
import { BONUS, SCHOOL_DAYS, TIME } from './constants';

export type AgePreset = 6 | 8;

const FULL_MORNING: { label: string; icon: string; timerSec: number | null }[] = [
  { label: 'Wstać', icon: 'bed', timerSec: null },
  { label: 'Ubranie', icon: 'clothes', timerSec: null },
  { label: 'Śniadanie', icon: 'cereal', timerSec: null },
  { label: 'Zęby', icon: 'toothbrush', timerSec: TIME.defaultToothTimerSec },
  { label: 'Uczesać się', icon: 'hairbrush', timerSec: null },
  { label: 'Plecak', icon: 'backpack', timerSec: null },
  { label: 'Buty', icon: 'shoes', timerSec: null },
];

const YOUNG_MORNING = FULL_MORNING.filter(
  (item) => item.icon !== 'hairbrush' && item.icon !== 'backpack',
);

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

export function eveningTasksForKey(kidKey: string): Task[] {
  return mapTasks(kidKey, 'evening', EVENING_LABELS);
}

export function tasksForAgePreset(kidKey: string, age: AgePreset): Task[] {
  const morning = age === 6 ? YOUNG_MORNING : FULL_MORNING;
  return [...mapTasks(kidKey, 'morning', morning), ...eveningTasksForKey(kidKey)];
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
