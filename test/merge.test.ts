import { describe, expect, it } from 'vitest';
import { createMergeNtv, mergeNtv, mergeNtvWithOptions, ntv } from '../src/index.js';

describe('mergeNtv', () => {
  it('merges multiple style functions', () => {
    const colorStyles = ntv<{ color?: 'red' | 'blue' }>({
      color: { red: 'text-red', blue: 'text-blue' },
    });
    const sizeStyles = ntv<{ size?: 'sm' | 'lg' }>({
      size: { sm: 'text-sm', lg: 'text-lg' },
    });

    const styles = mergeNtv(colorStyles, sizeStyles);
    expect(styles({ color: 'red', size: 'lg' })).toBe('text-red text-lg');
  });

  it('later functions take precedence via tailwind-merge', () => {
    const baseStyles = ntv({ $base: 'p-4 m-2' });
    const overrideStyles = ntv({ $base: 'p-8' });

    const styles = mergeNtv(baseStyles, overrideStyles);
    expect(styles()).toBe('m-2 p-8');
  });

  it('appends class/className props', () => {
    const styles = mergeNtv(ntv({ $base: 'base' }));
    expect(styles({ class: 'extra' })).toBe('base extra');
    expect(styles({ className: 'extra' })).toBe('base extra');
  });
});

describe('mergeNtvWithOptions', () => {
  it('uses twMerge by default', () => {
    const styles = mergeNtvWithOptions(ntv({ $base: 'p-4' }), ntv({ $base: 'p-8' }))();
    expect(styles()).toBe('p-8');
  });

  it('preserves all classes when twMerge is false', () => {
    const styles = mergeNtvWithOptions(
      ntv({ $base: 'p-4' }),
      ntv({ $base: 'p-8' }),
    )({
      twMerge: false,
    });
    expect(styles()).toBe('p-4 p-8');
  });
});

describe('createMergeNtv', () => {
  it('applies default options', () => {
    const myMergeNtv = createMergeNtv({ twMerge: false });
    const styles = myMergeNtv(ntv({ $base: 'p-4' }), ntv({ $base: 'p-8' }));
    expect(styles()).toBe('p-4 p-8');
  });

  it('works without arguments', () => {
    const myMergeNtv = createMergeNtv();
    const styles = myMergeNtv(ntv({ $base: 'p-4' }), ntv({ $base: 'p-8' }));
    expect(styles()).toBe('p-8');
  });
});
