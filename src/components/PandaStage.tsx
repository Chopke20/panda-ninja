import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { PandaAppearance, PandaPose } from '../types';
import { CELEBRATE_STARS, COLORS, MOTION, PANDA_STAGE, USE_PANDA_V2 } from '../lib/constants';
import { pandaArtSrc } from '../lib/pandaArt';
import {
  bodySheet,
  furFilter,
  logoGlyph,
  POSE_ANCHORS,
} from '../lib/pandaCompose';
import { PandaComposer } from './PandaComposer';

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

function OverlayGlyph({
  glyph,
  x,
  y,
  scale,
  rotate,
  sizePx,
}: {
  glyph: string;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  sizePx: number;
}) {
  return (
    <span
      className="pointer-events-none absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        fontSize: sizePx * scale,
        transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.25))',
      }}
      aria-hidden
    >
      {glyph}
    </span>
  );
}

function ColorChip({
  hex,
  x,
  y,
  w,
  h,
  opacity = 0.55,
}: {
  hex: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
}) {
  return (
    <span
      className="pointer-events-none absolute rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${w}%`,
        height: `${h}%`,
        transform: 'translate(-50%, -50%)',
        background: hex,
        opacity,
        mixBlendMode: 'multiply',
      }}
      aria-hidden
    />
  );
}

export function PandaStage({ pose, appearance, name, pulse, compact = false }: Props) {
  const reduce = useReducedMotion();
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const sheet = bodySheet(appearance.body);
  const src = pandaArtSrc(sheet, pose);
  const missing = failed[src] === true;
  const size = compact ? PANDA_STAGE.startSizePx : undefined;
  const zzz = ['z', 'Z', 'z'] as const;
  const anchors = POSE_ANCHORS[pose];
  const logo = logoGlyph(appearance.logoId);
  const glyphSize = compact ? 18 : 28;
  const useV2 = USE_PANDA_V2 && !compact;

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center">
      <motion.div
        className="relative flex aspect-square items-center justify-center"
        style={{
          width: compact ? size : PANDA_STAGE.width,
          height: compact ? size : undefined,
          maxHeight: compact ? size : '100%',
        }}
        animate={reduce || pulse === 0 ? { scale: 1 } : { scale: [1, MOTION.pulseScale, 1] }}
        transition={{ duration: MOTION.pulseSec }}
      >
        <motion.div
          className="relative h-full w-full overflow-hidden rounded-3xl"
          style={{
            background: useV2 || !missing ? 'transparent' : COLORS.placeholder[pose],
          }}
          animate={reduce ? { y: 0, scale: 1, rotate: 0 } : poseAnimate(pose)}
          transition={reduce ? { duration: 0 } : poseTransition(pose)}
        >
          {useV2 ? (
            <PandaComposer pose={pose} appearance={appearance} />
          ) : (
            <>
              <AnimatePresence initial={false}>
                {!missing && (
                  <motion.img
                    key={src}
                    src={src}
                    alt=""
                    className="absolute inset-0 h-full w-full object-contain object-bottom"
                    style={{ filter: furFilter(appearance.fur) }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0 : MOTION.crossfadeSec }}
                    onError={() => setFailed((prev) => ({ ...prev, [src]: true }))}
                  />
                )}
              </AnimatePresence>

              {/* Nakładki kolorów — przejściowe do czasu masek panda-v2 */}
              <ColorChip
                hex={appearance.outfitColor}
                x={anchors.collar.x}
                y={anchors.collar.y}
                w={42}
                h={28}
                opacity={0.35}
              />
              <ColorChip
                hex={appearance.headbandColor}
                x={anchors.headband.x}
                y={anchors.headband.y}
                w={36}
                h={10}
                opacity={0.65}
              />
              <OverlayGlyph
                glyph={logo}
                x={anchors.logo.x}
                y={anchors.logo.y}
                scale={anchors.logo.scale}
                rotate={anchors.logo.rotate}
                sizePx={glyphSize * 0.7}
              />
            </>
          )}

          {pose === 'sleeping' && !reduce && (
            <div className="pointer-events-none absolute right-[12%] top-[8%] flex flex-col items-start text-muted">
              {zzz.map((letter, index) => (
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
          {pose === 'celebrating' && !reduce && (
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
