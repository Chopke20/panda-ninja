import type { DayException, DayLog, Kid, RoutineId, Settings, Task, Weekday } from '../types';
import { SCHOOL_DAYS, TIME } from './constants';
import { emptyDayLog } from './day';
import { isFreeDay } from './dayExceptions';
import {
  addDaysIso,
  getTargetToday,
  getMinutesLeft,
  todayIso,
  weekRange,
  weekdayFromDate,
  weekdayFromIso,
} from './time';
import { dueFromLogOrKid, findDayLog, snapshotTasks, tasksForToday } from './tasks';

export function isSchoolWeekday(day: Weekday): boolean {
  return (SCHOOL_DAYS as readonly Weekday[]).includes(day);
}

export function isListComplete(due: Task[], completedIds: string[]): boolean {
  return due.length > 0 && due.every((task) => completedIds.includes(task.id));
}

export function taskPoints(points: number): number {
  return points;
}

export function ownCompleteBonus(allDone: boolean, bonus: number): number {
  return allDone ? bonus : 0;
}

export function bothCompleteBonus(bothDone: boolean, beforeDeparture: boolean, bonus: number): number {
  return bothDone && beforeDeparture ? bonus : 0;
}

export function earlyFinishBonus(
  allDone: boolean,
  minutesLeft: number | null,
  bonus: number,
  thresholdMin: number = TIME.earlyFinishMin,
): number {
  if (!allDone || minutesLeft === null) return 0;
  return minutesLeft >= thresholdMin ? bonus : 0;
}

export function nextStreakOnToggle(
  current: number,
  wasComplete: boolean,
  isComplete: boolean,
  schoolDay: boolean,
): number {
  if (!schoolDay) return current;
  if (!wasComplete && isComplete) return current + 1;
  if (wasComplete && !isComplete) return Math.max(0, current - 1);
  return current;
}

export function weeklyPoints(logs: DayLog[], kidId: string, now: Date): number {
  const { start, end } = weekRange(now);
  return logs
    .filter((log) => log.kidId === kidId && log.date >= start && log.date <= end)
    .reduce((sum, log) => sum + log.pointsEarned, 0);
}

export function possiblePointsToday(
  kid: Kid,
  weekday: Weekday,
  settings: Settings,
  routineId: RoutineId = 'morning',
): number {
  const due = tasksForToday(kid, weekday, routineId);
  const taskSum = due.reduce((sum, task) => sum + task.points, 0);
  return (
    taskSum +
    settings.bonuses.ownComplete +
    settings.bonuses.bothComplete +
    settings.bonuses.earlyFinish
  );
}

/**
 * Punktacja dnia.
 * `earlyAt` — moment kompletu tego dziecka (zamrożony finishedAt).
 * `bothAt` — moment, gdy obie listy były gotowe (późniejszy finishedAt), albo null.
 */
export function dayScore(args: {
  due: Task[];
  completedIds: string[];
  partnerComplete: boolean;
  earlyAt: Date;
  bothAt: Date | null;
  departure: Date | null;
  bonuses: Settings['bonuses'];
}): number {
  const done = args.due.filter((task) => args.completedIds.includes(task.id));
  const taskSum = done.reduce((sum, task) => sum + task.points, 0);
  const allDone = isListComplete(args.due, args.completedIds);
  const earlyMinutes = getMinutesLeft(args.earlyAt, args.departure);
  const bothBefore =
    args.bothAt !== null &&
    args.departure !== null &&
    args.bothAt.getTime() < args.departure.getTime();
  return (
    taskSum +
    ownCompleteBonus(allDone, args.bonuses.ownComplete) +
    bothCompleteBonus(allDone && args.partnerComplete, bothBefore, args.bonuses.bothComplete) +
    earlyFinishBonus(allDone, earlyMinutes, args.bonuses.earlyFinish)
  );
}

/** Seria liczy wyłącznie poranek. */
export function streakAfterMissedSchoolDay(
  kid: Kid,
  logs: DayLog[],
  today: string,
  exceptions: DayException[] = [],
): number {
  for (let back = 1; back <= 7; back += 1) {
    const date = addDaysIso(today, -back);
    if (isFreeDay(exceptions, date)) continue;
    const weekday = weekdayFromIso(date);
    const log = findDayLog(logs, date, kid.id, 'morning');
    const due = dueFromLogOrKid(log, kid, weekday, 'morning');
    if (due.length === 0) continue;
    const complete = log ? isListComplete(due, log.completedTaskIds) : false;
    return complete ? kid.streak : 0;
  }
  return kid.streak;
}

