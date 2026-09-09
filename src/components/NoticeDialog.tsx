import { useEffect, useId, useRef } from 'react';
import { TOUCH } from '../lib/constants';

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onClose: () => void;
};

/** Proste okienko informacyjne — jeden przycisk, bez Anuluj. */
export function NoticeDialog({
  open,
  title,
  body,
  confirmLabel = 'Super!',
  onClose,
}: Props) {
  const titleId = useId();
  const bodyId = useId();
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    okRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className="w-full max-w-md rounded-3xl bg-panel p-6 text-ink"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="text-2xl font-semibold">
          {title}
        </h2>
        <p id={bodyId} className="mt-3 text-lg text-muted">
          {body}
        </p>
        <button
          ref={okRef}
          type="button"
          className="mt-6 w-full rounded-2xl bg-dojo text-lg text-white"
          style={{ minHeight: TOUCH.minTilePx }}
          onClick={onClose}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
