/**
 * Blokada przybliżania na iPadzie / Safari.
 * Meta viewport (user-scalable=no) nie zawsze wystarcza — iOS bywa uparty.
 */
export function lockViewportZoom(): void {
  const blockGesture = (event: Event) => {
    event.preventDefault();
  };

  document.addEventListener('gesturestart', blockGesture, { passive: false });
  document.addEventListener('gesturechange', blockGesture, { passive: false });
  document.addEventListener('gestureend', blockGesture, { passive: false });

  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 1) event.preventDefault();
    },
    { passive: false },
  );

  // Ctrl + scroll (trackpad) też potrafi zoomować w przeglądarce.
  document.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey) event.preventDefault();
    },
    { passive: false },
  );
}
