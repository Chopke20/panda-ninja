import { COLORS, TOUCH } from '../lib/constants';
import { useStore } from '../store/useStore';

type Props = {
  bothReady: boolean;
  showShop: boolean;
};

export function FooterBar({ bothReady, showShop }: Props) {
  const bonus = useStore((s) => s.settings.bonuses.bothComplete);
  const special = useStore((s) => s.settings.specialReward);
  const routineId = useStore((s) => s.settings.activeRoutine ?? 'morning');
  const setUiScreen = useStore((s) => s.setUiScreen);
  const pending = useStore(
    (s) => s.purchaseRequests.filter((req) => req.status === 'pending').length,
  );
  const readyLabel =
    routineId === 'evening'
      ? `Obie pandy gotowe do snu = +${bonus} pkt`
      : `Obie pandy gotowe = +${bonus} pkt bonusu`;

  return (
    <footer className="flex flex-col gap-2 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {special.trim() && (
        <div className="rounded-2xl bg-white/80 px-3 py-2 text-sm text-muted">
          <p>Niespodzianka: {special.trim()}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <p
          className="flex-1 rounded-2xl px-3 py-2 text-base"
          style={
            bothReady
              ? { background: 'rgba(224,184,77,0.28)', color: COLORS.ink, fontWeight: 650 }
              : { color: COLORS.muted }
          }
        >
          {readyLabel}
        </p>
        {showShop && (
          <button
            type="button"
            className="relative flex items-center justify-center rounded-2xl bg-white text-xl"
            style={{ minHeight: TOUCH.minTilePx, minWidth: TOUCH.minTilePx }}
            onClick={() => setUiScreen('shop')}
            aria-label="Sklepik dojo"
          >
            ★
            {pending > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-belt px-1 text-xs text-white">
                {pending}
              </span>
            )}
          </button>
        )}
        <button
          type="button"
          className="flex items-center justify-center rounded-2xl bg-dojo text-xl text-white"
          style={{ minHeight: TOUCH.minTilePx, minWidth: TOUCH.minTilePx }}
          onClick={() => setUiScreen('parent')}
          aria-label="Panel rodzica"
        >
          ⚙
        </button>
      </div>
    </footer>
  );
}