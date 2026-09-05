import { twMerge } from 'tailwind-merge';
import { describe, expectTypeOf, it } from 'vitest';

import { createNtv } from '../src/index.js';

const ntv = createNtv({ twMerge });

describe('factory contract', () => {
  it('requires a class-value merger with a string result', () => {
    // @ts-expect-error A merger must be selected explicitly.
    createNtv();
    // @ts-expect-error Class values include arrays and empty values, not just strings.
    createNtv({ twMerge: (classes: string) => classes });
    // @ts-expect-error The merger must return a string.
    createNtv({ twMerge: () => 1 });
  });

  it('accepts only scheme objects with valid condition keys', () => {
    // @ts-expect-error A string is not a scheme.
    ntv('');
    // @ts-expect-error An array is not a scheme.
    ntv([]);
    // @ts-expect-error Props must be an object.
    ntv<string>({});
    // @ts-expect-error class is a call prop, not a scheme property.
    ntv({ class: 'p-2' });
    // @ts-expect-error className is a call prop, not a scheme property.
    ntv({ className: 'p-2' });
  });
});

describe('style props', () => {
  it('accepts interfaces and retains required non-style data', () => {
    interface Props {
      tone: 'primary' | 'secondary';
      count: number;
      onPress?: () => void;
    }
    const styles = ntv<Props>({ tone: { primary: 'primary', secondary: 'secondary' } });
    expectTypeOf(styles).returns.toBeString();
    styles({ tone: 'primary', count: 3 });
    styles({ tone: 'secondary', count: 3, onPress() {} });
    expectTypeOf<Parameters<typeof styles>[0]['count']>().toEqualTypeOf<number>();
    // @ts-expect-error Required props require an argument.
    styles();
    // @ts-expect-error Non-style props remain required.
    styles({ tone: 'primary' });
    // @ts-expect-error Variant values remain constrained.
    styles({ tone: 'other', count: 3 });
  });

  it('allows omitted optional props and normalizes explicitly undefined values', () => {
    const styles = ntv<{ tone?: 'primary'; size: 'sm' | undefined }>({
      tone: { primary: 'primary' },
      size: { sm: 'small' },
    });
    styles();
    styles({ size: undefined });
    // @ts-expect-error exactOptionalPropertyTypes distinguishes absent from explicit undefined.
    styles({ tone: undefined });
  });

  it('accepts recursive readonly class values while keeping class and className exclusive', () => {
    const styles = ntv<{ isActive?: boolean }>({ isActive: 'active' });
    const classes = ['extra', [false, null, undefined, 0, 0n]] as const;
    styles({ class: classes });
    // @ts-expect-error The two override props are mutually exclusive.
    styles({ class: 'a', className: 'b' });
    // @ts-expect-error Class dictionaries conflict with nested scheme syntax.
    styles({ class: { active: true } });
    // @ts-expect-error Truthy numbers are not class values.
    styles({ class: 1 });
  });

  it('preserves exclusive union members and their different property kinds', () => {
    const styles = ntv<{ isPending: boolean } | { tone: 'primary' | 'secondary' }>({
      isPending: 'pending',
      tone: { primary: 'primary', secondary: 'secondary' },
    });
    styles({ isPending: true });
    styles({ tone: 'primary' });
    // @ts-expect-error Properties from separate union members cannot be mixed.
    styles({ isPending: true, tone: 'primary' });
    // @ts-expect-error At least one required union member must be supplied.
    styles({});
  });

  it('keeps untyped definitions usable without exposing any', () => {
    const styles = ntv({ tone: { primary: 'primary' } });
    styles({ tone: 'primary', count: 2 });
    expectTypeOf<NonNullable<Parameters<typeof styles>[0]>['tone']>().toBeUnknown();
  });
});

describe('scheme validation', () => {
  it('matches the runtime boolean naming convention', () => {
    ntv<{ isActive?: boolean; allowsRemoval?: boolean }>({
      isActive: 'active',
      allowsRemoval: 'remove',
    });
    ntv<{ disabled?: boolean }>({
      // @ts-expect-error Boolean conditions require is[A-Z] or allows[A-Z].
      disabled: 'disabled',
    });
    ntv<{ isactive?: boolean }>({
      // @ts-expect-error The first character after the prefix must be uppercase ASCII.
      isactive: 'active',
    });
    ntv<{ is?: boolean }>({
      // @ts-expect-error A bare prefix does not define a boolean condition.
      is: 'active',
    });
    ntv<{ isSize?: 'sm' }>({
      // @ts-expect-error Boolean-prefixed names cannot define string variants.
      isSize: { sm: 'small' },
    });
    ntv<{ count: number }>({
      // @ts-expect-error Non-style props cannot define conditions.
      count: { 1: 'one' },
    });
  });

  it('allows recursive defaults at every scheme level', () => {
    const styles = ntv<{
      tone?: 'primary';
      size?: 'sm';
      isActive?: boolean;
    }>({
      $default: {
        $default: {
          tone: { primary: 'chain' },
        },
        tone: {
          $default: {
            size: { sm: 'fallback' },
          },
          primary: {
            $default: {
              isActive: 'choice',
            },
          },
        },
      },
      isActive: {
        $default: {
          $default: 'branch',
        },
      },
    });
    styles({ tone: 'primary', size: 'sm', isActive: true });
  });

  it('validates recursive default keys and reserved fields', () => {
    ntv<{ tone?: 'primary' }>({
      $default: {
        tone: {
          // @ts-expect-error Variant names remain constrained in nested defaults.
          secondary: 'secondary',
        },
      },
    });
    ntv<{ count?: number }>({
      // @ts-expect-error Number props cannot define nested conditions.
      $default: { count: { 1: 'one' } },
    });
    ntv<{ tone?: 'primary' }>({
      // @ts-expect-error Nested scheme bases remain class-only.
      $default: { $base: { invalid: true } },
    });
    ntv<{ tone?: 'primary' }>({
      // @ts-expect-error Class is a call prop, not a scheme property.
      $default: { class: 'invalid' },
    });
    ntv<{ tone?: 'primary' }>({
      // @ts-expect-error className is a call prop, not a scheme property.
      $default: { className: 'invalid' },
    });
    ntv<{ tone?: 'primary' }>({
      tone: {
        // @ts-expect-error Variant names must belong to the declared prop type.
        secondary: 'secondary',
      },
    });
  });
});
