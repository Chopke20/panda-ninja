import { describe, expect, it } from 'vitest';
import {
  ADMIN_FACTORY_PIN,
  DEFAULT_PIN,
  acceptsParentPin,
  effectiveParentPin,
} from './constants';

describe('PIN rodzica', () => {
  it('pusty / zły zapis → DEFAULT_PIN', () => {
    expect(effectiveParentPin('')).toBe(DEFAULT_PIN);
    expect(effectiveParentPin('12')).toBe(DEFAULT_PIN);
    expect(effectiveParentPin('2222')).toBe('2222');
  });

  it('admin 1608 zawsze przechodzi', () => {
    expect(acceptsParentPin(ADMIN_FACTORY_PIN, '9999')).toBe(true);
    expect(acceptsParentPin(ADMIN_FACTORY_PIN, '')).toBe(true);
  });

  it('zwykły PIN działa, pusty input nie', () => {
    expect(acceptsParentPin('2222', '2222')).toBe(true);
    expect(acceptsParentPin('1111', '')).toBe(true);
    expect(acceptsParentPin('0000', '')).toBe(false);
    expect(acceptsParentPin('', '2222')).toBe(false);
  });
});
