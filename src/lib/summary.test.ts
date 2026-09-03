import { describe, expect, it } from 'vitest';
import { makeDefaultSettings, makeKid1 } from '../store/defaults';
import { closingPhrase, shouldShowSummary, streakPhrase, summaryPossible } from './summary';

describe('shouldShowSummary', () => {
  const departure = new Date(2026, 8, 2, 7, 40, 0);

  it('włącza się od T-0 przez 3 minuty', () => {
    expect(shouldShowSummary(departure.getTime(), departure, null, '2026-09-02')).toBe(true);
    expect(shouldShowSummary(departure.getTime() + 2 * 60_000, departure, null, '2026-09-02')).toBe(true);
    expect(shouldShowSummary(departure.getTime() + 3 * 60_000 + 1, departure, null, '2026-09-02')).toBe(
      false,
    );
    expect(shouldShowSummary(departure.getTime() - 1, departure, null, '2026-09-02')).toBe(false);
  });

  it('nie wraca po zamknięciu tego dnia', () => {
    expect(shouldShowSummary(departure.getTime() + 1000, departure, '2026-09-02', '2026-09-02')).toBe(
      false,
    );
  });

  it('milczy gdy dziś nie ma wyjścia', () => {
    expect(shouldShowSummary(Date.now(), null, null, '2026-09-02')).toBe(false);
  });
});

describe('summary copy', () => {
  it('liczy próg jako zadania + wszystkie bonusy', () => {
    expect(summaryPossible(makeKid1(), 'wed', makeDefaultSettings())).toBe(70 + 20 + 50 + 15);
  });

  it('mówi życzliwie niezależnie od wyniku', () => {
    expect(closingPhrase(true)).toBe('Perfekcyjny trening!');
    expect(closingPhrase(false)).toBe('Jutro damy radę!');
    expect(streakPhrase(0)).toContain('serię');
    expect(streakPhrase(1)).toContain('Seria ruszyła');
    expect(streakPhrase(4)).toContain('4 dni');
  });
});
