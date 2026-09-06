import { describe, expect, it } from 'vitest';
import { makeKid1, makeKid2, makeDefaultSettings } from '../store/defaults';
import { emptyDayLog } from './day';
import {
  emptyDayException,
  isFreeDay,
  trimDayExceptions,
  upsertDayException,
} from './dayExceptions';
import { settleStreaks } from './scoring';
import { dueFromLogOrKid } from './tasks';
import { getDepartureToday, todayIso } from './time';

describe('dayExceptions', () => {
  it('wolny dzień wyłącza wyjście', () => {
    const settings = makeDefaultSettings();
    const now = new Date(2026, 8, 2, 7, 0, 0);
    const date = todayIso(now);
    const exceptions = upsertDayException([], {
      ...emptyDayException(date),
      freeDay: true,
    });
    expect(isFreeDay(exceptions, date)).toBe(true);
    expect(getDepartureToday(settings, now, exceptions)).toBeNull();
  });

  it('override godziny ma pierwszeństwo przed tygodniem', () => {
    const settings = makeDefaultSettings();
    const now = new Date(2026, 8, 2, 7, 0, 0);
    const date = todayIso(now);
    const exceptions = [
      { date, freeDay: false, departureOverride: '08:15', note: 'wycieczka' },
    ];
    const dep = getDepartureToday(settings, now, exceptions);
    expect(dep?.getHours()).toBe(8);
    expect(dep?.getMinutes()).toBe(15);
  });

  it('pusty plannedTasks / wolne nie psuje serii', () => {
    const kids: [ReturnType<typeof makeKid1>, ReturnType<typeof makeKid2>] = [
      { ...makeKid1(), streak: 5 },
      makeKid2(),
    ];
    const fridayDue = kids[0].tasks
      .filter((task) => task.routine === 'morning')
      .map((task) => ({
        id: task.id,
        label: task.label,
        points: task.points,
        icon: task.icon,
      }));
    const logs = [
      {
        ...emptyDayLog('2026-08-28', 'kid-1', fridayDue),
        completedTaskIds: fridayDue.map((task) => task.id),
        onTime: true,
      },
    ];
    const exceptions = [
      { date: '2026-08-31', freeDay: true, departureOverride: null, note: '' },
      { date: '2026-09-01', freeDay: true, departureOverride: null, note: '' },
    ];
    const settled = settleStreaks(kids, logs, '2026-09-02', exceptions);
    expect(settled[0].streak).toBe(5);
  });

  it('dueFromLogOrKid respektuje pusty snapshot', () => {
    const kid = makeKid1();
    const due = dueFromLogOrKid({ plannedTasks: [] }, kid, 'wed');
    expect(due).toEqual([]);
  });

  it('trimDayExceptions zachowuje referencję, gdy nic nie wycina', () => {
    const list = [
      { date: '2026-09-01', freeDay: false, departureOverride: null, note: 'a' },
      { date: '2026-09-05', freeDay: true, departureOverride: null, note: '' },
    ];
    expect(trimDayExceptions(list, '2026-09-05')).toBe(list);
  });

  it('trimDayExceptions wycina stare dni nową tablicą', () => {
    const list = [
      { date: '2025-01-01', freeDay: false, departureOverride: null, note: 'stare' },
      { date: '2026-09-05', freeDay: true, departureOverride: null, note: '' },
    ];
    const next = trimDayExceptions(list, '2026-09-05', 7);
    expect(next).not.toBe(list);
    expect(next).toEqual([list[1]]);
  });
});
