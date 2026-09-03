import type {
  DayLog,
  Kid,
  PointTransaction,
  PurchaseRequest,
  WeeklyClaim,
} from '../types';
import { getCosmetic } from './cosmetics';
import { addDaysIso, weekRange } from './time';
import {
  availableBalance,
  canRequestPurchase,
  hasEarnForDay,
  makeEarnTx,
  PURCHASE_EXPIRE_MS,
  REFUND_WINDOW_MS,
  syncKidWalletCache,
  walletBalance,
} from './wallet';

export { availableBalance, walletBalance };

/** Księguje wczorajsze punkty do sakiewki (jedna transakcja earn na dzień — suma rutyn). */
export function settleYesterdayEarns(
  logs: DayLog[],
  transactions: PointTransaction[],
  kids: [Kid, Kid],
  today: string,
  nowIso: string,
): { transactions: PointTransaction[]; kids: [Kid, Kid] } {
  const yesterday = addDaysIso(today, -1);
  let txs = transactions;
  let changed = false;

  for (const kid of kids) {
    const earned = logs
      .filter((item) => item.date === yesterday && item.kidId === kid.id)
      .reduce((sum, item) => sum + item.pointsEarned, 0);
    if (earned <= 0) continue;
    if (hasEarnForDay(txs, yesterday, kid.id)) continue;
    txs = [...txs, makeEarnTx(kid.id, yesterday, earned, nowIso)];
    changed = true;
  }

  if (!changed) {
    return { transactions, kids: syncKidsDisplay(kids, transactions, logs, today) };
  }
  return { transactions: txs, kids: syncKidsDisplay(kids, txs, logs, today) };
}

/** Cache: sakiewka + prowizoryczne punkty dzisiejsze (poranek + wieczór). */
export function syncKidsDisplay(
  kids: [Kid, Kid],
  transactions: PointTransaction[],
  logs: DayLog[],
  today: string,
): [Kid, Kid] {
  return kids.map((kid) => {
    const wallet = walletBalance(transactions, kid.id);
    const todayPts = logs
      .filter((log) => log.date === today && log.kidId === kid.id)
      .reduce((sum, log) => sum + log.pointsEarned, 0);
    return { ...kid, totalPoints: wallet + todayPts };
  }) as [Kid, Kid];
}

export function createPurchaseRequest(args: {
  transactions: PointTransaction[];
  requests: PurchaseRequest[];
  inventory: string[];
  kidId: string;
  itemId: string;
  nowMs?: number;
}): { ok: true; request: PurchaseRequest } | { ok: false; reason: string } {
  const nowMs = args.nowMs ?? Date.now();
  const check = canRequestPurchase(
    args.transactions,
    args.requests,
    args.inventory,
    args.kidId,
    args.itemId,
    nowMs,
  );
  if (!check.ok) return check;
  const createdAt = new Date(nowMs).toISOString();
  const request: PurchaseRequest = {
    id: `req-${args.kidId}-${args.itemId}-${nowMs}`,
    kidId: args.kidId,
    itemId: args.itemId,
    priceSnapshot: check.price,
    status: 'pending',
    createdAt,
    expiresAt: new Date(nowMs + PURCHASE_EXPIRE_MS).toISOString(),
  };
  return { ok: true, request };
}

export function approvePurchase(args: {
  request: PurchaseRequest;
  transactions: PointTransaction[];
  kids: [Kid, Kid];
  nowMs?: number;
}):
  | {
      ok: true;
      transactions: PointTransaction[];
      kids: [Kid, Kid];
      request: PurchaseRequest;
    }
  | { ok: false; reason: string } {
  const nowMs = args.nowMs ?? Date.now();
  if (args.request.status !== 'pending') {
    return { ok: false, reason: 'Ta prośba już nie czeka.' };
  }
  if (new Date(args.request.expiresAt).getTime() <= nowMs) {
    return { ok: false, reason: 'Prośba wygasła — dziecko może poprosić ponownie.' };
  }
  const kid = args.kids.find((item) => item.id === args.request.kidId);
  if (!kid) return { ok: false, reason: 'Nie znaleziono dziecka.' };
  if (kid.inventory.includes(args.request.itemId)) {
    return { ok: false, reason: 'Skarb jest już w szafie.' };
  }
  // Rezerwacja tej prośby trzymała cenę — wystarczy saldo sakiewki ≥ cena.
  if (walletBalance(args.transactions, kid.id) < args.request.priceSnapshot) {
    return { ok: false, reason: 'Za mało gwiazdek w sakiewce.' };
  }

  const createdAt = new Date(nowMs).toISOString();
  const purchaseTx: PointTransaction = {
    id: `tx-buy-${args.request.id}`,
    kidId: args.request.kidId,
    kind: 'purchase',
    amount: -args.request.priceSnapshot,
    itemId: args.request.itemId,
    dayLogKey: null,
    createdAt,
  };
  const transactions = [...args.transactions, purchaseTx];
  const kids = args.kids.map((item) => {
    if (item.id !== kid.id) return item;
    const next = {
      ...item,
      inventory: [...item.inventory, args.request.itemId],
    };
    return syncKidWalletCache(next, transactions);
  }) as [Kid, Kid];

  return {
    ok: true,
    transactions,
    kids,
    request: { ...args.request, status: 'approved' },
  };
}

