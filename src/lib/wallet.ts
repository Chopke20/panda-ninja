import type {
  Kid,
  LegacyPandaConfig,
  PandaAppearance,
  PointTransaction,
  PurchaseRequest,
} from '../types';
import {
  defaultOwnedIds,
  getCosmetic,
  HEADBAND_COLORS,
  OUTFIT_COLORS,
} from './cosmetics';

const LEGACY_WEAPON: Record<string, string> = {
  bo: 'weapon-bo',
  katana: 'weapon-bokken',
  nunchaku: 'weapon-nunchaku',
  kama: 'weapon-fan',
  shuriken: 'weapon-sticks',
  sai: 'weapon-sai',
};

const LEGACY_HEADBAND: Record<string, string> = {
  white: '#F2F0EA',
  red: '#C44536',
  blue: '#3D6B8A',
  green: '#3F8F62',
  black: '#2A2926',
};

const LEGACY_OUTFIT: Record<string, string> = {
  charcoal: '#3A3F46',
  indigo: '#3D4F8A',
  crimson: '#A83B3B',
  forest: '#3F6B4A',
};

export function makeDefaultAppearance(seed: 'kid-1' | 'kid-2' = 'kid-1'): PandaAppearance {
  if (seed === 'kid-2') {
    return {
      body: 'agile',
      fur: 'classic',
      faceMark: 'classic',
      outfitColor: LEGACY_OUTFIT.indigo ?? '#3D4F8A',
      headbandColor: LEGACY_HEADBAND.red ?? '#C44536',
      logoId: 'logo-bamboo',
      handId: 'weapon-nunchaku',
      headId: null,
      backId: null,
      beltId: null,
      auraId: null,
      outfitPatternId: null,
      accent: '#C44536',
    };
  }
  return {
    body: 'round',
    fur: 'classic',
    faceMark: 'classic',
    outfitColor: LEGACY_OUTFIT.charcoal ?? '#3A3F46',
    headbandColor: LEGACY_HEADBAND.black ?? '#2A2926',
    logoId: 'logo-paw',
    handId: 'weapon-bokken',
    headId: null,
    backId: null,
    beltId: null,
    auraId: null,
    outfitPatternId: null,
    accent: '#3D6B8A',
  };
}

/** Zamienia stary PandaConfig / częściowy wygląd na pełny PandaAppearance. */
export function normalizeAppearance(raw: unknown, seed: 'kid-1' | 'kid-2'): PandaAppearance {
  const fallback = makeDefaultAppearance(seed);
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Partial<PandaAppearance> & LegacyPandaConfig;

  if (typeof r.outfitColor === 'string' && typeof r.headbandColor === 'string') {
    return {
      body: r.body === 'agile' ? 'agile' : 'round',
      fur: r.fur === 'snow' || r.fur === 'bamboo' ? r.fur : 'classic',
      faceMark:
        r.faceMark === 'round' || r.faceMark === 'bolt' || r.faceMark === 'mask'
          ? r.faceMark
          : 'classic',
      outfitColor: r.outfitColor,
      headbandColor: r.headbandColor,
      logoId: typeof r.logoId === 'string' ? r.logoId : fallback.logoId,
      handId: typeof r.handId === 'string' ? r.handId : fallback.handId,
      headId: typeof r.headId === 'string' ? r.headId : null,
      backId: typeof r.backId === 'string' ? r.backId : null,
      beltId: typeof r.beltId === 'string' ? r.beltId : null,
      auraId: typeof r.auraId === 'string' ? r.auraId : null,
      outfitPatternId: typeof r.outfitPatternId === 'string' ? r.outfitPatternId : null,
      accent: typeof r.accent === 'string' ? r.accent : fallback.accent,
    };
  }

  // Migracja ze starego modelu weapon/headband/outfit
  const weaponId =
    typeof r.weapon === 'string' && LEGACY_WEAPON[r.weapon]
      ? LEGACY_WEAPON[r.weapon]
      : fallback.handId;
  const headbandColor =
    typeof r.headband === 'string' && LEGACY_HEADBAND[r.headband]
      ? LEGACY_HEADBAND[r.headband]
      : fallback.headbandColor;
  const outfitColor =
    typeof r.outfit === 'string' && LEGACY_OUTFIT[r.outfit]
      ? LEGACY_OUTFIT[r.outfit]
      : fallback.outfitColor;

  return {
    ...fallback,
    body: seed === 'kid-2' ? 'agile' : 'round',
    outfitColor,
    headbandColor,
    handId: weaponId,
    accent: typeof r.accent === 'string' ? r.accent : fallback.accent,
  };
}

