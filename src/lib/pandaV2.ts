import type { CosmeticItem } from './cosmetics';
import { getCosmetic } from './cosmetics';
import { PANDA_V2_LOGO } from './constants';
import { assetUrl } from './assetUrl';
import { POSE_ANCHORS } from './pandaCompose';
import type { PandaAppearance, PandaBodyId, PandaPose } from '../types';

export type PandaV2Status = {
  checkedAt: string;
  canvas: number;
  body: string;
  required: number;
  present: number;
  missing: string[];
  mvpReady: boolean;
};

const BODY_DIR: Record<PandaBodyId, string> = {
  round: 'round',
  agile: 'agile',
};

/** Katalog body w public/art/panda-v2/. */
export function pandaV2Base(body: PandaBodyId): string {
  return assetUrl(`art/panda-v2/${BODY_DIR[body]}`);
}

/** Ścieżka warstwy — WebP z art:webp, PNG jako fallback w composerze. */
export function pandaV2LayerSrc(
  body: PandaBodyId,
  parts: string[],
  ext: 'webp' | 'png' = 'webp',
): string {
  return `${pandaV2Base(body)}/${parts.join('/')}.${ext}`;
}

export function bodyLayerSrc(body: PandaBodyId, pose: PandaPose): string {
  return pandaV2LayerSrc(body, ['body', pose]);
}

export function handsLayerSrc(
  body: PandaBodyId,
  grip: string,
  pose: PandaPose,
): string {
  return pandaV2LayerSrc(body, ['hands', grip, pose]);
}

export function weaponLayerSrc(
  body: PandaBodyId,
  assetKey: string,
  pose: PandaPose,
): string {
  return pandaV2LayerSrc(body, ['weapons', assetKey, pose]);
}

export function gadgetLayerSrc(
  body: PandaBodyId,
  assetKey: string,
  pose: PandaPose,
): string {
  return pandaV2LayerSrc(body, ['gadgets', assetKey, pose]);
}

export function kimonoMaskSrc(body: PandaBodyId, pose: PandaPose): string {
  return pandaV2LayerSrc(body, ['kimono', 'mask', pose]);
}

export function kimonoShadeSrc(body: PandaBodyId, pose: PandaPose): string {
  return pandaV2LayerSrc(body, ['kimono', 'shade', pose]);
}

export function headbandMaskSrc(body: PandaBodyId, pose: PandaPose): string {
  return pandaV2LayerSrc(body, ['headband', 'mask', pose]);
}

export function headbandShadeSrc(body: PandaBodyId, pose: PandaPose): string {
  return pandaV2LayerSrc(body, ['headband', 'shade', pose]);
}

export function logoLayerSrc(body: PandaBodyId, assetKey: string): string {
  return pandaV2LayerSrc(body, ['logos', assetKey]);
}

export function auraLayerSrc(
  body: PandaBodyId,
  assetKey: string,
  pose: PandaPose,
): string {
  return pandaV2LayerSrc(body, ['auras', assetKey, pose]);
}

export function patternLayerSrc(body: PandaBodyId, assetKey: string): string {
  return pandaV2LayerSrc(body, ['patterns', assetKey]);
}

export function gripFamilyForHand(handId: string): string {
  const item = getCosmetic(handId);
  return item?.gripFamily ?? 'staff';
}

export function weaponAssetKey(handId: string): string | null {
  const item = getCosmetic(handId);
  if (!item || item.slot !== 'hand' || item.comingSoon) return null;
  return item.assetKey;
}

export function gadgetAssetKey(itemId: string | null): string | null {
  if (!itemId) return null;
  const item: CosmeticItem | undefined = getCosmetic(itemId);
  if (!item || item.comingSoon) return null;
  return item.assetKey;
}

export function logoAssetKey(logoId: string): string {
  return getCosmetic(logoId)?.assetKey ?? 'paw';
}

export function auraAssetKey(auraId: string | null): string | null {
  if (!auraId) return null;
  const item = getCosmetic(auraId);
  if (!item || item.slot !== 'aura' || item.comingSoon) return null;
  return item.assetKey;
}

