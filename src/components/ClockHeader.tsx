import { COLORS, TOUCH, TYPE } from '../lib/constants';
import { isMutedToday } from '../lib/day';
import { formatClock, todayIso } from '../lib/time';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/useStore';
import { RoutineSwitcher } from './RoutineSwitcher';

export function ClockHeader() {
  const nowMs = useNow();
  const now = new Date(nowMs);
  const mutedToday = useStore((s) => s.mutedToday);
  const mutedDate = useStore((s) => s.mutedDate);
  const toggleMuteToday = useStore((s) => s.toggleMuteToday);
  const muted = isMutedToday(mutedToday, mutedDate, todayIso(now));

  return (
    <header
      className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 pb-1"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <div className="justify-self-start">
        <RoutineSwitcher />
      </div>

      <time
        dateTime={formatClock(now)}
        className="justify-self-center font-semibold leading-none text-ink tabular-nums"
        style={{ fontSize: TYPE.clockPx }}
      >
        {formatClock(now)}
      </time>

      <div className="justify-self-end">
        <button
          type="button"
          onClick={toggleMuteToday}
          className={`flex items-center justify-center rounded-2xl ${
            muted ? 'bg-white text-muted' : 'bg-white text-ink'
          }`}
          style={{ minHeight: TOUCH.minTilePx, minWidth: TOUCH.minTilePx }}
          aria-label={muted ? 'Włącz dźwięk' : 'Wycisz na dziś'}
        >
          <BellIcon muted={muted} />
        </button>
      </div>
    </header>
  );
}

/** Płaski dzwonek w stylu ikon poranek/wieczór (nie emoji). */
function BellIcon({ muted }: { muted: boolean }) {
  const stroke = muted ? 'rgba(42,41,38,0.45)' : COLORS.ink;
  const accent = muted ? 'rgba(42,41,38,0.45)' : COLORS.gold;
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <path
        d="M15 4.5c-4.2 0-7.5 3.1-7.5 7.2v3.1c0 .9-.4 1.8-1.1 2.4l-.9.8c-.7.6-.3 1.8.6 1.8h17.8c.9 0 1.3-1.2.6-1.8l-.9-.8c-.7-.6-1.1-1.5-1.1-2.4v-3.1c0-4.1-3.3-7.2-7.5-7.2Z"
        stroke={stroke}
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <path
        d="M12.2 22.2a2.9 2.9 0 0 0 5.6 0"
        stroke={accent}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="15" cy="4.8" r="1.4" fill={accent} />
      {muted && (
        <line
          x1="6"
          y1="24"
          x2="24"
          y2="6"
          stroke={COLORS.belt}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
