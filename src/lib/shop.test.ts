import { describe, expect, it } from 'vitest';
import { makeKid1 } from '../store/defaults';
import {
  approvePurchase,
  createPurchaseRequest,
  refundPurchase,
  settleYesterdayEarns,
} from './shop';
import { addDaysIso, todayIso } from './time';
import {
  availableBalance,
  canRequestPurchase,
  makeOpeningBalance,
  normalizeAppearance,
  walletBalance,
} from './wallet';
import { EVOLUTION_WEEK_PRICE, evolutionItemId } from './evolution';

describe('normalizeAppearance', () => {
  it('migruje stary PandaConfig do ewolucji', () => {
    const panda = normalizeAppearance(
      { weapon: 'katana', headband: 'black', outfit: 'charcoal', accent: '#3D6B8A' },
      'kid-1',
    );
    expect(panda.body).toBe('round');
    expect(panda.stage).toBe(1);
    expect(panda.outfitColor).toBe('#3A3F46');
  });

  it('zachowuje uproszczony wygląd', () => {
    const panda = normalizeAppearance(
      {
        body: 'agile',
        stage: 3,
        outfitColor: '#3D4F8A',
        logoId: 'logo-bolt',
        accent: '#C44536',
      },
      'kid-2',
    );
    expect(panda.body).toBe('agile');
    expect(panda.stage).toBe(3);
    expect(panda.logoId).toBe('logo-bolt');
  });
});

describe('ledger ewolucji', () => {
  it('pozwala kupić następne stadium gdy ready i jest saldo', () => {
    const txs = [makeOpeningBalance('kid-1', 2000, new Date().toISOString())];
    const check = canRequestPurchase(
      txs,
      [],
      makeKid1().inventory,
      'kid-1',
      evolutionItemId('round', 2),
      Date.now(),
      1,
      'round',
    );
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.price).toBe(EVOLUTION_WEEK_PRICE);
  });

  it('księguje wczorajsze earn', () => {
    const today = todayIso();
    const yesterday = addDaysIso(today, -1);
    const kids = [makeKid1(), makeKid1()] as [
      ReturnType<typeof makeKid1>,
      ReturnType<typeof makeKid1>,
    ];
    kids[1] = { ...kids[1], id: 'kid-2' };
    const result = settleYesterdayEarns(
      [
        {
          date: yesterday,
          kidId: 'kid-1',
          routineId: 'morning',
          completedTaskIds: ['a'],
          pointsEarned: 30,
          finishedAt: `${yesterday}T08:00:00.000Z`,
          onTime: true,
        },
      ],
      [],
      kids,
      today,
      new Date().toISOString(),
    );
    expect(walletBalance(result.transactions, 'kid-1')).toBe(30);
  });

  it('approve podnosi stadium', () => {
    const now = Date.now();
    const txs = [makeOpeningBalance('kid-1', 2000, new Date(now).toISOString())];
    const created = createPurchaseRequest({
      transactions: txs,
      requests: [],
      inventory: makeKid1().inventory,
      kidId: 'kid-1',
      itemId: evolutionItemId('round', 2),
      nowMs: now,
      currentStage: 1,
      body: 'round',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const kid = makeKid1();
    const approved = approvePurchase({
      request: created.request,
      transactions: txs,
      kids: [kid, { ...makeKid1(), id: 'kid-2' }],
      nowMs: now + 1,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(approved.kids[0].panda.stage).toBe(2);
    expect(walletBalance(approved.transactions, 'kid-1')).toBe(2000 - EVOLUTION_WEEK_PRICE);

    const refunded = refundPurchase({
      request: { ...created.request, status: 'approved' },
      transactions: approved.transactions,
      kids: approved.kids,
      nowMs: now + 2,
    });
    expect(refunded.ok).toBe(true);
    if (!refunded.ok) return;
    expect(refunded.kids[0].panda.stage).toBe(1);
  });

  it('availableBalance odejmuje pending', () => {
    const now = Date.now();
    const txs = [makeOpeningBalance('kid-1', 2000, new Date(now).toISOString())];
    const created = createPurchaseRequest({
      transactions: txs,
      requests: [],
      inventory: makeKid1().inventory,
      kidId: 'kid-1',
      itemId: evolutionItemId('round', 2),
      nowMs: now,
      currentStage: 1,
      body: 'round',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(availableBalance(txs, [created.request], 'kid-1', now)).toBe(
      2000 - EVOLUTION_WEEK_PRICE,
    );
  });
});
