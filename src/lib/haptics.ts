export function tapHaptic(): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  navigator.vibrate(18);
}
