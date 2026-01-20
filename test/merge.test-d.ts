import { assertType, describe, expectTypeOf, it } from 'vitest';
import type { MergeStyleFunctionProps, StyleFunction } from '../src/types.js';
import { createMergeNtv, mergeNtv, ntv } from '../src/index.js';

describe('mergeNtv types', () => {
  it('infers combined props from all style functions', () => {
    const colorStyles = ntv<{ color: 'red' | 'blue' }>({
      color: { red: 'text-red', blue: 'text-blue' },
    });
    const sizeStyles = ntv<{ size: 'sm' | 'lg' }>({
      size: { sm: 'text-sm', lg: 'text-lg' },
    });

    const styles = mergeNtv(colorStyles, sizeStyles);

    assertType(styles({ color: 'red', size: 'lg' }));
    assertType(styles({ color: 'blue' }));
    assertType(styles({ size: 'sm' }));
    assertType(styles({}));
    expectTypeOf(styles({})).toBeString();
  });

  it('creates union for overlapping variant props', () => {
    const fn1 = ntv<{ variant: 'primary' }>({ variant: { primary: 'p' } });
    const fn2 = ntv<{ variant: 'secondary' }>({ variant: { secondary: 's' } });

    const styles = mergeNtv(fn1, fn2);

    assertType(styles({ variant: 'primary' }));
    assertType(styles({ variant: 'secondary' }));
  });
});

describe('mergeNtv with untyped ntv', () => {
  it('untyped ntv({}) preserves type constraints when merged', () => {
    const merged = mergeNtv(ntv({}), ntv<{ isActive: boolean }>({}));

    type MergedProps = NonNullable<Parameters<typeof merged>[0]>;

    // ntv({}) infers as StyleFunction<{}>, so isActive remains boolean
    expectTypeOf<MergedProps['isActive']>().toEqualTypeOf<boolean | undefined>();
  });

  it('untyped ntv with keys infers as StyleFunction<any>, polluting merged types', () => {
    const merged = mergeNtv(
      ntv({ variant: { primary: 'p' } }), // No type argument, has keys -> StyleFunction<any>
      ntv<{ isActive: boolean }>({}),
    );

    type MergedProps = NonNullable<Parameters<typeof merged>[0]>;

    // any pollutes isActive type (no longer boolean)
    expectTypeOf<MergedProps['isActive']>().toEqualTypeOf<any>();
  });
});

describe('MergeStyleFunctionProps type', () => {
  it('merges props from multiple style functions', () => {
    type ColorFn = StyleFunction<{ color: 'red' | 'blue' }>;
    type SizeFn = StyleFunction<{ size: 'sm' | 'lg' }>;

    type MergedProps = MergeStyleFunctionProps<[ColorFn, SizeFn]>;

    expectTypeOf<MergedProps>().toEqualTypeOf<{
      color: 'red' | 'blue';
      size: 'sm' | 'lg';
    }>();
  });

  it('creates union for overlapping props', () => {
    type Fn1 = StyleFunction<{ variant: 'primary' }>;
    type Fn2 = StyleFunction<{ variant: 'secondary' }>;

    type MergedProps = MergeStyleFunctionProps<[Fn1, Fn2]>;

    expectTypeOf<MergedProps>().toEqualTypeOf<{
      variant: 'primary' | 'secondary';
    }>();
  });
});

describe('createMergeNtv types', () => {
  it('returns a style function', () => {
    const myMergeNtv = createMergeNtv({ twMerge: false });
    const colorStyles = ntv<{ color: 'red' | 'blue' }>({
      color: { red: 'text-red', blue: 'text-blue' },
    });
    const sizeStyles = ntv<{ size: 'sm' | 'lg' }>({
      size: { sm: 'text-sm', lg: 'text-lg' },
    });

    const styles = myMergeNtv(colorStyles, sizeStyles);

    assertType(styles({ color: 'red', size: 'lg' }));
    expectTypeOf(styles({})).toBeString();
  });
});
