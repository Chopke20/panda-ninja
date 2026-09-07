import { describe, expect, it } from 'vitest';
import { pandaSpriteSrcs } from './pandaArt';

describe('pandaSpriteSrcs', () => {
  it('priorytetuje sprite ewolucji gdy ready', () => {
    const srcs = pandaSpriteSrcs('round', 'training', 1);
    expect(srcs.some((src) => src.includes('art/evo/round/01/training.webp'))).toBe(true);
    expect(srcs.some((src) => src.includes('art/panda-a/training.png'))).toBe(true);
  });

  it('agile idzie na panda-b jako fallback', () => {
    const srcs = pandaSpriteSrcs('agile', 'sleeping', 2);
    expect(srcs.some((src) => src.includes('art/evo/agile/02/sleeping.webp'))).toBe(true);
    expect(srcs.some((src) => src.includes('art/panda-b/sleeping.png'))).toBe(true);
  });
});
