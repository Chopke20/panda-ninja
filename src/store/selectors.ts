import type { PandaPose, RoutinePhase } from '../types';

export { tasksForToday } from '../lib/tasks';

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

  if (phase !== 'active' || completedCount === 0) {
    return 'sleeping';
  }

  if (minutesLeft !== null && windowMin > 0 && minutesLeft / windowMin < 0.2) {
    return 'hurry';
  }

  return 'training';
}

export function kidProgress(completed: number, total: number): number {
  if (total <= 0) return 0;
  return completed / total;
}
