import type { DayException } from '../types';
import { TIME } from './constants';
import { addDaysIso } from './time';

export function getDayException(
  exceptions: DayException[],
  date: string,
): DayException | undefined {
  return exceptions.find((item) => item.date === date);
}

export function isFreeDay(exceptions: DayException[], date: string): boolean {
  return getDayException(exceptions, date)?.freeDay === true;
}

export function emptyDayException(date: string): DayException {
  return {
    date,
    freeDay: false,
    departureOverride: null,
    note: '',
  };
}

export function upsertDayException(
  exceptions: DayException[],
  next: DayException,
): DayException[] {
  const without = exceptions.filter((item) => item.date !== next.date);
  const idle = !next.freeDay && next.departureOverride === null && !next.note.trim();
  if (idle) return without;
  return [...without, next];
}

export function trimDayExceptions(
  exceptions: DayException[],
  today: string,
  keepDays: number = TIME.historyDays,
): DayException[] {
  const oldest = addDaysIso(today, -(keepDays - 1));
  const next = exceptions.filter((item) => item.date >= oldest);
  // Ta sama referencja, gdy nic nie wypadło — inaczej ensureToday wpadłby w pętlę set().
  return next.length === exceptions.length ? exceptions : next;
}
