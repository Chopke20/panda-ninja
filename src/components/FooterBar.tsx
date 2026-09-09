import { TOUCH } from '../lib/constants';
import { useStore } from '../store/useStore';

type Props = {
  showShop: boolean;
};

export function FooterBar({ showShop }: Props) {
  const special = useStore((s) => s.settings.specialReward);
  const setUiScreen = useStore((s) => s.setUiScreen);
  const pending = useStore(
    (s) => s.purchaseRequests.filter((req) => req.status === 'pending').length,
  );

  return (
    <footer className="flex flex-col gap-2 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {special.trim() && (
        <div className="rounded-2xl border border-[color:var(--color-tile-border)] bg-tile/90 px-3 py-2 text-sm text-muted backdrop-blur-[4px]">
          <p>Niespodzianka: {special.trim()}</p>
        </div>
      )}
      <div className="flex items-center justify-end gap-3">
        {showShop && (
          <button
            type="button"
            className="relative flex items-center justify-center rounded-2xl border border-[color:var(--color-tile-border)] bg-tile text-xl text-ink backdrop-blur-[4px]"
            style={{ minHeight: TOUCH.minTilePx, minWidth: TOUCH.minTilePx }}
            onClick={() => setUiScreen('shop')}
            aria-label="Awans pandy"
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
