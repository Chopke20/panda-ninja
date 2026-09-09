import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { PandaStage } from '../../../components/PandaStage';
import { ACCENTS } from '../../../lib/cosmetics';
import {
  EVOLUTION_LINES,
  OUTFIT_SWATCHES,
  STARTER_LOGOS,
  evolutionLine,
} from '../../../lib/evolution';
import { availableBalance } from '../../../lib/shop';
import { scrollFieldIntoView } from '../../../lib/useKeyboardOffset';
import { useStore } from '../../../store/useStore';
import type { Kid, PandaBodyId } from '../../../types';

export function KidsTab() {
  const kids = useStore((s) => s.kids);
  const updateKidName = useStore((s) => s.updateKidName);
  const updateKidPanda = useStore((s) => s.updateKidPanda);
  const resetKidPoints = useStore((s) => s.resetKidPoints);
  const adjustKidPoints = useStore((s) => s.adjustKidPoints);
  const transactions = useStore((s) => s.transactions);
  const requests = useStore((s) => s.purchaseRequests);
  const [resetId, setResetId] = useState<string | null>(null);

  return (
    <section className="space-y-6 py-4">
      {kids.map((kid) => (
        <KidCard
          key={kid.id}
          kid={kid}
          wallet={availableBalance(transactions, requests, kid.id)}
          onName={(name) => updateKidName(kid.id, name)}
          onPanda={(patch) => updateKidPanda(kid.id, patch)}
          onAdjust={(amount) => adjustKidPoints(kid.id, amount)}
          onReset={() => setResetId(kid.id)}
        />
      ))}
      <ConfirmDialog
        open={resetId !== null}
        title="Wyzerować sakiewkę?"
        body="Gwiazdki w sakiewce wrócą do zera. Seria dni i awanse pandy zostają. Tego nie da się cofnąć."
        confirmLabel="Wyzeruj"
        danger
        onCancel={() => setResetId(null)}
        onConfirm={() => {
          if (resetId) resetKidPoints(resetId);
          setResetId(null);
        }}
      />
    </section>
  );
}

function KidCard({
  kid,
  wallet,
  onName,
  onPanda,
  onAdjust,
  onReset,
}: {
  kid: Kid;
  wallet: number;
  onName: (name: string) => void;
  onPanda: (patch: Partial<Kid['panda']>) => void;
  onAdjust: (amount: number) => void;
  onReset: () => void;
}) {
  const [name, setName] = useState(kid.name);
  const [pointsDraft, setPointsDraft] = useState('50');
  const line = evolutionLine(kid.panda.body);

  useEffect(() => {
    setName(kid.name);
  }, [kid.name]);

  function applyPoints(sign: 1 | -1) {
    const value = Math.trunc(Number(pointsDraft));
    if (!Number.isFinite(value) || value <= 0) return;
    onAdjust(sign * value);
  }

  return (
    <article className="rounded-3xl bg-white p-4" style={{ borderLeft: `6px solid ${kid.panda.accent}` }}>
      <div className="mb-3 flex justify-center">
        <PandaStage pose="training" appearance={kid.panda} name={kid.name} pulse={0} compact />
      </div>

      <label className="text-sm text-muted">Imię</label>
      <input
        value={name}
        onChange={(e) => {
          const next = e.target.value;
          setName(next);
          if (next.trim()) onName(next);
        }}
        onBlur={() => {
          if (!name.trim()) {
            setName(kid.name);
            return;
          }
          onName(name);
        }}
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        className="mt-1 w-full min-h-[52px] rounded-xl bg-paper px-3 text-xl"
        maxLength={24}
      />
      <p className="mt-3 text-muted">
        Sakiewka ★ {wallet} · konto ★ {kid.totalPoints} · seria {kid.streak}
      </p>
      <p className="mt-1 text-muted">
        {line.name} · stadium {kid.panda.stage} ({line.stages.find((s) => s.id === kid.panda.stage)?.label})
      </p>

      <p className="mt-4 mb-2 font-semibold">Punkty ręcznie</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Odejmij punkty"
          className="min-h-[56px] min-w-[56px] rounded-2xl bg-paper text-2xl"
          onClick={() => applyPoints(-1)}
        >
          −
        </button>
        <input
          type="number"
          min={1}
          max={99999}
          inputMode="numeric"
          aria-label="Liczba gwiazdek"
          value={pointsDraft}
          onChange={(e) => setPointsDraft(e.target.value)}
          onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
          className="min-h-[56px] w-[5.5rem] rounded-xl bg-paper px-2 text-center text-xl tabular-nums"
        />
        <button
          type="button"
          aria-label="Dodaj punkty"
          className="min-h-[56px] min-w-[56px] rounded-2xl bg-dojo text-2xl text-white"
          onClick={() => applyPoints(1)}
        >
          +
        </button>
        <span className="text-muted">★</span>
      </div>

      <p className="mt-4 mb-2 font-semibold">Panda (charakter)</p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(EVOLUTION_LINES) as PandaBodyId[]).map((body) => {
          const item = EVOLUTION_LINES[body];
          return (
            <Chip
              key={body}
              selected={kid.panda.body === body}
              label={item.name}
              onClick={() =>
                onPanda({
                  body,
                  stage: 1,
                  outfitColor: item.defaultOutfit,
                  logoId: item.defaultLogoId,
                  accent: item.accent,
                })
              }
            />
          );
        })}
      </div>
      <p className="mt-2 text-sm text-muted">{line.temperament}</p>

      <p className="mt-4 mb-2 font-semibold">Kolor kimona</p>
      <div className="flex flex-wrap gap-2">
        {OUTFIT_SWATCHES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => onPanda({ outfitColor: item.hex })}
            className="h-[72px] w-[72px] rounded-2xl"
            style={{
              background: item.hex,
              outline: kid.panda.outfitColor === item.hex ? '3px solid #2A2926' : 'none',
              outlineOffset: 2,
            }}
          />
        ))}
      </div>

      <p className="mt-4 mb-2 font-semibold">Logo opaski</p>
      <div className="flex flex-wrap gap-2">
        {STARTER_LOGOS.map((item) => (
          <Chip
            key={item.id}
            selected={kid.panda.logoId === item.id}
            label={item.label}
            onClick={() => onPanda({ logoId: item.id })}
          />
        ))}
      </div>

      <p className="mt-4 mb-2 font-semibold">Kolor ramki UI</p>
      <div className="flex flex-wrap gap-2">
        {ACCENTS.map((item) => (
          <button
            key={item.hex}
            type="button"
            aria-label={item.label}
            onClick={() => onPanda({ accent: item.hex })}
            className="h-[72px] w-[72px] rounded-2xl"
            style={{
              background: item.hex,
              outline: kid.panda.accent === item.hex ? '3px solid #2A2926' : 'none',
              outlineOffset: 2,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        className="mt-6 w-full rounded-2xl bg-paper text-lg text-red"
        style={{ minHeight: 56 }}
        onClick={onReset}
      >
        Wyzeruj sakiewkę
      </button>
    </article>
  );
}

function Chip({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[56px] rounded-2xl px-4 text-lg ${
        selected ? 'bg-dojo text-white' : 'bg-paper'
      }`}
    >
      {label}
    </button>
  );
}
