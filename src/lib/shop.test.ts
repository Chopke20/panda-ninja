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

describe('normalizeAppearance', () => {
  it('migruje stary PandaConfig', () => {
    const panda = normalizeAppearance(
      { weapon: 'katana', headband: 'black', outfit: 'charcoal', accent: '#3D6B8A' },
      'kid-1',
    );
    expect(panda.handId).toBe('weapon-bokken');
    expect(panda.headbandColor).toBe('#2A2926');
    expect(panda.outfitColor).toBe('#3A3F46');
    expect(panda.body).toBe('round');
  });

  it('zachowuje nowy wygląd', () => {
    const panda = normalizeAppearance(
      {
        body: 'agile',
        fur: 'snow',
        faceMark: 'bolt',
        outfitColor: '#3D4F8A',
        headbandColor: '#C44536',
        logoId: 'logo-dragon',
        handId: 'weapon-sai',
        headId: null,
        backId: null,
        beltId: null,
        auraId: null,
        outfitPatternId: null,
        accent: '#C44536',
      },
      'kid-2',
    );
    expect(panda.body).toBe('agile');
    expect(panda.logoId).toBe('logo-dragon');
    expect(panda.handId).toBe('weapon-sai');
  });
});

describe('ledger', () => {
  it('liczy saldo i rezerwację pending', () => {
    const now = Date.now();
    const txs = [makeOpeningBalance('kid-1', 500, new Date(now).toISOString())];
    const req = createPurchaseRequest({
      transactions: txs,
      requests: [],
      inventory: makeKid1().inventory,
      kidId: 'kid-1',
      itemId: 'gadget-talisman',
      nowMs: now,
    });
    expect(req.ok).toBe(true);
    if (!req.ok) return;
    expect(walletBalance(txs, 'kid-1')).toBe(500);
    expect(availableBalance(txs, [req.request], 'kid-1', now)).toBe(500 - 140);
  });

  it('nie pozwala kupić bez salda', () => {
    const check = canRequestPurchase([], [], makeKid1().inventory, 'kid-1', 'weapon-master');
    expect(check.ok).toBe(false);
  });

  it('zatwierdza zakup i odejmuje gwiazdki', () => {
    const now = Date.now();
    const kid = { ...makeKid1(), totalPoints: 500 };
    const txs = [makeOpeningBalance(kid.id, 500, new Date(now).toISOString())];
    const created = createPurchaseRequest({
      transactions: txs,
      requests: [],
      inventory: kid.inventory,
      kidId: kid.id,
      itemId: 'gadget-talisman',
      nowMs: now,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const approved = approvePurchase({
      request: created.request,
      transactions: txs,
      kids: [kid, { ...makeKid1(), id: 'kid-2' }],
      nowMs: now,
    });
    expect(approved.ok).toBe(true);
    if (!approved.ok) return;
    expect(walletBalance(approved.transactions, kid.id)).toBe(360);
    expect(approved.kids[0].inventory).toContain('gadget-talisman');
  });

  it('zwraca zakup w oknie 24 h', () => {
    const now = Date.now();
    const kid = makeKid1();
    const txs = [makeOpeningBalance(kid.id, 500, new Date(now).toISOString())];
    const created = createPurchaseRequest({
      transactions: txs,
      requests: [],
      inventory: kid.inventory,
      kidId: kid.id,
      itemId: 'gadget-talisman',
      nowMs: now,
    });
    if (!created.ok) throw new Error('request');
    const approved = approvePurchase({
      request: created.request,
      transactions: txs,
      kids: [kid, { ...makeKid1(), id: 'kid-2' }],
      nowMs: now,
    });
    if (!approved.ok) throw new Error('approve');
    const refunded = refundPurchase({
      request: approved.request,
      transactions: approved.transactions,
      kids: approved.kids,
      nowMs: now + 1000,
    });
    expect(refunded.ok).toBe(true);
    if (!refunded.ok) return;
    expect(walletBalance(refunded.transactions, kid.id)).toBe(500);
    expect(refunded.kids[0].inventory).not.toContain('gadget-talisman');
  });

  it('księguje wczorajsze punkty raz', () => {
    const today = todayIso(new Date(2026, 8, 3));
    const yesterday = addDaysIso(today, -1);
    const kids: [ReturnType<typeof makeKid1>, ReturnType<typeof makeKid1>] = [
      makeKid1(),
      { ...makeKid1(), id: 'kid-2' },
    ];
    const logs = [
      {
        date: yesterday,
        kidId: 'kid-1',
        routineId: 'morning' as const,
        completedTaskIds: ['k1-morning-1'],
        pointsEarned: 80,
        finishedAt: null,
        onTime: true,
      },
    ];
    const first = settleYesterdayEarns(logs, [], kids, today, new Date().toISOString());
    expect(walletBalance(first.transactions, 'kid-1')).toBe(80);
    const second = settleYesterdayEarns(
      logs,
      first.transactions,
      first.kids,
      today,
      new Date().toISOString(),
    );
    expect(second.transactions).toHaveLength(1);
    expect(walletBalance(second.transactions, 'kid-1')).toBe(80);
  });
});
