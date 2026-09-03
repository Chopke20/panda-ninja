import { useEffect, useState } from 'react';

/** Ile pikseli klawiatura iPada zasłania dołu ekranu. */
export function useKeyboardOffset(): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const sync = () => {
      const covered = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setOffset(covered);
    };
    viewport.addEventListener('resize', sync);
    viewport.addEventListener('scroll', sync);
    return () => {
      viewport.removeEventListener('resize', sync);
      viewport.removeEventListener('scroll', sync);
    };
  }, []);

  return offset;
}

export function scrollFieldIntoView(element: HTMLElement): void {
  window.setTimeout(() => {
    element.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 300);
}
