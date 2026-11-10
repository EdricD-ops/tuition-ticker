import { describe, expect, it } from 'vitest';
import { readView, viewUrl } from './view';

describe('view', () => {
  it('reads ?view=mini and defaults to full', () => {
    expect(readView('?view=mini')).toBe('mini');
    expect(readView('?view=full')).toBe('full');
    expect(readView('')).toBe('full');
    expect(readView('?lang=zh&view=mini')).toBe('mini');
  });

  it('switches the view while keeping other params and the hash', () => {
    const base = 'https://x.github.io/tuition-ticker/?lang=zh#cfg=abc';
    const mini = viewUrl('mini', base);
    expect(mini).toBe('https://x.github.io/tuition-ticker/?lang=zh&view=mini#cfg=abc');
    expect(viewUrl('full', mini)).toBe(base);
  });
});
