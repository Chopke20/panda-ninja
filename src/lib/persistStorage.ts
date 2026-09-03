import { TIME } from './constants';

type StorageLike = {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
};

type PersistStorage = {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
};

let quotaWarned = false;

/** Debounce zapisu + łagodna obsługa QuotaExceededError. */
export function createDebouncedStorage(
  base: StorageLike = localStorage,
  debounceMs: number = TIME.persistDebounceMs,
): PersistStorage {
  const timers = new Map<string, number>();
  const pending = new Map<string, string>();

  function flush(name: string): void {
    const value = pending.get(name);
    if (value === undefined) return;
    pending.delete(name);
    try {
      base.setItem(name, value);
      quotaWarned = false;
    } catch {
      if (!quotaWarned) {
        quotaWarned = true;
        console.warn('Panda Ninja: brak miejsca w localStorage — zrób backup w panelu rodzica.');
      }
    }
  }

  return {
    getItem: (name) => {
      const queued = pending.get(name);
      if (queued !== undefined) return queued;
      return base.getItem(name);
    },
    setItem: (name, value) => {
      pending.set(name, value);
      const existing = timers.get(name);
      if (existing) window.clearTimeout(existing);
      const id = window.setTimeout(() => {
        timers.delete(name);
        flush(name);
      }, debounceMs);
      timers.set(name, id);
    },
    removeItem: (name) => {
      const existing = timers.get(name);
      if (existing) window.clearTimeout(existing);
      timers.delete(name);
      pending.delete(name);
      base.removeItem(name);
    },
  };
}

export function wasQuotaWarned(): boolean {
  return quotaWarned;
}
