import { weeklyPoints } from '../lib/scoring';
import { weekRange } from '../lib/time';
import { useNow } from '../lib/useNow';
import { useStore } from '../store/useStore';

/** Postęp nagrody tygodniowej — osobne paski, bez porównań. */
export function WeeklyGoalBar() {
  const weekly = useStore((s) => s.settings.weeklyReward);
  const kids = useStore((s) => s.kids);
  const logs = useStore((s) => s.logs);
  const claims = useStore((s) => s.weeklyClaims);
  const now = new Date(useNow());
  const { start } = weekRange(now);

  if (!weekly || weekly.points <= 0) return null;

  return (
    <div className="mx-4 mb-1 rounded-2xl bg-white/90 px-3 py-2">
      <p className="mb-2 text-sm font-semibold text-ink">Tydzień · {weekly.label}</p>
      <div className="grid grid-cols-2 gap-3">
        {kids.map((kid) => {
          const pts = weeklyPoints(logs, kid.id, now);
          const ratio = Math.min(1, pts / weekly.points);
          const claim = claims.find((c) => c.weekStart === start && c.kidId === kid.id);
          const earned = Boolean(claim) || pts >= weekly.points;
          const redeemed = claim?.redeemedAt != null;
          return (
            <div key={kid.id}>
              <div className="mb-1 flex items-baseline justify-between gap-1 text-sm">
                <span className="font-medium">{kid.name}</span>
                <span className="text-muted">
                  {redeemed
                    ? 'Odebrane'
                    : earned
                      ? 'Nagroda zdobyta!'
                      : `${pts}/${weekly.points}`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.round(ratio * 100)}%`,
                    background: kid.panda.accent,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
