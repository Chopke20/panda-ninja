import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Kid, Weekday } from '../types';
import { TOUCH } from '../lib/constants';
import { isMutedToday } from '../lib/day';
import { isFreeDay } from '../lib/dayExceptions';
import { tapHaptic } from '../lib/haptics';
import { fillVoiceLine } from '../lib/schedule';
import { chime, fanfare, setVolume, unchime, victory } from '../lib/sfx';
import { speak } from '../lib/speech';
import { todayIso } from '../lib/time';
import { tasksForToday } from '../lib/tasks';
import { useStore } from '../store/useStore';
import { TaskTile } from './TaskTile';

type Props = {
  kid: Kid;
  weekday: Weekday;
  completedIds: string[];
  nowMs: number;
  onBothReady?: () => void;
};

export function KidColumn({ kid, weekday, completedIds, nowMs, onBothReady }: Props) {
  const toggleTask = useStore((s) => s.toggleTask);
  const settings = useStore((s) => s.settings);
  const mutedToday = useStore((s) => s.mutedToday);
  const mutedDate = useStore((s) => s.mutedDate);
  const dayExceptions = useStore((s) => s.dayExceptions);
  const [showAll, setShowAll] = useState(false);
  const date = todayIso(new Date(nowMs));
  const free = isFreeDay(dayExceptions, date);
  const routineId = settings.activeRoutine ?? 'morning';
  const tasks = free ? [] : tasksForToday(kid, weekday, routineId);
  const open = tasks.filter((task) => !completedIds.includes(task.id));
  const done = tasks.filter((task) => completedIds.includes(task.id));
  const next = open[0];
  const nextId = next?.id;
  const ordered = [...open, ...done];
  const mission = settings.nextMissionMode && !showAll;
  const quiet = isMutedToday(mutedToday, mutedDate, date);

  function complete(taskId: string) {
    const flags = toggleTask(kid.id, taskId, 'complete', nowMs);
    if (!flags) return;
    tapHaptic();
    if (quiet) return;
    setVolume(settings.volume);
    if (flags.bothJustCompleted) {
      victory();
      onBothReady?.();
    } else if (flags.ownJustCompleted) fanfare();
    else chime();
    if (flags.ownJustCompleted && settings.ttsEnabled) {
      const line = fillVoiceLine(settings.voiceLines.complete ?? '', kid.name);
      if (line) speak(line, settings.ttsVoiceURI);
    }
  }

  function uncomplete(taskId: string) {
    const flags = toggleTask(kid.id, taskId, 'uncomplete', nowMs);
    if (!flags) return;
    tapHaptic();
    if (quiet) return;
    setVolume(settings.volume);
    unchime();
  }

  if (free) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center px-3 text-center">
        <p className="text-xl font-semibold">Dziś wolne</p>
        <p className="mt-2 text-muted">Seria 🔥 zostaje. Odpoczynek też jest treningiem.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {settings.nextMissionMode && (
        <div className="px-1 pb-1">
          <button
            type="button"
            className="w-full rounded-xl border border-[color:var(--color-tile-border)] bg-tile text-sm text-muted backdrop-blur-[4px]"
            style={{ minHeight: TOUCH.minTilePx }}
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? 'Tylko następna misja' : 'Pokaż całą listę'}
          </button>
        </div>
      )}
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-0.5">
        {mission ? (
          next ? (
            <div className="flex min-h-full min-w-0 flex-col justify-center py-2">
              <p className="mb-2 text-center text-sm text-muted">
                Następna misja · {done.length}/{tasks.length}
              </p>
              <TaskTile
                taskLabel={next.label}
                icon={next.icon}
                points={next.points}
                done={false}
                highlight
                large
                timerSec={next.timerSec}
                muted={quiet}
                onComplete={() => complete(next.id)}
                onUncomplete={() => undefined}
              />
            </div>
          ) : (
            <div className="flex min-h-full flex-col items-center justify-center gap-2 px-2 text-center">
              <p className="text-xl font-semibold">Misje ukończone!</p>
              <p className="text-muted">
                {done.length}/{tasks.length} zadań
              </p>
              {done.length > 0 && (
                <button
                  type="button"
                  className="mt-2 rounded-xl border border-[color:var(--color-tile-border)] bg-tile px-4 text-sm text-muted backdrop-blur-[4px]"
                  style={{ minHeight: TOUCH.minTilePx }}
                  onClick={() => setShowAll(true)}
                >
                  Pokaż listę
                </button>
              )}
            </div>
          )
        ) : (
          ordered.map((task) => (
            <motion.div
              key={task.id}
              layout="position"
              transition={{ duration: 0.22 }}
              className="mb-1.5 min-w-0"
            >
              <TaskTile
                taskLabel={task.label}
                icon={task.icon}
                points={task.points}
                done={completedIds.includes(task.id)}
                highlight={task.id === nextId}
                timerSec={task.timerSec}
                muted={quiet}
                onComplete={() => complete(task.id)}
                onUncomplete={() => uncomplete(task.id)}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
