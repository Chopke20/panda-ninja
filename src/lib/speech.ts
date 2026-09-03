/** Lektor systemowy — jedna wypowiedź na raz, reszta w kolejce. */

type Job = {
  text: string;
  voiceURI: string | null;
};

const queue: Job[] = [];
let busy = false;

function synthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  return window.speechSynthesis;
}

function pickVoice(voiceURI: string | null): SpeechSynthesisVoice | null {
  const synth = synthesis();
  if (!synth) return null;
  const voices = synth.getVoices();
  if (voiceURI) {
    const match = voices.find((voice) => voice.voiceURI === voiceURI);
    if (match) return match;
  }
  return voices.find((voice) => voice.lang.toLowerCase().startsWith('pl')) ?? null;
}

function pump(): void {
  const synth = synthesis();
  if (!synth || busy) return;
  const job = queue.shift();
  if (!job) return;
  busy = true;
  const utter = new SpeechSynthesisUtterance(job.text);
  utter.lang = 'pl-PL';
  const voice = pickVoice(job.voiceURI);
  if (voice) utter.voice = voice;
  const done = () => {
    busy = false;
    pump();
  };
  utter.onend = done;
  utter.onerror = done;
  synth.speak(utter);
}

export function unlockSpeech(): void {
  const synth = synthesis();
  if (!synth) return;
  const utter = new SpeechSynthesisUtterance('');
  utter.lang = 'pl-PL';
  synth.speak(utter);
}

export function speak(
  text: string,
  voiceURI: string | null = null,
  options: { interrupt?: boolean } = {},
): void {
  const synth = synthesis();
  if (!synth || !text.trim()) return;
  if (options.interrupt) {
    synth.cancel();
    queue.length = 0;
    busy = false;
  }
  queue.push({ text: text.trim(), voiceURI });
  pump();
}

export function listPolishVoices(): SpeechSynthesisVoice[] {
  const synth = synthesis();
  if (!synth) return [];
  return synth.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('pl'));
}
