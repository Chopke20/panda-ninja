import { useEffect } from 'react';
import type { RoutineId } from '../types';

/** Ustawia data-theme na <html> — nocny theme przy wieczorze. */
export function useRoutineTheme(routineId: RoutineId): void {
  useEffect(() => {
    const root = document.documentElement;
    if (routineId === 'evening') {
      root.setAttribute('data-theme', 'evening');
    } else {
      root.removeAttribute('data-theme');
    }
    return () => {
      root.removeAttribute('data-theme');
    };
  }, [routineId]);
}
