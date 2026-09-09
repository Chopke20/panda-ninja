import type { PandaPose, RoutinePhase } from '../types';

export { tasksForToday } from '../lib/tasks';

/**
 * Pozy pandy na ekranie głównym (4 sprite’y):
 * - sleeping — jeszcze nic nie odhaczone
 * - training — w trakcie listy
 * - hurry — w trakcie, ale mało czasu / po deadline
 * - celebrating — wszystkie zadania dnia zrobione
 *
 * Postęp zadań ma pierwszeństwo przed fazą zegara — inaczej poza oknem
 * rutyny widać tylko medytację i radość.
 */
export function getPandaPose(args: {
  completedCount: number;
  totalCount: number;
  phase: RoutinePhase;
  minutesLeft: number | null;
  windowMin: number;
}): PandaPose {
  const { completedCount, totalCount, phase, minutesLeft, windowMin } = args;

  if (totalCount > 0 && completedCount >= totalCount) {
    return 'celebrating';
  }

  if (completedCount <= 0) {
    return 'sleeping';
  }

  const timeTight =
    minutesLeft !== null && windowMin > 0 && minutesLeft / windowMin < 0.2;
  if (phase === 'past' || timeTight) {
    return 'hurry';
  }

  return 'training';
}

export function kidProgress(completed: number, total: number): number {
  if (total <= 0) return 0;
  return completed / total;
}
