import { assertType, describe, expectTypeOf, it } from 'vitest';
import type { MergeStyleFunctionProps, StyleFunction } from '../src/types.js';
import { createMergeNtv, mergeNtv, ntv } from '../src/index.js';

describe('mergeNtv types', () => {
  it('keeps key required if required in any merged function', () => {
    const fn1 = ntv<{ variant: 'primary' }>({ variant: { primary: 'p' } });
    const fn2 = ntv<{ variant?: 'secondary' }>({ variant: { secondary: 's' } });

    const styles = mergeNtv(fn1, fn2);

    assertType(styles({ variant: 'primary' }));
    assertType(styles({ variant: 'secondary' }));

    // @ts-expect-error - variant is required because it's required in fn1
    styles();
  });

  it('keeps key optional if optional in all merged functions', () => {
    const fn1 = ntv<{ variant?: 'primary' }>({ variant: { primary: 'p' } });
    const fn2 = ntv<{ variant?: 'secondary' }>({ variant: { secondary: 's' } });

    const styles = mergeNtv(fn1, fn2);

    assertType(styles({ variant: 'primary' }));
    assertType(styles());
    expectTypeOf(styles({})).toBeString();
  });
});

describe('MergeStyleFunctionProps type', () => {
  it('keeps key required if required in any', () => {
    type Fn1 = StyleFunction<{ variant: 'primary' }>;
    type Fn2 = StyleFunction<{ variant?: 'secondary' }>;

    type MergedProps = MergeStyleFunctionProps<[Fn1, Fn2]>;

    expectTypeOf<MergedProps>().toEqualTypeOf<{
      variant: 'primary' | 'secondary';
    }>();
  });

  it('keeps key optional if optional in all', () => {
    type Fn1 = StyleFunction<{ variant?: 'primary' }>;
    type Fn2 = StyleFunction<{ variant?: 'secondary' }>;

    type MergedProps = MergeStyleFunctionProps<[Fn1, Fn2]>;

    expectTypeOf<MergedProps['variant']>().toEqualTypeOf<'primary' | 'secondary' | undefined>();
  });
});

describe('MergeStyleFunctionProps with union types', () => {
  it('distributes merge across union members', () => {
    type Fn1 = StyleFunction<{ isPending: boolean } | { isCurrent: boolean }>;
    type Fn2 = StyleFunction<{ isFocused: boolean }>;

    type MergedProps = MergeStyleFunctionProps<[Fn1, Fn2]>;

    expectTypeOf<MergedProps>().toEqualTypeOf<
      { isPending: boolean; isFocused: boolean } | { isCurrent: boolean; isFocused: boolean }
    >();
  });

  it('handles multiple unions across multiple functions', () => {
    type Fn1 = StyleFunction<{ a: boolean } | { b: boolean }>;
    type Fn2 = StyleFunction<{ c: boolean }>;
    type Fn3 = StyleFunction<{ d: boolean } | { e: boolean }>;

    type MergedProps = MergeStyleFunctionProps<[Fn1, Fn2, Fn3]>;

    expectTypeOf<MergedProps>().toEqualTypeOf<
      | { a: boolean; c: boolean; d: boolean }
      | { a: boolean; c: boolean; e: boolean }
      | { b: boolean; c: boolean; d: boolean }
      | { b: boolean; c: boolean; e: boolean }
    >();
  });

  it('preserves optional status in distributed merge', () => {
    type Fn1 = StyleFunction<{ required: boolean } | { other: boolean }>;
    type Fn2 = StyleFunction<{ optional?: string }>;

    type MergedProps = MergeStyleFunctionProps<[Fn1, Fn2]>;

    expectTypeOf<MergedProps>().toEqualTypeOf<
      { required: boolean; optional?: string } | { other: boolean; optional?: string }
    >();
  });
});

describe('createMergeNtv types', () => {
  it('returns a style function', () => {
    const myMergeNtv = createMergeNtv({ twMerge: false });
    const colorStyles = ntv<{ color?: 'red' | 'blue' }>({
      color: { red: 'text-red', blue: 'text-blue' },
    });

    const styles = myMergeNtv(colorStyles);

    expectTypeOf(styles({ color: 'red' })).toBeString();
  });
});
