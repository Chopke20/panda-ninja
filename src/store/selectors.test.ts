import { describe, expect, it } from 'vitest';
import { getPandaPose } from './selectors';

const base = {
  totalCount: 5,
  windowMin: 90,
  minutesLeft: 60,
  phase: 'active' as const,
};

describe('getPandaPose', () => {
  it('śpi gdy nic nie zrobione', () => {
    expect(getPandaPose({ ...base, completedCount: 0, phase: 'before' })).toBe('sleeping');
    expect(getPandaPose({ ...base, completedCount: 0, phase: 'active' })).toBe('sleeping');
    expect(getPandaPose({ ...base, completedCount: 0, phase: 'past' })).toBe('sleeping');
  });

  it('trenuje przy częściowym postępie — także przed oknem rutyny', () => {
    expect(getPandaPose({ ...base, completedCount: 2, phase: 'before' })).toBe('training');
    expect(getPandaPose({ ...base, completedCount: 1, phase: 'active' })).toBe('training');
  });

  it('śpieszy się pod koniec okna albo po deadline', () => {
    expect(
      getPandaPose({ ...base, completedCount: 2, phase: 'active', minutesLeft: 10 }),
    ).toBe('hurry');
    expect(getPandaPose({ ...base, completedCount: 3, phase: 'past', minutesLeft: -5 })).toBe(
      'hurry',
    );
  });

  it('świętuje po komplecie niezależnie od fazy', () => {
    expect(getPandaPose({ ...base, completedCount: 5, phase: 'before' })).toBe('celebrating');
    expect(getPandaPose({ ...base, completedCount: 5, phase: 'past' })).toBe('celebrating');
  });
});
