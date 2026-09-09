import { COLORS, TOUCH } from '../lib/constants';
import { ROUTINE_LABELS } from '../lib/onboarding';
import type { RoutineId } from '../types';
import { useStore } from '../store/useStore';

const OPTIONS: { id: RoutineId; Icon: typeof SunIcon }[] = [
  { id: 'morning', Icon: SunIcon },
  { id: 'evening', Icon: MoonIcon },
];

/** Kompaktowy przełącznik rutyny — ikony u góry, bez dużych kafli. */
export function RoutineSwitcher() {
  const active = useStore((s) => s.settings.activeRoutine ?? 'morning');
  const patchSettings = useStore((s) => s.patchSettings);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Rutyna">
      {OPTIONS.map(({ id, Icon }) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            title={ROUTINE_LABELS[id]}
            aria-label={ROUTINE_LABELS[id]}
            aria-pressed={on}
            className={`flex items-center justify-center rounded-2xl ${
              on ? 'bg-dojo text-white' : 'bg-white/80 text-muted'
            }`}
            style={{ minHeight: TOUCH.minTilePx, minWidth: TOUCH.minTilePx }}
            onClick={() => patchSettings({ activeRoutine: id })}
          >
            <Icon active={on} />
          </button>
        );
      })}
    </div>
  );
}

function SunIcon({ active }: { active: boolean }) {
  const stroke = active ? '#FFFFFF' : COLORS.ink;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="5" stroke={stroke} strokeWidth="2.2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 14 + Math.cos(rad) * 8.2;
        const y1 = 14 + Math.sin(rad) * 8.2;
        const x2 = 14 + Math.cos(rad) * 11.2;
        const y2 = 14 + Math.sin(rad) * 11.2;
        return (
          <line
            key={deg}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function MoonIcon({ active }: { active: boolean }) {
  const stroke = active ? '#FFFFFF' : COLORS.ink;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M18.5 4.5a9.5 9.5 0 1 0 5 16.2 8.2 8.2 0 1 1-5-16.2Z"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
