import { TOUCH } from '../lib/constants';
import { ROUTINE_LABELS } from '../lib/onboarding';
import type { RoutineId } from '../types';
import { useStore } from '../store/useStore';

const OPTIONS: RoutineId[] = ['morning', 'evening'];

export function RoutineSwitcher() {
  const active = useStore((s) => s.settings.activeRoutine ?? 'morning');
  const patchSettings = useStore((s) => s.patchSettings);

  return (
    <div className="flex gap-2 px-4 pb-2">
      {OPTIONS.map((id) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            className={`flex-1 rounded-2xl text-lg font-semibold ${
              on ? 'bg-dojo text-white' : 'bg-white text-muted'
            }`}
            style={{ minHeight: TOUCH.minTilePx }}
            onClick={() => patchSettings({ activeRoutine: id })}
          >
            {ROUTINE_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}
