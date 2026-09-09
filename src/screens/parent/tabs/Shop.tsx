import { useState } from 'react';
import { shopItemLabel, canRefundPurchase, walletBalance } from '../../../lib/shop';
import { useStore } from '../../../store/useStore';

/** Panel rodzica: prośby o awans ewolucji (nie kosmetyki). */
export function ShopTab() {
  const kids = useStore((s) => s.kids);
  const requests = useStore((s) => s.purchaseRequests);
  const transactions = useStore((s) => s.transactions);
  const claims = useStore((s) => s.weeklyClaims);
  const approve = useStore((s) => s.approvePurchaseRequest);
  const reject = useStore((s) => s.rejectPurchaseRequest);
  const refund = useStore((s) => s.refundPurchaseRequest);
  const markWeekly = useStore((s) => s.markWeeklyRedeemed);
  const [info, setInfo] = useState<string | null>(null);

  const pending = requests.filter((req) => req.status === 'pending');
  const approved = requests.filter((req) => req.status === 'approved');
  const openClaims = claims.filter((c) => c.redeemedAt === null);
  const redeemedClaims = [...claims]
    .filter((c) => c.redeemedAt !== null)
    .sort((a, b) => (b.redeemedAt ?? '').localeCompare(a.redeemedAt ?? ''))
    .slice(0, 8);

  return (
    <section className="space-y-6 py-4">
      {info && <p className="rounded-2xl bg-panel px-3 py-2">{info}</p>}

      <div>
        <h2 className="mb-2 text-xl font-semibold">Stare prośby</h2>
        {pending.length === 0 && (
          <p className="text-muted">Awans kupuje się od razu — tu nic nie czeka.</p>
        )}
        <div className="space-y-3">
          {pending.map((req) => {
            const kid = kids.find((item) => item.id === req.kidId);
            const bal = kid ? walletBalance(transactions, kid.id) : 0;
            const after = bal - req.priceSnapshot;
            return (
              <article key={req.id} className="rounded-3xl bg-panel p-4">
                <p className="text-lg font-semibold">
                  {kid?.name ?? req.kidId} · {shopItemLabel(req.itemId)}
                </p>
                <p className="text-muted">
                  Cena ★ {req.priceSnapshot} · saldo ★ {bal} → po awansie ★ {after}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="min-h-[56px] flex-1 rounded-2xl bg-dojo text-white"
                    onClick={() => {
                      const err = approve(req.id);
                      setInfo(err ?? 'Awans zatwierdzony.');
                    }}
                  >
                    Zatwierdź
                  </button>
                  <button
                    type="button"
                    className="min-h-[56px] flex-1 rounded-2xl bg-paper"
                    onClick={() => {
                      reject(req.id);
                      setInfo('Prośba odrzucona. Gwiazdki wróciły do dyspozycji.');
                    }}
                  >
                    Odrzuć
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xl font-semibold">Historia / zwroty (24 h)</h2>
        {approved.length === 0 && <p className="text-muted">Brak awansów do zwrotu.</p>}
        <div className="space-y-3">
          {approved.map((req) => {
            const check = canRefundPurchase(req, transactions);
            const kid = kids.find((item) => item.id === req.kidId);
            return (
              <article key={req.id} className="rounded-3xl bg-panel p-4">
                <p className="text-lg font-semibold">
                  {kid?.name ?? req.kidId} · {shopItemLabel(req.itemId)}
                </p>
                <button
                  type="button"
                  disabled={!check.ok}
                  className="mt-2 min-h-[56px] w-full rounded-2xl bg-paper disabled:opacity-40"
                  onClick={() => {
                    const err = refund(req.id);
                    setInfo(err ?? 'Zwrot zrobiony. Stadium cofnięte.');
                  }}
                >
                  {check.ok ? 'Zwróć gwiazdki' : check.reason}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xl font-semibold">Nagroda tygodnia</h2>
        {openClaims.length === 0 && <p className="text-muted">Brak otwartych nagród.</p>}
        {openClaims.map((claim) => {
          const kid = kids.find((item) => item.id === claim.kidId);
          return (
            <article key={`${claim.weekStart}-${claim.kidId}`} className="mb-2 rounded-3xl bg-panel p-4">
              <p className="font-semibold">
                {kid?.name} · {claim.label} (★ {claim.points})
              </p>
              <button
                type="button"
                className="mt-2 min-h-[56px] w-full rounded-2xl bg-dojo text-white"
                onClick={() => markWeekly(claim.kidId, claim.weekStart)}
              >
                Odebrane
              </button>
            </article>
          );
        })}
        {redeemedClaims.length > 0 && (
          <p className="mt-2 text-sm text-muted">
            Ostatnio: {redeemedClaims.map((c) => c.label).join(' · ')}
          </p>
        )}
      </div>
    </section>
  );
}
