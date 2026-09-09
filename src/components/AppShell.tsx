import type { ReactNode } from 'react';
import { RoutineBackdrop } from './RoutineBackdrop';
import { routineFromHour } from '../lib/time';
import { useNow } from '../lib/useNow';
import { useRoutineTheme } from '../lib/useRoutineTheme';
import { useStore } from '../store/useStore';

/**
 * Wspólne tło + motyw (dzień/noc) dla wszystkich ekranów —
 * panel rodzica, PIN, awans, podsumowanie itd.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const screen = useStore((s) => s.uiScreen);
  const onboardingDone = useStore((s) => s.onboardingDone);
  const activeRoutine = useStore((s) => s.settings.activeRoutine ?? 'morning');
  const nowMs = useNow();

  const mood =
    !onboardingDone || screen === 'onboarding' || screen === 'start'
      ? routineFromHour(new Date(nowMs))
      : activeRoutine;

  useRoutineTheme(mood);

  return (
    <div className="relative min-h-[100dvh] bg-paper text-ink">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <RoutineBackdrop routineId={mood} />
      </div>
      <div className="relative z-10 min-h-[100dvh]">{children}</div>
    </div>
  );
}
