import { describe, expect, it } from 'vitest';
import type { Task } from '../types';
import { moveTaskInRoutine } from './tasks';

function task(
  id: string,
  order: number,
  routine: 'morning' | 'evening',
): Task {
  return {
    id,
    label: id,
    icon: 'bed',
    points: 10,
    order,
    days: ['mon'],
    enabled: true,
    routine,
    timerSec: null,
  };
}

describe('moveTaskInRoutine', () => {
  it('przestawia w obrębie poranka mimo wieczoru między orderami', () => {
    const tasks = [
      task('m1', 0, 'morning'),
      task('m2', 1, 'morning'),
      task('e1', 2, 'evening'),
      task('m3', 10, 'morning'),
    ];
    const next = moveTaskInRoutine(tasks, 'm2', 'down');
    const morning = next
      .filter((t) => t.routine === 'morning')
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id);
    expect(morning).toEqual(['m1', 'm3', 'm2']);
    expect(morning.map((_, i) => i)).toEqual([0, 1, 2]);
    expect(next.find((t) => t.id === 'm1')?.order).toBe(0);
    expect(next.find((t) => t.id === 'm3')?.order).toBe(1);
    expect(next.find((t) => t.id === 'm2')?.order).toBe(2);
  });

  it('nie rusza pierwszego w górę', () => {
    const tasks = [task('m1', 0, 'morning'), task('m2', 1, 'morning')];
    expect(moveTaskInRoutine(tasks, 'm1', 'up')).toBe(tasks);
  });

  it('działa przy takich samych orderach', () => {
    const tasks = [
      task('m1', 0, 'morning'),
      task('m2', 0, 'morning'),
      task('m3', 0, 'morning'),
    ];
    const next = moveTaskInRoutine(tasks, 'm1', 'down');
    const morning = next
      .filter((t) => t.routine === 'morning')
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id);
    expect(morning[0]).toBe('m2');
    expect(morning[1]).toBe('m1');
  });
});
