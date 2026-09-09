import { describe, expect, it } from 'vitest';
import { TIME } from './constants';
import { tasksForAgePreset } from './onboarding';

const SHARED_LABELS = [
  'Wstać z łóżka',
  'Śniadanie',
  'Umyć zęby',
  'Ubranie się',
  'Spakowanie plecaka',
];

describe('onboarding presets', () => {
  it('6 i 8 lat mają tę samą listę poranka + wieczór', () => {
    for (const age of [6, 8] as const) {
      const tasks = tasksForAgePreset('k1', age);
      const morning = tasks.filter((task) => task.routine === 'morning');
      const evening = tasks.filter((task) => task.routine === 'evening');
      expect(morning).toHaveLength(5);
      expect(evening).toHaveLength(5);
      expect(morning.map((task) => task.label)).toEqual(SHARED_LABELS);
      expect(morning[1]?.icon).toBe('cereal');
      expect(morning[2]?.timerSec).toBe(TIME.morningToothTimerSec);
    }
  });

  it('oba klucze dzieci dostają te same etykiety', () => {
    const a = tasksForAgePreset('k1', 8)
      .filter((t) => t.routine === 'morning')
      .map((t) => t.label);
    const b = tasksForAgePreset('k2', 6)
      .filter((t) => t.routine === 'morning')
      .map((t) => t.label);
    expect(a).toEqual(b);
  });
});
