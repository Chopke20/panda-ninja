import type { DayLog, Kid, RoutineId, TaskSnapshot } from '../types';
import { ROUTINE_IDS, TIME } from './constants';
import { addDaysIso } from './time';

export function emptyDayLog(
  date: string,
  kidId: string,
  plannedTasks?: TaskSnapshot[],
  routineId: RoutineId = 'morning',
): DayLog {
  return {
    date,
    kidId,
    routineId,
    completedTaskIds: [],
    pointsEarned: 0,
    finishedAt: null,
    onTime: false,
    ...(plannedTasks !== undefined ? { plannedTasks } : {}),
  };
}

export function trimLogsToDays(logs: DayLog[], today: string, keepDays: number = TIME.historyDays): DayLog[] {
  const oldest = addDaysIso(today, -(keepDays - 1));
  return logs.filter((log) => log.date >= oldest);
}

export type DaySlice = {
  logs: DayLog[];
  kids: [Kid, Kid];
  mutedToday: boolean;
  mutedDate: string | null;
  playedWarnings: number[];
};

/**
 * Jeśli brak wpisów na dziś — dopisz puste logi (poranek i wieczór).
 * Stare dni zostają w historii. Wyciszenie i odegrane ostrzeżenia resetują się z nową datą.
 */
export function applyDayRollover(
  state: DaySlice,
  today: string,
  planForKid?: (kidId: string, routineId: RoutineId) => TaskSnapshot[],
): DaySlice {
  const kidIds = state.kids.map((kid) => kid.id);
  const missing: { kidId: string; routineId: RoutineId }[] = [];
  for (const kidId of kidIds) {
    for (const routineId of ROUTINE_IDS) {
      const exists = state.logs.some(
        (log) =>
          log.date === today &&
          log.kidId === kidId &&
          (log.routineId ?? 'morning') === routineId,
      );
      if (!exists) missing.push({ kidId, routineId });
    }
  }
  const dateChanged = state.mutedDate !== today;

  if (missing.length === 0 && !dateChanged) {
    return state;
  }

  const logs =
    missing.length === 0
      ? state.logs
      : trimLogsToDays(
          [
            ...state.logs,
            ...missing.map(({ kidId, routineId }) =>
              emptyDayLog(today, kidId, planForKid?.(kidId, routineId) ?? [], routineId),
            ),
          ],
          today,
        );

  return {
    ...state,
    logs,
    mutedToday: dateChanged ? false : state.mutedToday,
    mutedDate: today,
    playedWarnings: dateChanged ? [] : state.playedWarnings,
  };
}

export function isMutedToday(mutedToday: boolean, mutedDate: string | null, today: string): boolean {
  return mutedToday && mutedDate === today;
}
