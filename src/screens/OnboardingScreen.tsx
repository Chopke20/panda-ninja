import { useState } from 'react';
import { PandaStage } from '../components/PandaStage';
import { DEFAULT_PIN, TOUCH } from '../lib/constants';
import {
  ONBOARDING_STEPS,
  ONBOARDING_STEP_LABELS,
} from '../lib/onboarding';
import {
  EVOLUTION_LINES,
  OUTFIT_SWATCHES,
  STARTER_LOGOS,
  evolutionLine,
} from '../lib/evolution';
import { chime, setVolume, unlockAudio } from '../lib/sfx';
import { unlockSpeech } from '../lib/speech';
import { scrollFieldIntoView } from '../lib/useKeyboardOffset';
import { useStore } from '../store/useStore';
import type { PandaBodyId } from '../types';

export function OnboardingScreen() {
  const kids = useStore((s) => s.kids);
  const settings = useStore((s) => s.settings);
  const updateKidName = useStore((s) => s.updateKidName);
  const patchSettings = useStore((s) => s.patchSettings);
  const updateKidPanda = useStore((s) => s.updateKidPanda);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const [stepIndex, setStepIndex] = useState(0);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [soundOk, setSoundOk] = useState(false);
  const [names, setNames] = useState<[string, string]>([kids[0].name, kids[1].name]);

  const step = ONBOARDING_STEPS[stepIndex] ?? 'welcome';
  const last = stepIndex >= ONBOARDING_STEPS.length - 1;

  function next() {
    if (step === 'kids') {
      const n0 = names[0].trim().slice(0, 24);
      const n1 = names[1].trim().slice(0, 24);
      if (!n0 || !n1) return;
      updateKidName(kids[0].id, n0);
      updateKidName(kids[1].id, n1);
    }
    if (step === 'pin') {
      if (!/^\d{4}$/.test(pin)) {
        setPinError('PIN musi mieć dokładnie 4 cyfry.');
        return;
      }
      if (pin !== pin2) {
        setPinError('PIN-y nie są takie same.');
        return;
      }
      if (pin === DEFAULT_PIN) {
        setPinError(`Wybierz inny PIN niż ${DEFAULT_PIN}.`);
        return;
      }
      patchSettings({ pin });
      setPinError(null);
    }
    if (last) {
      // Pomiń / koniec — zawsze zostaw poprawny 4-cyfrowy PIN.
      const current = useStore.getState().settings.pin;
      if (!/^\d{4}$/.test(current)) {
        patchSettings({ pin: DEFAULT_PIN });
      }
      completeOnboarding();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1));
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function testSound() {
    await unlockAudio();
    unlockSpeech();
    setVolume(settings.volume);
    chime();
    setSoundOk(true);
  }

  return (
    <div className="flex h-[100dvh] flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <header className="px-4 pt-[env(safe-area-inset-top)] pb-2">
        <p className="text-sm uppercase tracking-[0.15em] text-muted">Pierwsze uruchomienie</p>
        <div className="mt-2 flex gap-1">
          {ONBOARDING_STEPS.map((id, index) => (
            <span
              key={id}
              className={`h-2 flex-1 rounded-full ${index <= stepIndex ? 'bg-dojo' : 'bg-ink/15'}`}
              title={ONBOARDING_STEP_LABELS[id]}
            />
          ))}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {step === 'welcome' && <WelcomeStep />}
        {step === 'kids' && (
          <KidsStep
            names={names}
            onName={(index, value) =>
              setNames((prev) => (index === 0 ? [value, prev[1]] : [prev[0], value]))
            }
          />
        )}
        {step === 'pandas' && <PandasStep onPanda={updateKidPanda} />}
        {step === 'timing' && (
          <TimingStep
            departure={settings.departure.mon ?? '07:40'}
            mission={settings.nextMissionMode}
            onDeparture={(value) => {
              const days = ['mon', 'tue', 'wed', 'thu', 'fri'] as const;
              const departure = { ...settings.departure };
              for (const day of days) departure[day] = value;
              patchSettings({ departure });
            }}
            onMission={(value) => patchSettings({ nextMissionMode: value })}
          />
        )}
        {step === 'pin' && (
          <PinStep
            pin={pin}
            pin2={pin2}
            error={pinError}
            onPin={setPin}
            onPin2={setPin2}
          />
        )}
        {step === 'sound' && <SoundStep ok={soundOk} onTest={() => void testSound()} />}
        {step === 'ipad' && <IpadStep />}
      </div>

      <footer className="flex gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {stepIndex > 0 ? (
          <button
            type="button"
            className="min-h-[72px] flex-1 rounded-2xl bg-panel text-lg"
            onClick={back}
          >
            Wstecz
          </button>
        ) : (
          <button
            type="button"
            className="min-h-[72px] flex-1 rounded-2xl bg-panel text-lg text-muted"
            onClick={() => completeOnboarding()}
          >
            Pomiń
          </button>
        )}
        <button
          type="button"
          className="min-h-[72px] flex-[1.4] rounded-2xl bg-dojo text-lg font-semibold text-white"
          onClick={next}
        >
          {last ? 'Do dojo' : 'Dalej'}
        </button>
      </footer>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="text-3xl font-semibold">Obowiązki Pandy Ninja</h1>
      <p className="max-w-md text-lg text-muted">
        Poranna rutyna dwóch synów jako trening w dojo. Bez kar, bez wyścigu, na jednym iPadzie w
        kuchni.
      </p>
      <p className="text-base text-muted">Ustawimy imiona, godzinę wyjścia, PIN i dźwięk — chwilę.</p>
    </div>
  );
}

