import { twJoin, twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';

import { createNtv } from '../src/index.js';

describe('ntv.combine', () => {
  const ntv = createNtv({ twMerge });

  it('passes non-style props to each function and appends overrides only once', () => {
    const join = createNtv({ twMerge: twJoin });
    const inputs: object[] = [];
    const first = (props: { count: number; class?: string }) => {
      inputs.push(props);
      return `count-${props.count}`;
    };
    const second = (props: { count: number; className?: string }) => {
      inputs.push(props);
      return `double-${props.count * 2}`;
    };
    const props = Object.freeze({ count: 3, class: 'extra' });
    expect(join.combine(first, second)(props)).toBe('count-3 double-6 extra');
    expect(inputs).toEqual([{ count: 3 }, { count: 3 }]);
  });

  it('supports repeated composition with independent defaults', () => {
    const join = createNtv({ twMerge: twJoin });
    const first = join<{ isActive?: boolean }>({ $default: 'idle', isActive: 'active' });
    const styles = join.combine(
      join.combine(first, join({ $base: 'second' })),
      join({ $base: 'third' }),
    );
    expect(styles()).toBe('idle second third');
    expect(styles({ isActive: true, className: 'last' })).toBe('active second third last');
  });

  it('uses each source merger before applying the composing factory merger', () => {
    const join = createNtv({ twMerge: twJoin });
    const first = join({ $base: 'p-2 p-4' });
    const second = ntv({ $base: 'p-6 p-8' });
    expect(join.combine(first, second)()).toBe('p-2 p-4 p-8');
    expect(ntv.combine(first, second)()).toBe('p-8');
    expect(first()).toBe('p-2 p-4');
  });

  it('handles zero and one input without duplicating the override', () => {
    const join = createNtv({ twMerge: twJoin });
    expect(join.combine()()).toBe('');
    expect(join.combine()({ class: 'extra' })).toBe('extra');
    expect(join.combine(join({ $base: 'base' }))({ className: 'extra' })).toBe('base extra');
  });
});
