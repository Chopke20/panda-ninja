import { describe, expect, it } from 'vitest';
import { BONUS, SCHOOL_DAYS } from './constants';
import {
  EVOLUTION_WEEK_PRICE,
  canUnlockStage,
  clampStage,
  evolutionItemId,
  evolutionLine,
  parseEvolutionItemId,
  perfectRoutinePoints,
  perfectSchoolDayPoints,
  perfectSchoolWeekPoints,
} from './evolution';

describe('evolution', () => {
  it('ma 6 stadiów na każdą linię', () => {
    expect(evolutionLine('round').stages).toHaveLength(6);
    expect(evolutionLine('agile').stages).toHaveLength(6);
  });

  it('różni charaktery', () => {
    expect(evolutionLine('round').name).toMatch(/spokojna/i);
    expect(evolutionLine('agile').name).toMatch(/zwinna/i);
  });

  it('parsuje itemId awansu', () => {
    expect(parseEvolutionItemId('evo-round-3')).toEqual({ body: 'round', stage: 3 });
    expect(parseEvolutionItemId('logo-paw')).toBeNull();
  });

  it('blokuje skok, pozwala na następne gdy ready', () => {
    expect(canUnlockStage('round', 1, 3).ok).toBe(false);
    expect(canUnlockStage('round', 1, 2).ok).toBe(true);
  });

  it('clampStage', () => {
    expect(clampStage(0)).toBe(1);
    expect(clampStage(9)).toBe(6);
    expect(evolutionItemId('agile', 4)).toBe('evo-agile-4');
  });

  it('cena awansu = idealny tydzień szkolny (850)', () => {
    expect(perfectRoutinePoints(5)).toBe(
      5 * BONUS.defaultTaskPoints + BONUS.ownComplete + BONUS.earlyFinish,
    );
    expect(perfectSchoolDayPoints()).toBe(170);
    expect(perfectSchoolWeekPoints()).toBe(SCHOOL_DAYS.length * 170);
    expect(EVOLUTION_WEEK_PRICE).toBe(850);
    for (const body of ['round', 'agile'] as const) {
      for (const stage of evolutionLine(body).stages) {
        if (stage.id === 1) expect(stage.price).toBe(0);
        else expect(stage.price).toBe(850);
      }
    }
  });
});
