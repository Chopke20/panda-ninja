import { describe, expect, it } from 'vitest';
import {
  COSMETIC_CATALOG,
  canTryOnFlat,
  isPurchasable,
} from './cosmetics';

describe('cosmetics faza 0', () => {
  it('każda kupowalna broń ma unikalny preview', () => {
    const weapons = COSMETIC_CATALOG.filter(
      (item) => item.category === 'weapon' && isPurchasable(item),
    );
    const previews = weapons.map((item) => item.preview);
    expect(previews.every((src) => typeof src === 'string' && src.length > 0)).toBe(true);
    expect(new Set(previews).size).toBe(previews.length);
  });

  it('comingSoon nie jest kupowalne', () => {
    const soon = COSMETIC_CATALOG.filter((item) => item.comingSoon);
    expect(soon.every((item) => !isPurchasable(item))).toBe(true);
  });

  it('przymiarka flat działa tylko dla logo', () => {
    expect(canTryOnFlat(COSMETIC_CATALOG.find((i) => i.id === 'logo-moon')!)).toBe(true);
    expect(canTryOnFlat(COSMETIC_CATALOG.find((i) => i.id === 'weapon-bokken')!)).toBe(false);
    expect(canTryOnFlat(COSMETIC_CATALOG.find((i) => i.id === 'gadget-pack')!)).toBe(false);
  });

  it('bronię mają gripFamily', () => {
    const weapons = COSMETIC_CATALOG.filter((item) => item.category === 'weapon');
    expect(weapons.every((item) => item.gripFamily != null)).toBe(true);
  });
});
