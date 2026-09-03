import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { COLORS, TIME } from '../../lib/constants';
import { useNow } from '../../lib/useNow';
import { useStore } from '../../store/useStore';

type Props = {
  onUnlock: () => void;
};

export function PinLock({ onUnlock }: Props) {
  const pin = useStore((s) => s.settings.pin);
  const now = useNow();
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const digitsRef = useRef('');
  const attemptsRef = useRef(0);
  const locked = now < lockedUntil;
  const remaining = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  useEffect(() => {
    if (locked) {
      digitsRef.current = '';
      setDigits('');
      return;
    }
    if (attempts >= TIME.pinMaxAttempts) {
      attemptsRef.current = 0;
      setAttempts(0);
    }
  }, [locked, attempts]);

  function press(digit: string) {
    if (locked) return;
    const next = (digitsRef.current + digit).slice(0, 4);
    setError(false);
    if (next.length < 4) {
      digitsRef.current = next;
      setDigits(next);
      return;
    }
    digitsRef.current = '';
    setDigits('');
    if (next === pin) {
      attemptsRef.current = 0;
      setAttempts(0);
      onUnlock();
      return;
    }
    const nextAttempts = attemptsRef.current + 1;
    attemptsRef.current = nextAttempts;
    setAttempts(nextAttempts);
    setError(true);
    setShake((n) => n + 1);
    if (nextAttempts >= TIME.pinMaxAttempts) {
      setLockedUntil(Date.now() + TIME.pinLockSeconds * 1000);
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center gap-6 bg-paper px-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-ink">
      <h1 className="text-2xl font-semibold">Panel rodzica</h1>
      <motion.div
        key={shake}
        animate={error ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="flex gap-3"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className="h-4 w-4 rounded-full"
            style={{
              background: error
                ? COLORS.red
                : i < digits.length
                  ? COLORS.ink
                  : 'rgba(42,41,38,0.2)',
            }}
          />
        ))}
      </motion.div>
      {locked ? (
        <p className="text-muted">Za dużo prób. Poczekaj {remaining} s.</p>
      ) : (
        <p className="text-muted">Wpisz 4-cyfrowy PIN</p>
      )}
      <div className="grid w-full max-w-xs grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => (
          <button
            key={key || 'empty'}
            type="button"
            disabled={key === '' || locked}
            className="min-h-[72px] rounded-2xl bg-white text-2xl font-semibold disabled:opacity-0"
            onClick={() => {
              if (key === '⌫') {
                digitsRef.current = digitsRef.current.slice(0, -1);
                setDigits(digitsRef.current);
                return;
              }
              press(key);
            }}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
