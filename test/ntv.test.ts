import { twJoin } from 'tailwind-merge';
import { describe, expect, it } from 'vitest';

import { createNtv } from '../src/index.js';

const ntv = createNtv({ twMerge: twJoin });

describe('nested conditions', () => {
  const button = ntv<{
    tone?: 'primary';
    size?: 'sm';
    isHovered?: boolean;
    isPressed?: boolean;
    allowsRemoval?: boolean;
  }>({
    $base: 'base',
    $default: 'idle',
    tone: {
      $default: {
        $base: 'fallback',
        $default: 'fallback-idle',
        isHovered: 'fallback-hover',
      },
      primary: {
        $base: 'primary',
        $default: 'primary-idle',
        size: {
          $default: 'default-size',
          sm: 'small',
        },
        isHovered: 'primary-hover',
      },
    },
    isPressed: {
      $base: 'pressed',
      tone: { primary: 'pressed-primary' },
    },
    allowsRemoval: 'remove',
  });

  it.each([
    [{ isPressed: false }, 'base idle fallback fallback-idle'],
    [{ isHovered: true }, 'base idle fallback fallback-hover'],
    [{ tone: 'primary', size: 'sm' }, 'base idle primary primary-idle small'],
    [{ tone: 'primary', isHovered: true }, 'base idle primary default-size primary-hover'],
    [
      { tone: 'primary', size: 'sm', isPressed: true, isHovered: true, allowsRemoval: true },
      'base primary small primary-hover pressed pressed-primary remove',
    ],
  ] as const)('resolves nested conditions and independent defaults for %j', (props, result) => {
    expect(button(props)).toBe(result);
  });

  it('resolves recursive defaults with forwarded props and local boolean suppression', () => {
    const styles = ntv<{
      tone?: 'quiet';
      isActive?: boolean;
      isNested?: boolean;
    }>({
      $base: 'base',
      $default: {
        $base: 'root-default-base',
        $default: { $base: 'root-default' },
        tone: { quiet: 'root-default-tone' },
        isNested: 'root-default-nested',
      },
      isActive: {
        $base: 'active-base',
        $default: {
          $base: 'active-default-base',
          $default: 'active-default',
          tone: { quiet: 'active-default-tone' },
          isNested: 'active-default-nested',
        },
      },
      tone: { quiet: 'tone' },
    });

    expect(styles({ tone: 'quiet' })).toBe(
      'base root-default-base root-default root-default-tone tone',
    );
    expect(styles({ tone: 'quiet', isNested: true })).toBe(
      'base root-default-base root-default-tone root-default-nested tone',
    );
    expect(styles({ tone: 'quiet', isActive: true })).toBe(
      'base active-base active-default-base active-default active-default-tone tone',
    );
    expect(styles({ tone: 'quiet', isActive: true, isNested: true })).toBe(
      'base active-base active-default-base active-default-tone active-default-nested tone',
    );
  });

  it('orders base and fallback before conditions regardless of declaration positions', () => {
    const styles = ntv<{ tone?: 'a'; size?: 'sm'; isActive?: boolean }>({
      size: { sm: 'small' },
      $default: 'fallback',
      tone: { a: 'accent' },
      $base: 'base',
      isActive: 'active',
    });
    expect(styles({ tone: 'a', size: 'sm' })).toBe('base fallback small accent');
    expect(styles({ tone: 'a', size: 'sm', isActive: true })).toBe('base small accent active');
  });

  it('suppresses fallback even when a matched boolean produces no classes', () => {
    const styles = ntv<{ isActive?: boolean; allowsRemoval?: boolean }>({
      $default: 'fallback',
      isActive: null,
      allowsRemoval: {},
    });
    expect(styles()).toBe('fallback');
    expect(styles({ isActive: true })).toBe('');
    expect(styles({ allowsRemoval: true })).toBe('');
  });

  it('distinguishes empty variant entries from missing and inherited entries', () => {
    const styles = ntv({
      tone: {
        $default: 'fallback',
        empty: '',
        nil: null,
        constructor: 'explicit',
        ['__proto__']: 'own',
      },
    });
    expect(styles({ tone: 'empty' })).toBe('');
    expect(styles({ tone: 'nil' })).toBe('');
    expect(styles({ tone: 'missing' })).toBe('fallback');
    expect(styles({ tone: 'toString' })).toBe('fallback');
    expect(styles({ tone: 'constructor' })).toBe('explicit');
    expect(styles({ tone: '__proto__' })).toBe('own');
  });

  it('uses fallback for runtime undefined and non-string variants', () => {
    const styles = ntv({ tone: { $default: 'fallback', primary: 'primary' }, isActive: 'active' });
    for (const tone of [undefined, null, false, 1, {}]) {
      expect(styles({ tone, isActive: undefined })).toBe('fallback');
    }
    expect(styles({ isActive: 'truthy' })).toBe('fallback active');
  });

  it('allows empty definitions and appends either class override', () => {
    const styles = ntv({});
    expect(styles()).toBe('');
    expect(styles({ class: 'extra' })).toBe('extra');
    expect(styles({ className: 'extra' })).toBe('extra');
  });

  it('rejects reserved scheme properties', () => {
    // @ts-expect-error JavaScript callers can bypass the reserved-key type check.
    expect(() => ntv({ class: 'invalid' })).toThrow('The "class" property is not allowed');
    // @ts-expect-error JavaScript callers can bypass the reserved-key type check.
    expect(() => ntv({ className: 'invalid' })).toThrow('The "className" property is not allowed');
  });

  it('rejects reached reserved runtime values and skips suppressed defaults', () => {
    const styles = ntv({ tone: { primary: { size: { $default: 'fallback' } } } });
    expect(() => styles({ tone: 'primary', size: '$default' })).toThrow('"$default" is reserved');
    expect(styles({ size: '$default' })).toBe('');

    const defaults = ntv({
      $default: { size: { $default: 'fallback' } },
      isActive: 'active',
    });
    expect(() => defaults({ size: '$default' })).toThrow('"$default" is reserved');
    expect(defaults({ isActive: true, size: '$default' })).toBe('active');
  });
});