export function settleStreaks(
  kids: [Kid, Kid],
  logs: DayLog[],
  today: string,
  exceptions: DayException[] = [],
): [Kid, Kid] {
  return kids.map((kid) => ({
    ...kid,
    streak: streakAfterMissedSchoolDay(kid, logs, today, exceptions),
  })) as [Kid, Kid];
}

export type PointFlight = {
  kidId: string;
  points: number;
};

export type ToggleMode = 'complete' | 'uncomplete';

export type ToggleInput = {
  kids: [Kid, Kid];
  logs: DayLog[];
  settings: Settings;
  kidId: string;
  taskId: string;
  now: Date;
  mode: ToggleMode;
  dayExceptions?: DayException[];
  routineId?: RoutineId;
};

export type ToggleResult = {
  kids: [Kid, Kid];
  logs: DayLog[];
  flights: PointFlight[];
  ownJustCompleted: boolean;
  bothJustCompleted: boolean;
};

function ensureLog(
  logs: DayLog[],
  date: string,
  kidId: string,
  routineId: RoutineId,
  planned: ReturnType<typeof snapshotTasks>,
): DayLog[] {
  const existing = findDayLog(logs, date, kidId, routineId);
  if (existing) {
    if (Array.isArray(existing.plannedTasks)) return logs;
    return logs.map((log) =>
      log.date === date &&
      log.kidId === kidId &&
      (log.routineId ?? 'morning') === routineId
        ? { ...log, plannedTasks: planned, routineId }
        : log,
    );
  }
  return [...logs, emptyDayLog(date, kidId, planned, routineId)];
}

