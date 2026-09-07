/**
 * Recolor kimona: piksele o hue bliskim magenty (klucz generatora)
 * dostają hue koloru docelowego, z zachowaniem jasności i alfy.
 */
export const CHROMA_KEY_HEX = '#FF2D9B';

/** Domyślny „bazowy” odcień gi na sprite’ach evo (magenta). */
export const EVO_BASE_OUTFIT = CHROMA_KEY_HEX;

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHsl(r: number, g: number, b: number): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hue2rgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = ((h % 360) + 360) % 360 / 360;
  return {
    r: Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hn) * 255),
    b: Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  };
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Czy piksel to „magenta kimona” (nie futro, nie drewno, nie metal).
 * Magenta ~330°, wysoka saturacja.
 */
export function isChromaKimono(r: number, g: number, b: number, a: number): boolean {
  if (a < 16) return false;
  const { h, s, l } = rgbToHsl(r, g, b);
  if (s < 0.28) return false;
  if (l < 0.18 || l > 0.92) return false;
  return hueDistance(h, 330) <= 38 || hueDistance(h, 320) <= 38;
}

/** Przemalowuje bufor RGBA in-place. Zwraca liczbę zmienionych pikseli. */
export function recolorKimonoBuffer(
  data: Uint8ClampedArray | Uint8Array,
  targetHex: string,
): number {
  const target = hexToRgb(targetHex);
  const targetHsl = rgbToHsl(target.r, target.g, target.b);
  let changed = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const a = data[i + 3] ?? 0;
    if (!isChromaKimono(r, g, b, a)) continue;
    const src = rgbToHsl(r, g, b);
    // Saturacja: mieszanka źródła i celu — fałdy zostają, kolor gi się zmienia.
    const s = Math.min(1, Math.max(src.s * 0.55 + targetHsl.s * 0.45, targetHsl.s * 0.7));
    const out = hslToRgb(targetHsl.h, s, src.l);
    data[i] = out.r;
    data[i + 1] = out.g;
    data[i + 2] = out.b;
    changed += 1;
  }
  return changed;
}

const cache = new Map<string, string>();

export function chromaCacheKey(src: string, outfitHex: string): string {
  return `${src}::${outfitHex.toLowerCase()}`;
}

export function clearChromaCache(): void {
  for (const url of cache.values()) {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  }
  cache.clear();
}

/**
 * Ładuje obraz i zwraca blob URL z przemalowanym kimonem.
 * Gdy kolor ≈ magenta bazowa, zwraca oryginalny src (bez canvas).
 */
export async function recolorKimonoSrc(
  src: string,
  outfitHex: string,
): Promise<string> {
  const key = chromaCacheKey(src, outfitHex);
  const hit = cache.get(key);
  if (hit) return hit;

  const target = hexToRgb(outfitHex);
  const base = hexToRgb(EVO_BASE_OUTFIT);
  const sameHue =
    hueDistance(rgbToHsl(target.r, target.g, target.b).h, rgbToHsl(base.r, base.g, base.b).h) < 12 &&
    Math.abs(rgbToHsl(target.r, target.g, target.b).s - rgbToHsl(base.r, base.g, base.b).s) < 0.15;
  if (sameHue) {
    cache.set(key, src);
    return src;
  }

  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    cache.set(key, src);
    return src;
  }
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  recolorKimonoBuffer(imageData.data, outfitHex);
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png'),
  );
  if (!blob) {
    cache.set(key, src);
    return src;
  }
  const url = URL.createObjectURL(blob);
  cache.set(key, url);
  return url;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Nie załadowano: ${src}`));
    img.src = src;
  });
}
