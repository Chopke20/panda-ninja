import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { TIME } from './constants';

const NowContext = createContext<number | null>(null);

/** Jeden tik na całą aplikację. Zawsze Date.now(), plus odświeżenie po odblokowaniu iPada. */
export function NowProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, TIME.tickMs);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

export function useNow(): number {
  const value = useContext(NowContext);
  return value ?? Date.now();
}
