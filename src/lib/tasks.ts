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

/**
 * Przestawia zadanie w górę/dół tylko w obrębie tej samej rutyny
 * (w UI rodzica widać poranek albo wieczór osobno).
 * Nadaje gęste order 0…n−1 w tej rutynie — działa też przy dziurach / kolizjach.
 */
export function moveTaskInRoutine(
  tasks: Task[],
  taskId: string,
  direction: 'up' | 'down',
): Task[] {
  const target = tasks.find((task) => task.id === taskId);
  if (!target) return tasks;
  const routine = target.routine ?? 'morning';
  const inRoutine = tasks
    .filter((task) => (task.routine ?? 'morning') === routine)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const index = inRoutine.findIndex((task) => task.id === taskId);
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= inRoutine.length) return tasks;

  const reordered = [...inRoutine];
  const current = reordered[index];
  const neighbor = reordered[swapWith];
  if (!current || !neighbor) return tasks;
  reordered[index] = neighbor;
  reordered[swapWith] = current;

  const orderById = new Map(reordered.map((task, i) => [task.id, i]));
  return tasks.map((task) => {
    const nextOrder = orderById.get(task.id);
    return nextOrder === undefined ? task : { ...task, order: nextOrder };
  });
}
