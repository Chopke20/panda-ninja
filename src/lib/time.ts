import type {
  DayException,
  RoutineId,
  Settings,
  RoutinePhase,
  TimelineColor,
  Weekday,
} from '../types';
import { BG, TIME } from './constants';
import { getDayException } from './dayExceptions';

const WEEKDAY_INDEX: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function weekdayFromDate(now: Date): Weekday {
  return WEEKDAY_INDEX[now.getDay()] ?? 'mon';
}

/** Poranek vs wieczór wg godziny (ekran startowy / atmosfera). */
export function routineFromHour(now: Date): RoutineId {
  const hour = now.getHours();
  return hour >= BG.eveningFromHour || hour < 5 ? 'evening' : 'morning';
}

export function weekdayFromIso(iso: string): Weekday {
  const [y, m, d] = iso.split('-').map(Number);
  return weekdayFromDate(new Date(y ?? 0, (m ?? 1) - 1, d ?? 1));
}

/** Poniedziałek–niedziela bieżącego tygodnia, lokalnie. */
export function weekRange(now: Date): { start: string; end: string } {
  const day = now.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const start = todayIso(monday);
  return { start, end: addDaysIso(start, 6) };
}

/** Data kalendarzowa w strefie lokalnej — nigdy z toISOString() (UTC psuje północ). */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y ?? 0, (m ?? 1) - 1, d);
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

export function parseHm(hhmm: string, day: Date): Date {
  const [hRaw, mRaw] = hhmm.split(':');
  const hours = Number(hRaw);
  const minutes = Number(mRaw);
  const result = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0);
  return result;
}

export function formatClock(now: Date): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function getDepartureToday(
  settings: Settings,
  now: Date,
  exceptions: DayException[] = [],
): Date | null {
  const date = todayIso(now);
  const ex = getDayException(exceptions, date);
  if (ex?.freeDay) return null;
  if (ex?.departureOverride && /^\d{2}:\d{2}$/.test(ex.departureOverride)) {
    return parseHm(ex.departureOverride, now);
  }
  const key = weekdayFromDate(now);
  const value = settings.departure[key];
  if (!value) return null;
  return parseHm(value, now);
}

/** Godzina snu / koniec wieczoru — bez override (tylko wolne wyłącza). */
export function getEveningTargetToday(
  settings: Settings,
  now: Date,
  exceptions: DayException[] = [],
): Date | null {
  const date = todayIso(now);
  const ex = getDayException(exceptions, date);
  if (ex?.freeDay) return null;
  const key = weekdayFromDate(now);
  const value = settings.eveningTarget?.[key] ?? null;
  if (!value) return null;
  return parseHm(value, now);
}

/** Cel osi czasu: wyjście rano albo sen wieczorem. */
export function getTargetToday(
  settings: Settings,
  now: Date,
  routineId: RoutineId,
  exceptions: DayException[] = [],
): Date | null {
  return routineId === 'evening'
    ? getEveningTargetToday(settings, now, exceptions)
    : getDepartureToday(settings, now, exceptions);
}

export function getRoutinePhase(
  now: Date,
  departure: Date | null,
  windowMin: number,
): RoutinePhase {
  if (!departure) return 'before';
  if (now.getTime() >= departure.getTime()) return 'past';
  const start = departure.getTime() - windowMin * 60_000;
  if (now.getTime() < start) return 'before';
  return 'active';
}

export function getProgress(now: Date, departure: Date | null, windowMin: number): number {
  if (!departure || windowMin <= 0) return 0;
  const windowMs = windowMin * 60_000;
  const start = departure.getTime() - windowMs;
  const t = now.getTime();
  if (t <= start) return 0;
  if (t >= departure.getTime()) return 1;
  return (t - start) / windowMs;
}

/** Całe minuty do wyjścia, z Date.now() — floor, żeby ostrzeżenia T-n odpalały się raz. */
export function getMinutesLeft(now: Date, departure: Date | null): number | null {
  if (!departure) return null;
  return Math.floor((departure.getTime() - now.getTime()) / 60_000);
}

export function getRatioLeft(
  now: Date,
  departure: Date | null,
  windowMin: number,
): number {
  if (!departure || windowMin <= 0) return 1;
  const minutes = getMinutesLeft(now, departure);
  if (minutes === null) return 1;
  return Math.max(0, Math.min(1, minutes / windowMin));
}

export function getTimelineColor(ratioLeft: number): TimelineColor {
  if (ratioLeft > 0.5) return 'green';
  if (ratioLeft >= 0.2) return 'amber';
  return 'red';
}

function pluralMinutes(n: number): string {
  if (n === 1) return 'minuta';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'minuty';
  return 'minut';
}

export function formatCountdown(
  minutes: number | null,
  windowMin: number = TIME.defaultWindowMin,
  routineId: RoutineId = 'morning',
): string {
  const evening = routineId === 'evening';
  if (minutes === null) return evening ? 'Dziś bez wieczoru' : 'Dziś bez treningu';
  if (minutes <= 0) return evening ? 'Czas do snu!' : 'Czas wychodzić!';
  if (minutes > windowMin) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const prefix = evening ? 'Do snu' : 'Do wyjścia';
    if (hours === 0) return `${prefix}: ${rest} min`;
    if (rest === 0) return `${prefix}: ${hours} godz`;
    return `${prefix}: ${hours} godz ${rest} min`;
  }
  if (minutes <= 5) return evening ? 'Ostatnie spokojne minuty' : 'Ostatnie 5 minut!';
  return `Zostało ${minutes} ${pluralMinutes(minutes)}`;
}

/** Pozycje znaczników T-n na osi (0 = start okna, 1 = godzina wyjścia). */
export function warningMarkerPositions(windowMin: number, warningsMin: number[]): number[] {
  if (windowMin <= 0) return [];
  return warningsMin
    .filter((mark) => mark > 0 && mark < windowMin)
    .map((mark) => 1 - mark / windowMin);
}
