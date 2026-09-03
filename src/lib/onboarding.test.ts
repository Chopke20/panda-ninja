import { describe, expect, it } from 'vitest';
import { tasksForAgePreset } from './onboarding';

describe('onboarding presets', () => {
  it('6 lat daje krótszą listę poranka + wieczór', () => {
    const young = tasksForAgePreset('k1', 6);
    const morning = young.filter((task) => task.routine === 'morning');
    const evening = young.filter((task) => task.routine === 'evening');
    expect(morning).toHaveLength(5);
    expect(evening).toHaveLength(5);
    expect(morning.map((task) => task.icon)).not.toContain('hairbrush');
    expect(morning.map((task) => task.icon)).not.toContain('backpack');
  });

  it('8 lat daje pełną listę poranka + wieczór', () => {
    const older = tasksForAgePreset('k2', 8);
    const morning = older.filter((task) => task.routine === 'morning');
    expect(morning).toHaveLength(7);
    expect(morning[0]?.label).toBe('Wstać');
    expect(morning[6]?.label).toBe('Buty');
    expect(older.some((task) => task.routine === 'evening' && task.label === 'Do łóżka')).toBe(true);
  });
});
