import { useMemo, useState } from 'react';
import { PandaStage } from '../components/PandaStage';
import { TOUCH } from '../lib/constants';
import {
  COSMETIC_CATALOG,
  type CosmeticCategory,
  getCosmetic,
} from '../lib/cosmetics';
import { availableBalance } from '../lib/shop';
import { todayIso } from '../lib/time';
import { equipItem } from '../lib/wallet';
import { useStore } from '../store/useStore';
import type { PandaAppearance } from '../types';

const TABS: { id: CosmeticCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Wszystko' },
  { id: 'weapon', label: 'Sprzęt' },
  { id: 'gadget', label: 'Gadżety' },
  { id: 'logo', label: 'Logo' },
  { id: 'pattern', label: 'Wzory' },
];

export function ShopScreen() {
  const kids = useStore((s) => s.kids);
  const transactions = useStore((s) => s.transactions);
  const requests = useStore((s) => s.purchaseRequests);
  const logs = useStore((s) => s.logs);
  const setUiScreen = useStore((s) => s.setUiScreen);
  const requestPurchase = useStore((s) => s.requestPurchase);
  const cancelPurchaseRequest = useStore((s) => s.cancelPurchaseRequest);
  const equipCosmetic = useStore((s) => s.equipCosmetic);
  const updateKidPanda = useStore((s) => s.updateKidPanda);
  const [kidId, setKidId] = useState(kids[0].id);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all');
  const [tryOn, setTryOn] = useState<PandaAppearance | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const kid = kids.find((item) => item.id === kidId) ?? kids[0];
  const wallet = availableBalance(transactions, requests, kid.id);
  const today = todayIso();
  const todayPts = logs.find((log) => log.date === today && log.kidId === kid.id)?.pointsEarned ?? 0;
  const preview = tryOn ?? kid.panda;

  const catalog = useMemo(() => {
    const paid = COSMETIC_CATALOG.filter((item) => item.price > 0);
    if (tab === 'all') return paid;
    return paid.filter((item) => item.category === tab);
  }, [tab]);

  const pending = requests.filter((req) => req.kidId === kid.id && req.status === 'pending');

  function applyTry(itemId: string) {
    const item = getCosmetic(itemId);
    if (!item) return;
    if (item.slot === 'outfitColor' || item.slot === 'headbandColor') return;
    const next = equipItem(preview, itemId);
    if (next) setTryOn(next);
  }

  function buy(itemId: string) {
    const reason = requestPurchase(kid.id, itemId);
    if (reason) {
      setMessage(reason);
      return;
    }
    setMessage('Prośba poszła do rodzica. Po PIN-ie skarb trafi do szafy.');
    setTryOn(null);
  }

  function keepLook() {
    if (!tryOn) return;
    updateKidPanda(kid.id, {
      body: tryOn.body,
      fur: tryOn.fur,
      faceMark: tryOn.faceMark,
      outfitColor: tryOn.outfitColor,
      headbandColor: tryOn.headbandColor,
      accent: tryOn.accent,
    });
    const slots = [
      tryOn.handId,
      tryOn.logoId,
      tryOn.headId,
      tryOn.backId,
      tryOn.beltId,
      tryOn.auraId,
      tryOn.outfitPatternId,
    ];
    for (const id of slots) {
      if (id && kid.inventory.includes(id)) equipCosmetic(kid.id, id);
    }
    setTryOn(null);
    setMessage('Wygląd zapisany z szafy.');
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-paper text-ink pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <header className="flex items-center justify-between gap-2 px-4 pt-[env(safe-area-inset-top)]">
        <h1 className="text-2xl font-semibold">Sklepik dojo</h1>
        <button
          type="button"
          className="rounded-2xl bg-white px-4 text-lg"
          style={{ minHeight: TOUCH.minTilePx }}
          onClick={() => setUiScreen('main')}
        >
          Wróć
        </button>
      </header>

      <div className="flex gap-2 px-4 py-2">
        {kids.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setKidId(item.id);
              setTryOn(null);
              setMessage(null);
            }}
            className={`min-h-[56px] flex-1 rounded-2xl text-lg ${
              kid.id === item.id ? 'bg-dojo text-white' : 'bg-white'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="mx-4 flex items-center gap-4 rounded-3xl bg-white p-3">
        <div className="h-28 w-28 shrink-0">
          <PandaStage pose="training" appearance={preview} name={kid.name} pulse={0} compact />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">Sakiewka ★ {wallet}</p>
          <p className="text-muted">Dziś zdobyte ★ {todayPts} (jeszcze w drodze)</p>
          {tryOn && (
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-[48px] rounded-xl bg-paper px-3"
                onClick={() => setTryOn(null)}
              >
                Anuluj przymiarkę
              </button>
              <button
                type="button"
                className="min-h-[48px] rounded-xl bg-dojo px-3 text-white"
                onClick={keepLook}
              >
                Zostaw z szafy
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <p className="mx-4 mt-2 rounded-2xl bg-white px-3 py-2 text-base">{message}</p>
      )}

      {pending.length > 0 && (
        <div className="mx-4 mt-2 space-y-2">
          {pending.map((req) => {
            const item = getCosmetic(req.itemId);
            return (
              <div
                key={req.id}
                className="flex items-center justify-between gap-2 rounded-2xl bg-belt/10 px-3 py-2"
              >
                <span className="text-base">
                  Czeka: {item?.label ?? req.itemId} · ★ {req.priceSnapshot}
                </span>
                <button
                  type="button"
                  className="min-h-[48px] rounded-xl bg-white px-3"
                  onClick={() => cancelPurchaseRequest(req.id)}
                >
                  Anuluj
                </button>
              </div>
            );
          })}
        </div>
      )}

      <nav className="flex gap-1 overflow-x-auto px-3 py-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-xl px-3 ${tab === item.id ? 'bg-dojo text-white' : 'bg-white'}`}
            style={{ minHeight: TOUCH.minTilePx }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {catalog.map((item) => {
            const owned = kid.inventory.includes(item.id);
            const waiting = pending.some((req) => req.itemId === item.id);
            return (
              <article key={item.id} className="flex flex-col rounded-3xl bg-white p-3">
                {item.preview ? (
                  <img src={item.preview} alt="" className="mx-auto h-16 w-16 object-contain" />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-paper text-2xl">
                    ★
                  </div>
                )}
                <p className="mt-2 text-center text-base font-semibold leading-tight">{item.label}</p>
                <p className="text-center text-sm text-muted">
                  {owned ? 'W szafie' : waiting ? 'Czeka na PIN' : `★ ${item.price}`}
                </p>
                <p className="mt-1 flex-1 text-center text-xs text-muted">{item.description}</p>
                <div className="mt-2 flex flex-col gap-1">
                  <button
                    type="button"
                    className="min-h-[56px] rounded-2xl bg-paper text-base"
                    onClick={() => applyTry(item.id)}
                  >
                    Przymierz
                  </button>
                  {!owned && !waiting && (
                    <button
                      type="button"
                      className="min-h-[56px] rounded-2xl bg-dojo text-base text-white"
                      onClick={() => buy(item.id)}
                    >
                      Poproś o zakup
                    </button>
                  )}
                  {owned && (
                    <button
                      type="button"
                      className="min-h-[56px] rounded-2xl bg-dojo text-base text-white"
                      onClick={() => {
                        equipCosmetic(kid.id, item.id);
                        setTryOn(null);
                        setMessage('Założono z szafy.');
                      }}
                    >
                      Załóż
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
