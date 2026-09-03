import { TYPE } from '../lib/constants';
import { isMutedToday } from '../lib/day';
import { formatClock, todayIso } from '../lib/time';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/useStore';

export function ClockHeader() {
  const nowMs = useNow();
  const now = new Date(nowMs);
  const mutedToday = useStore((s) => s.mutedToday);
  const mutedDate = useStore((s) => s.mutedDate);
  const toggleMuteToday = useStore((s) => s.toggleMuteToday);
  const muted = isMutedToday(mutedToday, mutedDate, todayIso(now));

  return (
    <header className="relative flex flex-col items-center justify-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <time
        dateTime={formatClock(now)}
        className="font-semibold leading-none text-ink tabular-nums"
        style={{ fontSize: TYPE.clockPx }}
      >
        {formatClock(now)}
      </time>
      <button
        type="button"
        onClick={toggleMuteToday}
        className="absolute right-4 top-[max(0.5rem,env(safe-area-inset-top))] flex min-h-[52px] min-w-[52px] items-center justify-center text-2xl"
        aria-label={muted ? 'Włącz dźwięk' : 'Wycisz na dziś'}
      >
        {muted ? '🔕' : '🔔'}
      </button>
    </header>
  );
}
