import { describe, expect, it } from 'vitest';
import { makeKid1, makeKid2 } from '../store/defaults';
import { applyDayRollover, emptyDayLog, trimLogsToDays } from './day';
import type { DayLog } from '../types';

function slice(logs: DayLog[], mutedDate: string | null = null, mutedToday = false) {
  return {
    logs,
    kids: [makeKid1(), makeKid2()] as [ReturnType<typeof makeKid1>, ReturnType<typeof makeKid2>],
    mutedToday,
    mutedDate,
    playedWarnings: [20, 10],
  };
}

describe('day rollover', () => {
  it('puste logi → tworzy dzisiejsze wpisy dla obu dzieci i obu rutyn', () => {
    const next = applyDayRollover(slice([]), '2026-09-02');
    expect(next.logs).toHaveLength(4);
    expect(next.logs.every((log) => log.date === '2026-09-02')).toBe(true);
    expect(next.logs.filter((log) => log.routineId === 'morning')).toHaveLength(2);
    expect(next.logs.filter((log) => log.routineId === 'evening')).toHaveLength(2);
    expect(next.logs.every((log) => log.completedTaskIds.length === 0)).toBe(true);
    expect(next.mutedDate).toBe('2026-09-02');
    expect(next.mutedToday).toBe(false);
    expect(next.playedWarnings).toEqual([]);
  });

  it('wczorajsze logi zostają, dziś dostaje puste checki', () => {
    const yesterday: DayLog[] = [
      { ...emptyDayLog('2026-09-01', 'kid-1'), completedTaskIds: ['k1-morning-1'], pointsEarned: 10 },
      { ...emptyDayLog('2026-09-01', 'kid-2'), completedTaskIds: ['k2-morning-1'], pointsEarned: 10 },
    ];
    const next = applyDayRollover(slice(yesterday, '2026-09-01'), '2026-09-02');
    expect(next.logs).toHaveLength(6);
    const today = next.logs.filter((log) => log.date === '2026-09-02');
    expect(today).toHaveLength(4);
    expect(today.every((log) => log.completedTaskIds.length === 0)).toBe(true);
    expect(next.logs.find((log) => log.date === '2026-09-01' && log.kidId === 'kid-1')?.pointsEarned).toBe(
      10,
    );
  });

  it('gdy dziś już jest — nie duplikuje i nie rusza wyciszenia', () => {
    const todayLogs = [
      emptyDayLog('2026-09-02', 'kid-1', [], 'morning'),
      emptyDayLog('2026-09-02', 'kid-2', [], 'morning'),
      emptyDayLog('2026-09-02', 'kid-1', [], 'evening'),
      emptyDayLog('2026-09-02', 'kid-2', [], 'evening'),
    ];
    const prev = slice(todayLogs, '2026-09-02', true);
    const next = applyDayRollover(prev, '2026-09-02');
    expect(next).toBe(prev);
    expect(next.mutedToday).toBe(true);
    expect(next.playedWarnings).toEqual([20, 10]);
  });

  it('gdy brakuje wieczoru — dopina brakujące rutyny', () => {
    const partial = [
      emptyDayLog('2026-09-02', 'kid-1', [], 'morning'),
      emptyDayLog('2026-09-02', 'kid-2', [], 'morning'),
    ];
    const next = applyDayRollover(slice(partial, '2026-09-02', true), '2026-09-02');
    expect(next.logs).toHaveLength(4);
    expect(next.logs.filter((log) => log.routineId === 'evening')).toHaveLength(2);
    expect(next.mutedToday).toBe(true);
  });

  it('północ resetuje wyciszenie i ostrzeżenia', () => {
    const todayLogs = [emptyDayLog('2026-09-01', 'kid-1'), emptyDayLog('2026-09-01', 'kid-2')];
    const next = applyDayRollover(slice(todayLogs, '2026-09-01', true), '2026-09-02');
    expect(next.mutedToday).toBe(false);
    expect(next.mutedDate).toBe('2026-09-02');
    expect(next.playedWarnings).toEqual([]);
  });

  it('przycina historię do roku', () => {
    const logs: DayLog[] = [
      emptyDayLog('2025-09-01', 'kid-1'),
      emptyDayLog('2026-01-10', 'kid-1'),
      emptyDayLog('2026-09-02', 'kid-1'),
    ];
    const trimmed = trimLogsToDays(logs, '2026-09-02', 365);
    expect(trimmed.some((log) => log.date === '2025-09-01')).toBe(false);
    expect(trimmed.some((log) => log.date === '2026-01-10')).toBe(true);
    expect(trimmed.some((log) => log.date === '2026-09-02')).toBe(true);
  });
});
