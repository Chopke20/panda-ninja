import { useState } from 'react';
import { DEFAULT_PIN, TOUCH } from '../../lib/constants';
import { useKeyboardOffset } from '../../lib/useKeyboardOffset';
import { useStore } from '../../store/useStore';
import { PinLock } from './PinLock';
import { KidsTab } from './tabs/Kids';
import { TasksTab } from './tabs/Tasks';
import { TimingTab } from './tabs/Timing';
import { RewardsTab } from './tabs/Rewards';
import { SoundTab } from './tabs/Sound';
import { HistoryTab } from './tabs/History';
import { DataTab } from './tabs/Data';
import { ShopTab } from './tabs/Shop';

const TABS = [
  { id: 'kids', label: 'Dzieci' },
  { id: 'shop', label: 'Awans' },
  { id: 'tasks', label: 'Zadania' },
  { id: 'timing', label: 'Czas' },
  { id: 'rewards', label: 'Nagrody' },
  { id: 'sound', label: 'Dźwięk' },
  { id: 'history', label: 'Historia' },
  { id: 'data', label: 'Dane' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function ParentPanel() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<TabId>('kids');
  const setUiScreen = useStore((s) => s.setUiScreen);
  const pin = useStore((s) => s.settings.pin);
  const pendingCount = useStore(
    (s) => s.purchaseRequests.filter((req) => req.status === 'pending').length,
  );
  const keyboardOffset = useKeyboardOffset();
  const defaultPin = pin === DEFAULT_PIN || !/^\d{4}$/.test(pin);

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <h1 className="text-2xl font-semibold">Panel rodzica</h1>
        <button
          type="button"
          className="px-3 text-lg"
          style={{ minHeight: TOUCH.minTilePx }}
          onClick={() => setUiScreen('main')}
        >
          Zamknij
        </button>
      </header>
      {defaultPin && (
        <button
          type="button"
          className="mx-4 mb-2 rounded-2xl bg-belt/15 px-4 text-left text-base text-ink"
          style={{ minHeight: TOUCH.minTilePx }}
          onClick={() => setTab('data')}
        >
          {!/^\d{4}$/.test(pin)
            ? 'PIN rodzica był pusty — ustaw nowy w zakładce Dane. Wejście też przez PIN admina.'
            : `PIN to nadal ${DEFAULT_PIN}. Zmień go w zakładce Dane.`}
        </button>
      )}
      {pendingCount > 0 && (
        <button
          type="button"
          className="mx-4 mb-2 rounded-2xl bg-dojo/15 px-4 text-left text-base"
          style={{ minHeight: TOUCH.minTilePx }}
          onClick={() => setTab('shop')}
        >
          {pendingCount} {pendingCount === 1 ? 'prośba' : 'próśb'} o awans czeka w zakładce Awans.
        </button>
      )}
      <nav className="flex gap-1 overflow-x-auto px-2 py-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-xl px-3 ${tab === item.id ? 'bg-dojo text-white' : 'bg-panel'}`}
            style={{ minHeight: TOUCH.minTilePx }}
          >
            {item.label}
            {item.id === 'shop' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </nav>
      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]"
        style={{ paddingBottom: `calc(env(safe-area-inset-bottom) + ${keyboardOffset}px)` }}
      >
        {tab === 'kids' && <KidsTab />}
        {tab === 'shop' && <ShopTab />}
        {tab === 'tasks' && <TasksTab />}
        {tab === 'timing' && <TimingTab />}
        {tab === 'rewards' && <RewardsTab />}
        {tab === 'sound' && <SoundTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'data' && <DataTab />}
      </div>
    </div>
  );
}
