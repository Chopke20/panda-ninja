import { useEffect } from 'react';
import { shouldShowSummary } from '../lib/summary';
import { getDepartureToday, todayIso } from '../lib/time';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/useStore';

/** Pokazuje podsumowanie od T-0 przez 3 minuty, jeśli rodzic nie jest w panelu. */
export function SummaryDirector() {
  const nowMs = useNow();
  const screen = useStore((s) => s.uiScreen);
  const settings = useStore((s) => s.settings);
  const dayExceptions = useStore((s) => s.dayExceptions);
  const dismissed = useStore((s) => s.summaryDismissedDate ?? null);
  const setUiScreen = useStore((s) => s.setUiScreen);
  const now = new Date(nowMs);
  const today = todayIso(now);
  const departure = getDepartureToday(settings, now, dayExceptions);
  const show = shouldShowSummary(nowMs, departure, dismissed, today);

  useEffect(() => {
    if (screen === 'main' && show) setUiScreen('summary');
    if (screen === 'summary' && !show) setUiScreen('main');
  }, [screen, show, setUiScreen]);

  return null;
}
