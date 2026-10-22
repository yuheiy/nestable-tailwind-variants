import { twJoin, twMerge } from 'tailwind-merge';
import { describe, expect, it } from 'vite-plus/test';

import { createNtv } from '../src/index.js';

describe('ntv.extend', () => {
  const ntv = createNtv({ twMerge });
  const join = createNtv({ twMerge: twJoin });

  it('passes non-style props to each function and appends overrides only once', () => {
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
    expect(join.extend(first, second)({})(props)).toBe('count-3 double-6 extra');
    expect(inputs).toEqual([{ count: 3 }, { count: 3 }]);
  });

  it('supports repeated composition with independent defaults', () => {
    const first = join<{ isActive?: boolean }>({ $default: 'idle', isActive: 'active' });
    const styles = join.extend(
      join.extend(first, join({ $base: 'second' }))({}),
      join({ $base: 'third' }),
    )({});
    expect(styles()).toBe('idle second third');
    expect(styles({ isActive: true, className: 'last' })).toBe('active second third last');
  });

  it('uses each source merger before applying the composing factory merger', () => {
    const first = join({ $base: 'p-2 p-4' });
    const second = ntv({ $base: 'p-6 p-8' });
    expect(join.extend(first, second)({})()).toBe('p-2 p-4 p-8');
    expect(ntv.extend(first, second)({})()).toBe('p-8');
    expect(first()).toBe('p-2 p-4');
  });

  it('handles zero and one input without duplicating the override', () => {
    expect(join.extend()({})()).toBe('');
    expect(join.extend()({})({ class: 'extra' })).toBe('extra');
    expect(join.extend(join({ $base: 'base' }))({})({ className: 'extra' })).toBe('base extra');
  });

  it('resolves base and extension defaults independently', () => {
    const base = join<{ isActive?: boolean; isDisabled?: boolean }>({
      $base: 'base',
      $default: 'base-idle',
      isActive: 'active',
    });
    const extended = join.extend(base)({
      $base: 'extension',
      $default: 'extension-idle',
      isDisabled: 'disabled',
    });
    expect(extended()).toBe('base base-idle extension extension-idle');
    expect(extended({ isActive: true })).toBe('base active extension extension-idle');
    expect(extended({ isDisabled: true, className: ['last', false, ['override']] })).toBe(
      'base base-idle extension disabled last override',
    );
    expect(base({ isDisabled: true })).toBe('base base-idle');
  });

  it('merges extension classes after bases and before caller overrides', () => {
    const base = ntv<{ size?: 'sm' | 'lg' }>({ $base: 'p-2', size: { sm: 'text-sm' } });
    const extended = ntv.extend(base)<{ isDisabled?: boolean }>({
      $base: 'p-4',
      size: { lg: 'text-lg' },
      isDisabled: 'opacity-50',
    });
    expect(extended({ size: 'lg', isDisabled: true })).toBe('p-4 text-lg opacity-50');
    expect(extended({ size: 'sm', class: 'p-8' })).toBe('text-sm p-8');
  });

  it('validates the extension scheme when the builder is called', () => {
    const extend = ntv.extend();
    // @ts-expect-error Reserved overrides cannot appear in the extension scheme.
    expect(() => extend({ className: 'invalid' })).toThrow('Use "$base" instead.');
  });
});
