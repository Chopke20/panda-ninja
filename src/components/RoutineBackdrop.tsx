import { AnimatePresence, motion } from 'framer-motion';
import { BG, MOTION } from '../lib/constants';
import { assetUrl } from '../lib/assetUrl';
import type { RoutineId } from '../types';

type Props = {
  routineId: RoutineId;
};

/** Bambusowe tło rutyny — niska opacity, nie gryzie z UI. */
export function RoutineBackdrop({ routineId }: Props) {
  const file =
    routineId === 'evening' ? 'art/bg/bamboo-evening.webp' : 'art/bg/bamboo-morning.webp';
  const opacity =
    routineId === 'evening' ? BG.routineOpacityEvening : BG.routineOpacity;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <AnimatePresence mode="sync" initial={false}>
        <motion.img
          key={routineId}
          src={assetUrl(file)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity }}
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION.crossfadeSec }}
        />
      </AnimatePresence>
    </div>
  );
}
