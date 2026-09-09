import { useEffect } from 'react';
import type { RoutineId } from '../types';

/** Ustawia data-theme na <html> — nocny theme przy wieczorze. Bez cleanup, żeby nie gasić motywu przy zmianie ekranu. */
export function useRoutineTheme(routineId: RoutineId): void {
  useEffect(() => {
    const root = document.documentElement;
    if (routineId === 'evening') {
      root.setAttribute('data-theme', 'evening');
    } else {
      root.removeAttribute('data-theme');
    }
  }, [routineId]);
}