function KidsStep({
  names,
  onName,
}: {
  names: [string, string];
  onName: (index: 0 | 1, value: string) => void;
}) {
  const kids = useStore((s) => s.kids);
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Imiona</h2>
      <p className="text-muted">
        Listę obowiązków i punkty ustawisz później w panelu rodzica — tu wystarczą imiona.
      </p>
      {([0, 1] as const).map((index) => (
        <article
          key={kids[index].id}
          className="rounded-3xl bg-panel p-4"
          style={{ borderLeft: `6px solid ${kids[index].panda.accent}` }}
        >
          <label className="text-sm text-muted">Imię</label>
          <input
            value={names[index]}
            maxLength={24}
            onChange={(e) => onName(index, e.target.value)}
            onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
            className="mt-1 w-full rounded-xl bg-paper px-3 text-xl"
            style={{ minHeight: TOUCH.minTilePx }}
          />
        </article>
      ))}
    </div>
  );
}

function PandasStep({
  onPanda,
}: {
  onPanda: (kidId: string, patch: Parameters<ReturnType<typeof useStore.getState>['updateKidPanda']>[1]) => void;
}) {
  const kids = useStore((s) => s.kids);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Wybierzcie pandy</h2>
      <p className="text-muted">
        Dwie różne postacie — spokojna z bokkenem i zwinna z nunchaku. Kolor kimona i logo
        wybieracie teraz; broń rośnie z ewolucją za gwiazdki.
      </p>
      {kids.map((kid) => {
        const line = evolutionLine(kid.panda.body);
        return (
          <article
            key={kid.id}
            className="rounded-3xl bg-panel p-4"
            style={{ borderLeft: `6px solid ${kid.panda.accent}` }}
          >
            <p className="mb-2 text-xl font-semibold">{kid.name}</p>
            <div className="mb-3 flex justify-center">
              <PandaStage pose="training" appearance={kid.panda} name={kid.name} pulse={0} compact />
            </div>

            <p className="mb-2 font-semibold">Charakter</p>
            <div className="flex flex-col gap-2">
              {(Object.keys(EVOLUTION_LINES) as PandaBodyId[]).map((body) => {
                const item = EVOLUTION_LINES[body];
                const selected = kid.panda.body === body;
                return (
                  <button
                    key={body}
                    type="button"
                    className={`rounded-2xl px-3 py-3 text-left ${
                      selected ? 'bg-dojo text-white' : 'bg-paper'
                    }`}
                    style={{ minHeight: TOUCH.minTilePx }}
                    onClick={() =>
                      onPanda(kid.id, {
                        body,
                        stage: 1,
                        outfitColor: item.defaultOutfit,
                        logoId: item.defaultLogoId,
                        accent: item.accent,
                      })
                    }
                  >
                    <span className="block text-lg font-semibold">{item.name}</span>
                    <span className={`block text-sm ${selected ? 'text-white/85' : 'text-muted'}`}>
                      {item.temperament}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-muted">Ścieżka: {line.weaponPath}</p>

            <p className="mt-4 mb-2 font-semibold">Kolor kimona</p>
            <div className="flex flex-wrap gap-2">
              {OUTFIT_SWATCHES.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  aria-label={swatch.label}
                  onClick={() => onPanda(kid.id, { outfitColor: swatch.hex })}
                  className="h-[72px] w-[72px] rounded-2xl"
                  style={{
                    background: swatch.hex,
                    outline: kid.panda.outfitColor === swatch.hex ? '3px solid #2A2926' : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>

            <p className="mt-4 mb-2 font-semibold">Logo na opasce</p>
            <div className="flex flex-wrap gap-2">
              {STARTER_LOGOS.map((logo) => (
                <button
                  key={logo.id}
                  type="button"
                  className={`min-h-[56px] rounded-2xl px-4 text-lg ${
                    kid.panda.logoId === logo.id ? 'bg-dojo text-white' : 'bg-paper'
                  }`}
                  onClick={() => onPanda(kid.id, { logoId: logo.id })}
                >
                  {logo.label}
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function TimingStep({
  departure,
  mission,
  onDeparture,
  onMission,
}: {
  departure: string;
  mission: boolean;
  onDeparture: (value: string) => void;
  onMission: (value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Poranek</h2>
      <p className="text-muted">Godzina wyjścia w dni szkolne (możesz zmienić później w panelu).</p>
      <input
        type="time"
        value={departure}
        onChange={(e) => onDeparture(e.target.value || '07:40')}
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        className="w-full rounded-2xl bg-panel px-3 text-xl"
        style={{ minHeight: TOUCH.minTilePx }}
      />
      <button
        type="button"
        className={`w-full rounded-2xl text-lg ${mission ? 'bg-dojo text-white' : 'bg-panel'}`}
        style={{ minHeight: TOUCH.minTilePx }}
        onClick={() => onMission(!mission)}
      >
        {mission
          ? 'Tryb „następna misja” włączony'
          : 'Włącz tryb „następna misja” (jedno zadanie na raz)'}
      </button>
    </div>
  );
}

function PinStep({
  pin,
  pin2,
  error,
  onPin,
  onPin2,
}: {
  pin: string;
  pin2: string;
  error: string | null;
  onPin: (value: string) => void;
  onPin2: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">PIN rodzica</h2>
      <p className="text-muted">
        Chroni panel ustawień. Domyślny {DEFAULT_PIN} trzeba zmienić — dzieci go znają z opowieści.
      </p>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        placeholder="Nowy PIN"
        value={pin}
        onChange={(e) => onPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        className="w-full rounded-2xl bg-panel px-3 text-center text-2xl tracking-[0.4em]"
        style={{ minHeight: TOUCH.minTilePx }}
      />
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        placeholder="Powtórz PIN"
        value={pin2}
        onChange={(e) => onPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        className="w-full rounded-2xl bg-panel px-3 text-center text-2xl tracking-[0.4em]"
        style={{ minHeight: TOUCH.minTilePx }}
      />
      {error && <p className="text-belt">{error}</p>}
    </div>
  );
}

function SoundStep({ ok, onTest }: { ok: boolean; onTest: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-semibold">Dźwięk</h2>
      <p className="text-muted">
        iPad wymaga pierwszego tapnięcia, żeby puścić dźwięk i lektora. Sprawdźmy to teraz.
      </p>
      <button
        type="button"
        className="w-full rounded-2xl bg-dojo text-xl font-semibold text-white"
        style={{ minHeight: TOUCH.minTilePx }}
        onClick={onTest}
      >
        Odtwórz testowy dźwięk
      </button>
      {ok && <p className="text-lg text-dojo">Słychać? Super — audio odblokowane.</p>}
    </div>
  );
}

function IpadStep() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">iPad w kuchni</h2>
      <ol className="list-decimal space-y-3 pl-5 text-lg">
        <li>
          W <strong>Safari</strong>: Udostępnij → <strong>Dodaj do ekranu początkowego</strong>.
        </li>
        <li>
          Włącz <strong>Dostęp nadzorowany</strong> (Ustawienia → Dostępność) — osobny kod niż PIN
          aplikacji.
        </li>
        <li>
          Zrób <strong>eksport JSON</strong> w panelu rodzica (Dane) i trzymaj kopię poza Safari.
        </li>
      </ol>
      <p className="rounded-2xl bg-panel p-4 text-muted">
        Po pierwszym załadowaniu aplikacja działa offline. Budzik zostaw na Zegarze iOS.
      </p>
    </div>
  );
}
