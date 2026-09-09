import { useEffect, useId, useRef } from 'react';
import { TOUCH } from '../lib/constants';

type Props = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
      role="presentation"
      onClick={onCancel}
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
        <div className="mt-6 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            className="flex-1 rounded-2xl bg-paper text-lg"
            style={{ minHeight: TOUCH.minTilePx }}
            onClick={onCancel}
          >
            Anuluj
          </button>
          <button
            type="button"
            className={`flex-1 rounded-2xl text-lg text-white ${danger ? 'bg-belt' : 'bg-dojo'}`}
            style={{ minHeight: TOUCH.minTilePx }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
