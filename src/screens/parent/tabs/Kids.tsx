import { useEffect, useState } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { PandaStage } from '../../../components/PandaStage';
import {
  ACCENTS,
  COSMETIC_CATALOG,
  HEADBAND_COLORS,
  OUTFIT_COLORS,
} from '../../../lib/cosmetics';
import { availableBalance } from '../../../lib/shop';
import { scrollFieldIntoView } from '../../../lib/useKeyboardOffset';
import { useStore } from '../../../store/useStore';
import type { FurTone, Kid, PandaBodyId, FaceMark } from '../../../types';

const BODIES: { id: PandaBodyId; label: string }[] = [
  { id: 'round', label: 'Okrągła' },
  { id: 'agile', label: 'Zwinna' },
];

const FURS: { id: FurTone; label: string }[] = [
  { id: 'classic', label: 'Klasyczne' },
  { id: 'snow', label: 'Śnieżne' },
  { id: 'bamboo', label: 'Bambusowe' },
];

const MARKS: { id: FaceMark; label: string }[] = [
  { id: 'classic', label: 'Klasyczne' },
  { id: 'round', label: 'Okrągłe' },
  { id: 'bolt', label: 'Błyskawica' },
  { id: 'mask', label: 'Maska' },
];

export function KidsTab() {
  const kids = useStore((s) => s.kids);
  const updateKidName = useStore((s) => s.updateKidName);
  const updateKidPanda = useStore((s) => s.updateKidPanda);
  const equipCosmetic = useStore((s) => s.equipCosmetic);
  const unequipCosmetic = useStore((s) => s.unequipCosmetic);
  const resetKidPoints = useStore((s) => s.resetKidPoints);
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
          onEquip={(itemId) => equipCosmetic(kid.id, itemId)}
          onUnequip={(slot) => unequipCosmetic(kid.id, slot)}
          onReset={() => setResetId(kid.id)}
        />
      ))}
      <ConfirmDialog
        open={resetId !== null}
        title="Wyzerować sakiewkę?"
        body="Gwiazdki w sakiewce wrócą do zera. Seria dni i skarby w szafie zostają. Tego nie da się cofnąć."
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
  onEquip,
  onUnequip,
  onReset,
}: {
  kid: Kid;
  wallet: number;
  onName: (name: string) => void;
  onPanda: (patch: Partial<Kid['panda']>) => void;
  onEquip: (itemId: string) => void;
  onUnequip: (slot: 'head' | 'back' | 'belt' | 'aura' | 'outfitPattern') => void;
  onReset: () => void;
}) {
  const [name, setName] = useState(kid.name);
  const owned = COSMETIC_CATALOG.filter((item) => kid.inventory.includes(item.id));

  useEffect(() => {
    setName(kid.name);
  }, [kid.name]);

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

      <p className="mt-4 mb-2 font-semibold">Sylwetka</p>
      <div className="flex flex-wrap gap-2">
        {BODIES.map((item) => (
          <Chip
            key={item.id}
            selected={kid.panda.body === item.id}
            label={item.label}
            onClick={() => onPanda({ body: item.id })}
          />
        ))}
      </div>

      <p className="mt-4 mb-2 font-semibold">Futro</p>
      <div className="flex flex-wrap gap-2">
        {FURS.map((item) => (
          <Chip
            key={item.id}
            selected={kid.panda.fur === item.id}
            label={item.label}
            onClick={() => onPanda({ fur: item.id })}
          />
        ))}
      </div>

      <p className="mt-4 mb-2 font-semibold">Plamy wokół oczu</p>
      <div className="flex flex-wrap gap-2">
        {MARKS.map((item) => (
          <Chip
            key={item.id}
            selected={kid.panda.faceMark === item.id}
            label={item.label}
            onClick={() => onPanda({ faceMark: item.id })}
          />
        ))}
      </div>

      <p className="mt-4 mb-2 font-semibold">Kolor kimona</p>
      <div className="flex flex-wrap gap-2">
        {OUTFIT_COLORS.map((item) => (
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

      <p className="mt-4 mb-2 font-semibold">Kolor opaski</p>
      <div className="flex flex-wrap gap-2">
        {HEADBAND_COLORS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            onClick={() => onPanda({ headbandColor: item.hex })}
            className="h-[72px] w-[72px] rounded-2xl"
            style={{
              background: item.hex,
              outline: kid.panda.headbandColor === item.hex ? '3px solid #2A2926' : 'none',
              outlineOffset: 2,
            }}
          />
        ))}
      </div>

      <p className="mt-4 mb-2 font-semibold">Logo opaski</p>
      <div className="flex flex-wrap gap-2">
        {owned
          .filter((item) => item.slot === 'headbandLogo')
          .map((item) => (
            <Chip
              key={item.id}
              selected={kid.panda.logoId === item.id}
              label={item.label}
              onClick={() => onEquip(item.id)}
            />
          ))}
      </div>

      <p className="mt-4 mb-2 font-semibold">Sprzęt treningowy</p>
      <div className="flex flex-wrap gap-2">
        {owned
          .filter((item) => item.slot === 'hand')
          .map((item) => (
            <Chip
              key={item.id}
              selected={kid.panda.handId === item.id}
              label={item.label}
              onClick={() => onEquip(item.id)}
            />
          ))}
      </div>

      <EquipRow
        title="Głowa"
        items={owned.filter((item) => item.slot === 'head' && !item.comingSoon)}
        activeId={kid.panda.headId}
        onEquip={onEquip}
        onClear={() => onUnequip('head')}
      />
      <EquipRow
        title="Plecy"
        items={owned.filter((item) => item.slot === 'back' && !item.comingSoon)}
        activeId={kid.panda.backId}
        onEquip={onEquip}
        onClear={() => onUnequip('back')}
      />
      <EquipRow
        title="Pas"
        items={owned.filter((item) => item.slot === 'belt' && !item.comingSoon)}
        activeId={kid.panda.beltId}
        onEquip={onEquip}
        onClear={() => onUnequip('belt')}
      />
      <EquipRow
        title="Aura"
        items={owned.filter((item) => item.slot === 'aura' && !item.comingSoon)}
        activeId={kid.panda.auraId}
        onEquip={onEquip}
        onClear={() => onUnequip('aura')}
      />
      <EquipRow
        title="Wzór kimona"
        items={owned.filter((item) => item.slot === 'outfitPattern' && !item.comingSoon)}
        activeId={kid.panda.outfitPatternId}
        onEquip={onEquip}
        onClear={() => onUnequip('outfitPattern')}
      />
      <p className="mt-3 text-sm text-muted">
        Gadżety i wzory wrócą do szafy razem z grafiką warstwową (v2).
      </p>

      <p className="mt-4 mb-2 font-semibold">Kolor akcentu</p>
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
        className="mt-5 min-h-[56px] w-full rounded-2xl bg-paper text-lg text-belt"
        onClick={onReset}
      >
        Wyzeruj sakiewkę
      </button>
    </article>
  );
}

function EquipRow({
  title,
  items,
  activeId,
  onEquip,
  onClear,
}: {
  title: string;
  items: { id: string; label: string }[];
  activeId: string | null;
  onEquip: (id: string) => void;
  onClear: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <p className="mt-4 mb-2 font-semibold">{title}</p>
      <div className="flex flex-wrap gap-2">
        <Chip selected={activeId === null} label="Brak" onClick={onClear} />
        {items.map((item) => (
          <Chip
            key={item.id}
            selected={activeId === item.id}
            label={item.label}
            onClick={() => onEquip(item.id)}
          />
        ))}
      </div>
    </>
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
      className={`min-h-[72px] rounded-2xl bg-paper px-3 text-sm ${selected ? 'ring-2 ring-ink' : ''}`}
    >
      {label}
    </button>
  );
}
