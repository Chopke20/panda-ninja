import { useState } from 'react';
import { getCosmetic } from '../../../lib/cosmetics';
import { canRefundPurchase, walletBalance } from '../../../lib/shop';
import { useStore } from '../../../store/useStore';

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
      {info && <p className="rounded-2xl bg-white px-3 py-2">{info}</p>}

      <div>
        <h2 className="mb-2 text-xl font-semibold">Prośby o zakup</h2>
        {pending.length === 0 && <p className="text-muted">Brak oczekujących próśb.</p>}
        <div className="space-y-3">
          {pending.map((req) => {
            const kid = kids.find((item) => item.id === req.kidId);
            const item = getCosmetic(req.itemId);
            const bal = kid ? walletBalance(transactions, kid.id) : 0;
            const after = bal - req.priceSnapshot;
            return (
              <article key={req.id} className="rounded-3xl bg-white p-4">
                <p className="text-lg font-semibold">
                  {kid?.name ?? req.kidId} · {item?.label ?? req.itemId}
                </p>
                <p className="text-muted">
                  Cena ★ {req.priceSnapshot} · sakiewka ★ {bal} → po zakupie ★ {after}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="min-h-[56px] flex-1 rounded-2xl bg-dojo text-white"
                    onClick={() => {
                      const err = approve(req.id);
                      setInfo(err ?? 'Zakup zatwierdzony. Skarb w szafie.');
                    }}
                  >
                    Zatwierdź PIN-em
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
        <h2 className="mb-2 text-xl font-semibold">Zwroty (24 h)</h2>
        {approved.length === 0 && <p className="text-muted">Brak zatwierdzonych zakupów.</p>}
        <div className="space-y-3">
          {approved.map((req) => {
            const check = canRefundPurchase(req, transactions);
            const kid = kids.find((item) => item.id === req.kidId);
            const item = getCosmetic(req.itemId);
            if (!check.ok) return null;
            return (
              <article key={req.id} className="rounded-3xl bg-white p-4">
                <p className="text-lg font-semibold">
                  {kid?.name} · {item?.label}
                </p>
                <button
                  type="button"
                  className="mt-2 min-h-[56px] w-full rounded-2xl bg-paper"
                  onClick={() => {
                    const err = refund(req.id);
                    setInfo(err ?? 'Zwrot wykonany. Skarb wrócił, gwiazdki też.');
                  }}
                >
                  Zwróć ★ {req.priceSnapshot}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xl font-semibold">Nagrody tygodniowe</h2>
        {openClaims.length === 0 && (
          <p className="text-muted">Brak zdobytych nagród do oznaczenia.</p>
        )}
        <div className="space-y-3">
          {openClaims.map((claim) => {
            const kid = kids.find((item) => item.id === claim.kidId);
            return (
              <article
                key={`${claim.weekStart}-${claim.kidId}`}
                className="rounded-3xl bg-white p-4"
              >
                <p className="text-lg font-semibold">
                  {kid?.name} · {claim.label}
                </p>
                <p className="text-muted">Tydzień od {claim.weekStart} · zdobyta</p>
                <button
                  type="button"
                  className="mt-2 min-h-[56px] w-full rounded-2xl bg-dojo text-white"
                  onClick={() => {
                    markWeekly(claim.kidId, claim.weekStart);
                    setInfo('Nagroda oznaczona jako zrealizowana.');
                  }}
                >
                  Zrealizowana
                </button>
              </article>
            );
          })}
        </div>
        {redeemedClaims.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-muted">Historia realizacji</p>
            {redeemedClaims.map((claim) => {
              const kid = kids.find((item) => item.id === claim.kidId);
              return (
                <p
                  key={`${claim.weekStart}-${claim.kidId}-done`}
                  className="rounded-2xl bg-paper px-3 py-2 text-sm text-muted"
                >
                  {kid?.name} · {claim.label} · tydzień {claim.weekStart}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
