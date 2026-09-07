/**
 * Edytor kotwic paper-doll — TYLKO dev (`npm run dev`, adres z `#kotwice`).
 *
 * Podgląd składa `PandaComposer`, czyli dokładnie ten sam kod co aplikacja,
 * a kotwice idą przez `setAnchorOverride`. Co widzisz tutaj, to zobaczysz
 * na iPadzie.
 *
 * „Zapisz do pliku" strzela POST-em na /__anchors — dev-serwer Vite nadpisuje
 * src/data/panda-anchors.json i HMR przeładowuje resztę. Zero kopiuj-wklej.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { PandaComposer } from '../components/PandaComposer';
import { COSMETIC_CATALOG } from '../lib/cosmetics';
import {
  BASE_ANCHORS,
  setAnchorOverride,
  type AnchorConfig,
} from '../lib/pandaAnchors';
import type { PandaAppearance, PandaPose } from '../types';

type PointKey = 'handMain' | 'handOff' | 'grip' | 'plate' | 'face' | 'back' | 'belt' | 'aura';

const POINTS: { key: PointKey; label: string; color: string }[] = [
  { key: 'handMain', label: 'dłoń główna', color: '#e0483c' },
  { key: 'handOff', label: 'dłoń druga', color: '#e08a3c' },
  { key: 'grip', label: 'środek chwytu', color: '#8a4ce0' },
  { key: 'plate', label: 'płytka opaski', color: '#2f8fd6' },
  { key: 'face', label: 'twarz', color: '#2fb36b' },
  { key: 'back', label: 'plecy', color: '#b3892f' },
  { key: 'belt', label: 'pas', color: '#d63f8f' },
  { key: 'aura', label: 'aura', color: '#6b7280' },
];

const WEAPONS = [
  'bo',
  'bokken',
  'dragon-staff',
  'naginata',
  'master',
  'nunchaku',
  'sai',
  'sticks',
  'fan',
];
const BACKS = ['pack', 'dragon-pack', 'cape'];
const HEADS = ['glasses', 'mask', 'scarf'];
const BELTS = ['talisman', 'bottle', 'pouch'];
const LOGOS = ['paw', 'bamboo', 'mountain', 'wave', 'moon', 'bolt', 'dragon', 'star'];
const OUTFITS = ['#3A3F46', '#A83B3B', '#3D4F8A', '#3F6B4A', '#C4A574', '#5B8FB8'];
const BANDS = ['#F2F0EA', '#C44536', '#3D6B8A', '#3F8F62', '#2A2926', '#D4A017'];

function idFor(assetKey: string | null, slot: string): string | null {
  if (!assetKey) return null;
  return COSMETIC_CATALOG.find((i) => i.assetKey === assetKey && i.slot === slot)?.id ?? null;
}

function clone(cfg: AnchorConfig): AnchorConfig {
  return JSON.parse(JSON.stringify(cfg)) as AnchorConfig;
}

function Slider({
  label,
  value,
  min,
  max,
  step = 0.1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-1 flex items-center gap-2 text-xs">
      <span className="w-36 shrink-0 text-slate-600">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1"
      />
      <input
        type="number"
        step={step}
        value={Math.round(value * 100) / 100}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 rounded border border-slate-300 px-1 py-0.5 text-right"
      />
    </label>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
  allowNone = false,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
  allowNone?: boolean;
}) {
  return (
    <label className="mb-1 flex items-center gap-2 text-xs">
      <span className="w-24 shrink-0 text-slate-600">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        className="flex-1 rounded border border-slate-300 px-1 py-0.5"
      >
        {allowNone && <option value="">— brak —</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AnchorTuner() {
  const [cfg, setCfg] = useState<AnchorConfig>(() => clone(BASE_ANCHORS));
  const [pose, setPose] = useState<PandaPose>('training');
  const [weapon, setWeapon] = useState<string | null>('bo');
  const [back, setBack] = useState<string | null>('pack');
  const [head, setHead] = useState<string | null>(null);
  const [belt, setBelt] = useState<string | null>(null);
  const [logo, setLogo] = useState<string>('dragon');
  const [outfit, setOutfit] = useState(OUTFITS[1]);
  const [band, setBand] = useState(BANDS[1]);
  const [showPoints, setShowPoints] = useState(true);
  const [saved, setSaved] = useState<string>('');
  const [drag, setDrag] = useState<PointKey | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Podgląd musi liczyć kotwice z edytowanej kopii, nie z pliku.
  setAnchorOverride(cfg);
  useEffect(() => () => setAnchorOverride(null), []);

  const appearance: PandaAppearance = useMemo(
    () =>
      ({
        body: 'round',
        stage: 2,
        outfitColor: outfit,
        logoId: idFor(logo, 'headbandLogo') ?? 'logo-paw',
        accent: '#C44536',
        // Legacy paper-doll — tylko dla podglądu composera w edytorze.
        headbandColor: band,
        handId: idFor(weapon, 'hand') ?? 'weapon-bo',
        headId: idFor(head, 'head'),
        backId: idFor(back, 'back'),
        beltId: idFor(belt, 'belt'),
        auraId: null,
        outfitPatternId: null,
      }) as PandaAppearance,
    [outfit, band, logo, weapon, head, back, belt],
  );

  const a = cfg.anchors[pose];

  function patch(fn: (draft: AnchorConfig) => void) {
    setCfg((prev) => {
      const next = clone(prev);
      fn(next);
      return next;
    });
    setSaved('');
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
    const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
    patch((d) => {
      const target = d.anchors[pose] as unknown as Record<string, { x: number; y: number } | null>;
      const point = target[drag];
      if (point) {
        point.x = x;
        point.y = y;
      }
    });
  }

  async function save() {
    try {
      const res = await fetch('/__anchors', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(cfg, null, 2),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      setSaved(json.ok ? 'Zapisane do src/data/panda-anchors.json' : `Błąd: ${json.error}`);
    } catch (err) {
      setSaved(`Błąd sieci: ${String(err)}`);
    }
  }

  async function copyJson() {
    await navigator.clipboard.writeText(`${JSON.stringify(cfg, null, 2)}\n`);
    setSaved('JSON w schowku');
  }

  const itemKeys = [weapon, back, head, belt, logo].filter(Boolean) as string[];
  const [editItem, setEditItem] = useState<string>('bo');
  const item = cfg.items[editItem] ?? {};

  return (
    <div
      className="flex min-h-screen gap-6 bg-slate-100 p-6 font-sans"
      onPointerMove={onPointerMove}
      onPointerUp={() => setDrag(null)}
      onPointerLeave={() => setDrag(null)}
    >
      <div className="shrink-0">
        <div
          ref={stageRef}
          className="relative h-[512px] w-[512px] rounded-lg bg-white shadow"
          style={{ touchAction: 'none' }}
        >
          <PandaComposer pose={pose} appearance={appearance} />
          {showPoints &&
            POINTS.map(({ key, label, color }) => {
              const raw = (a as unknown as Record<string, { x: number; y: number } | null>)[key];
              if (!raw) return null;
              return (
                <button
                  key={key}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setDrag(key);
                  }}
                  title={label}
                  className="absolute z-[200] -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white shadow"
                  style={{
                    left: `${raw.x}%`,
                    top: `${raw.y}%`,
                    width: 14,
                    height: 14,
                    background: color,
                  }}
                />
              );
            })}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          {POINTS.map(({ key, label, color }) => (
            <span key={key} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
        <p className="mt-2 max-w-[512px] text-[11px] text-slate-500">
          Kotwice opisują sylwetkę <b>round</b>. Sylwetka <b>agile</b> liczy się z nich
          automatycznie (zwężenie {cfg.bodies.agile.sx}), więc nie ma czego przeciągać osobno.
        </p>
      </div>

      <div className="max-w-[420px] flex-1 space-y-4 overflow-y-auto">
        <div className="rounded-lg bg-white p-3 shadow">
          <div className="mb-2 flex gap-1">
            {cfg.poses.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPose(p)}
                className={`flex-1 rounded px-2 py-1 text-xs ${
                  pose === p ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Picker label="broń" value={weapon} options={WEAPONS} onChange={setWeapon} allowNone />
          <Picker label="plecy" value={back} options={BACKS} onChange={setBack} allowNone />
          <Picker label="głowa" value={head} options={HEADS} onChange={setHead} allowNone />
          <Picker label="pas" value={belt} options={BELTS} onChange={setBelt} allowNone />
          <Picker label="logo" value={logo} options={LOGOS} onChange={(v) => setLogo(v ?? 'paw')} />
          <div className="mt-2 flex gap-1">
            {OUTFITS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setOutfit(c)}
                className={`h-6 w-6 rounded border ${outfit === c ? 'border-slate-900' : 'border-slate-300'}`}
                style={{ background: c }}
              />
            ))}
            <span className="mx-1 w-2" />
            {BANDS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBand(c)}
                className={`h-6 w-6 rounded border ${band === c ? 'border-slate-900' : 'border-slate-300'}`}
                style={{ background: c }}
              />
            ))}
          </div>
          <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={showPoints}
              onChange={(e) => setShowPoints(e.target.checked)}
            />
            pokaż punkty kotwic
          </label>
        </div>

        <div className="rounded-lg bg-white p-3 shadow">
          <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">poza: {pose}</h3>
          <Slider
            label="kąt chwytu"
            value={a.grip.angle}
            min={-90}
            max={90}
            step={0.5}
            onChange={(v) => patch((d) => void (d.anchors[pose].grip.angle = v))}
          />
          <Slider
            label="rozstaw rąk"
            value={a.grip.span}
            min={0}
            max={95}
            step={0.5}
            onChange={(v) => patch((d) => void (d.anchors[pose].grip.span = v))}
          />
          <Slider
            label="płytka: szerokość"
            value={a.plate.w}
            min={3}
            max={30}
            onChange={(v) => patch((d) => void (d.anchors[pose].plate.w = v))}
          />
          <Slider
            label="płytka: kąt"
            value={a.plate.angle ?? 0}
            min={-45}
            max={45}
            step={0.5}
            onChange={(v) => patch((d) => void (d.anchors[pose].plate.angle = v))}
          />
          <Slider
            label="twarz: szerokość"
            value={a.face.w}
            min={8}
            max={70}
            onChange={(v) => patch((d) => void (d.anchors[pose].face.w = v))}
          />
          <Slider
            label="plecy: szerokość"
            value={a.back.w}
            min={8}
            max={100}
            onChange={(v) => patch((d) => void (d.anchors[pose].back.w = v))}
          />
          <Slider
            label="pas: szerokość"
            value={a.belt.w}
            min={3}
            max={40}
            onChange={(v) => patch((d) => void (d.anchors[pose].belt.w = v))}
          />
          <Slider
            label="aura: szerokość"
            value={a.aura.w}
            min={30}
            max={160}
            onChange={(v) => patch((d) => void (d.anchors[pose].aura.w = v))}
          />
        </div>

        <div className="rounded-lg bg-white p-3 shadow">
          <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">
            wspólne dla wszystkich póz
          </h3>
          <Slider
            label="kij × rozstaw"
            value={cfg.slots.weaponStaff.wFromSpan}
            min={0.6}
            max={3}
            step={0.05}
            onChange={(v) => patch((d) => void (d.slots.weaponStaff.wFromSpan = v))}
          />
          <Slider
            label="kij: minimum"
            value={cfg.slots.weaponStaff.wMin}
            min={10}
            max={90}
            onChange={(v) => patch((d) => void (d.slots.weaponStaff.wMin = v))}
          />
          <Slider
            label="para × rozstaw"
            value={cfg.slots.weaponDual.wFromSpan}
            min={0.4}
            max={2}
            step={0.05}
            onChange={(v) => patch((d) => void (d.slots.weaponDual.wFromSpan = v))}
          />
          <Slider
            label="para: minimum"
            value={cfg.slots.weaponDual.wMin}
            min={10}
            max={70}
            onChange={(v) => patch((d) => void (d.slots.weaponDual.wMin = v))}
          />
          <Slider
            label="wachlarz: szer."
            value={cfg.slots.weaponFan.w}
            min={8}
            max={60}
            onChange={(v) => patch((d) => void (d.slots.weaponFan.w = v))}
          />
          <Slider
            label="wachlarz: kąt"
            value={cfg.slots.weaponFan.rotate}
            min={-90}
            max={90}
            step={0.5}
            onChange={(v) => patch((d) => void (d.slots.weaponFan.rotate = v))}
          />
          <Slider
            label="pięść: szerokość"
            value={cfg.slots.fist.w}
            min={4}
            max={30}
            onChange={(v) => patch((d) => void (d.slots.fist.w = v))}
          />
          <Slider
            label="gadżet głowy ×"
            value={cfg.slots.head.wFromAnchor}
            min={0.2}
            max={1.6}
            step={0.02}
            onChange={(v) => patch((d) => void (d.slots.head.wFromAnchor = v))}
          />
          <Slider
            label="logo ×"
            value={cfg.slots.logo.wFromAnchor}
            min={0.2}
            max={1.6}
            step={0.02}
            onChange={(v) => patch((d) => void (d.slots.logo.wFromAnchor = v))}
          />
        </div>

        <div className="rounded-lg bg-white p-3 shadow">
          <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">pojedynczy przedmiot</h3>
          <Picker
            label="przedmiot"
            value={editItem}
            options={Array.from(new Set([...itemKeys, ...Object.keys(cfg.items)]))}
            onChange={(v) => setEditItem(v ?? 'bo')}
          />
          <Slider
            label="rozmiar ×"
            value={item.wMul ?? 1}
            min={0.2}
            max={2.5}
            step={0.05}
            onChange={(v) =>
              patch((d) => void ((d.items[editItem] = { ...d.items[editItem] }).wMul = v))
            }
          />
          <Slider
            label="przesuń w bok"
            value={item.dx ?? 0}
            min={-25}
            max={25}
            step={0.5}
            onChange={(v) =>
              patch((d) => void ((d.items[editItem] = { ...d.items[editItem] }).dx = v))
            }
          />
          <Slider
            label="przesuń w pionie"
            value={item.dy ?? 0}
            min={-25}
            max={25}
            step={0.5}
            onChange={(v) =>
              patch((d) => void ((d.items[editItem] = { ...d.items[editItem] }).dy = v))
            }
          />
          <Slider
            label="obrót"
            value={item.rotate ?? 0}
            min={-90}
            max={90}
            step={0.5}
            onChange={(v) =>
              patch((d) => void ((d.items[editItem] = { ...d.items[editItem] }).rotate = v))
            }
          />
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 rounded-lg bg-white p-3 shadow">
          <button
            type="button"
            onClick={save}
            className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
          >
            Zapisz do pliku
          </button>
          <button
            type="button"
            onClick={copyJson}
            className="rounded bg-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            Kopiuj JSON
          </button>
          <button
            type="button"
            onClick={() => {
              setCfg(clone(BASE_ANCHORS));
              setSaved('Wrócone do wersji z pliku');
            }}
            className="rounded bg-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            Reset
          </button>
          <span className="text-xs text-slate-500">{saved}</span>
        </div>
      </div>
    </div>
  );
}
