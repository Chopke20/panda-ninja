import type { DayLog, Kid, Settings, Weekday } from '../types';
import { TIME } from './constants';
import { isListComplete, possiblePointsToday, weeklyPoints } from './scoring';
import { tasksForToday } from './tasks';

export function shouldShowSummary(
  nowMs: number,
  departure: Date | null,
  dismissedDate: string | null,
  today: string,
): boolean {
  if (!departure) return false;
  const elapsed = nowMs - departure.getTime();
  if (elapsed < 0 || elapsed > TIME.summaryVisibleMs) return false;
  return dismissedDate !== today;
}

/** Maksimum dnia (poranek): zadania + wszystkie możliwe bonusy. */
export function summaryPossible(kid: Kid, weekday: Weekday, settings: Settings): number {
  return possiblePointsToday(kid, weekday, settings, 'morning');
}

export function streakPhrase(streak: number): string {
  if (streak >= 2) return `🔥 ${streak} dni z rzędu z kompletem`;
  if (streak === 1) return '🔥 Komplet! Seria ruszyła.';
  return 'Kolejny komplet zacznie serię.';
}

export function closingPhrase(everyoneComplete: boolean): string {
  return everyoneComplete ? 'Perfekcyjny trening!' : 'Jutro damy radę!';
}

export function weeklyPhrase(
  logs: DayLog[],
  kidId: string,
  now: Date,
  weekly: Settings['weeklyReward'],
): string | null {
  if (!weekly) return null;
  const pts = weeklyPoints(logs, kidId, now);
  if (pts >= weekly.points) return `Próg tygodnia zdobyty: ${weekly.label}`;
  return `${pts} / ${weekly.points} do: ${weekly.label}`;
}

export function kidCompleteToday(kid: Kid, weekday: Weekday, completedIds: string[]): boolean {
  const due = tasksForToday(kid, weekday, 'morning');
  return isListComplete(due, completedIds);
}
