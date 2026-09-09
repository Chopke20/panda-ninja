import { describe, expect, it } from 'vitest';
import type { DayLog } from '../types';
import { makeDefaultState, makeKid1, makeKid2 } from '../store/defaults';
import {
  logsToCsv,
  mergePersistedSlice,
  normalizeSettings,
  parseAppState,
  serializeAppState,
} from './backup';

describe('parseAppState', () => {
  it('odtwarza wyeksportowany stan', () => {
    const state = makeDefaultState();
    state.kids[0].name = 'Leo';
    state.settings.specialReward = 'Lody';
    const json = serializeAppState(state);
    const parsed = parseAppState(json);
    expect(parsed).not.toBeNull();
    expect(parsed?.kids[0].name).toBe('Leo');
    expect(parsed?.settings.specialReward).toBe('Lody');
    expect(parsed?.settings.pin).toBe(state.settings.pin);
  });

  it('odrzuca śmieci i niepełne dzieci', () => {
    expect(parseAppState('nie-json')).toBeNull();
    expect(parseAppState('[]')).toBeNull();
    expect(parseAppState(JSON.stringify({ kids: [{ id: 'x', name: 'A', tasks: [] }] }))).toBeNull();
  });

  it('migruje stary wygląd pandy i otwiera ledger z totalPoints', () => {
    const defaults = makeDefaultState();
    const raw = {
      kids: [
        {
          id: 'kid-1',
          name: 'Leo',
          panda: { weapon: 'katana', headband: 'black', outfit: 'charcoal', accent: '#3D6B8A' },
          tasks: defaults.kids[0].tasks,
          totalPoints: 240,
          streak: 4,
        },
        {
          id: 'kid-2',
          name: 'Maks',
          panda: { weapon: 'nunchaku', headband: 'red', outfit: 'indigo', accent: '#C44536' },
          tasks: defaults.kids[1].tasks,
          totalPoints: 180,
          streak: 2,
        },
      ],
      settings: defaults.settings,
      logs: [],
      version: 1,
    };
    const parsed = parseAppState(JSON.stringify(raw));
    expect(parsed).not.toBeNull();
    expect(parsed?.kids[0].panda.stage).toBe(1);
    expect(parsed?.kids[0].panda.outfitColor).toBe('#3A3F46');
    expect(parsed?.kids[0].inventory).toContain('logo-paw');
    expect(parsed?.kids[0].inventory).toContain('evo-round-1');
    expect(parsed?.transactions.some((tx) => tx.kind === 'opening-balance' && tx.amount === 240)).toBe(
      true,
    );
    expect(parsed?.transactions.some((tx) => tx.kind === 'opening-balance' && tx.amount === 180)).toBe(
      true,
    );
    expect(parsed?.purchaseRequests).toEqual([]);
  });

  it('uzupełnia brakującą nagrodę specjalną', () => {
    const state = makeDefaultState();
    const raw = JSON.parse(serializeAppState(state)) as { settings: { specialReward?: string } };
    delete raw.settings.specialReward;
    const parsed = parseAppState(JSON.stringify({ ...state, settings: raw.settings }));
    expect(parsed?.settings.specialReward).toBe('');
  });
});

