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

describe('scheme validation', () => {
  it('rejects string as scheme for ntv', () => {
    // @ts-expect-error - string is not allowed as scheme
    ntv('');
  });

  it('rejects array as scheme for ntv', () => {
    // @ts-expect-error - array is not allowed as scheme
    ntv([]);
  });

  it('rejects string as scheme for createNtv', () => {
    const myNtv = createNtv();
    // @ts-expect-error - string is not allowed as scheme
    myNtv('');
  });

  it('rejects array as scheme for createNtv', () => {
    const myNtv = createNtv();
    // @ts-expect-error - array is not allowed as scheme
    myNtv([]);
  });
});

describe('type parameter constraints', () => {
  it('accepts interfaces and type aliases', () => {
    interface ButtonProps {
      variant?: 'primary' | 'secondary';
    }
    const button = ntv<ButtonProps>({
      variant: { primary: 'bg-blue-500', secondary: 'bg-gray-500' },
    });

    assertType(button({ variant: 'primary' }));
  });

  it('rejects props with non-boolean or non-string values', () => {
    // @ts-expect-error - number is not a valid prop value
    ntv<{ count: number }>({});

    // @ts-expect-error - object is not a valid prop value
    ntv<{ data: { nested: string } }>({});
  });
});

describe('union type props', () => {
  it('allows keys from all union members in scheme', () => {
    // Union types create exclusive props - can use either isPending OR isCurrent, but not both
    const styles = ntv<{ isPending: boolean } | { isCurrent: boolean }>({
      isPending: 'pending-class',
      isCurrent: 'current-class',
    });

    // Each union member can be used independently
    assertType(styles({ isPending: true }));
    assertType(styles({ isCurrent: true }));

    // @ts-expect-error - cannot mix union members
    styles({ isPending: true, isCurrent: true });
  });

  it('handles mixed boolean and variant keys in union', () => {
    // Union can contain different prop types - boolean vs string variants
    const styles = ntv<{ isActive: boolean } | { variant: 'primary' | 'secondary' }>({
      isActive: 'active-class',
      variant: {
        primary: 'primary-class',
        secondary: 'secondary-class',
      },
    });

    // Each union member works with its appropriate value type
    assertType(styles({ isActive: true }));
    assertType(styles({ variant: 'primary' }));

    // @ts-expect-error - cannot mix union members
    styles({ isActive: true, variant: 'primary' });
  });
});
