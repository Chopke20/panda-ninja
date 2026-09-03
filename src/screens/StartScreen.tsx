import { unlockAudio } from '../lib/sfx';
import { unlockSpeech } from '../lib/speech';
import { getDepartureToday, weekdayFromDate } from '../lib/time';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/useStore';
import { PandaStage } from '../components/PandaStage';

export function StartScreen() {
  const kids = useStore((s) => s.kids);
  const settings = useStore((s) => s.settings);
  const dayExceptions = useStore((s) => s.dayExceptions);
  const setUiScreen = useStore((s) => s.setUiScreen);
  const now = new Date(useNow());
  const departure = getDepartureToday(settings, now, dayExceptions);
  const weekday = weekdayFromDate(now);
  const dayLabel = now.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  async function start() {
    await unlockAudio();
    unlockSpeech();
    setUiScreen('main');
  }

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-6 bg-paper px-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center text-ink">
      <p className="text-sm uppercase tracking-[0.2em] text-muted">Dzień dobry</p>
      <h1 className="text-4xl font-semibold">Obowiązki Pandy Ninja</h1>
      <div className="flex items-end justify-center gap-6">
        <PandaStage pose="sleeping" appearance={kids[0].panda} name={kids[0].name} pulse={0} compact />
        <PandaStage pose="sleeping" appearance={kids[1].panda} name={kids[1].name} pulse={0} compact />
      </div>
      <p className="text-lg text-muted">
        {kids[0].name} i {kids[1].name}
      </p>
      <button
        type="button"
        onClick={() => void start()}
        className="min-h-[72px] min-w-[280px] rounded-3xl bg-dojo px-8 text-2xl font-semibold text-white"
      >
        🥋 Zaczynamy trening!
      </button>
      <p className="text-muted">
        {dayLabel}
        {departure
          ? ` · wyjście ${settings.departure[weekday]}`
          : ' · dziś bez wyznaczonej godziny wyjścia'}
      </p>
    </div>
  );
}
