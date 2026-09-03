import { describe, expect, it } from 'vitest';
import { makeDefaultSettings, makeKid1, makeKid2 } from '../store/defaults';
import { emptyDayLog } from './day';
import {
  applyTaskToggle,
  dayScore,
  isListComplete,
  settleStreaks,
  weeklyPoints,
} from './scoring';
import type { DayLog, Kid, Task } from '../types';

const morning = new Date(2026, 8, 2, 7, 0, 0); // środa, 40 min do 07:40
const late = new Date(2026, 8, 2, 7, 35, 0); // 5 min do wyjścia
const after = new Date(2026, 8, 2, 8, 0, 0);

function pair(): [Kid, Kid] {
  return [makeKid1(), makeKid2()];
}

function morningDue(kid: Kid): Task[] {
  return kid.tasks.filter((task) => task.enabled && (task.routine ?? 'morning') === 'morning');
}

function completeAllBut(
  kids: [Kid, Kid],
  logs: DayLog[],
  kidId: string,
  leave: number,
  now: Date,
  settings = makeDefaultSettings(),
) {
  const actor = kids.find((item) => item.id === kidId);
  if (!actor) throw new Error('brak dziecka');
  const due = morningDue(actor);
  const toCheck = due.slice(0, Math.max(0, due.length - leave));
  let nextKids = kids;
  let nextLogs = logs;
  for (const task of toCheck) {
    const result = applyTaskToggle({
      kids: nextKids,
      logs: nextLogs,
      settings,
      kidId,
      taskId: task.id,
      now,
      mode: 'complete',
      routineId: 'morning',
    });
    if (!result) continue;
    nextKids = result.kids;
    nextLogs = result.logs;
  }
  return { kids: nextKids, logs: nextLogs };
}

function lastMorning(kid: Kid): Task {
  const due = morningDue(kid);
  const task = due[due.length - 1];
  if (!task) throw new Error('brak zadań poranka');
  return task;
}

