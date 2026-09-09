import { useEffect, useState } from 'react';
import { BG } from '../lib/constants';
import { assetCandidates } from '../lib/assetUrl';
import type { RoutineId } from '../types';

type Props = {
  routineId: RoutineId;
};

/** Bambusowe tło rutyny — CSS (bez Framer opacity), czytelniejsze na iPadzie. */
export function RoutineBackdrop({ routineId }: Props) {
  const file =
    routineId === 'evening' ? 'art/bg/bamboo-evening.webp' : 'art/bg/bamboo-morning.webp';
  const candidates = assetCandidates(file);
  const [srcIndex, setSrcIndex] = useState(0);
  const opacity =
    routineId === 'evening' ? BG.routineOpacityEvening : BG.routineOpacity;

  useEffect(() => {
    setSrcIndex(0);
  }, [routineId]);

  const src = candidates[srcIndex] ?? candidates[0];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <img
        key={src}
        src={src}
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity }}
        onError={() => {
          setSrcIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
        }}
      />
    </div>
  );
}