/** Przedmioty, które muszą być w inventory po migracji wyglądu. */
export function ownedFromAppearance(panda: PandaAppearance): string[] {
  const ids = new Set(defaultOwnedIds());
  ids.add(panda.logoId);
  ids.add(panda.handId);
  if (panda.headId) ids.add(panda.headId);
  if (panda.backId) ids.add(panda.backId);
  if (panda.beltId) ids.add(panda.beltId);
  if (panda.auraId) ids.add(panda.auraId);
  if (panda.outfitPatternId) ids.add(panda.outfitPatternId);

  const outfitMatch = OUTFIT_COLORS.find((c) => c.hex === panda.outfitColor);
  if (outfitMatch) ids.add(outfitMatch.id);
  const hbMatch = HEADBAND_COLORS.find((c) => c.hex === panda.headbandColor);
  if (hbMatch) ids.add(hbMatch.id);

  return [...ids];
}

export function walletBalance(transactions: PointTransaction[], kidId: string): number {
  return transactions
    .filter((tx) => tx.kidId === kidId)
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function reservedAmount(
  requests: PurchaseRequest[],
  kidId: string,
  nowMs: number = Date.now(),
): number {
  return requests
    .filter(
      (req) =>
        req.kidId === kidId &&
        req.status === 'pending' &&
        new Date(req.expiresAt).getTime() > nowMs,
    )
    .reduce((sum, req) => sum + req.priceSnapshot, 0);
}

export function availableBalance(
  transactions: PointTransaction[],
  requests: PurchaseRequest[],
  kidId: string,
  nowMs: number = Date.now(),
): number {
  return Math.max(0, walletBalance(transactions, kidId) - reservedAmount(requests, kidId, nowMs));
}

export function dayEarnKey(date: string, kidId: string): string {
  return `${date}:${kidId}`;
}

export function hasEarnForDay(
  transactions: PointTransaction[],
  date: string,
  kidId: string,
): boolean {
  const key = dayEarnKey(date, kidId);
  return transactions.some((tx) => tx.kind === 'earn' && tx.dayLogKey === key);
}

export function makeOpeningBalance(
  kidId: string,
  amount: number,
  createdAt: string,
): PointTransaction {
  return {
    id: `tx-open-${kidId}-${createdAt}`,
    kidId,
    kind: 'opening-balance',
    amount: Math.max(0, amount),
    itemId: null,
    dayLogKey: null,
    createdAt,
    note: 'Saldo przed sklepikiem',
  };
}

export function makeEarnTx(
  kidId: string,
  date: string,
  amount: number,
  createdAt: string,
): PointTransaction {
  return {
    id: `tx-earn-${kidId}-${date}`,
    kidId,
    kind: 'earn',
    amount: Math.max(0, amount),
    itemId: null,
    dayLogKey: dayEarnKey(date, kidId),
    createdAt,
  };
}

export function syncKidWalletCache(kid: Kid, transactions: PointTransaction[]): Kid {
  return { ...kid, totalPoints: walletBalance(transactions, kid.id) };
}

export function canRequestPurchase(
  transactions: PointTransaction[],
  requests: PurchaseRequest[],
  inventory: string[],
  kidId: string,
  itemId: string,
  nowMs: number = Date.now(),
): { ok: true; price: number } | { ok: false; reason: string } {
  const item = getCosmetic(itemId);
  if (!item) return { ok: false, reason: 'Nie ma takiego skarbu.' };
  if (item.price <= 0) return { ok: false, reason: 'Ten skarb masz już na start.' };
  if (inventory.includes(itemId)) return { ok: false, reason: 'Już posiadasz ten skarb.' };
  const pendingSame = requests.some(
    (req) =>
      req.kidId === kidId &&
      req.itemId === itemId &&
      req.status === 'pending' &&
      new Date(req.expiresAt).getTime() > nowMs,
  );
  if (pendingSame) return { ok: false, reason: 'Prośba już czeka na rodzica.' };
  const available = availableBalance(transactions, requests, kidId, nowMs);
  if (available < item.price) {
    return { ok: false, reason: `Brakuje ${item.price - available} pkt. Trening przybliża Cię do skarbu.` };
  }
  return { ok: true, price: item.price };
}

export function equipItem(panda: PandaAppearance, itemId: string): PandaAppearance | null {
  const item = getCosmetic(itemId);
  if (!item) return null;
  if (item.slot === 'hand') return { ...panda, handId: itemId };
  if (item.slot === 'head') return { ...panda, headId: itemId };
  if (item.slot === 'back') return { ...panda, backId: itemId };
  if (item.slot === 'belt') return { ...panda, beltId: itemId };
  if (item.slot === 'aura') return { ...panda, auraId: itemId };
  if (item.slot === 'headbandLogo') return { ...panda, logoId: itemId };
  if (item.slot === 'outfitPattern') return { ...panda, outfitPatternId: itemId };
  return null;
}

export function unequipSlot(
  panda: PandaAppearance,
  slot: 'head' | 'back' | 'belt' | 'aura' | 'outfitPattern',
): PandaAppearance {
  if (slot === 'head') return { ...panda, headId: null };
  if (slot === 'back') return { ...panda, backId: null };
  if (slot === 'belt') return { ...panda, beltId: null };
  if (slot === 'aura') return { ...panda, auraId: null };
  return { ...panda, outfitPatternId: null };
}

export const PURCHASE_EXPIRE_MS = 48 * 60 * 60 * 1000;
export const REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;
