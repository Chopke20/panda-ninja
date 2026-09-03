/** Spokojny timer misji — czas wyłącznie z Date.now(), bez kar. */

export function timerRemainingSec(endsAtMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000));
}

export function formatTimerClock(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function timerEndsAt(nowMs: number, durationSec: number): number {
  return nowMs + Math.max(0, durationSec) * 1000;
}
