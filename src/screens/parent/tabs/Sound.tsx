import { useEffect, useState } from 'react';
import { VOICE_LINE_FIELDS } from '../../../lib/catalog';
import { COLORS } from '../../../lib/constants';
import { fillVoiceLine } from '../../../lib/schedule';
import { chime, fanfare, gong, setVolume, taiko, unchime, unlockAudio, victory } from '../../../lib/sfx';
import { listPolishVoices, speak } from '../../../lib/speech';
import { scrollFieldIntoView } from '../../../lib/useKeyboardOffset';
import { useStore } from '../../../store/useStore';

const SFX_TESTS: { id: string; label: string; play: () => void }[] = [
  { id: 'chime', label: 'Dzwonek (odhaczenie)', play: () => chime() },
  { id: 'unchime', label: 'Puf (odznaczenie)', play: () => unchime() },
  { id: 'gong', label: 'Gong (start okna)', play: () => gong() },
  { id: 'taiko', label: 'Bęben (ostrzeżenie)', play: () => taiko(3) },
  { id: 'fanfare', label: 'Fanfara (komplet)', play: () => fanfare() },
  { id: 'victory', label: 'Zwycięstwo (bonus wspólny)', play: () => victory() },
];

export function SoundTab() {
  const settings = useStore((s) => s.settings);
  const kids = useStore((s) => s.kids);
  const patchSettings = useStore((s) => s.patchSettings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const load = () => setVoices(listPolishVoices());
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load);
  }, []);

  async function playSfx(play: () => void) {
    await unlockAudio();
    setVolume(settings.volume);
    play();
  }

  function previewLine(key: string) {
    const raw = settings.voiceLines[key] ?? '';
    speak(fillVoiceLine(raw, kids[0]?.name ?? 'Panda'), settings.ttsVoiceURI, { interrupt: true });
  }

  return (
    <section className="space-y-4 py-4">
      <label className="block text-sm text-muted">Głośność {Math.round(settings.volume * 100)}%</label>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(settings.volume * 100)}
        onChange={(e) => patchSettings({ volume: Number(e.target.value) / 100 })}
        className="w-full min-h-[48px]"
        aria-label="Głośność"
      />

      <button
        type="button"
        className={`min-h-[56px] w-full rounded-2xl text-lg ${settings.ttsEnabled ? 'bg-dojo text-white' : 'bg-panel'}`}
        onClick={() => patchSettings({ ttsEnabled: !settings.ttsEnabled })}
      >
        Lektor {settings.ttsEnabled ? 'włączony' : 'wyłączony'}
      </button>

      <p className="font-semibold">Głos systemu</p>
      {voices.length === 0 ? (
        <p className="text-muted">Brak polskich głosów — iPad użyje domyślnego.</p>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            className={`min-h-[52px] w-full rounded-2xl px-3 text-left ${settings.ttsVoiceURI === null ? 'bg-dojo text-white' : 'bg-panel'}`}
            onClick={() => patchSettings({ ttsVoiceURI: null })}
          >
            Domyślny
          </button>
          {voices.map((voice) => (
            <button
              key={voice.voiceURI}
              type="button"
              className={`min-h-[52px] w-full rounded-2xl px-3 text-left ${settings.ttsVoiceURI === voice.voiceURI ? 'bg-dojo text-white' : 'bg-panel'}`}
              onClick={() => patchSettings({ ttsVoiceURI: voice.voiceURI })}
            >
              {voice.name} ({voice.lang})
            </button>
          ))}
        </div>
      )}

      <p className="pt-2 font-semibold">Test dźwięków</p>
      <div className="grid grid-cols-2 gap-2">
        {SFX_TESTS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="min-h-[72px] rounded-2xl bg-panel px-2 text-sm"
            onClick={() => void playSfx(item.play)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="pt-2 font-semibold">Komunikaty lektora</p>
      {VOICE_LINE_FIELDS.map((field) => (
        <div key={field.key}>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-sm text-muted">{field.label}</label>
            <button
              type="button"
              className="min-h-[44px] rounded-xl bg-panel px-3 text-sm"
              style={{ color: COLORS.dojo }}
              onClick={() => previewLine(field.key)}
            >
              Test
            </button>
          </div>
          <textarea
            value={settings.voiceLines[field.key] ?? ''}
            onChange={(e) =>
              patchSettings({
                voiceLines: { ...settings.voiceLines, [field.key]: e.target.value },
              })
            }
            onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
            rows={2}
            className="w-full rounded-xl bg-panel px-3 py-3 text-lg"
          />
        </div>
      ))}
    </section>
  );
}
