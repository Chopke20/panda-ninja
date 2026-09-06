import { describe, expect, it } from 'vitest';
import { pandaSpriteSrcs } from './pandaArt';

describe('pandaSpriteSrcs', () => {
  it('daje flat sprite i zapasowe body v2', () => {
    const srcs = pandaSpriteSrcs('round', 'training');
    expect(srcs.some((src) => src.includes('art/panda-a/training.png'))).toBe(true);
    expect(srcs.some((src) => src.includes('art/panda-v2/round/body/training.png'))).toBe(true);
  });

  it('agile idzie na panda-b', () => {
    const srcs = pandaSpriteSrcs('agile', 'sleeping');
    expect(srcs.some((src) => src.includes('art/panda-b/sleeping.png'))).toBe(true);
  });
});
