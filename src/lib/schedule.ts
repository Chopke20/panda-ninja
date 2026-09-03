import { TIME } from './constants';

/** Znacznik w `playedWarnings`: gong na starcie okna rutyny. */
export const WINDOW_GONG_MARK = -1;

export function voiceLineKey(mark: number): string {
  return mark === 0 ? 't0' : `t${mark}`;
}

export function fillVoiceLine(template: string, name: string): string {
  return template.replaceAll('{name}', name);
}

export function shouldPlayWindowGong(
  prevMinutes: number | null,
  minutesLeft: number | null,
  windowMin: number,
  played: readonly number[],
): boolean {
  if (minutesLeft === null || prevMinutes === null) return false;
  if (played.includes(WINDOW_GONG_MARK)) return false;
  return prevMinutes > windowMin && minutesLeft <= windowMin;
}

/**
 * Ostrzeżenia, które właśnie przekroczyliśmy (w tym dokładne trafienie).
 * Po śnie iPada zostaje tylko najpilniejsze, żeby nie sypać serią dźwięków.
 */
export function dueWarningMarks(
  prevMinutes: number | null,
  minutesLeft: number | null,
  warningsMin: readonly number[],
  played: readonly number[],
): number[] {
  if (minutesLeft === null) return [];
  const pending = warningsMin.filter((mark) => !played.includes(mark));
  if (pending.length === 0) return [];

  if (prevMinutes === null) {
    return pending.includes(minutesLeft) ? [minutesLeft] : [];
  }

  const crossed = pending
    .filter((mark) => prevMinutes > mark && minutesLeft <= mark)
    .sort((a, b) => b - a);
  if (crossed.length === 0) return [];
  const latest = crossed[crossed.length - 1];
  return latest === undefined ? [] : [latest];
}

/** T-20 → 1, T-10 → 2, T-5 → 3 (kolejność od najwcześniejszego). */
export function taikoCountForWarning(mark: number, warningsMin: readonly number[]): number {
  if (mark <= 0) return 0;
  const positives = warningsMin.filter((item) => item > 0).sort((a, b) => b - a);
  const index = positives.indexOf(mark);
  return index < 0 ? 1 : index + 1;
}

export function isDepartureGong(mark: number): boolean {
  return mark === 0;
}

export function departureGongCount(): number {
  return TIME.t0GongCount;
}
