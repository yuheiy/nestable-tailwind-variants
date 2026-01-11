import { describe, it, expect } from 'vitest';
import { ntv, createNTV, composeNtv, createComposeNtv } from '../src/ntv';

describe('ntv', () => {
  describe('basic functionality', () => {
    it('should return a function', () => {
      const button = ntv<{ variant?: 'primary' }>({
        default: 'base',
      });
      expect(typeof button).toBe('function');
    });

    it('should apply default styles when no props provided', () => {
      const button = ntv<{ variant?: 'primary' }>({
        default: 'bg-gray-100 border',
      });
      expect(button({})).toBe('bg-gray-100 border');
    });

    it('should apply variant styles', () => {
      const button = ntv<{ variant?: 'primary' | 'secondary' }>({
        default: 'border',
        variant: {
          primary: 'bg-blue-500',
          secondary: 'bg-gray-500',
        },
      });
      expect(button({ variant: 'primary' })).toContain('bg-blue-500');
      expect(button({ variant: 'secondary' })).toContain('bg-gray-500');
    });

    it('should skip default when variant matches', () => {
      const button = ntv<{ variant?: 'primary' }>({
        default: 'bg-gray-100',
        variant: {
          primary: 'bg-blue-500',
        },
      });
      const result = button({ variant: 'primary' });
      expect(result).not.toContain('bg-gray-100');
      expect(result).toContain('bg-blue-500');
    });
  });

  describe('boolean conditions', () => {
    it('should handle is* conditions', () => {
      const button = ntv<{ isDisabled?: boolean }>({
        default: 'bg-blue-500',
        isDisabled: 'opacity-50',
      });
      expect(button({ isDisabled: true })).toContain('opacity-50');
      expect(button({ isDisabled: false })).not.toContain('opacity-50');
    });

    it('should handle allows* conditions', () => {
      const table = ntv<{ allowsSelection?: boolean }>({
        default: 'table-auto',
        allowsSelection: 'cursor-pointer',
      });
      expect(table({ allowsSelection: true })).toContain('cursor-pointer');
    });

    it('should handle multiple boolean conditions', () => {
      const button = ntv<{ isDisabled?: boolean; isLoading?: boolean }>({
        isDisabled: 'opacity-50',
        isLoading: 'animate-pulse',
      });
      const result = button({ isDisabled: true, isLoading: true });
      expect(result).toContain('opacity-50');
      expect(result).toContain('animate-pulse');
    });

    it('should skip default when boolean condition matches', () => {
      const button = ntv<{ isDisabled?: boolean }>({
        default: 'bg-blue-500',
        isDisabled: 'bg-gray-300',
      });
      const result = button({ isDisabled: true });
      expect(result).not.toContain('bg-blue-500');
      expect(result).toContain('bg-gray-300');
    });
  });

  describe('nested conditions', () => {
    it('should handle nested variant definitions', () => {
      const button = ntv<{ variant?: 'primary'; size?: 'sm' | 'lg' }>({
        variant: {
          primary: {
            default: 'bg-blue-500',
            size: {
              sm: 'text-sm',
              lg: 'text-lg',
            },
          },
        },
      });
      const result = button({ variant: 'primary', size: 'sm' });
      expect(result).toContain('text-sm');
    });

    it('should handle nested boolean in variant', () => {
      const card = ntv<{ variant?: 'elevated'; isHovered?: boolean }>({
        variant: {
          elevated: {
            default: 'shadow-md',
            isHovered: 'shadow-lg',
          },
        },
      });
      expect(card({ variant: 'elevated', isHovered: true })).toContain('shadow-lg');
      expect(card({ variant: 'elevated', isHovered: false })).toContain('shadow-md');
    });

    it('should handle deeply nested conditions', () => {
      const styles = ntv<{
        isSelected?: boolean;
        isEmphasized?: boolean;
        isDisabled?: boolean;
        isSpecial?: boolean;
      }>({
        default: 'bg-gray-25',
        isSelected: {
          default: 'bg-neutral',
          isEmphasized: 'bg-accent',
          isSpecial: 'bg-[Highlight]',
          isDisabled: {
            default: 'bg-gray-400',
            isSpecial: 'bg-[GrayText]',
          },
        },
      });

      expect(styles({})).toBe('bg-gray-25');
      expect(styles({ isSelected: true })).toBe('bg-neutral');
      expect(styles({ isSelected: true, isEmphasized: true })).toBe('bg-accent');
      expect(styles({ isSelected: true, isSpecial: true })).toBe('bg-[Highlight]');
      expect(styles({ isSelected: true, isDisabled: true })).toBe('bg-gray-400');
      expect(styles({ isSelected: true, isDisabled: true, isSpecial: true })).toBe('bg-[GrayText]');
    });
  });

  describe('priority handling', () => {
    it('should apply both top-level and nested conditions when both match', () => {
      const card = ntv<{ variant?: 'elevated'; isHovered?: boolean }>({
        isHovered: 'scale-105',
        variant: {
          elevated: {
            isHovered: 'shadow-xl',
          },
        },
      });
      const result = card({ variant: 'elevated', isHovered: true });
      // Both conditions apply since they are at different levels
      expect(result).toContain('shadow-xl');
      expect(result).toContain('scale-105');
    });

    it('should resolve conflicting classes via tailwind-merge', () => {
      const button = ntv<{ isActive?: boolean }>({
        default: 'bg-gray-100',
        isActive: 'bg-blue-500',
      });
      const result = button({ isActive: true });
      // tailwind-merge resolves the conflict, keeping the later class
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('bg-gray-100');
    });
  });

  describe('tailwind-merge integration', () => {
    it('should resolve conflicting classes', () => {
      const button = ntv<{ variant?: 'primary' }>({
        default: 'bg-gray-100 p-4',
        variant: {
          primary: 'bg-blue-500',
        },
      });
      const result = button({ variant: 'primary' });
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('bg-gray-100');
      expect(result).toContain('p-4');
    });

    it('should work with custom twMergeConfig', () => {
      // Create ntv with custom config that adds a custom class group
      const customNTV = createNTV({
        twMergeConfig: {
          extend: {
            classGroups: {
              'custom-group': ['custom-a', 'custom-b'],
            },
          },
        },
      });
      const button = customNTV<{ variant?: 'primary' }>({
        default: 'custom-a',
        variant: {
          primary: 'custom-b',
        },
      });
      const result = button({ variant: 'primary' });
      // With custom config, custom-a and custom-b are in the same group
      // so custom-b should override custom-a
      expect(result).toBe('custom-b');
    });

    it('should disable tailwind-merge when twMerge is false', () => {
      const ntvNoMerge = createNTV({ twMerge: false });
      const button = ntvNoMerge<{ variant?: 'primary' }>({
        default: 'bg-gray-100 p-4',
        variant: {
          primary: 'bg-blue-500',
        },
      });
      const result = button({ variant: 'primary' });
      // With twMerge: false, conflicting classes are NOT resolved
      // Both bg-gray-100 and bg-blue-500 are present
      expect(result).toBe('bg-gray-100 p-4 bg-blue-500');
    });
  });
});

