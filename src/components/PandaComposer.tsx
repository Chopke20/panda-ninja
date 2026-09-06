import { useEffect, useState } from 'react';
import type { PandaAppearance, PandaPose } from '../types';
import { buildComposeLayers, type ComposeLayer } from '../lib/pandaV2';

type Props = {
  pose: PandaPose;
  appearance: PandaAppearance;
  className?: string;
};

function withPngFallback(src: string): string {
  return src.endsWith('.webp') ? src.replace(/\.webp$/i, '.png') : src;
}

function LayerImage({
  src,
  z,
  anchor,
  onMissing,
}: {
  src: string;
  z: number;
  anchor?: { x: number; y: number; sizePct: number; rotate?: number };
  onMissing: () => void;
}) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(src);
    setFailed(false);
  }, [src]);

  if (failed) return null;

  if (anchor) {
    const rot = anchor.rotate ?? 0;
    return (
      <img
        src={current}
        alt=""
        className="pointer-events-none absolute object-contain"
        style={{
          zIndex: z,
          left: `${anchor.x}%`,
          top: `${anchor.y}%`,
          width: `${anchor.sizePct}%`,
          height: `${anchor.sizePct}%`,
          transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        }}
        onError={() => {
          const png = withPngFallback(current);
          if (png !== current) {
            setCurrent(png);
            return;
          }
          setFailed(true);
          onMissing();
        }}
      />
    );
  }

  return (
    <img
      src={current}
      alt=""
      className="pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
      style={{ zIndex: z }}
      onError={() => {
        const png = withPngFallback(current);
        if (png !== current) {
          setCurrent(png);
          return;
        }
        setFailed(true);
        onMissing();
      }}
    />
  );
}

function MaskColorLayer({
  layer,
  onMissing,
}: {
  layer: Extract<ComposeLayer, { kind: 'maskColor' }>;
  onMissing: () => void;
}) {
  const [maskSrc, setMaskSrc] = useState(layer.maskSrc);
  const [shadeSrc, setShadeSrc] = useState(layer.shadeSrc);
  const [maskOk, setMaskOk] = useState(true);
  const [shadeOk, setShadeOk] = useState(true);

  useEffect(() => {
    setMaskSrc(layer.maskSrc);
    setShadeSrc(layer.shadeSrc);
    setMaskOk(true);
    setShadeOk(true);
  }, [layer.maskSrc, layer.shadeSrc]);

  if (!maskOk) return null;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: layer.z,
          backgroundColor: layer.color,
          WebkitMaskImage: `url(${maskSrc})`,
          maskImage: `url(${maskSrc})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center bottom',
          maskPosition: 'center bottom',
        }}
      />
      <img
        src={maskSrc}
        alt=""
        className="hidden"
        onError={() => {
          const png = withPngFallback(maskSrc);
          if (png !== maskSrc) {
            setMaskSrc(png);
            return;
          }
          setMaskOk(false);
          onMissing();
        }}
      />
      {shadeOk && (
        <img
          src={shadeSrc}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom"
          style={{ zIndex: layer.z + 1 }}
          onError={() => {
            const png = withPngFallback(shadeSrc);
            if (png !== shadeSrc) {
              setShadeSrc(png);
              return;
            }
            setShadeOk(false);
          }}
        />
      )}
    </>
  );
}

function MaskPatternLayer({
  layer,
  onMissing,
}: {
  layer: Extract<ComposeLayer, { kind: 'maskPattern' }>;
  onMissing: () => void;
}) {
  const [patternSrc, setPatternSrc] = useState(layer.patternSrc);
  const [maskSrc, setMaskSrc] = useState(layer.maskSrc);
  const [ok, setOk] = useState(true);

  useEffect(() => {
    setPatternSrc(layer.patternSrc);
    setMaskSrc(layer.maskSrc);
    setOk(true);
  }, [layer.maskSrc, layer.patternSrc]);

  if (!ok) return null;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: layer.z,
          opacity: 0.55,
          mixBlendMode: 'multiply',
          backgroundImage: `url(${patternSrc})`,
          backgroundSize: '48% 48%',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          WebkitMaskImage: `url(${maskSrc})`,
          maskImage: `url(${maskSrc})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center bottom',
          maskPosition: 'center bottom',
        }}
      />
      <img
        src={patternSrc}
        alt=""
        className="hidden"
        onError={() => {
          const png = withPngFallback(patternSrc);
          if (png !== patternSrc) {
            setPatternSrc(png);
            return;
          }
          setOk(false);
          onMissing();
        }}
      />
      <img
        src={maskSrc}
        alt=""
        className="hidden"
        onError={() => {
          const png = withPngFallback(maskSrc);
          if (png !== maskSrc) setMaskSrc(png);
        }}
      />
    </>
  );
}

/**
 * Składa pandę z warstw panda-v2.
 * Brakujące pliki są pomijane (onError) — body jest wymagane sensownie.
 */
export function PandaComposer({ pose, appearance, className = '' }: Props) {
  const layers = buildComposeLayers(appearance, pose);
  const [, setMissingTick] = useState(0);
  const bump = () => setMissingTick((n) => n + 1);

  return (
    <div className={`relative h-full w-full ${className}`}>
      {layers.map((layer) => {
        if (layer.kind === 'img') {
          return (
            <LayerImage
              key={`${layer.key}-${layer.src}`}
              src={layer.src}
              z={layer.z}
              anchor={layer.anchor}
              onMissing={bump}
            />
          );
        }
        if (layer.kind === 'maskPattern') {
          return (
            <MaskPatternLayer
              key={`${layer.key}-${layer.patternSrc}`}
              layer={layer}
              onMissing={bump}
            />
          );
        }
        return (
          <MaskColorLayer
            key={`${layer.key}-${layer.maskSrc}`}
            layer={layer}
            onMissing={bump}
          />
        );
      })}
    </div>
  );
}
