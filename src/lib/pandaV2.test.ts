import { describe, expect, it } from 'vitest';
import { makeDefaultAppearance } from './wallet';
import { buildComposeLayers, gripFamilyForHand } from './pandaV2';

describe('pandaV2 compose', () => {
  it('układa body przed dłońmi i bronią', () => {
    const appearance = makeDefaultAppearance('kid-1');
    const layers = buildComposeLayers(appearance, 'training');
    const keys = layers.map((layer) => layer.key);
    expect(keys.indexOf('body')).toBeLessThan(keys.indexOf('hands'));
    expect(keys).toContain('kimono');
    expect(keys).toContain('headband');
    expect(keys).toContain('logo');
  });

  it('mapuje gripFamily z katalogu', () => {
    expect(gripFamilyForHand('weapon-bo')).toBe('staff');
    expect(gripFamilyForHand('weapon-nunchaku')).toBe('dual');
    expect(gripFamilyForHand('weapon-fan')).toBe('fan');
  });

  it('warstwy wskazują na pliki .webp', () => {
    const appearance = makeDefaultAppearance('kid-1');
    const layers = buildComposeLayers(appearance, 'training');
    const imgs = layers.filter((layer) => layer.kind === 'img');
    expect(imgs.every((layer) => layer.src.endsWith('.webp'))).toBe(true);
    expect(imgs.every((layer) => layer.src.includes('art/panda-v2/'))).toBe(true);
  });

  it('agile ma własne ścieżki body', () => {
    const appearance = { ...makeDefaultAppearance('kid-2'), body: 'agile' as const };
    const layers = buildComposeLayers(appearance, 'training');
    const body = layers.find((layer) => layer.kind === 'img' && layer.key === 'body');
    expect(body?.kind === 'img' && body.src.includes('/agile/')).toBe(true);
  });

  it('dłonie i broń mają kotwicę', () => {
    const layers = buildComposeLayers(makeDefaultAppearance('kid-1'), 'training');
    const hands = layers.find((layer) => layer.kind === 'img' && layer.key === 'hands');
    const weapon = layers.find((layer) => layer.kind === 'img' && layer.key === 'weapon');
    expect(hands?.kind === 'img' && hands.anchor != null).toBe(true);
    expect(weapon?.kind === 'img' && weapon.anchor != null).toBe(true);
  });

  it('pięści to osobne pliki na rękę, a hurry ma tylko jedną', () => {
    const two = buildComposeLayers(makeDefaultAppearance('kid-1'), 'training');
    expect(two.map((l) => l.key)).toContain('hands-off');
    const main = two.find((l) => l.kind === 'img' && l.key === 'hands');
    expect(main?.kind === 'img' && main.src).toMatch(/training-r\.webp$/);

    const one = buildComposeLayers(makeDefaultAppearance('kid-1'), 'hurry');
    expect(one.map((l) => l.key)).not.toContain('hands-off');
    const solo = one.find((l) => l.kind === 'img' && l.key === 'hands');
    expect(solo?.kind === 'img' && solo.src).toMatch(/hurry-solo\.webp$/);
  });

  it('dodaje aurę i wzór kimona do stosu', () => {
    const appearance = {
      ...makeDefaultAppearance('kid-1'),
      auraId: 'gadget-leaves',
      outfitPatternId: 'pattern-bamboo',
    };
    const keys = buildComposeLayers(appearance, 'training').map((layer) => layer.key);
    expect(keys).toContain('aura');
    expect(keys).toContain('pattern');
    expect(keys.indexOf('pattern')).toBeGreaterThan(keys.indexOf('kimono'));
  });
});
