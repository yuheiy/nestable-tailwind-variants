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
