import { WEEKDAYS, TOUCH } from '../../../lib/constants';
import {
  emptyDayException,
  getDayException,
} from '../../../lib/dayExceptions';
import { todayIso } from '../../../lib/time';
import { scrollFieldIntoView } from '../../../lib/useKeyboardOffset';
import { useStore } from '../../../store/useStore';
import type { Weekday } from '../../../types';

export function TimingTab() {
  const settings = useStore((s) => s.settings);
  const patchSettings = useStore((s) => s.patchSettings);
  const dayExceptions = useStore((s) => s.dayExceptions);
  const setTodayException = useStore((s) => s.setTodayException);
  const today = todayIso();
  const todayEx = getDayException(dayExceptions, today) ?? emptyDayException(today);

  function setDay(day: Weekday, value: string | null) {
    patchSettings({
      departure: { ...settings.departure, [day]: value },
    });
  }

  function setEvening(day: Weekday, value: string | null) {
    patchSettings({
      eveningTarget: { ...settings.eveningTarget, [day]: value },
    });
  }

  function setWarning(index: number, raw: string) {
    const next = [...settings.warningsMin];
    next[index] = Math.max(0, Math.min(180, Number(raw) || 0));
    patchSettings({ warningsMin: next });
  }

  return (
    <section className="space-y-4 py-4">
      <article className="rounded-3xl bg-white p-4">
        <h2 className="text-xl font-semibold">Dzisiaj</h2>
        <p className="mt-1 text-sm text-muted">
          Choroba, wycieczka albo wolne — bez psucia serii.
        </p>
        <button
          type="button"
          className={`mt-3 w-full rounded-2xl px-4 text-lg ${
            todayEx.freeDay ? 'bg-dojo text-white' : 'bg-paper'
          }`}
          style={{ minHeight: TOUCH.minTilePx }}
          onClick={() => setTodayException({ freeDay: !todayEx.freeDay })}
        >
          {todayEx.freeDay ? 'Dziś wolne — seria zostaje' : 'Oznacz dziś jako wolne'}
        </button>
        {!todayEx.freeDay && (
          <>
            <label className="mt-4 block text-sm text-muted">
              Jednorazowa godzina wyjścia (puste = wg tygodnia)
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="time"
                value={todayEx.departureOverride ?? ''}
                onChange={(e) =>
                  setTodayException({
                    departureOverride: e.target.value || null,
                  })
                }
                onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                className="min-h-[56px] flex-1 rounded-xl bg-paper px-3 text-lg"
              />
              {todayEx.departureOverride && (
                <button
                  type="button"
                  className="min-h-[56px] rounded-xl bg-paper px-4"
                  onClick={() => setTodayException({ departureOverride: null })}
                >
                  Reset
                </button>
              )}
            </div>
          </>
        )}
        <label className="mt-4 block text-sm text-muted">Notatka (opcjonalnie)</label>
        <input
          value={todayEx.note}
          maxLength={80}
          onChange={(e) => setTodayException({ note: e.target.value })}
          onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
          placeholder="np. wycieczka, choroba"
          className="mt-1 w-full min-h-[56px] rounded-xl bg-paper px-3 text-lg"
        />
      </article>

      <article className="rounded-3xl bg-white p-4">
        <h2 className="text-xl font-semibold">Tryb listy</h2>
        <p className="mt-1 text-sm text-muted">
          Sześciolatkowi łatwiej z jednym dużym krokiem naraz.
        </p>
        <button
          type="button"
          className={`mt-3 w-full rounded-2xl px-4 text-lg ${
            settings.nextMissionMode ? 'bg-dojo text-white' : 'bg-paper'
          }`}
          style={{ minHeight: TOUCH.minTilePx }}
          onClick={() => patchSettings({ nextMissionMode: !settings.nextMissionMode })}
        >
          {settings.nextMissionMode ? 'Następna misja włączona' : 'Pełna lista zadań'}
        </button>
      </article>

      {WEEKDAYS.map((day) => {
        const value = settings.departure[day.id];
        const evening = settings.eveningTarget[day.id];
        const on = value !== null;
        const eveningOn = evening !== null;
        return (
          <article key={day.id} className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-semibold">{day.long}</p>
              <button
                type="button"
                className={`rounded-xl px-4 ${on ? 'bg-dojo text-white' : 'bg-paper text-muted'}`}
                style={{ minHeight: TOUCH.minTilePx }}
                onClick={() => setDay(day.id, on ? null : '07:40')}
              >
                {on ? 'Poranek' : 'Bez poranka'}
              </button>
            </div>
            {on && (
              <label className="mt-3 block text-sm text-muted">
                Wyjście
                <input
                  type="time"
                  value={value}
                  onChange={(e) => setDay(day.id, e.target.value || '07:40')}
                  onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                  className="mt-1 w-full min-h-[56px] rounded-xl bg-paper px-3 text-lg"
                />
              </label>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-muted">Wieczór / sen</p>
              <button
                type="button"
                className={`rounded-xl px-4 ${eveningOn ? 'bg-dojo text-white' : 'bg-paper text-muted'}`}
                style={{ minHeight: TOUCH.minTilePx }}
                onClick={() => setEvening(day.id, eveningOn ? null : '20:00')}
              >
                {eveningOn ? 'Włączony' : 'Wyłączony'}
              </button>
            </div>
            {eveningOn && evening && (
              <input
                type="time"
                value={evening}
                onChange={(e) => setEvening(day.id, e.target.value || '20:00')}
                onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                className="mt-2 w-full min-h-[56px] rounded-xl bg-paper px-3 text-lg"
              />
            )}
          </article>
        );
      })}

      <label className="block text-sm text-muted">Okno rutyny (minuty)</label>
      <input
        type="number"
        min={15}
        max={180}
        inputMode="numeric"
        value={settings.routineWindowMin}
        onChange={(e) =>
          patchSettings({ routineWindowMin: Math.max(15, Math.min(180, Number(e.target.value) || 90)) })
        }
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        className="w-full min-h-[56px] rounded-xl bg-white px-3 text-lg"
      />

      <p className="pt-2 font-semibold">Ostrzeżenia (minuty przed wyjściem)</p>
      {settings.warningsMin.map((mark, index) => (
        <input
          key={index}
          type="number"
          min={0}
          max={180}
          inputMode="numeric"
          value={mark}
          onChange={(e) => setWarning(index, e.target.value)}
          onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
          className="w-full min-h-[56px] rounded-xl bg-white px-3 text-lg"
          aria-label={`Ostrzeżenie ${index + 1}`}
        />
      ))}
    </section>
  );
}
