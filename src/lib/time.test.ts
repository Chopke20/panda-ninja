import { describe, expect, it } from 'vitest';
import { makeDefaultSettings } from '../store/defaults';
import {
  addDaysIso,
  formatCountdown,
  formatClock,
  getDepartureToday,
  getMinutesLeft,
  getProgress,
  getRatioLeft,
  getRoutinePhase,
  getTimelineColor,
  parseHm,
  routineFromHour,
  startScheduleHint,
  todayIso,
  warningMarkerPositions,
  weekdayFromDate,
} from './time';

describe('time', () => {
  const day = new Date(2026, 8, 2, 7, 0, 0); // środa 2 września 2026, lokalnie

  it('faza before poza oknem', () => {
    const departure = parseHm('07:40', day);
    const now = new Date(2026, 8, 2, 5, 0, 0);
    expect(getRoutinePhase(now, departure, 90)).toBe('before');
    expect(getProgress(now, departure, 90)).toBe(0);
  });

  it('wejście w okno (dokładnie T-90) jest active', () => {
    const departure = parseHm('07:40', day);
    const start = new Date(2026, 8, 2, 6, 10, 0);
    expect(getRoutinePhase(start, departure, 90)).toBe('active');
    expect(getMinutesLeft(start, departure)).toBe(90);
    expect(formatCountdown(90, 90)).toBe('Zostało 90 minut');
  });

  it('faza active w środku okna', () => {
    const departure = parseHm('07:40', day);
    const now = new Date(2026, 8, 2, 7, 0, 0);
    expect(getRoutinePhase(now, departure, 90)).toBe('active');
    expect(getMinutesLeft(now, departure)).toBe(40);
    expect(formatCountdown(40, 90)).toBe('Zostało 40 minut');
  });

  it('dokładnie o godzinie wyjścia jest past', () => {
    const departure = parseHm('07:40', day);
    expect(getRoutinePhase(departure, departure, 90)).toBe('past');
    expect(getMinutesLeft(departure, departure)).toBe(0);
    expect(getProgress(departure, departure, 90)).toBe(1);
    expect(formatCountdown(0, 90)).toBe('Czas wychodzić!');
  });

  it('minutę po wyjściu', () => {
    const departure = parseHm('07:40', day);
    const now = new Date(2026, 8, 2, 7, 41, 0);
    expect(getRoutinePhase(now, departure, 90)).toBe('past');
    expect(getMinutesLeft(now, departure)).toBe(-1);
    expect(formatCountdown(-1, 90)).toBe('Czas wychodzić!');
  });

  it('brak godziny wyjścia (weekend)', () => {
    const settings = makeDefaultSettings();
    const saturday = new Date(2026, 8, 5, 8, 0, 0);
    expect(weekdayFromDate(saturday)).toBe('sat');
    expect(getDepartureToday(settings, saturday)).toBeNull();
    expect(getRoutinePhase(saturday, null, 90)).toBe('before');
    expect(getMinutesLeft(saturday, null)).toBeNull();
    expect(formatCountdown(null, 90)).toBe('Dziś bez treningu');
  });

  it('getDepartureToday czyta godzinę z dnia tygodnia', () => {
    const settings = makeDefaultSettings();
    const wed = new Date(2026, 8, 2, 6, 0, 0);
    const departure = getDepartureToday(settings, wed);
    expect(departure).not.toBeNull();
    expect(formatClock(departure as Date)).toBe('07:40');
  });

  it('kolor osi: progi 50% i 20%', () => {
    expect(getTimelineColor(0.51)).toBe('green');
    expect(getTimelineColor(0.5)).toBe('amber');
    expect(getTimelineColor(0.2)).toBe('amber');
    expect(getTimelineColor(0.199)).toBe('red');
  });

  it('postęp 0–1 wewnątrz okna', () => {
    const departure = parseHm('07:40', day);
    expect(getProgress(new Date(2026, 8, 2, 6, 10, 0), departure, 90)).toBe(0);
    expect(getProgress(new Date(2026, 8, 2, 6, 55, 0), departure, 90)).toBe(0.5);
    expect(getProgress(new Date(2026, 8, 2, 7, 40, 0), departure, 90)).toBe(1);
  });

  it('minuty floor, nie round', () => {
    const departure = parseHm('07:40', day);
    const now = new Date(2026, 8, 2, 7, 10, 30);
    expect(getMinutesLeft(now, departure)).toBe(29);
  });

  it('formatCountdown: daleko / okno / ostatnie 5 / T-0', () => {
    expect(formatCountdown(192, 90)).toBe('Do wyjścia: 3 godz 12 min');
    expect(formatCountdown(120, 90)).toBe('Do wyjścia: 2 godz');
    expect(formatCountdown(28, 90)).toBe('Zostało 28 minut');
    expect(formatCountdown(2, 90)).toBe('Ostatnie 5 minut!');
    expect(formatCountdown(5, 90)).toBe('Ostatnie 5 minut!');
    expect(formatCountdown(1, 90)).toBe('Ostatnie 5 minut!');
  });

  it('przekroczenie północy zmienia dzień i godzinę wyjścia', () => {
    const settings = makeDefaultSettings();
    const thursdayNight = new Date(2026, 8, 3, 23, 50, 0);
    const fridayMorning = new Date(2026, 8, 4, 0, 1, 0);

    expect(weekdayFromDate(thursdayNight)).toBe('thu');
    expect(getRoutinePhase(thursdayNight, getDepartureToday(settings, thursdayNight), 90)).toBe(
      'past',
    );

    expect(weekdayFromDate(fridayMorning)).toBe('fri');
    const fridayDep = getDepartureToday(settings, fridayMorning);
    expect(fridayDep).not.toBeNull();
    expect(getRoutinePhase(fridayMorning, fridayDep, 90)).toBe('before');
    const left = getMinutesLeft(fridayMorning, fridayDep);
    expect(left).not.toBeNull();
    expect(left as number).toBeGreaterThan(90);
    expect(formatCountdown(left, 90)).toMatch(/^Do wyjścia:/);
    expect(getRatioLeft(fridayMorning, fridayDep, 90)).toBe(1);
  });

  it('todayIso jest lokalny, nie UTC', () => {
    const localMidnight = new Date(2026, 8, 2, 0, 30, 0);
    expect(todayIso(localMidnight)).toBe('2026-09-02');
    expect(addDaysIso('2026-09-02', 1)).toBe('2026-09-03');
    expect(addDaysIso('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('znaczniki T-20 T-10 T-5 na osi', () => {
    const marks = warningMarkerPositions(90, [20, 10, 5, 0]);
    expect(marks).toEqual([1 - 20 / 90, 1 - 10 / 90, 1 - 5 / 90]);
  });

  it('zmiana czasu letniego nie psuje godziny wyjścia', () => {
    // 29 mar 2026 w Polsce: 02:00 → 03:00; 07:40 jest już po skoku.
    const morning = new Date(2026, 2, 29, 7, 0, 0);
    const departure = parseHm('07:40', morning);
    expect(departure.getHours()).toBe(7);
    expect(departure.getMinutes()).toBe(40);
    expect(getMinutesLeft(morning, departure)).toBe(40);
    expect(getRoutinePhase(morning, departure, 90)).toBe('active');
  });

  it('godzina wyjścia w piątek rano po nocy bez otwartej apki', () => {
    const settings = makeDefaultSettings();
    const now = new Date(2026, 8, 4, 5, 0, 0);
    const departure = getDepartureToday(settings, now);
    expect(getRoutinePhase(now, departure, 90)).toBe('before');
    expect(formatCountdown(getMinutesLeft(now, departure), 90)).toBe('Do wyjścia: 2 godz 40 min');
  });

  it('routineFromHour: przed 15 = poranek, potem wieczór', () => {
    expect(routineFromHour(new Date(2026, 8, 2, 7, 0, 0))).toBe('morning');
    expect(routineFromHour(new Date(2026, 8, 2, 14, 59, 0))).toBe('morning');
    expect(routineFromHour(new Date(2026, 8, 2, 15, 0, 0))).toBe('evening');
    expect(routineFromHour(new Date(2026, 8, 2, 3, 0, 0))).toBe('evening');
  });

  it('startScheduleHint: wieczorem sen, rano wyjście', () => {
    const settings = makeDefaultSettings();
    const morning = new Date(2026, 8, 9, 7, 0, 0);
    const evening = new Date(2026, 8, 9, 21, 0, 0);
    expect(startScheduleHint(settings, morning, [], 'morning')).toMatch(/wyjście 07:40/);
    expect(startScheduleHint(settings, evening, [], 'evening')).toMatch(/sen 20:00/);
    expect(startScheduleHint(settings, evening, [], 'evening')).not.toMatch(/wyjście/);
  });
});