describe('scoring', () => {
  it('dodaje wagę zadania do konta', () => {
    const kids = pair();
    const result = applyTaskToggle({
      kids,
      logs: [],
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: 'k1-morning-1',
      now: morning,
      mode: 'complete',
      routineId: 'morning',
    });
    expect(result).not.toBeNull();
    expect(result?.kids[0].totalPoints).toBe(10);
    expect(
      result?.logs.find(
        (log) => log.kidId === 'kid-1' && (log.routineId ?? 'morning') === 'morning',
      )?.completedTaskIds,
    ).toEqual(['k1-morning-1']);
    expect(result?.flights).toEqual([{ kidId: 'kid-1', points: 10 }]);
  });

  it('ponowny complete tego samego zadania nic nie robi', () => {
    const first = applyTaskToggle({
      kids: pair(),
      logs: [],
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: 'k1-morning-1',
      now: morning,
      mode: 'complete',
      routineId: 'morning',
    });
    const second = applyTaskToggle({
      kids: first!.kids,
      logs: first!.logs,
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: 'k1-morning-1',
      now: morning,
      mode: 'complete',
      routineId: 'morning',
    });
    expect(second).toBeNull();
  });

  it('komplet własnej listy daje +20 i +15 za tempo przed 07:40', () => {
    const { kids, logs } = completeAllBut(pair(), [], 'kid-1', 1, morning);
    const last = lastMorning(kids[0]);
    const result = applyTaskToggle({
      kids,
      logs,
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: last.id,
      now: morning,
      mode: 'complete',
      routineId: 'morning',
    });
    expect(result?.ownJustCompleted).toBe(true);
    expect(result?.kids[0].totalPoints).toBe(70 + 20 + 15);
    expect(result?.kids[0].streak).toBe(1);
  });

  it('bonus wspólny +50 każdemu, gdy druga lista domyka przed wyjściem', () => {
    const first = completeAllBut(pair(), [], 'kid-1', 0, morning);
    const second = completeAllBut(first.kids, first.logs, 'kid-2', 1, morning);
    const last = lastMorning(second.kids[1]);
    const result = applyTaskToggle({
      kids: second.kids,
      logs: second.logs,
      settings: makeDefaultSettings(),
      kidId: 'kid-2',
      taskId: last.id,
      now: morning,
      mode: 'complete',
      routineId: 'morning',
    });
    expect(result?.bothJustCompleted).toBe(true);
    expect(result?.kids[0].totalPoints).toBe(70 + 20 + 15 + 50);
    expect(result?.kids[1].totalPoints).toBe(70 + 20 + 15 + 50);
    expect(result?.flights.some((fly) => fly.kidId === 'kid-1' && fly.points === 50)).toBe(true);
  });

  it('po wyjściu nie ma bonusu wspólnego ani za tempo', () => {
    const { kids, logs } = completeAllBut(pair(), [], 'kid-1', 1, after);
    const last = lastMorning(kids[0]);
    const result = applyTaskToggle({
      kids,
      logs,
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: last.id,
      now: after,
      mode: 'complete',
      routineId: 'morning',
    });
    expect(result?.kids[0].totalPoints).toBe(70 + 20);
    expect(
      result?.logs.find(
        (log) => log.kidId === 'kid-1' && (log.routineId ?? 'morning') === 'morning',
      )?.onTime,
    ).toBe(false);
  });

  it('bonus za tempo +15 przy komplecie ≥10 min przed wyjściem', () => {
    const { kids, logs } = completeAllBut(pair(), [], 'kid-1', 1, morning);
    const last = lastMorning(kids[0]);
    const result = applyTaskToggle({
      kids,
      logs,
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: last.id,
      now: morning,
      mode: 'complete',
      routineId: 'morning',
    });
    expect(result?.kids[0].totalPoints).toBe(70 + 20 + 15);
  });

  it('komplet o T-5 nie daje bonusu za tempo', () => {
    const { kids, logs } = completeAllBut(pair(), [], 'kid-1', 1, late);
    const last = lastMorning(kids[0]);
    const result = applyTaskToggle({
      kids,
      logs,
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: last.id,
      now: late,
      mode: 'complete',
      routineId: 'morning',
    });
    expect(result?.kids[0].totalPoints).toBe(70 + 20);
  });

  it('odznaczenie zabiera punkty zadania i bonusy, nie spuszcza konta pod zero', () => {
    const done = applyTaskToggle({
      kids: pair(),
      logs: [],
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: 'k1-morning-1',
      now: morning,
      mode: 'complete',
      routineId: 'morning',
    });
    const undone = applyTaskToggle({
      kids: done!.kids,
      logs: done!.logs,
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: 'k1-morning-1',
      now: morning,
      mode: 'uncomplete',
      routineId: 'morning',
    });
    expect(undone?.kids[0].totalPoints).toBe(0);
    expect(
      undone?.logs.find(
        (log) => log.kidId === 'kid-1' && (log.routineId ?? 'morning') === 'morning',
      )?.completedTaskIds,
    ).toEqual([]);
  });

  it('seria nie rusza się w weekend i nie odbiera punktów', () => {
    const sunday = new Date(2026, 8, 6, 10, 0, 0);
    const kid = makeKid1();
    kid.tasks = kid.tasks.map((task) => ({ ...task, days: ['sun'] }));
    kid.streak = 3;
    kid.totalPoints = 100;
    const result = applyTaskToggle({
      kids: [kid, makeKid2()],
      logs: [],
      settings: makeDefaultSettings(),
      kidId: 'kid-1',
      taskId: 'k1-morning-1',
      now: sunday,
      mode: 'complete',
      routineId: 'morning',
    });
    expect(result?.kids[0].streak).toBe(3);
    expect(result?.kids[0].totalPoints).toBe(110);
  });

  it('punkty tygodniowe z logów pon–nd', () => {
    const logs = [
      { ...emptyDayLog('2026-08-31', 'kid-1'), pointsEarned: 10 },
      { ...emptyDayLog('2026-09-01', 'kid-1'), pointsEarned: 20 },
      { ...emptyDayLog('2026-09-02', 'kid-1'), pointsEarned: 30 },
      { ...emptyDayLog('2026-09-02', 'kid-2'), pointsEarned: 99 },
    ];
    expect(weeklyPoints(logs, 'kid-1', morning)).toBe(60);
  });

  it('settleStreaks zeruje po niekompletnym dniu szkolnym', () => {
    const kids = pair();
    kids[0].streak = 4;
    const logs = [
      { ...emptyDayLog('2026-09-01', 'kid-1'), completedTaskIds: ['k1-morning-1'] },
    ];
    const settled = settleStreaks(kids, logs, '2026-09-02');
    expect(settled[0].streak).toBe(0);
  });

  it('isListComplete wymaga wszystkich zadań dnia', () => {
    const kid = makeKid1();
    const due = morningDue(kid);
    expect(isListComplete(due, due.slice(0, 6).map((task) => task.id))).toBe(false);
    expect(isListComplete(due, due.map((task) => task.id))).toBe(true);
  });

  it('dayScore bez kompletów to sama suma zadań', () => {
    const kid = makeKid1();
    expect(
      dayScore({
        due: morningDue(kid),
        completedIds: ['k1-morning-1'],
        partnerComplete: false,
        earlyAt: morning,
        bothAt: null,
        departure: new Date(2026, 8, 2, 7, 40, 0),
        bonuses: makeDefaultSettings().bonuses,
      }),
    ).toBe(10);
  });

  it('wczesny komplet nie traci bonusu tempo, gdy drugi kończy po wyjściu', () => {
    const first = completeAllBut(pair(), [], 'kid-1', 0, morning);
    const kid1Log = first.logs.find(
      (log) => log.kidId === 'kid-1' && (log.routineId ?? 'morning') === 'morning',
    );
    expect(kid1Log?.pointsEarned).toBe(70 + 20 + 15);
    expect(kid1Log?.finishedAt).toBe(morning.toISOString());

    const second = completeAllBut(first.kids, first.logs, 'kid-2', 0, after);
    const afterKid1 = second.logs.find(
      (log) => log.kidId === 'kid-1' && (log.routineId ?? 'morning') === 'morning',
    );
    const afterKid2 = second.logs.find(
      (log) => log.kidId === 'kid-2' && (log.routineId ?? 'morning') === 'morning',
    );
    expect(afterKid1?.finishedAt).toBe(morning.toISOString());
    expect(afterKid1?.pointsEarned).toBe(70 + 20 + 15);
    expect(afterKid2?.pointsEarned).toBe(70 + 20);
    expect(afterKid2?.onTime).toBe(false);
  });
});