export function rejectPurchase(request: PurchaseRequest): PurchaseRequest {
  return { ...request, status: 'rejected' };
}

export function cancelPurchase(request: PurchaseRequest): PurchaseRequest {
  return { ...request, status: 'cancelled' };
}

export function expireStaleRequests(
  requests: PurchaseRequest[],
  nowMs: number = Date.now(),
): PurchaseRequest[] {
  let changed = false;
  const next = requests.map((req) => {
    if (req.status !== 'pending') return req;
    if (new Date(req.expiresAt).getTime() > nowMs) return req;
    changed = true;
    return { ...req, status: 'expired' as const };
  });
  return changed ? next : requests;
}

export function canRefundPurchase(
  request: PurchaseRequest,
  transactions: PointTransaction[],
  nowMs: number = Date.now(),
): { ok: true; purchaseTx: PointTransaction } | { ok: false; reason: string } {
  if (request.status !== 'approved') {
    return { ok: false, reason: 'Zwrot tylko po zatwierdzonym zakupie.' };
  }
  const purchaseTx = transactions.find(
    (tx) =>
      tx.kind === 'purchase' &&
      tx.kidId === request.kidId &&
      tx.itemId === request.itemId &&
      tx.id === `tx-buy-${request.id}`,
  );
  if (!purchaseTx) {
    return { ok: false, reason: 'Nie znaleziono transakcji zakupu.' };
  }
  if (new Date(purchaseTx.createdAt).getTime() + REFUND_WINDOW_MS < nowMs) {
    return { ok: false, reason: 'Minęło 24 godziny — zwrot już niedostępny.' };
  }
  const already = transactions.some(
    (tx) => tx.kind === 'refund' && tx.itemId === request.itemId && tx.kidId === request.kidId && tx.note === request.id,
  );
  if (already) return { ok: false, reason: 'Ten zakup już zwrócono.' };
  return { ok: true, purchaseTx };
}

export function refundPurchase(args: {
  request: PurchaseRequest;
  transactions: PointTransaction[];
  kids: [Kid, Kid];
  nowMs?: number;
}):
  | {
      ok: true;
      transactions: PointTransaction[];
      kids: [Kid, Kid];
    }
  | { ok: false; reason: string } {
  const nowMs = args.nowMs ?? Date.now();
  const check = canRefundPurchase(args.request, args.transactions, nowMs);
  if (!check.ok) return check;

  const refundTx: PointTransaction = {
    id: `tx-refund-${args.request.id}`,
    kidId: args.request.kidId,
    kind: 'refund',
    amount: Math.abs(check.purchaseTx.amount),
    itemId: args.request.itemId,
    dayLogKey: null,
    createdAt: new Date(nowMs).toISOString(),
    note: args.request.id,
  };
  const transactions = [...args.transactions, refundTx];
  const kids = args.kids.map((kid) => {
    if (kid.id !== args.request.kidId) return kid;
    const next = {
      ...kid,
      inventory: kid.inventory.filter((id) => id !== args.request.itemId),
    };
    return syncKidWalletCache(next, transactions);
  }) as [Kid, Kid];

  return { ok: true, transactions, kids };
}

export function zeroKidWallet(
  kidId: string,
  transactions: PointTransaction[],
  nowIso: string,
): PointTransaction[] {
  const balance = walletBalance(transactions, kidId);
  if (balance === 0) return transactions;
  return [
    ...transactions,
    {
      id: `tx-adj-zero-${kidId}-${nowIso}`,
      kidId,
      kind: 'adjustment',
      amount: -balance,
      itemId: null,
      dayLogKey: null,
      createdAt: nowIso,
      note: 'Wyzerowanie przez rodzica',
    },
  ];
}

export function weekStartIso(now: Date): string {
  return weekRange(now).start;
}

export function ensureWeeklyClaims(args: {
  claims: WeeklyClaim[];
  logs: DayLog[];
  kids: [Kid, Kid];
  weekly: { label: string; points: number } | null;
  now: Date;
}): WeeklyClaim[] {
  if (!args.weekly || args.weekly.points <= 0) return args.claims;
  const { start, end } = weekRange(args.now);

  let claims = args.claims;
  let added = false;
  for (const kid of args.kids) {
    const exists = claims.some((c) => c.weekStart === start && c.kidId === kid.id);
    if (exists) continue;
    const pts = args.logs
      .filter((log) => log.kidId === kid.id && log.date >= start && log.date <= end)
      .reduce((sum, log) => sum + log.pointsEarned, 0);
    if (pts < args.weekly.points) continue;
    added = true;
    claims = [
      ...claims,
      {
        weekStart: start,
        kidId: kid.id,
        earnedAt: new Date().toISOString(),
        redeemedAt: null,
        label: args.weekly.label,
        points: args.weekly.points,
      },
    ];
  }
  return added ? claims : args.claims;
}

export function redeemWeeklyClaim(
  claims: WeeklyClaim[],
  weekStart: string,
  kidId: string,
  nowIso: string,
): WeeklyClaim[] {
  return claims.map((claim) =>
    claim.weekStart === weekStart && claim.kidId === kidId && claim.redeemedAt === null
      ? { ...claim, redeemedAt: nowIso }
      : claim,
  );
}

export function shopItemLabel(itemId: string): string {
  return getCosmetic(itemId)?.label ?? itemId;
}
