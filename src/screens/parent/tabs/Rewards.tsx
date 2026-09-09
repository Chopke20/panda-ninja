import { scrollFieldIntoView } from '../../../lib/useKeyboardOffset';
import { useStore } from '../../../store/useStore';

export function RewardsTab() {
  const weekly = useStore((s) => s.settings.weeklyReward);
  const special = useStore((s) => s.settings.specialReward);
  const patchSettings = useStore((s) => s.patchSettings);

  return (
    <section className="space-y-4 py-4">
      <label className="text-sm text-muted">Nagroda tygodniowa</label>
      <input
        value={weekly?.label ?? ''}
        onChange={(e) =>
          patchSettings({
            weeklyReward: { label: e.target.value, points: weekly?.points ?? 400 },
          })
        }
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        className="w-full min-h-[52px] rounded-xl bg-panel px-3 text-lg"
        placeholder="Np. Wybór filmu w piątek"
      />
      <label className="text-sm text-muted">Próg punktów w tygodniu</label>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={weekly?.points ?? 0}
        onChange={(e) =>
          patchSettings({
            weeklyReward: {
              label: weekly?.label ?? '',
              points: Math.max(0, Number(e.target.value) || 0),
            },
          })
        }
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        className="w-full min-h-[52px] rounded-xl bg-panel px-3 text-lg"
      />
      <label className="text-sm text-muted">Nagroda specjalna</label>
      <textarea
        value={special}
        onChange={(e) => patchSettings({ specialReward: e.target.value })}
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        rows={4}
        className="w-full rounded-xl bg-panel px-3 py-3 text-lg"
        placeholder="Ad-hoc, np. lody po kompletnej środzie"
      />
    </section>
  );
}
