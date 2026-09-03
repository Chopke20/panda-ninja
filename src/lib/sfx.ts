/** Syntezowane dźwięki przez Web Audio API — zero plików. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let volume = 0.8;
let muted = false;

function AudioCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;
}

export function getAudioContext(): AudioContext | null {
  return ctx;
}

function applyMaster(): void {
  if (!master || !ctx) return;
  const target = muted ? 0 : volume;
  master.gain.setTargetAtTime(target, ctx.currentTime, 0.04);
}

export async function unlockAudio(): Promise<void> {
  const Ctor = AudioCtor();
  if (!Ctor) return;
  if (!ctx) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.connect(ctx.destination);
    applyMaster();
  }
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

export function setVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value));
  applyMaster();
}

export function setMuted(value: boolean): void {
  muted = value;
  applyMaster();
}

function now(): number {
  return ctx?.currentTime ?? 0;
}

function tone(
  frequency: number,
  start: number,
  duration: number,
  peak: number,
  type: OscillatorType = 'sine',
): void {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noiseBuffer(seconds: number): AudioBuffer | null {
  if (!ctx) return null;
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function taikoHit(start: number, cutoff: number, peak: number): void {
  if (!ctx || !master) return;
  const buffer = noiseBuffer(0.18);
  if (!buffer) return;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, start);
  filter.Q.setValueAtTime(0.8, start);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(start);
  src.stop(start + 0.2);
}

function oneGong(start: number): void {
  tone(98, start, 2.4, 0.38, 'sine');
  tone(147, start, 1.8, 0.18, 'sine');
  tone(220, start + 0.02, 0.6, 0.08, 'triangle');
}

/** Dwutonowy dzwonek przy odhaczeniu. */
export function chime(): void {
  const t = now();
  tone(880, t, 0.09, 0.28, 'sine');
  tone(1320, t + 0.09, 0.09, 0.24, 'sine');
}

/** Cichy puf przy odznaczeniu. */
export function unchime(): void {
  if (!ctx || !master) return;
  const t = now();
  const buffer = noiseBuffer(0.08);
  if (!buffer) return;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.07, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t);
  src.stop(t + 0.09);
}

/** Niski gong — start okna albo T-0 (kilka uderzeń). */
export function gong(times = 1): void {
  const t = now();
  const count = Math.max(1, times);
  for (let i = 0; i < count; i += 1) {
    oneGong(t + i * 0.82);
  }
}

/** Uderzenia bębna na ostrzeżenia T-20 / T-10 / T-5. */
export function taiko(n: number): void {
  const t = now();
  const hits = Math.max(0, n);
  for (let i = 0; i < hits; i += 1) {
    const cutoff = 160 + n * 45 + i * 25;
    taikoHit(t + i * 0.17, cutoff, 0.55);
  }
}

const FANFARE_HZ = [523.25, 659.25, 783.99, 1046.5, 1318.51];

function arpeggio(start: number): void {
  FANFARE_HZ.forEach((hz, i) => {
    tone(hz, start + i * 0.11, 0.14, 0.22, 'triangle');
  });
}

function arpeggioEnd(): number {
  return FANFARE_HZ.length * 0.11;
}

/** Arpeggio + taiko przy komplecie własnej listy. */
export function fanfare(): void {
  const t = now();
  arpeggio(t);
  taikoHit(t + arpeggioEnd() + 0.04, 220, 0.5);
}

/** Fanfara i podwójne taiko przy bonusie wspólnym. */
export function victory(): void {
  const t = now();
  arpeggio(t);
  const after = arpeggioEnd() + 0.08;
  taikoHit(t + after, 200, 0.55);
  taikoHit(t + after + 0.17, 240, 0.5);
}
