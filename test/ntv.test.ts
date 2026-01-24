import { describe, expect, it } from 'vitest';
import { createNtv, ntv } from '../src/index.js';

describe('ntv', () => {
  describe('basic', () => {
    it('returns $base when no conditions defined', () => {
      const styles = ntv({ $base: 'base-class' });
      expect(styles()).toBe('base-class');
    });

    it('returns $default when no conditions match', () => {
      const styles = ntv<{ variant?: 'primary' }>({
        $default: 'default-class',
        variant: { primary: 'primary-class' },
      });
      expect(styles()).toBe('default-class');
      expect(styles({ variant: 'primary' })).toBe('primary-class');
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
      expect(styles({ variant: 'primary', size: 'sm' })).toBe('base primary-sm');
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
      expect(styles({ isSelected: true, variant: 'primary' })).toBe('base selected-primary');
    });
  });

  describe('nested $base', () => {
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
      expect(styles({ variant: 'primary', size: 'sm' })).toBe('root-base variant-base size-sm');
    });
  });

  describe('nested $default', () => {
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

  describe('$default accumulation', () => {
    it('accumulates $defaults based on matched conditions', () => {
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
      expect(styles({ variant: 'primary' })).toBe('base size-default');
      expect(styles({ variant: 'primary', size: 'large' })).toBe('base size-large');
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
  });

  describe('twMerge option', () => {
    it('preserves all classes when twMerge is false', () => {
      const styles = ntv({ $base: 'p-4' }, { twMerge: false });
      expect(styles({ class: 'p-8' })).toBe('p-4 p-8');
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
});