describe('createNTV', () => {
  it('should create ntv with custom options', () => {
    const customNTV = createNTV({
      twMergeConfig: {
        cacheSize: 100,
      },
    });
    expect(typeof customNTV).toBe('function');
  });

  it('should accept twMergeConfig with extend option', () => {
    const customNTV = createNTV({
      twMergeConfig: {
        extend: {
          classGroups: {
            'my-group': ['my-class-a', 'my-class-b'],
          },
        },
      },
    });
    const button = customNTV<{ isActive?: boolean }>({
      default: 'my-class-a',
      isActive: 'my-class-b',
    });
    // my-class-a and my-class-b are in the same group, so my-class-b wins
    expect(button({ isActive: true })).toBe('my-class-b');
  });
});

describe('composeNtv', () => {
  it('should compose multiple style functions', () => {
    const baseButton = ntv<{ size?: 'sm' | 'lg' }>({
      default: 'rounded font-medium',
      size: {
        sm: 'px-2 py-1 text-sm',
        lg: 'px-4 py-2 text-lg',
      },
    });

    const coloredButton = ntv<{ variant?: 'primary' | 'secondary' }>({
      variant: {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-200 text-gray-800',
      },
    });

    const button = composeNtv(baseButton, coloredButton);

    expect(button({ size: 'lg', variant: 'primary' })).toBe(
      'rounded font-medium px-4 py-2 text-lg bg-blue-500 text-white',
    );
  });

  it('should resolve class conflicts between composed functions', () => {
    const base = ntv<{ isActive?: boolean }>({
      default: 'bg-gray-100',
    });

    const overlay = ntv<{ isActive?: boolean }>({
      isActive: 'bg-blue-500',
    });

    const combined = composeNtv(base, overlay);

    expect(combined({ isActive: true })).toBe('bg-blue-500');
  });

  it('should work with empty props', () => {
    const base = ntv<{ size?: 'sm' }>({
      default: 'p-4',
    });

    const extra = ntv<{ size?: 'sm' }>({
      default: 'm-4',
    });

    const combined = composeNtv(base, extra);

    expect(combined({})).toBe('p-4 m-4');
  });
});

describe('createComposeNtv', () => {
  it('should create composeNtv with custom options', () => {
    const customComposeNtv = createComposeNtv({
      twMergeConfig: {
        cacheSize: 100,
      },
    });
    expect(typeof customComposeNtv).toBe('function');
  });

  it('should work with custom twMergeConfig', () => {
    const customComposeNtv = createComposeNtv({
      twMergeConfig: {
        extend: {
          classGroups: {
            'custom-group': ['custom-a', 'custom-b'],
          },
        },
      },
    });

    const base = ntv<{ isActive?: boolean }>({
      default: 'custom-a',
    });

    const overlay = ntv<{ isActive?: boolean }>({
      isActive: 'custom-b',
    });

    const combined = customComposeNtv(base, overlay);

    // custom-a and custom-b are in the same group, so custom-b wins
    expect(combined({ isActive: true })).toBe('custom-b');
  });

  it('should disable tailwind-merge when twMerge is false', () => {
    const composeNtvNoMerge = createComposeNtv({ twMerge: false });

    const base = ntv<{ isActive?: boolean }>({
      default: 'bg-gray-100',
    });

    const overlay = ntv<{ isActive?: boolean }>({
      isActive: 'bg-blue-500',
    });

    const combined = composeNtvNoMerge(base, overlay);

    // With twMerge: false, conflicting classes are NOT resolved
    expect(combined({ isActive: true })).toBe('bg-gray-100 bg-blue-500');
  });

  it('should compose multiple style functions with custom config', () => {
    const customComposeNtv = createComposeNtv({
      twMergeConfig: {
        extend: {
          classGroups: {
            'my-group': ['my-a', 'my-b', 'my-c'],
          },
        },
      },
    });

    const first = ntv<{ size?: 'sm' }>({
      default: 'my-a',
    });

    const second = ntv<{ size?: 'sm' }>({
      default: 'my-b',
    });

    const third = ntv<{ size?: 'sm' }>({
      default: 'my-c',
    });

    const combined = customComposeNtv(first, second, third);

    // All three are in the same group, so my-c wins
    expect(combined({})).toBe('my-c');
  });
});
