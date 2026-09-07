import { describe, expect, it } from 'vitest';
import anchors from '../data/panda-anchors.json';
import { hasOffHand, placementFor } from './pandaAnchors';

describe('kotwice paper-doll', () => {
  it('broń typu staff jest szersza niż rozstaw rąk (wystaje poza pięści)', () => {
    const p = placementFor('weapon', 'round', 'training', 'bo', 'staff');
    expect(p).not.toBeNull();
    expect(p!.w).toBeGreaterThan(anchors.anchors.training.grip.span);
    expect(p!.rotate).toBe(anchors.anchors.training.grip.angle);
  });

  it('hurry ma jedną widoczną rękę — brak kotwicy drugiej pięści', () => {
    expect(hasOffHand('hurry')).toBe(false);
    expect(placementFor('fistOff', 'round', 'hurry')).toBeNull();
    expect(placementFor('fistMain', 'round', 'hurry')).not.toBeNull();
  });

  it('pozostałe pozy mają obie pięści', () => {
    for (const pose of ['sleeping', 'training', 'celebrating'] as const) {
      expect(hasOffHand(pose)).toBe(true);
      expect(placementFor('fistOff', 'round', pose)).not.toBeNull();
    }
  });

  it('agile jest węższy: kotwice i szerokości skalują się do środka', () => {
    const round = placementFor('fistMain', 'round', 'training')!;
    const agile = placementFor('fistMain', 'agile', 'training')!;
    expect(agile.w).toBeLessThan(round.w);
    expect(Math.abs(agile.x - 50)).toBeLessThan(Math.abs(round.x - 50));
  });

  it('przedmiot może nadpisać rozmiar i przesunięcie (peleryna jest większa)', () => {
    const cape = placementFor('back', 'round', 'training', 'cape')!;
    const plain = placementFor('back', 'round', 'training', 'nie-ma-takiego')!;
    expect(cape.w).toBeGreaterThan(plain.w);
  });

  it('grip empty nie kotwiczy broni', () => {
    expect(placementFor('weapon', 'round', 'training', null, 'empty')).toBeNull();
  });

  it('każda poza ma komplet kotwic', () => {
    for (const pose of anchors.poses as ('sleeping' | 'training' | 'hurry' | 'celebrating')[]) {
      for (const kind of ['weapon', 'fistMain', 'back', 'head', 'belt', 'logo', 'aura'] as const) {
        expect(placementFor(kind, 'round', pose, null, 'staff'), `${pose}/${kind}`).not.toBeNull();
      }
    }
  });
});
