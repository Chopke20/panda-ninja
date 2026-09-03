import { COLORS } from '../lib/constants';
import {
  formatClock,
  formatCountdown,
  getMinutesLeft,
  getProgress,
  getRatioLeft,
  getRoutinePhase,
  getTargetToday,
  getTimelineColor,
  todayIso,
  warningMarkerPositions,
} from '../lib/time';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/useStore';

const COLOR_MAP = {
  green: COLORS.green,
  amber: COLORS.amber,
  red: COLORS.red,
} as const;

export function DepartureTimeline() {
  const nowMs = useNow();
  const now = new Date(nowMs);
  const settings = useStore((s) => s.settings);
  const dayExceptions = useStore((s) => s.dayExceptions);
  const routineId = settings.activeRoutine ?? 'morning';
  const target = getTargetToday(settings, now, routineId, dayExceptions);
  const phase = getRoutinePhase(now, target, settings.routineWindowMin);
  const progress = getProgress(now, target, settings.routineWindowMin);
  const minutes = getMinutesLeft(now, target);
  const lit = phase === 'active' || phase === 'past';
  const ratioLeft = getRatioLeft(now, target, settings.routineWindowMin);
  const barColor = lit && phase === 'active' ? COLOR_MAP[getTimelineColor(ratioLeft)] : COLORS.muted;
  const marks =
    routineId === 'morning'
      ? warningMarkerPositions(settings.routineWindowMin, settings.warningsMin)
      : [];
  const caption = target
    ? formatCountdown(minutes, settings.routineWindowMin, routineId)
    : dayExceptions.some((ex) => ex.date === todayIso(now) && ex.freeDay)
      ? 'Dziś wolne — seria zostaje'
      : formatCountdown(null, settings.routineWindowMin, routineId);

  return (
    <div className="px-6 pb-1">
      <div className="mb-2 flex items-center gap-3">
        <div
          className="relative h-3 min-w-0 flex-1 rounded-full"
          style={{ background: lit ? 'rgba(42,41,38,0.14)' : 'rgba(42,41,38,0.07)' }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          aria-label={routineId === 'evening' ? 'Czas do snu' : 'Czas do wyjścia'}
        >
          <div
            className="h-full rounded-full transition-[width,background-color,opacity] duration-500"
            style={{
              width: `${Math.round(progress * 100)}%`,
              background: phase === 'active' ? barColor : COLORS.muted,
              opacity: lit ? (phase === 'past' ? 0.45 : 1) : 0.28,
            }}
          />
          {marks.map((pos) => (
            <span
              key={pos}
              className="absolute top-[-3px] h-[18px] w-0.5 rounded-full bg-ink/50"
              style={{ left: `${pos * 100}%` }}
            />
          ))}
        </div>
        <span className="shrink-0 text-base tabular-nums text-muted">
          {target ? `→ ${formatClock(target)}` : '—'}
        </span>
      </div>
      <p className="text-center text-lg text-muted">{caption}</p>
    </div>
  );
}
