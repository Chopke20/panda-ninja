import { useReducedMotion } from 'framer-motion';
import { motion } from 'framer-motion';
import type { PandaAppearance, PandaPose } from '../types';
import { CELEBRATE_STARS, COLORS, MOTION, PANDA_STAGE, USE_PANDA_V2 } from '../lib/constants';
import { stageDef } from '../lib/evolution';
import { PandaComposer } from './PandaComposer';
import { PandaEvoSprite } from './PandaEvoSprite';

const LABELS: Record<PandaPose, string> = {
  sleeping: 'śpi',
  training: 'trenuje',
  hurry: 'śpieszy się',
  celebrating: 'świętuje',
};

type Props = {
  pose: PandaPose;
  appearance: PandaAppearance;
  name: string;
  pulse: number;
  compact?: boolean;
};

function poseAnimate(pose: PandaPose) {
  if (pose === 'sleeping') return { scale: [1, MOTION.sleepScale, 1], y: 0, rotate: 0 };
  if (pose === 'training') return { y: [0, -MOTION.bouncePx, 0], scale: 1, rotate: 0 };
  if (pose === 'hurry') return { y: [0, -MOTION.bouncePx, 0], scale: 1, rotate: 0 };
  return {
    y: [0, -MOTION.celebrateBouncePx, 0],
    rotate: [0, -MOTION.celebrateRotateDeg, MOTION.celebrateRotateDeg, 0],
    scale: 1,
  };
}

function poseTransition(pose: PandaPose) {
  const duration =
    pose === 'sleeping'
      ? MOTION.sleepSec
      : pose === 'training'
        ? MOTION.trainSec
        : pose === 'hurry'
          ? MOTION.hurrySec
          : MOTION.celebrateSec;
  return { duration, repeat: Infinity, ease: 'easeInOut' as const };
}

/** Sprite ewolucji (recolor + logo) albo legacy paper-doll gdy włączone. */
export function PandaStage({ pose, appearance, name, pulse, compact = false }: Props) {
  const reduce = useReducedMotion();
  const size = compact ? PANDA_STAGE.startSizePx : undefined;
  const evoReady = stageDef(appearance.body, appearance.stage)?.ready === true;
  const useV2 = USE_PANDA_V2 && !compact && !evoReady;
  const still = compact || reduce || pulse === 0;

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center">
      <motion.div
        className="relative flex aspect-square items-center justify-center"
        style={{
          width: compact ? size : PANDA_STAGE.width,
          height: compact ? size : undefined,
          maxHeight: compact ? size : '100%',
        }}
        animate={still ? { scale: 1 } : { scale: [1, MOTION.pulseScale, 1] }}
        transition={{ duration: MOTION.pulseSec }}
      >
        <motion.div
          className="relative h-full w-full overflow-hidden"
          animate={compact || reduce ? { y: 0, scale: 1, rotate: 0 } : poseAnimate(pose)}
          transition={compact || reduce ? { duration: 0 } : poseTransition(pose)}
        >
          {useV2 ? (
            <PandaComposer pose={pose} appearance={appearance} />
          ) : (
            <PandaEvoSprite pose={pose} appearance={appearance} compact={compact} />
          )}

          {!compact && pose === 'sleeping' && !reduce && (
            <div className="pointer-events-none absolute right-[12%] top-[8%] flex flex-col items-start text-muted">
              {(['z', 'Z', 'z'] as const).map((letter, index) => (
                <motion.span
                  key={letter + String(index)}
                  className="leading-none"
                  style={{ fontSize: MOTION.zzzSizePx + index * MOTION.zzzSizeStepPx }}
                  initial={{ opacity: 0, y: MOTION.zzzFromY }}
                  animate={{
                    opacity: [0, 1, 0],
                    y: [MOTION.zzzFromY, -(MOTION.zzzRisePx + index * MOTION.zzzRiseStepPx)],
                  }}
                  transition={{
                    duration: MOTION.zzzSec,
                    repeat: Infinity,
                    delay: index * MOTION.zzzDelaySec,
                    ease: 'easeOut',
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>
          )}
          {!compact && pose === 'celebrating' && !reduce && (
            <div className="pointer-events-none absolute inset-0">
              {CELEBRATE_STARS.map((star) => (
                <motion.span
                  key={`${star.x}-${star.y}-${star.delay}`}
                  className="absolute left-1/2 top-1/2"
                  style={{ color: COLORS.gold, fontSize: star.size }}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: [0, star.x],
                    y: [0, star.y],
                    scale: [0.4, 1, 0.7],
                  }}
                  transition={{
                    duration: MOTION.starSec,
                    repeat: Infinity,
                    delay: star.delay,
                    ease: 'easeOut',
                  }}
                >
                  ★
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
      <span className="sr-only">
        {name} {LABELS[pose]}
      </span>
    </div>
  );
}
