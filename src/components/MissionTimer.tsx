import { useEffect, useRef, useState } from 'react';
import { TOUCH } from '../lib/constants';
import { chime, setVolume } from '../lib/sfx';
import { speak } from '../lib/speech';
import { formatTimerClock, timerEndsAt, timerRemainingSec } from '../lib/timer';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/useStore';

type Props = {
  durationSec: number;
  muted?: boolean;
};

/** Spokojny timer misji — bez faila, można odhaczyć zadanie w dowolnym momencie. */
export function MissionTimer({ durationSec, muted = false }: Props) {
  const nowMs = useNow();
  const settings = useStore((s) => s.settings);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const announced = useRef(false);

  const running = endsAt !== null;
  const left = running ? timerRemainingSec(endsAt, nowMs) : durationSec;
  const done = running && left <= 0;

  useEffect(() => {
    if (!done || announced.current || muted) return;
    announced.current = true;
    setVolume(settings.volume);
    chime();
    if (settings.ttsEnabled) {
      const line = settings.voiceLines.timerDone ?? 'Koniec timera. Świetnie Ci idzie.';
      speak(line, settings.ttsVoiceURI);
    }
  }, [done, muted, settings.ttsEnabled, settings.ttsVoiceURI, settings.voiceLines.timerDone, settings.volume]);

  function start() {
    announced.current = false;
    setEndsAt(timerEndsAt(Date.now(), durationSec));
  }

  function stop() {
    setEndsAt(null);
    announced.current = false;
  }

  return (
    <div
      className="mt-2 flex items-center gap-2 rounded-2xl bg-paper/80 px-3 py-2"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="min-w-[4.5rem] text-center text-2xl tabular-nums font-semibold text-dojo">
        {formatTimerClock(left)}
      </span>
      {!running ? (
        <button
          type="button"
          className="flex-1 rounded-xl bg-dojo text-white"
          style={{ minHeight: TOUCH.minTilePx - 16 }}
          onClick={start}
        >
          Start timera
        </button>
      ) : done ? (
        <button
          type="button"
          className="flex-1 rounded-xl bg-white text-dojo"
          style={{ minHeight: TOUCH.minTilePx - 16 }}
          onClick={stop}
        >
          Gotowe — reset
        </button>
      ) : (
        <button
          type="button"
          className="flex-1 rounded-xl bg-white text-muted"
          style={{ minHeight: TOUCH.minTilePx - 16 }}
          onClick={stop}
        >
          Stop
        </button>
      )}
    </div>
  );
}
