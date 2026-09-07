/**
 * Wygląd i sakiewka — model ewolucji (bez paper-doll).
 */
import type {
  Kid,
  LegacyPandaConfig,
  PandaAppearance,
  PandaBodyId,
  PointTransaction,
  PurchaseRequest,
} from '../types';
import {
  clampStage,
  canUnlockStage,
  evolutionItemId,
  evolutionLine,
  OUTFIT_SWATCHES,
  parseEvolutionItemId,
  stageDef,
  STARTER_LOGOS,
  type EvolutionStageId,
} from './evolution';

const LEGACY_OUTFIT: Record<string, string> = {
  charcoal: '#3A3F46',
  indigo: '#3D4F8A',
  crimson: '#A83B3B',
  forest: '#3F6B4A',
};

export function makeDefaultAppearance(seed: 'kid-1' | 'kid-2' = 'kid-1'): PandaAppearance {
  const body: PandaBodyId = seed === 'kid-2' ? 'agile' : 'round';
  const line = evolutionLine(body);
  return {
    body,
    stage: 1,
    outfitColor: line.defaultOutfit,
    logoId: line.defaultLogoId,
    accent: line.accent,
  };
}

/** Zamienia stary / częściowy wygląd na uproszczony PandaAppearance. */
export function normalizeAppearance(raw: unknown, seed: 'kid-1' | 'kid-2'): PandaAppearance {
  const fallback = makeDefaultAppearance(seed);
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Partial<PandaAppearance> &
    LegacyPandaConfig & {
      headbandColor?: string;
      handId?: string;
      fur?: string;
      faceMark?: string;
      stage?: number;
    };

  const body: PandaBodyId =
    r.body === 'agile' || r.body === 'round'
      ? r.body
      : seed === 'kid-2'
        ? 'agile'
        : 'round';
  const line = evolutionLine(body);

  let outfitColor = fallback.outfitColor;
  if (typeof r.outfitColor === 'string') {
    outfitColor = r.outfitColor;
  } else if (typeof r.outfit === 'string' && LEGACY_OUTFIT[r.outfit]) {
    outfitColor = LEGACY_OUTFIT[r.outfit] ?? outfitColor;
  }

  const logoId =
    typeof r.logoId === 'string' && STARTER_LOGOS.some((l) => l.id === r.logoId)
      ? r.logoId
      : line.defaultLogoId;

  const stage = clampStage(typeof r.stage === 'number' ? r.stage : 1);

  return {
    body,
    stage,
    outfitColor,
    logoId,
    accent: typeof r.accent === 'string' ? r.accent : line.accent,
  };
}

/** Inventory po migracji: logo + odblokowane stadia ewolucji. */
export function ownedFromAppearance(panda: PandaAppearance): string[] {
  const ids = new Set<string>();
  ids.add(panda.logoId);
  for (const logo of STARTER_LOGOS) ids.add(logo.id);
  for (const swatch of OUTFIT_SWATCHES) ids.add(swatch.id);
  for (let s = 1; s <= panda.stage; s++) {
    ids.add(evolutionItemId(panda.body, s as EvolutionStageId));
  }
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
    note: 'Saldo startowe',
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

export function evolutionPrice(itemId: string): number | null {
  const parsed = parseEvolutionItemId(itemId);
  if (!parsed) return null;
  return stageDef(parsed.body, parsed.stage)?.price ?? null;
}

export function canRequestPurchase(
  transactions: PointTransaction[],
  requests: PurchaseRequest[],
  inventory: string[],
  kidId: string,
  itemId: string,
  nowMs: number = Date.now(),
  currentStage?: number,
  body?: PandaBodyId,
): { ok: true; price: number } | { ok: false; reason: string } {
  const evo = parseEvolutionItemId(itemId);
  if (evo) {
    if (body && body !== evo.body) {
      return { ok: false, reason: 'To stadium należy do drugiej pandy.' };
    }
    const stage = currentStage ?? 1;
    const unlock = canUnlockStage(evo.body, stage, evo.stage);
    if (!unlock.ok) return unlock;
    const price = stageDef(evo.body, evo.stage)?.price ?? 0;
    if (inventory.includes(itemId)) return { ok: false, reason: 'Już masz to stadium.' };
    const pendingSame = requests.some(
      (req) =>
        req.kidId === kidId &&
        req.itemId === itemId &&
        req.status === 'pending' &&
        new Date(req.expiresAt).getTime() > nowMs,
    );
    if (pendingSame) return { ok: false, reason: 'Prośba już czeka na rodzica.' };
    const available = availableBalance(transactions, requests, kidId, nowMs);
    if (available < price) {
      return {
        ok: false,
        reason: `Brakuje ${price - available} pkt. Trening przybliża Cię do awansu.`,
      };
    }
    return { ok: true, price };
  }

  return { ok: false, reason: 'Nie ma takiego skarbu.' };
}

/** Po zatwierdzeniu awansu — podnieś stadium. */
export function applyEvolutionUnlock(
  panda: PandaAppearance,
  itemId: string,
): PandaAppearance | null {
  const evo = parseEvolutionItemId(itemId);
  if (!evo || evo.body !== panda.body) return null;
  if (evo.stage !== panda.stage + 1) return null;
  return { ...panda, stage: evo.stage };
}

export const PURCHASE_EXPIRE_MS = 48 * 60 * 60 * 1000;
export const REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;
