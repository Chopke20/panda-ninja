import { useEffect, useState } from 'react';
import type { PandaAppearance, PandaPose } from '../types';
import { assetUrl } from '../lib/assetUrl';
import { STARTER_LOGOS, stageDef } from '../lib/evolution';
import { pandaSpriteSrcs } from '../lib/pandaArt';
import { recolorKimonoSrc } from '../lib/pandaChroma';

/** Przybliżona pozycja płytki opaski (% kontenera) — logo nakładane na sprite. */
const LOGO_PLATE: Record<PandaPose, { top: string; left: string; size: string }> = {
  sleeping: { top: '24%', left: '48%', size: '9%' },
  training: { top: '20%', left: '50%', size: '9%' },
  hurry: { top: '22%', left: '52%', size: '8%' },
  celebrating: { top: '18%', left: '50%', size: '9%' },
};

type Props = {
  pose: PandaPose;
  appearance: PandaAppearance;
  compact?: boolean;
};

function logoSrc(logoId: string): string {
  const key = STARTER_LOGOS.find((l) => l.id === logoId)?.assetKey ?? 'paw';
  return assetUrl(`art/panda-v2/round/logos/${key}.webp`);
}

/**
 * Sprite ewolucji z recolor kimona (chroma) i logo na płytce.
 */
export function PandaEvoSprite({ pose, appearance, compact = false }: Props) {
  const srcs = pandaSpriteSrcs(appearance.body, pose, appearance.stage);
  const [srcIndex, setSrcIndex] = useState(0);
  const baseSrc = srcs[Math.min(srcIndex, srcs.length - 1)] ?? '';
  const [displaySrc, setDisplaySrc] = useState(baseSrc);
  const showLogo = stageDef(appearance.body, appearance.stage)?.showLogo !== false;
  const plate = LOGO_PLATE[pose];

  useEffect(() => {
    setSrcIndex(0);
  }, [appearance.body, appearance.stage, pose]);

  useEffect(() => {
    if (!baseSrc) {
      setDisplaySrc('');
      return;
    }
    let cancelled = false;
    // Flat fallback (panda-a/b) — bez chroma; evo webp — z recolor.
    const isEvo = baseSrc.includes('/art/evo/') || baseSrc.includes('/evo/');
    if (!isEvo) {
      setDisplaySrc(baseSrc);
      return;
    }
    void recolorKimonoSrc(baseSrc, appearance.outfitColor)
      .then((url) => {
        if (!cancelled) setDisplaySrc(url);
      })
      .catch(() => {
        if (!cancelled) setDisplaySrc(baseSrc);
      });
    return () => {
      cancelled = true;
    };
  }, [baseSrc, appearance.outfitColor]);

  if (!displaySrc) return null;

  return (
    <div className="pointer-events-none absolute inset-0">
      <img
        key={displaySrc}
        src={displaySrc}
        alt=""
        className="absolute inset-0 h-full w-full object-contain object-bottom"
        onError={() => {
          setSrcIndex((i) => (i + 1 < srcs.length ? i + 1 : i));
        }}
      />
      {showLogo && (
        <img
          src={logoSrc(appearance.logoId)}
          alt=""
          className="absolute object-contain"
          style={{
            top: plate.top,
            left: plate.left,
            width: compact ? '11%' : plate.size,
            height: compact ? '11%' : plate.size,
            transform: 'translate(-50%, -50%)',
          }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
    </div>
  );
}
