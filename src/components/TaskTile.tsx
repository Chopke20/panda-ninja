import { useEffect, useRef, useState } from 'react';
import { COLORS, TIME, TOUCH } from '../lib/constants';
import { taskIconSrc } from '../lib/cosmetics';
import { MissionTimer } from './MissionTimer';

type Props = {
  taskLabel: string;
  icon: string;
  points: number;
  done: boolean;
  highlight?: boolean;
  large?: boolean;
  timerSec?: number | null;
  muted?: boolean;
  onComplete: () => void;
  onUncomplete: () => void;
};

export function TaskTile({
  taskLabel,
  icon,
  points,
  done,
  highlight = false,
  large = false,
  timerSec = null,
  muted = false,
  onComplete,
  onUncomplete,
}: Props) {
  const [hold, setHold] = useState(0);
  const frame = useRef<number>(0);
  const start = useRef<number>(0);

  function stopHold() {
    if (frame.current) window.cancelAnimationFrame(frame.current);
    frame.current = 0;
    start.current = 0;
    setHold(0);
  }

  function tick() {
    const elapsed = Date.now() - start.current;
    const ratio = Math.min(1, elapsed / TIME.uncheckHoldMs);
    setHold(ratio);
    if (ratio >= 1) {
      stopHold();
      onUncomplete();
      return;
    }
    frame.current = window.requestAnimationFrame(tick);
  }

  function onPointerDown() {
    if (!done) return;
    start.current = Date.now();
    frame.current = window.requestAnimationFrame(tick);
  }

  useEffect(() => () => stopHold(), []);

  const showTimer = !done && typeof timerSec === 'number' && timerSec > 0;

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-2xl border border-[color:var(--color-tile-border)] bg-tile shadow-sm backdrop-blur-[6px] ${
        done ? 'opacity-55' : ''
      } ${highlight && !done ? 'ring-2 ring-inset ring-dojo/45' : ''}`}
    >
      <button
        type="button"
        aria-pressed={done}
        onClick={() => {
          if (!done) onComplete();
        }}
        onPointerDown={onPointerDown}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onPointerLeave={stopHold}
        className={`relative flex w-full min-w-0 items-center gap-2 px-2 text-left sm:gap-3 sm:px-3 ${
          large ? 'flex-col py-6 text-center' : ''
        }`}
        style={{ minHeight: large ? 160 : TOUCH.minTilePx }}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-md border-2 text-white ${
            large ? 'h-12 w-12 text-xl' : 'h-8 w-8'
          }`}
          style={{
            borderColor: done ? COLORS.green : 'var(--color-check-border)',
            background: done ? COLORS.green : 'transparent',
          }}
        >
          {done ? '✓' : ''}
        </span>
        <img
          src={taskIconSrc(icon)}
          alt=""
          className={`shrink-0 object-contain ${large ? 'h-20 w-20' : 'h-9 w-9 sm:h-10 sm:w-10'}`}
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden';
          }}
        />
        <span
          className={`min-w-0 flex-1 truncate font-medium text-ink ${large ? 'text-2xl' : 'text-base sm:text-lg'}`}
        >
          {taskLabel}
        </span>
        <span className={`shrink-0 tabular-nums text-muted ${large ? 'text-base' : 'text-sm'}`}>
          {points} ★
        </span>
        {hold > 0 && (
          <span
            className="pointer-events-none absolute bottom-0 left-0 h-1 bg-belt"
            style={{ width: `${Math.round(hold * 100)}%` }}
          />
        )}
      </button>
      {showTimer && (
        <div className="px-2 pb-3 sm:px-3">
          <MissionTimer durationSec={timerSec} muted={muted} />
        </div>
      )}
    </div>
  );
}
