import { useMemo, useState } from 'react';
import { PandaStage } from '../components/PandaStage';
import { TOUCH } from '../lib/constants';
import {
  EVOLUTION_LINES,
  FUTURE_STAGE_SLOTS,
  evolutionItemId,
  evolutionLine,
  nextPurchasableStage,
  type EvolutionStageId,
} from '../lib/evolution';
import { availableBalance } from '../lib/shop';
import { useStore } from '../store/useStore';
import type { PandaBodyId } from '../types';

/** Ekran awansu pandy — zamiast sklepiku kosmetyków. */
export function EvolutionScreen() {
  const kids = useStore((s) => s.kids);
  const transactions = useStore((s) => s.transactions);
  const requests = useStore((s) => s.purchaseRequests);
  const setUiScreen = useStore((s) => s.setUiScreen);
  const requestPurchase = useStore((s) => s.requestPurchase);
  const cancelPurchaseRequest = useStore((s) => s.cancelPurchaseRequest);
  const [kidId, setKidId] = useState(kids[0].id);
  const [message, setMessage] = useState<string | null>(null);

  const kid = kids.find((item) => item.id === kidId) ?? kids[0];
  const wallet = availableBalance(transactions, requests, kid.id);
  const line = evolutionLine(kid.panda.body);
  const next = nextPurchasableStage(kid.panda.body, kid.panda.stage);
  const pending = requests.filter((req) => req.kidId === kid.id && req.status === 'pending');

  const stages = useMemo(() => line.stages, [line]);

  function buyNext() {
    if (!next) {
      setMessage('Na razie to maksimum — kolejne stadia będą wkrótce.');
      return;
    }
    const itemId = evolutionItemId(kid.panda.body, next.id);
    const reason = requestPurchase(kid.id, itemId);
    if (reason) {
      setMessage(reason);
      return;
    }
    setMessage('Prośba poszła do rodzica. Po PIN-ie panda awansuje.');
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-paper text-ink pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <header className="flex items-center justify-between gap-2 px-4 pt-[env(safe-area-inset-top)]">
        <h1 className="text-2xl font-semibold">Awans pandy</h1>
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
        <div className="shrink-0">
          <PandaStage pose="training" appearance={kid.panda} name={kid.name} pulse={0} compact />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">Sakiewka ★ {wallet}</p>
          <p className="text-muted">
            {line.name} · stadium {kid.panda.stage}/{line.stages.length}
          </p>
          <p className="mt-1 text-sm text-muted">{line.temperament}</p>
        </div>
      </div>

      {message && (
        <p className="mx-4 mt-2 rounded-2xl bg-white px-3 py-2 text-base">{message}</p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <h2 className="mb-2 text-xl font-semibold">Droga ewolucji</h2>
        <div className="space-y-3">
          {stages.map((stage) => {
            const unlocked = kid.panda.stage >= stage.id;
            const isCurrent = kid.panda.stage === stage.id;
            const isNext = next?.id === stage.id;
            return (
              <article
                key={stage.id}
                className={`rounded-3xl p-4 ${isCurrent ? 'bg-dojo text-white' : 'bg-white'}`}
              >
                <p className="text-lg font-semibold">
                  {stage.id}. {stage.label}
                  {!stage.ready ? ' · wkrótce' : ''}
                  {unlocked && stage.ready ? ' · odblokowane' : ''}
                </p>
                <p className={isCurrent ? 'text-white/85' : 'text-muted'}>{stage.blurb}</p>
                {stage.price > 0 && (
                  <p className={`mt-1 text-sm ${isCurrent ? 'text-white/75' : 'text-muted'}`}>
                    Awans ★ {stage.price}
                  </p>
                )}
                {isNext && stage.ready && (
                  <button
                    type="button"
                    className="mt-3 w-full rounded-2xl bg-belt text-lg text-white"
                    style={{ minHeight: TOUCH.minTilePx }}
                    onClick={buyNext}
                  >
                    Poproś o awans ★ {stage.price}
                  </button>
                )}
              </article>
            );
          })}

          {FUTURE_STAGE_SLOTS.map((slot) => (
            <article key={slot} className="rounded-3xl bg-white/70 p-4 opacity-70">
              <p className="text-lg font-semibold">{slot}. ???</p>
              <p className="text-muted">Miejsce na kolejne stadium — wymyślimy później.</p>
            </article>
          ))}
        </div>

        {pending.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xl font-semibold">Czeka na rodzica</h2>
            {pending.map((req) => (
              <div key={req.id} className="mb-2 flex items-center gap-2 rounded-2xl bg-white p-3">
                <p className="flex-1">Awans · ★ {req.priceSnapshot}</p>
                <button
                  type="button"
                  className="rounded-xl bg-paper px-3 py-2"
                  onClick={() => cancelPurchaseRequest(req.id)}
                >
                  Anuluj
                </button>
              </div>
            ))}
          </div>
        )}

        <OtherLineHint body={kid.panda.body} />
      </div>
    </div>
  );
}

function OtherLineHint({ body }: { body: PandaBodyId }) {
  const other = body === 'round' ? EVOLUTION_LINES.agile : EVOLUTION_LINES.round;
  return (
    <p className="mt-6 mb-4 text-sm text-muted">
      Druga panda ({other.name}) ma własną drogę: {other.weaponPath}. Nie mieszamy sprzętu między
      braćmi.
    </p>
  );
}

// cisza lintera — EvolutionStageId używane przy evolutionItemId
void 0 as unknown as EvolutionStageId;
