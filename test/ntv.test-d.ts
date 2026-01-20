import { assertType, describe, expectTypeOf, it } from 'vitest';
import { createNtv, ntv } from '../src/index.js';

describe('ntv types', () => {
  it('returns string from style function', () => {
    const styles = ntv<{ variant: 'primary' }>({
      variant: { primary: 'primary' },
    });
    expectTypeOf(styles({ variant: 'primary' })).toBeString();
  });

  it('makes all props optional', () => {
    const styles = ntv<{ variant: 'primary'; isDisabled: boolean }>({
      variant: { primary: 'primary' },
      isDisabled: 'disabled',
    });

    assertType(styles());
    assertType(styles({}));
    assertType(styles({ variant: 'primary' }));
    assertType(styles({ isDisabled: true }));
    assertType(styles({ variant: undefined, isDisabled: undefined }));
  });

  it('accepts class or className but not both', () => {
    const styles = ntv<{ variant: 'primary' }>({
      variant: { primary: 'primary' },
    });

    assertType(styles({ class: 'extra' }));
    assertType(styles({ className: 'extra' }));
    assertType(styles({ class: ['a', 'b'] }));

    // @ts-expect-error - class and className are mutually exclusive
    styles({ class: 'a', className: 'b' });
  });
});

describe('createNtv types', () => {
  it('infers types from scheme without explicit type argument', () => {
    const myNtv = createNtv({ twMerge: false });
    const styles = myNtv({
      variant: { primary: 'primary' },
    });
    expectTypeOf(styles({ variant: 'primary' })).toBeString();
  });

  it('accepts explicit type argument', () => {
    const myNtv = createNtv({ twMerge: false });
    const styles = myNtv<{ variant: 'primary' | 'secondary' }>({
      variant: { primary: 'primary', secondary: 'secondary' },
    });
    expectTypeOf(styles({ variant: 'primary' })).toBeString();
    expectTypeOf(styles({ variant: 'secondary' })).toBeString();
  });
});