function parseFinishedAt(iso: string | null, fallback: Date): Date {
  if (!iso) return fallback;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

/** Czysta zmiana checka — komponenty tylko wywołują, bez liczenia bonusów. */
export function applyTaskToggle(input: ToggleInput): ToggleResult | null {
  const { settings, kidId, taskId, now, mode } = input;
  const routineId = input.routineId ?? settings.activeRoutine ?? 'morning';
  const weekday = weekdayFromDate(now);
  const date = todayIso(now);
  const actor = input.kids.find((kid) => kid.id === kidId);
  if (!actor) return null;

  const free = (input.dayExceptions ?? []).some((ex) => ex.date === date && ex.freeDay);
  if (free) return null;

  const due = tasksForToday(actor, weekday, routineId);
  const task = due.find((item) => item.id === taskId);
  if (!task) return null;

  let logs = input.logs;
  for (const kid of input.kids) {
    logs = ensureLog(
      logs,
      date,
      kid.id,
      routineId,
      snapshotTasks(tasksForToday(kid, weekday, routineId)),
    );
  }

  const currentLog = findDayLog(logs, date, kidId, routineId);
  if (!currentLog) return null;
  const already = currentLog.completedTaskIds.includes(taskId);
  if (mode === 'complete' && already) return null;
  if (mode === 'uncomplete' && !already) return null;

  const nextIds =
    mode === 'complete'
      ? [...currentLog.completedTaskIds, taskId]
      : currentLog.completedTaskIds.filter((id) => id !== taskId);

  const target = getTargetToday(settings, now, routineId, input.dayExceptions ?? []);
  const school = isSchoolWeekday(weekday);
  const dueFor = (kid: Kid) => tasksForToday(kid, weekday, routineId);
  const sameRoutine = (log: DayLog) =>
    log.date === date && (log.routineId ?? 'morning') === routineId;

  const beforeComplete = input.kids.map((kid) => {
    const log = findDayLog(logs, date, kid.id, routineId);
    const kidDue = dueFor(kid);
    return isListComplete(kidDue, log?.completedTaskIds ?? []);
  });

  const idsByKid = new Map<string, string[]>();
  for (const kid of input.kids) {
    const log = findDayLog(logs, date, kid.id, routineId);
    idsByKid.set(kid.id, log?.completedTaskIds ?? []);
  }
  idsByKid.set(kidId, nextIds);

  const completeByKid = new Map(
    input.kids.map((kid) => [
      kid.id,
      isListComplete(dueFor(kid), idsByKid.get(kid.id) ?? []),
    ]),
  );

  const oldEarned = new Map(
    input.kids.map((kid) => {
      const log = findDayLog(logs, date, kid.id, routineId);
      return [kid.id, log?.pointsEarned ?? 0] as const;
    }),
  );

  const finishedAtByKid = new Map<string, string | null>();
  for (const kid of input.kids) {
    const log = findDayLog(logs, date, kid.id, routineId);
    const complete = completeByKid.get(kid.id) === true;
    if (!complete) {
      finishedAtByKid.set(kid.id, null);
      continue;
    }
    const previous = log?.finishedAt ?? null;
    if (previous) {
      finishedAtByKid.set(kid.id, previous);
    } else if (kid.id === kidId && mode === 'complete') {
      finishedAtByKid.set(kid.id, now.toISOString());
    } else {
      finishedAtByKid.set(kid.id, previous ?? now.toISOString());
    }
  }

  const bothComplete = input.kids.every((kid) => completeByKid.get(kid.id) === true);
  let bothAt: Date | null = null;
  if (bothComplete) {
    const times = input.kids.map((kid) => parseFinishedAt(finishedAtByKid.get(kid.id) ?? null, now));
    bothAt = new Date(Math.max(...times.map((t) => t.getTime())));
  }

  const flights: PointFlight[] = [];
  let kids = input.kids;

  logs = logs.map((log) => {
    if (!sameRoutine(log)) return log;
    const kid = kids.find((item) => item.id === log.kidId);
    if (!kid) return log;
    const ids = idsByKid.get(kid.id) ?? log.completedTaskIds;
    const partnerId = kids.find((item) => item.id !== kid.id)?.id;
    const partnerComplete = partnerId ? completeByKid.get(partnerId) === true : false;
    const complete = completeByKid.get(kid.id) === true;
    const finishedAt = finishedAtByKid.get(kid.id) ?? null;
    const earlyAt = parseFinishedAt(finishedAt, now);
    const earned = dayScore({
      due: dueFor(kid),
      completedIds: ids,
      partnerComplete,
      earlyAt,
      bothAt,
      departure: target,
      bonuses: settings.bonuses,
    });
    const beforeTarget =
      finishedAt !== null &&
      target !== null &&
      parseFinishedAt(finishedAt, now).getTime() < target.getTime();
    return {
      ...log,
      routineId,
      completedTaskIds: ids,
      pointsEarned: earned,
      finishedAt,
      onTime: complete && beforeTarget,
      plannedTasks: Array.isArray(log.plannedTasks)
        ? log.plannedTasks
        : snapshotTasks(dueFor(kid)),
    };
  });

  kids = kids.map((kid, index) => {
    const newEarned = findDayLog(logs, date, kid.id, routineId)?.pointsEarned ?? 0;
    const old = oldEarned.get(kid.id) ?? 0;
    const delta = newEarned - old;
    if (delta > 0) {
      flights.push({ kidId: kid.id, points: delta });
    }
    const streakTouches =
      routineId === 'morning'
        ? nextStreakOnToggle(
            kid.streak,
            beforeComplete[index] === true,
            completeByKid.get(kid.id) === true,
            school,
          )
        : kid.streak;
    return {
      ...kid,
      totalPoints: Math.max(0, kid.totalPoints + delta),
      streak: streakTouches,
    };
  }) as [Kid, Kid];

  const actorIndex = input.kids.findIndex((kid) => kid.id === kidId);
  const ownJustCompleted =
    mode === 'complete' &&
    beforeComplete[actorIndex] === false &&
    completeByKid.get(kidId) === true;
  const bothAfter = input.kids.every((kid) => completeByKid.get(kid.id) === true);
  const bothBefore = beforeComplete[0] === true && beforeComplete[1] === true;
  const bothJustCompleted = mode === 'complete' && !bothBefore && bothAfter;

  return {
    kids,
    logs,
    flights,
    ownJustCompleted,
    bothJustCompleted,
  };
}
