import type { CosmeticItem, GripFamily } from './cosmetics';
import { getCosmetic } from './cosmetics';
import { assetUrl } from './assetUrl';
import { hasOffHand, placementFor, type Placement } from './pandaAnchors';
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

export type HandVariant = 'l' | 'r' | 'solo';

/** Pięści są rozbite na osobne pliki (npm run art:anchor) — po jednej na rękę. */
export function handsLayerSrc(
  body: PandaBodyId,
  grip: string,
  pose: PandaPose,
  variant?: HandVariant,
): string {
  const name = variant ? `${pose}-${variant}` : pose;
  return pandaV2LayerSrc(body, ['hands', grip, name]);
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
      /** Warstwa przycięta do bbox — sadzana kotwicą pozy. Brak = pełna klatka. */
      anchor?: Placement;
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
  const grip = gripFamilyForHand(appearance.handId) as GripFamily;
  const weaponKey = weaponAssetKey(appearance.handId);
  const auraKey = auraAssetKey(appearance.auraId);
  const patternKey = patternAssetKey(appearance.outfitPatternId);
  const layers: ComposeLayer[] = [];

  const push = (
    key: string,
    src: string,
    z: number,
    anchor: Placement | null,
  ): void => {
    if (!anchor) return;
    layers.push({ kind: 'img', key, src, z, anchor });
  };

  if (auraKey) {
    push(
      'aura',
      auraLayerSrc(body, auraKey, pose),
      2,
      placementFor('aura', body, pose, auraKey, grip),
    );
  }

  const backKey = gadgetAssetKey(appearance.backId);
  if (backKey) {
    push(
      'back',
      gadgetLayerSrc(body, backKey, pose),
      5,
      placementFor('back', body, pose, backKey, grip),
    );
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
    push(
      'weapon',
      weaponLayerSrc(body, weaponKey, pose),
      40,
      placementFor('weapon', body, pose, weaponKey, grip),
    );
  }

  // Pięści osobno na każdą rękę — w pozie z jedną widoczną ręką jeden plik.
  if (hasOffHand(pose)) {
    push(
      'hands-off',
      handsLayerSrc(body, grip, pose, 'l'),
      48,
      placementFor('fistOff', body, pose, null, grip),
    );
    push(
      'hands',
      handsLayerSrc(body, grip, pose, 'r'),
      50,
      placementFor('fistMain', body, pose, null, grip),
    );
  } else {
    push(
      'hands',
      handsLayerSrc(body, grip, pose, 'solo'),
      50,
      placementFor('fistMain', body, pose, null, grip),
    );
  }

  const headKey = gadgetAssetKey(appearance.headId);
  if (headKey) {
    push(
      'head',
      gadgetLayerSrc(body, headKey, pose),
      60,
      placementFor('head', body, pose, headKey, grip),
    );
  }

  const beltKey = gadgetAssetKey(appearance.beltId);
  if (beltKey) {
    push(
      'belt',
      gadgetLayerSrc(body, beltKey, pose),
      65,
      placementFor('belt', body, pose, beltKey, grip),
    );
  }

  const logoKey = logoAssetKey(appearance.logoId);
  push(
    'logo',
    logoLayerSrc(body, logoKey),
    70,
    placementFor('logo', body, pose, logoKey, grip),
  );

  return layers.sort((a, b) => a.z - b.z);
}
