import { describe, expect, it } from 'vitest';
import {
  WINDOW_GONG_MARK,
  dueWarningMarks,
  fillVoiceLine,
  shouldPlayWindowGong,
  taikoCountForWarning,
  voiceLineKey,
} from './schedule';

const warnings = [20, 10, 5, 0];

describe('shouldPlayWindowGong', () => {
  it('gra przy wejściu w okno, nie przy starcie aplikacji w środku okna', () => {
    expect(shouldPlayWindowGong(95, 89, 90, [])).toBe(true);
    expect(shouldPlayWindowGong(null, 40, 90, [])).toBe(false);
    expect(shouldPlayWindowGong(40, 39, 90, [])).toBe(false);
    expect(shouldPlayWindowGong(95, 89, 90, [WINDOW_GONG_MARK])).toBe(false);
  });
});

describe('dueWarningMarks', () => {
  it('trafia dokładną minutę i nie powtarza', () => {
    expect(dueWarningMarks(21, 20, warnings, [])).toEqual([20]);
    expect(dueWarningMarks(21, 20, warnings, [20])).toEqual([]);
  });

  it('przy pierwszym tiku gra tylko dokładne trafienie', () => {
    expect(dueWarningMarks(null, 20, warnings, [])).toEqual([20]);
    expect(dueWarningMarks(null, 18, warnings, [])).toEqual([]);
  });

  it('po przeładowaniu nie powtarza już odegranego ostrzeżenia', () => {
    expect(dueWarningMarks(null, 10, warnings, [20, 10])).toEqual([]);
    expect(dueWarningMarks(null, 10, warnings, [20])).toEqual([10]);
  });

  it('po śnie zostawia najpilniejsze przekroczone ostrzeżenie', () => {
    expect(dueWarningMarks(25, 8, warnings, [])).toEqual([10]);
    expect(dueWarningMarks(12, 4, warnings, [10])).toEqual([5]);
    expect(dueWarningMarks(1, 0, warnings, [20, 10, 5])).toEqual([0]);
  });
});

describe('taikoCountForWarning', () => {
  it('liczy uderzenia od najwcześniejszego znaczka', () => {
    expect(taikoCountForWarning(20, warnings)).toBe(1);
    expect(taikoCountForWarning(10, warnings)).toBe(2);
    expect(taikoCountForWarning(5, warnings)).toBe(3);
    expect(taikoCountForWarning(0, warnings)).toBe(0);
  });
});

describe('voice lines', () => {
  it('podstawia imię i mapuje minuty na klucz', () => {
    expect(voiceLineKey(20)).toBe('t20');
    expect(voiceLineKey(0)).toBe('t0');
    expect(fillVoiceLine('{name} gotowy! Świetny trening.', 'Leo')).toBe(
      'Leo gotowy! Świetny trening.',
    );
  });
});
