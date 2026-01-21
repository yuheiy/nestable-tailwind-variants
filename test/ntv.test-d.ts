import { assertType, describe, expectTypeOf, it } from 'vitest';
import { createNtv, ntv } from '../src/index.js';

describe('ntv types', () => {
  it('requires props parameter when any key is required', () => {
    const styles = ntv<{ variant: 'primary'; size?: 'sm' | 'lg' }>({
      variant: { primary: 'primary' },
      size: { sm: 'sm', lg: 'lg' },
    });

    assertType(styles({ variant: 'primary' }));

    // @ts-expect-error - props parameter is required
    styles();
  });

  it('makes props parameter optional when all keys are optional', () => {
    const styles = ntv<{ variant?: 'primary' }>({
      variant: { primary: 'primary' },
    });

    assertType(styles());
    expectTypeOf(styles({})).toBeString();
  });

  it('accepts class or className but not both', () => {
    const styles = ntv<{ variant?: 'primary' }>({
      variant: { primary: 'primary' },
    });

    assertType(styles({ class: 'extra' }));
    assertType(styles({ className: 'extra' }));

    // @ts-expect-error - class and className are mutually exclusive
    styles({ class: 'a', className: 'b' });
  });

  it('restricts top-level $default to ClassValue only', () => {
    // Top-level $default does not accept nested scheme
    ntv<{ variant: 'primary' }>({
      // @ts-expect-error - nested scheme not allowed at top-level $default
      $default: { $base: 'nested' },
      variant: { primary: 'primary' },
    });

    // Nested $default accepts scheme (variant must be optional to use $default)
    ntv<{ variant?: 'primary'; size: 'sm' }>({
      variant: {
        $default: { size: { sm: 'size-sm' } },
        primary: 'primary',
      },
    });
  });

  it('disallows $default for required variant keys', () => {
    ntv<{ variant: 'primary' | 'secondary' }>({
      variant: {
        primary: 'primary-class',
        secondary: 'secondary-class',
        // @ts-expect-error - $default is not allowed for required key
        $default: 'default-class',
      },
    });

    // OK: variant is optional
    ntv<{ variant?: 'primary' | 'secondary' }>({
      variant: {
        primary: 'primary-class',
        $default: 'default-class',
      },
    });
  });
});

describe('createNtv types', () => {
  it('returns a style function', () => {
    const myNtv = createNtv({ twMerge: false });
    const styles = myNtv<{ variant?: 'primary' }>({
      variant: { primary: 'primary' },
    });
    expectTypeOf(styles()).toBeString();
  });
});
