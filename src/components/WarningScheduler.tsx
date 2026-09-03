import { useEffect, useRef } from 'react';
import { isMutedToday } from '../lib/day';
import {
  WINDOW_GONG_MARK,
  departureGongCount,
  dueWarningMarks,
  isDepartureGong,
  shouldPlayWindowGong,
  taikoCountForWarning,
  voiceLineKey,
} from '../lib/schedule';
import { gong, setMuted, setVolume, taiko } from '../lib/sfx';
import { speak } from '../lib/speech';
import { getDepartureToday, getMinutesLeft, getRoutinePhase, todayIso } from '../lib/time';
import { useNow } from '../lib/useNow';
import { bindWakeLockOnVisible, syncWakeLock } from '../lib/wakeLock';
import { useStore } from '../store/useStore';

/** Gong, taiko i lektor według minut do wyjścia — zawsze z Date.now(). */
export function WarningScheduler() {
  const nowMs = useNow();
  const screen = useStore((s) => s.uiScreen);
  const settings = useStore((s) => s.settings);
  const mutedToday = useStore((s) => s.mutedToday);
  const mutedDate = useStore((s) => s.mutedDate);
  const playedWarnings = useStore((s) => s.playedWarnings);
  const markWarningPlayed = useStore((s) => s.markWarningPlayed);
  const ensureToday = useStore((s) => s.ensureToday);
  const dayExceptions = useStore((s) => s.dayExceptions);
  const prevMinutes = useRef<number | null>(null);
  const minuteKey = Math.floor(nowMs / 60_000);
  const nowDate = new Date(nowMs);
  const phase = getRoutinePhase(
    nowDate,
    getDepartureToday(settings, nowDate, dayExceptions),
    settings.routineWindowMin,
  );
  const holdLock = screen === 'main' && phase === 'active';

  useEffect(() => {
    const unbindLock = bindWakeLockOnVisible();
    const onVisible = () => {
      if (document.visibilityState === 'visible') ensureToday(Date.now());
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      unbindLock();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [ensureToday]);

  useEffect(() => {
    syncWakeLock(holdLock);
  }, [holdLock]);

  useEffect(() => {
    setVolume(settings.volume);
  }, [settings.volume]);

  useEffect(() => {
    const now = new Date(Date.now());
    ensureToday(now.getTime());
    const muted = isMutedToday(mutedToday, mutedDate, todayIso(now));
    setMuted(muted);

    if (screen === 'start' || screen === 'onboarding' || screen === 'shop' || screen === 'parent') {
      prevMinutes.current = getMinutesLeft(now, getDepartureToday(settings, now, dayExceptions));
      return;
    }

    // Gongi wyjścia zawsze wg poranka — nawet gdy na ekranie jest wieczór.
    const departure = getDepartureToday(settings, now, dayExceptions);
    const minutesLeft = getMinutesLeft(now, departure);
    const played = playedWarnings;

    if (settings.activeRoutine === 'evening') {
      prevMinutes.current = minutesLeft;
      return;
    }

    if (shouldPlayWindowGong(prevMinutes.current, minutesLeft, settings.routineWindowMin, played)) {
      markWarningPlayed(WINDOW_GONG_MARK);
      if (!muted) gong(1);
    }

    const marks = dueWarningMarks(prevMinutes.current, minutesLeft, settings.warningsMin, played);
    for (const mark of marks) {
      markWarningPlayed(mark);
      if (!muted) {
        if (isDepartureGong(mark)) gong(departureGongCount());
        else taiko(taikoCountForWarning(mark, settings.warningsMin));
        if (settings.ttsEnabled) {
          const line = settings.voiceLines[voiceLineKey(mark)];
          if (line) speak(line, settings.ttsVoiceURI);
        }
      }
    }

    prevMinutes.current = minutesLeft;
  }, [
    minuteKey,
    screen,
    settings,
    mutedToday,
    mutedDate,
    playedWarnings,
    markWarningPlayed,
    ensureToday,
    dayExceptions,
  ]);

  return null;
}
