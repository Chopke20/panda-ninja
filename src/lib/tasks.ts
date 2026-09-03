import type { Kid, RoutineId, Task, TaskSnapshot, Weekday } from '../types';

/** Zadania obowiązujące w danym dniu i rutynie, posortowane. */
export function tasksForToday(
  kid: Kid,
  weekday: Weekday,
  routineId: RoutineId = 'morning',
): Task[] {
  return kid.tasks
    .filter(
      (task) =>
        task.enabled &&
        task.days.includes(weekday) &&
        (task.routine ?? 'morning') === routineId,
    )
    .slice()
    .sort((a, b) => a.order - b.order);
}

export function snapshotTasks(tasks: Task[]): TaskSnapshot[] {
  return tasks.map((task) => ({
    id: task.id,
    label: task.label,
    points: task.points,
    icon: task.icon,
    timerSec: task.timerSec ?? null,
  }));
}

/** Do oceny historii: snapshot z dnia (także pusty) albo bieżąca lista. */
export function dueFromLogOrKid(
  log: { plannedTasks?: TaskSnapshot[]; routineId?: RoutineId } | undefined,
  kid: Kid,
  weekday: Weekday,
  routineId: RoutineId = 'morning',
): Task[] {
  if (log && Array.isArray(log.plannedTasks)) {
    return log.plannedTasks.map((item, index) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      points: item.points,
      order: index,
      days: [weekday],
      enabled: true,
      routine: routineId,
      timerSec: item.timerSec ?? null,
    }));
  }
  return tasksForToday(kid, weekday, routineId);
}

export function findDayLog<T extends { date: string; kidId: string; routineId?: RoutineId }>(
  logs: T[],
  date: string,
  kidId: string,
  routineId: RoutineId = 'morning',
): T | undefined {
  return logs.find(
    (log) =>
      log.date === date &&
      log.kidId === kidId &&
      (log.routineId ?? 'morning') === routineId,
  );
}
