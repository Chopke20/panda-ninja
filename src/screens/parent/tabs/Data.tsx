import { useRef, useState } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { downloadText, parseAppState, serializeAppState } from '../../../lib/backup';
import { ADMIN_FACTORY_PIN, TOUCH } from '../../../lib/constants';
import { todayIso } from '../../../lib/time';
import { scrollFieldIntoView } from '../../../lib/useKeyboardOffset';
import { useStore } from '../../../store/useStore';

export function DataTab() {
  const kids = useStore((s) => s.kids);
  const settings = useStore((s) => s.settings);
  const logs = useStore((s) => s.logs);
  const transactions = useStore((s) => s.transactions);
  const purchaseRequests = useStore((s) => s.purchaseRequests);
  const weeklyClaims = useStore((s) => s.weeklyClaims);
  const dayExceptions = useStore((s) => s.dayExceptions);
  const version = useStore((s) => s.version);
  const importState = useStore((s) => s.importState);
  const patchSettings = useStore((s) => s.patchSettings);
  const markBackupDone = useStore((s) => s.markBackupDone);
  const factoryReset = useStore((s) => s.factoryReset);
  const lastBackupAt = useStore((s) => s.lastBackupAt);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingJson, setPendingJson] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  function exportJson() {
    const text = serializeAppState({
      kids,
      settings,
      logs,
      transactions,
      purchaseRequests,
      weeklyClaims,
      dayExceptions,
      version,
    });
    downloadText(`panda-ninja-${todayIso(new Date())}.json`, text, 'application/json');
    markBackupDone();
    setMessage('Kopia zapisana. Trzymaj ją poza Safari.');
    setError(null);
  }

  const backupStale =
    !lastBackupAt || Date.now() - new Date(lastBackupAt).getTime() > 14 * 24 * 60 * 60_000;

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      if (!parseAppState(text)) {
        setError('Ten plik nie wygląda na kopię Pandy Ninja.');
        setPendingJson(null);
        return;
      }
      setError(null);
      setPendingJson(text);
    };
    reader.readAsText(file);
  }

  function savePin() {
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN musi mieć dokładnie 4 cyfry.');
      setMessage(null);
      return;
    }
    if (pin !== pin2) {
      setError('PIN-y nie są takie same.');
      setMessage(null);
      return;
    }
    patchSettings({ pin });
    setPin('');
    setPin2('');
    setError(null);
    setMessage('PIN zapisany.');
  }

  const parsed = pendingJson ? parseAppState(pendingJson) : null;

  return (
    <section className="space-y-4 py-4">
      {backupStale && (
        <p className="rounded-2xl bg-belt/15 px-4 py-3 text-base">
          Zrób eksport JSON — Safari bywa agresywna przy braku miejsca.
        </p>
      )}
      <button
        type="button"
        className="min-h-[56px] w-full rounded-2xl bg-dojo text-lg text-white"
        onClick={exportJson}
      >
        Eksport JSON
      </button>
      <button
        type="button"
        className="min-h-[56px] w-full rounded-2xl bg-white text-lg"
        onClick={() => fileRef.current?.click()}
      >
        Import JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <p className="pt-2 font-semibold">Zmiana PIN-u</p>
      <input
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        className="w-full min-h-[52px] rounded-xl bg-white px-3 text-lg"
        placeholder="Nowy PIN"
      />
      <input
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={pin2}
        onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
        className="w-full min-h-[52px] rounded-xl bg-white px-3 text-lg"
        placeholder="Powtórz PIN"
      />
      <button type="button" className="min-h-[56px] w-full rounded-2xl bg-white text-lg" onClick={savePin}>
        Zapisz PIN
      </button>
      {error && <p className="text-belt">{error}</p>}
      {message && <p className="text-dojo">{message}</p>}

      <div className="mt-6 space-y-3 rounded-3xl bg-white p-4">
        <p className="font-semibold">Reset fabryczny</p>
        <p className="text-sm text-muted">
          Kasuje tylko dane Pandy Ninja na tym iPadzie (imiona, punkty, ustawienia). Nie rusza innych
          stron na github.io. Wymaga PIN-u admina.
        </p>
        <input
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={adminPin}
          onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
          className="w-full min-h-[52px] rounded-xl bg-paper px-3 text-lg tracking-[0.3em]"
          placeholder="PIN admina"
          aria-label="PIN admina do resetu"
        />
        <button
          type="button"
          className="w-full rounded-2xl bg-belt text-lg text-white"
          style={{ minHeight: TOUCH.minTilePx }}
          onClick={() => {
            if (adminPin !== ADMIN_FACTORY_PIN) {
              setError('Zły PIN admina.');
              setMessage(null);
              return;
            }
            setError(null);
            setResetOpen(true);
          }}
        >
          Reset fabryczny…
        </button>
      </div>

      <ConfirmDialog
        open={parsed !== null}
        title="Wgrać kopię?"
        body="Aktualne dzieci, zadania, ustawienia i historia zostaną zastąpione plikiem. Tego nie da się cofnąć."
        confirmLabel="Wgraj"
        danger
        onCancel={() => setPendingJson(null)}
        onConfirm={() => {
          if (parsed) importState(parsed);
          setPendingJson(null);
          setMessage('Kopia wgrana.');
          setError(null);
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Zresetować Pandę Ninja?"
        body="Wrócicie do pierwszego uruchomienia. Imiona, pandy, gwiazdki, historia i PIN rodzica znikną. Inne apki na github.io zostają."
        confirmLabel="Resetuj"
        danger
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          setAdminPin('');
          factoryReset();
        }}
      />
    </section>
  );
}
