import { describe, expect, it } from 'vitest';
import {
  hexToRgb,
  isChromaKimono,
  recolorKimonoBuffer,
  rgbToHsl,
} from './pandaChroma';

describe('pandaChroma', () => {
  it('rozpoznaje magentę kimona', () => {
    const m = hexToRgb('#FF2D9B');
    expect(isChromaKimono(m.r, m.g, m.b, 255)).toBe(true);
    expect(isChromaKimono(40, 40, 40, 255)).toBe(false);
    expect(isChromaKimono(250, 250, 250, 255)).toBe(false);
  });

  it('przemalowuje magentę na indygo z zachowaniem jasności względnej', () => {
    const data = new Uint8ClampedArray([
      255, 45, 155, 255, // magenta
      20, 20, 20, 255, // czarny kontur
    ]);
    const n = recolorKimonoBuffer(data, '#3D4F8A');
    expect(n).toBe(1);
    const hsl = rgbToHsl(data[0]!, data[1]!, data[2]!);
    expect(hsl.h).toBeGreaterThan(200);
    expect(hsl.h).toBeLessThan(260);
    expect(data[4]).toBe(20);
  });
});
