import { describe, expect, it } from 'vitest';
import { createNtv, ntv } from '../src/index.js';

describe('ntv', () => {
  describe('$base', () => {
    it('applies $base when no conditions defined', () => {
      const styles = ntv({ $base: 'base-class' });
      expect(styles()).toBe('base-class');
    });

    it('applies $base with empty props', () => {
      const styles = ntv({ $base: 'base-class' });
      expect(styles({})).toBe('base-class');
    });

    it('applies $base with array class value', () => {
      const styles = ntv({ $base: ['class-a', 'class-b'] });
      expect(styles()).toBe('class-a class-b');
    });

    it('applies both $base and $default', () => {
      const styles = ntv({ $base: 'base-class', $default: 'default-class' });
      expect(styles()).toBe('base-class default-class');
    });
  });

  describe('$default', () => {
    it('applies $default when no conditions match', () => {
      const styles = ntv<{ variant?: 'primary' }>({
        $default: 'default-class',
        variant: { primary: 'primary-class' },
      });
      expect(styles()).toBe('default-class');
    });

    it('applies $default when no boolean conditions match', () => {
      const styles = ntv<{ isHovered?: boolean }>({
        $default: 'default-class',
        isHovered: 'hovered-class',
      });
      expect(styles()).toBe('default-class');
      expect(styles({ isHovered: false })).toBe('default-class');
    });

    it('does not apply $default when boolean condition matches', () => {
      const styles = ntv<{ isHovered?: boolean }>({
        $default: 'default-class',
        isHovered: 'hovered-class',
      });
      expect(styles({ isHovered: true })).toBe('hovered-class');
    });

    it('applies $default even when variant matches', () => {
      const styles = ntv<{ variant?: 'primary' }>({
        $default: 'default-class',
        variant: { primary: 'primary-class' },
      });
      expect(styles({ variant: 'primary' })).toBe('default-class primary-class');
    });

    it('accumulates $defaults from nested levels', () => {
      const styles = ntv<{ variant?: 'primary'; size?: 'large' }>({
        $base: 'base',
        $default: 'root-default',
        variant: {
          $default: 'variant-default',
          primary: {
            size: {
              $default: 'size-default',
              large: 'size-large',
            },
          },
        },
      });
      expect(styles()).toBe('base root-default variant-default');
      expect(styles({ variant: 'primary' })).toBe('base root-default size-default');
      expect(styles({ variant: 'primary', size: 'large' })).toBe('base root-default size-large');
    });

    it('applies $default with boolean and variant conditions', () => {
      const styles = ntv<{ isHovered?: boolean; variant?: 'primary' }>({
        $default: 'root-default',
        isHovered: 'root-hovered',
        variant: {
          $default: 'variant-default',
          primary: 'variant-primary',
        },
      });
      expect(styles()).toBe('root-default variant-default');
      expect(styles({ isHovered: true })).toBe('root-hovered variant-default');
      expect(styles({ variant: 'primary' })).toBe('root-default variant-primary');
      expect(styles({ isHovered: true, variant: 'primary' })).toBe('root-hovered variant-primary');
    });

    it('resolves nested conditions within variant $default', () => {
      const styles = ntv<{ variant?: 'primary'; isDisabled?: boolean }>({
        $base: 'root-base',
        variant: {
          $default: {
            $base: 'variant-default-base',
            isDisabled: 'variant-default-disabled',
          },
          primary: 'primary-class',
        },
      });
      expect(styles()).toBe('root-base variant-default-base');
      expect(styles({ isDisabled: true })).toBe(
        'root-base variant-default-base variant-default-disabled',
      );
      expect(styles({ variant: 'primary' })).toBe('root-base primary-class');
    });
  });

  describe('variant conditions', () => {
    it('selects variant based on prop value', () => {
      const styles = ntv<{ variant: 'primary' | 'secondary' }>({
        $base: 'base',
        variant: {
          primary: 'primary',
          secondary: 'secondary',
        },
      });
      expect(styles({ variant: 'primary' })).toBe('base primary');
      expect(styles({ variant: 'secondary' })).toBe('base secondary');
    });

    it('falls back to $default when variant value not in mapping', () => {
      const styles = ntv<{ variant?: 'a' | 'b' }>({
        variant: { $default: 'default', a: 'a-class' },
      });
      expect(styles({ variant: 'b' })).toBe('default');
    });

    it('handles undefined variant value', () => {
      const styles = ntv<{ variant?: 'primary' }>({
        variant: { $default: 'default', primary: 'primary' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(styles({ variant: undefined } as any)).toBe('default');
    });

    it('uses array class value for variant', () => {
      const styles = ntv<{ variant: 'primary' }>({
        variant: {
          primary: ['class-a', 'class-b'],
        },
      });
      expect(styles({ variant: 'primary' })).toBe('class-a class-b');
    });
  });

  describe('boolean conditions', () => {
    it('applies class when isXxx is true', () => {
      const styles = ntv<{ isDisabled: boolean }>({
        $base: 'base',
        isDisabled: 'disabled',
      });
      expect(styles({ isDisabled: true })).toBe('base disabled');
      expect(styles({ isDisabled: false })).toBe('base');
    });

    it('applies class when allowsXxx is true', () => {
      const styles = ntv<{ allowsRemoval: boolean }>({
        $base: 'base',
        allowsRemoval: 'removable',
      });
      expect(styles({ allowsRemoval: true })).toBe('base removable');
    });

    it('applies multiple boolean conditions when all are true', () => {
      const styles = ntv<{ isHovered?: boolean; isPressed?: boolean }>({
        $base: 'base',
        isHovered: 'hovered',
        isPressed: 'pressed',
      });
      expect(styles({ isHovered: true, isPressed: true })).toBe('base hovered pressed');
    });

    it('ignores falsy boolean values', () => {
      const styles = ntv<{ isDisabled?: boolean }>({
        $base: 'base',
        isDisabled: 'disabled',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(styles({ isDisabled: undefined } as any)).toBe('base');
    });

    it('uses array class value for boolean condition', () => {
      const styles = ntv<{ isDisabled: boolean }>({
        isDisabled: ['disabled-a', 'disabled-b'],
      });
      expect(styles({ isDisabled: true })).toBe('disabled-a disabled-b');
    });
  });

  describe('nested conditions', () => {
    it('resolves nested variant within variant', () => {
      const styles = ntv<{ variant?: 'primary'; size?: 'sm' | 'lg' }>({
        $base: 'base',
        variant: {
          primary: {
            $default: 'primary-default',
            size: {
              sm: 'primary-sm',
              lg: 'primary-lg',
            },
          },
        },
      });
      expect(styles({ variant: 'primary' })).toBe('base primary-default');
      expect(styles({ variant: 'primary', size: 'sm' })).toBe('base primary-default primary-sm');
    });

    it('resolves nested variant within boolean condition', () => {
      const styles = ntv<{ isSelected?: boolean; variant?: 'primary' | 'secondary' }>({
        $base: 'base',
        isSelected: {
          $default: 'selected-default',
          variant: {
            primary: 'selected-primary',
            secondary: 'selected-secondary',
          },
        },
      });
      expect(styles({ isSelected: true })).toBe('base selected-default');
      expect(styles({ isSelected: true, variant: 'primary' })).toBe(
        'base selected-default selected-primary',
      );
    });

    it('applies $base within nested conditions', () => {
      const styles = ntv<{ variant?: 'primary'; size?: 'sm' | 'lg' }>({
        $base: 'root-base',
        variant: {
          primary: {
            $base: 'variant-base',
            $default: 'variant-default',
            size: {
              sm: 'size-sm',
              lg: 'size-lg',
            },
          },
        },
      });
      expect(styles({ variant: 'primary' })).toBe('root-base variant-base variant-default');
      expect(styles({ variant: 'primary', size: 'sm' })).toBe(
        'root-base variant-base variant-default size-sm',
      );
    });

    it('handles deeply nested conditions (3 levels)', () => {
      const styles = ntv<{
        variant?: 'a';
        size?: 'sm';
        isHovered?: boolean;
      }>({
        variant: {
          a: {
            size: {
              sm: {
                $default: 'a-sm-default',
                isHovered: 'a-sm-hovered',
              },
            },
          },
        },
      });
      expect(styles({ variant: 'a', size: 'sm' })).toBe('a-sm-default');
      expect(styles({ variant: 'a', size: 'sm', isHovered: true })).toBe('a-sm-hovered');
    });
  });

  describe('class/className props', () => {
    it('appends class prop to result', () => {
      const styles = ntv({ $base: 'base' });
      expect(styles({ class: 'extra' })).toBe('base extra');
    });

    it('appends className prop to result', () => {
      const styles = ntv({ $base: 'base' });
      expect(styles({ className: 'extra' })).toBe('base extra');
    });

    it('merges conflicting tailwind classes by default', () => {
      const styles = ntv({ $base: 'p-4' });
      expect(styles({ class: 'p-8' })).toBe('p-8');
    });

    it('appends class with array value', () => {
      const styles = ntv({ $base: 'base' });
      expect(styles({ class: ['extra-a', 'extra-b'] })).toBe('base extra-a extra-b');
    });
  });

  describe('options', () => {
    describe('twMerge', () => {
      it('preserves all classes when twMerge is false', () => {
        const styles = ntv({ $base: 'p-4' }, { twMerge: false });
        expect(styles({ class: 'p-8' })).toBe('p-4 p-8');
      });
    });

    describe('twMergeConfig', () => {
      it('uses custom twMergeConfig for class resolution', () => {
        const styles = ntv(
          { $base: 'text-huge' },
          {
            twMergeConfig: {
              extend: {
                classGroups: {
                  'font-size': [{ text: ['huge'] }],
                },
              },
            },
          },
        );
        expect(styles({ class: 'text-sm' })).toBe('text-sm');
      });

      it('preserves custom classes without twMergeConfig', () => {
        const styles = ntv({ $base: 'text-huge' });
        expect(styles({ class: 'text-sm' })).toBe('text-huge text-sm');
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty scheme', () => {
      const styles = ntv({});
      expect(styles()).toBe('');
    });

    it('handles empty scheme with class prop', () => {
      const styles = ntv({});
      expect(styles({ class: 'extra' })).toBe('extra');
    });

    it('handles null class values gracefully', () => {
      const styles = ntv({ $base: 'base' });
      expect(styles({ class: null as unknown as string })).toBe('base');
    });
  });

  describe('validation errors', () => {
    it('throws when scheme contains "class"', () => {
      expect(() => ntv({ class: 'invalid' })).toThrow(
        'The "class" property is not allowed in ntv scheme',
      );
    });

    it('throws when scheme contains "className"', () => {
      expect(() => ntv({ className: 'invalid' })).toThrow(
        'The "className" property is not allowed in ntv scheme',
      );
    });

    it('throws when $default is passed as runtime value', () => {
      const styles = ntv<{ variant?: 'primary' }>({
        variant: { $default: 'default', primary: 'primary' },
      });
      expect(() => styles({ variant: '$default' as never })).toThrow(
        '"$default" is reserved for defining fallback styles and cannot be used as a value',
      );
    });
  });
});

describe('createNtv', () => {
  it('applies default options', () => {
    const myNtv = createNtv({ twMerge: false });
    const styles = myNtv({ $base: 'p-4' });
    expect(styles({ class: 'p-8' })).toBe('p-4 p-8');
  });

  it('works without arguments', () => {
    const myNtv = createNtv();
    const styles = myNtv({ $base: 'p-4' });
    expect(styles({ class: 'p-8' })).toBe('p-8');
  });

  it('applies twMergeConfig from default options', () => {
    const myNtv = createNtv({
      twMergeConfig: {
        extend: {
          classGroups: {
            'font-size': [{ text: ['huge'] }],
          },
        },
      },
    });
    const styles = myNtv({ $base: 'text-huge' });
    expect(styles({ class: 'text-sm' })).toBe('text-sm');
  });
});