export function patternAssetKey(patternId: string | null): string | null {
  if (!patternId) return null;
  const item = getCosmetic(patternId);
  if (!item || item.slot !== 'outfitPattern' || item.comingSoon) return null;
  return item.assetKey;
}

/** Stos warstw do renderu (kolejność = z-index rosnący). */
export type ComposeLayer =
  | {
      kind: 'img';
      key: string;
      src: string;
      z: number;
      /** Opcjonalna kotwica % (logo na płytce). */
      anchor?: { x: number; y: number; sizePct: number };
    }
  | {
      kind: 'maskColor';
      key: string;
      maskSrc: string;
      shadeSrc: string;
      color: string;
      z: number;
    }
  | {
      kind: 'maskPattern';
      key: string;
      maskSrc: string;
      patternSrc: string;
      z: number;
    };

export function buildComposeLayers(
  appearance: PandaAppearance,
  pose: PandaPose,
): ComposeLayer[] {
  const body = appearance.body;
  const grip = gripFamilyForHand(appearance.handId);
  const weaponKey = weaponAssetKey(appearance.handId);
  const auraKey = auraAssetKey(appearance.auraId);
  const patternKey = patternAssetKey(appearance.outfitPatternId);
  const layers: ComposeLayer[] = [];

  if (auraKey) {
    layers.push({
      kind: 'img',
      key: 'aura',
      src: auraLayerSrc(body, auraKey, pose),
      z: 2,
    });
  }

  if (appearance.backId) {
    const key = gadgetAssetKey(appearance.backId);
    if (key) {
      layers.push({
        kind: 'img',
        key: 'back',
        src: gadgetLayerSrc(body, key, pose),
        z: 5,
      });
    }
  }

  layers.push(
    { kind: 'img', key: 'body', src: bodyLayerSrc(body, pose), z: 10 },
    {
      kind: 'maskColor',
      key: 'kimono',
      maskSrc: kimonoMaskSrc(body, pose),
      shadeSrc: kimonoShadeSrc(body, pose),
      color: appearance.outfitColor,
      z: 20,
    },
  );

  if (patternKey) {
    layers.push({
      kind: 'maskPattern',
      key: 'pattern',
      maskSrc: kimonoMaskSrc(body, pose),
      patternSrc: patternLayerSrc(body, patternKey),
      z: 22,
    });
  }

  layers.push({
    kind: 'maskColor',
    key: 'headband',
    maskSrc: headbandMaskSrc(body, pose),
    shadeSrc: headbandShadeSrc(body, pose),
    color: appearance.headbandColor,
    z: 30,
  });

  if (weaponKey) {
    layers.push({
      kind: 'img',
      key: 'weapon',
      src: weaponLayerSrc(body, weaponKey, pose),
      z: 40,
    });
  }

  layers.push({
    kind: 'img',
    key: 'hands',
    src: handsLayerSrc(body, grip, pose),
    z: 50,
  });

  if (appearance.headId) {
    const key = gadgetAssetKey(appearance.headId);
    if (key) {
      layers.push({
        kind: 'img',
        key: 'head',
        src: gadgetLayerSrc(body, key, pose),
        z: 60,
      });
    }
  }

  if (appearance.beltId) {
    const key = gadgetAssetKey(appearance.beltId);
    if (key) {
      layers.push({
        kind: 'img',
        key: 'belt',
        src: gadgetLayerSrc(body, key, pose),
        z: 65,
      });
    }
  }

  layers.push({
    kind: 'img',
    key: 'logo',
    src: logoLayerSrc(body, logoAssetKey(appearance.logoId)),
    z: 70,
    anchor: {
      x: POSE_ANCHORS[pose].logo.x,
      y: POSE_ANCHORS[pose].logo.y,
      sizePct: PANDA_V2_LOGO.sizePct * POSE_ANCHORS[pose].logo.scale,
    },
  });

  return layers.sort((a, b) => a.z - b.z);
}
