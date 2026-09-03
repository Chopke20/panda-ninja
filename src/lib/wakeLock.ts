let sentinel: WakeLockSentinel | null = null;
let hold = false;

export async function requestWakeLock(): Promise<void> {
  if (!('wakeLock' in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
  } catch {
    sentinel = null;
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (!sentinel) return;
  try {
    await sentinel.release();
  } catch {
    /* iOS bywa kapryśny przy zwalnianiu */
  }
  sentinel = null;
}

/** Trzymaj ekran tylko w oknie rutyny; poza nim puszczaj. */
export function syncWakeLock(active: boolean): void {
  hold = active;
  if (active) void requestWakeLock();
  else void releaseWakeLock();
}

export function bindWakeLockOnVisible(): () => void {
  const onVisible = () => {
    if (document.visibilityState !== 'visible') return;
    if (hold) void requestWakeLock();
    else void releaseWakeLock();
  };
  document.addEventListener('visibilitychange', onVisible);
  return () => document.removeEventListener('visibilitychange', onVisible);
}