describe('mergePersistedSlice', () => {
  it('uzupełnia starą kopię bez ostrzeżeń i podsumowania', () => {
    const fallback = {
      ...makeDefaultState(),
      mutedToday: true,
      mutedDate: '2026-09-01',
      playedWarnings: [20],
      summaryDismissedDate: '2026-09-01',
      lastBackupAt: '2026-08-01',
      onboardingDone: false,
    };
    const old = {
      kids: makeDefaultState().kids,
      settings: { pin: '2222' },
      logs: [],
      version: 1,
    };
    const merged = mergePersistedSlice(old, fallback);
    expect(merged.settings.pin).toBe('2222');
    expect(merged.settings.departure.mon).toBe('07:40');
    expect(merged.playedWarnings).toEqual([]);
    expect(merged.summaryDismissedDate).toBeNull();
    expect(merged.mutedToday).toBe(false);
    expect(merged.lastBackupAt).toBeNull();
    expect(merged.onboardingDone).toBe(true);
  });

  it('przy śmieciach zostawia fallback', () => {
    const fallback = {
      ...makeDefaultState(),
      mutedToday: false,
      mutedDate: null,
      playedWarnings: [],
      summaryDismissedDate: null,
      lastBackupAt: null,
      onboardingDone: false,
    };
    expect(mergePersistedSlice(null, fallback)).toBe(fallback);
    expect(mergePersistedSlice('x', fallback)).toBe(fallback);
  });

  it('v8 podmienia poranek na wspólną listę 5 zadań', () => {
    const defaults = makeDefaultState();
    const oldMorning = [
      {
        id: 'k1-morning-1',
        label: 'Wstać',
        icon: 'bed',
        points: 10,
        order: 0,
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        routine: 'morning' as const,
        timerSec: null,
      },
      {
        id: 'k1-morning-7',
        label: 'Buty',
        icon: 'shoes',
        points: 10,
        order: 6,
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        routine: 'morning' as const,
        timerSec: null,
      },
    ];
    const kid1 = {
      ...defaults.kids[0],
      tasks: [
        ...oldMorning,
        ...defaults.kids[0].tasks.filter((t) => t.routine === 'evening'),
      ],
    };
    const kid2 = {
      ...defaults.kids[1],
      tasks: [
        ...oldMorning.map((t) => ({ ...t, id: t.id.replace('k1', 'k2') })),
        ...defaults.kids[1].tasks.filter((t) => t.routine === 'evening'),
      ],
    };
    const fallback = {
      ...defaults,
      mutedToday: false,
      mutedDate: null,
      playedWarnings: [],
      summaryDismissedDate: null,
      lastBackupAt: null,
      onboardingDone: true,
    };
    const merged = mergePersistedSlice(
      {
        kids: [kid1, kid2],
        settings: defaults.settings,
        logs: [],
        transactions: defaults.transactions,
        purchaseRequests: [],
        weeklyClaims: [],
        dayExceptions: [],
        version: 7,
      },
      fallback,
    );
    const morning1 = merged.kids[0].tasks.filter((t) => t.routine === 'morning');
    const morning2 = merged.kids[1].tasks.filter((t) => t.routine === 'morning');
    expect(morning1.map((t) => t.label)).toEqual([
      'Wstać z łóżka',
      'Śniadanie',
      'Umyć zęby',
      'Ubranie się',
      'Spakowanie plecaka',
    ]);
    expect(morning2.map((t) => t.label)).toEqual(morning1.map((t) => t.label));
    expect(morning1[1]?.icon).toBe('cereal');
  });
});

describe('normalizeSettings', () => {
  it('łączy częściowe ustawienia z domyślnymi', () => {
    const settings = normalizeSettings({ volume: 0.2, pin: '2222' });
    expect(settings.volume).toBe(0.2);
    expect(settings.pin).toBe('2222');
    expect(settings.departure.mon).toBe('07:40');
    expect(settings.departure.sat).toBeNull();
    expect(settings.voiceLines.t0).toContain('wychodzić');
  });
});

describe('logsToCsv', () => {
  it('pisze nagłówek i wiersze z średnikiem', () => {
    const kids: [ReturnType<typeof makeKid1>, ReturnType<typeof makeKid2>] = [makeKid1(), makeKid2()];
    kids[0].name = 'Ala;B';
    const logs: DayLog[] = [
      {
        date: '2026-09-02',
        kidId: kids[0].id,
        routineId: 'morning',
        completedTaskIds: ['a', 'b'],
        pointsEarned: 40,
        finishedAt: '2026-09-02T07:20:00',
        onTime: true,
      },
      {
        date: '2026-09-01',
        kidId: kids[1].id,
        routineId: 'morning',
        completedTaskIds: [],
        pointsEarned: 0,
        finishedAt: null,
        onTime: false,
      },
    ];
    const csv = logsToCsv(logs, kids, 30);
    expect(csv.startsWith('Data;Rutyna;Dziecko;Punkty;Zadań;Na czas')).toBe(true);
    expect(csv).toContain('"Ala;B"');
    expect(csv).toContain('2026-09-02;poranek;"Ala;B";40;2/2;tak');
    expect(csv).toContain('2026-09-01;poranek;Syn 2;0;0/0;nie');
  });
});
