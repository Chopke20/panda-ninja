import { AnimatePresence } from 'framer-motion';
import { ClockHeader } from '../components/ClockHeader';
import { DepartureTimeline } from '../components/DepartureTimeline';
import { FooterBar } from '../components/FooterBar';
import { KidColumn } from '../components/KidColumn';
import { PandaStage } from '../components/PandaStage';
import { PointsFly } from '../components/PointsFly';
import { availableBalance } from '../lib/shop';
import { isFreeDay } from '../lib/dayExceptions';
import { findDayLog, tasksForToday } from '../lib/tasks';
import {
  getMinutesLeft,
  getRoutinePhase,
  getTargetToday,
  todayIso,
  weekdayFromDate,
} from '../lib/time';
import { useNow } from '../lib/useNow';
import { getPandaPose } from '../store/selectors';
import { useStore } from '../store/useStore';

export function MainScreen() {
  const nowMs = useNow();
  const now = new Date(nowMs);
  const kids = useStore((s) => s.kids);
  const logs = useStore((s) => s.logs);
  const settings = useStore((s) => s.settings);
  const flights = useStore((s) => s.flights);
  const pandaPulse = useStore((s) => s.pandaPulse);
  const transactions = useStore((s) => s.transactions);
  const purchaseRequests = useStore((s) => s.purchaseRequests);
  const dayExceptions = useStore((s) => s.dayExceptions);
  const date = todayIso(now);
  const weekday = weekdayFromDate(now);
  const routineId = settings.activeRoutine ?? 'morning';
  const target = getTargetToday(settings, now, routineId, dayExceptions);
  const phase = getRoutinePhase(now, target, settings.routineWindowMin);
  const minutes = getMinutesLeft(now, target);
  const free = isFreeDay(dayExceptions, date);

  const columns = kids.map((kid) => {
    const due = free ? [] : tasksForToday(kid, weekday, routineId);
    const log = findDayLog(logs, date, kid.id, routineId);
    const completedIds = log?.completedTaskIds ?? [];
    const pose = getPandaPose({
      completedCount: completedIds.length,
      totalCount: due.length,
      phase,
      minutesLeft: minutes,
      windowMin: settings.routineWindowMin,
    });
    const wallet = availableBalance(transactions, purchaseRequests, kid.id);
    const ratio = due.length === 0 ? 0 : completedIds.length / due.length;
    const todayPts = logs
      .filter((item) => item.date === date && item.kidId === kid.id)
      .reduce((sum, item) => sum + item.pointsEarned, 0);
    return { kid, completedIds, pose, due, ratio, wallet, todayPts };
  });

  const bothReady = columns.every(
    (col) => col.due.length > 0 && col.completedIds.length >= col.due.length,
  );

  return (
    <div className="relative flex h-[100dvh] min-h-0 flex-col overflow-hidden pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="relative shrink-0">
          <ClockHeader />
          <DepartureTimeline />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col landscape:flex-row">
          <section className="grid min-h-0 min-w-0 shrink-0 basis-[42%] grid-cols-2 landscape:h-full landscape:w-[34%] landscape:basis-[34%] landscape:grid-cols-1">
            {columns.map((col) => (
              <div
                key={col.kid.id}
                className="flex min-h-0 min-w-0 flex-col border-t border-ink/10 px-1.5 landscape:border-t-0 landscape:border-b sm:px-2"
              >
                <PandaStage
                  pose={col.pose}
                  appearance={col.kid.panda}
                  name={col.kid.name}
                  pulse={pandaPulse[col.kid.id] ?? 0}
                />
                <div className="relative min-w-0 px-1 pb-1">
                  <div className="flex min-w-0 items-baseline justify-between gap-1">
                    <span className="min-w-0 truncate text-lg font-semibold">
                      {col.kid.name}
                      {col.kid.streak > 0 && (
                        <span className="ml-2 text-sm font-medium text-muted">🔥 {col.kid.streak}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm text-muted tabular-nums sm:text-base">
                      ★ {col.wallet}
                      {col.todayPts > 0 ? ` +${col.todayPts}` : ''} · {col.completedIds.length}/
                      {col.due.length}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full transition-[width] duration-300"
                      style={{
                        width: `${Math.round(col.ratio * 100)}%`,
                        background: col.kid.panda.accent,
                      }}
                    />
                  </div>
                  <AnimatePresence>
                    {flights
                      .filter((fly) => fly.kidId === col.kid.id)
                      .map((fly) => (
                        <PointsFly key={fly.id} id={fly.id} points={fly.points} />
                      ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </section>

          <section className="grid min-h-0 min-w-0 flex-1 grid-cols-2 gap-1 border-t border-ink/10 px-1 landscape:border-l landscape:border-t-0">
            {columns.map((col) => (
              <KidColumn
                key={col.kid.id}
                kid={col.kid}
                weekday={weekday}
                completedIds={col.completedIds}
                nowMs={nowMs}
              />
            ))}
          </section>
        </div>

        <FooterBar bothReady={bothReady} showShop={phase !== 'active'} />
      </div>
    </div>
  );
}
