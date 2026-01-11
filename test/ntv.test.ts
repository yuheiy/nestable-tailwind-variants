import { describe, it, expect } from 'vitest';
import { ntv, createNTV, composeNtv, createComposeNtv } from '../src/ntv';

describe('ntv', () => {
  it('returns default styles when no props provided', () => {
    const button = ntv<{ variant?: 'primary' }>({
      default: 'px-4 py-2 rounded',
    });
    expect(button({})).toBe('px-4 py-2 rounded');
  });

  it('applies variant styles', () => {
    const button = ntv<{ variant?: 'primary' | 'secondary' }>({
      default: 'rounded',
      variant: {
        primary: 'bg-blue-500',
        secondary: 'bg-gray-500',
      },
    });
    expect(button({ variant: 'primary' })).toBe('rounded bg-blue-500');
    expect(button({ variant: 'secondary' })).toBe('rounded bg-gray-500');
  });

  it('skips default when variant matches at same level', () => {
    const button = ntv<{ variant?: 'primary' }>({
      default: 'bg-gray-100',
      variant: {
        primary: 'bg-blue-500',
      },
    });
    expect(button({ variant: 'primary' })).toBe('bg-blue-500');
  });

  it('handles is* boolean conditions', () => {
    const button = ntv<{ isDisabled?: boolean }>({
      default: 'bg-blue-500',
      isDisabled: 'bg-gray-300 cursor-not-allowed',
    });
    expect(button({ isDisabled: true })).toBe('bg-gray-300 cursor-not-allowed');
    expect(button({ isDisabled: false })).toBe('bg-blue-500');
  });

  it('handles allows* boolean conditions', () => {
    const table = ntv<{ allowsSelection?: boolean }>({
      default: 'table-auto',
      allowsSelection: 'cursor-pointer',
    });
    expect(table({ allowsSelection: true })).toBe('table-auto cursor-pointer');
  });

  it('handles nested conditions within variants', () => {
    const card = ntv<{ variant?: 'elevated'; isHovered?: boolean }>({
      variant: {
        elevated: {
          default: 'shadow-md',
          isHovered: 'shadow-lg',
        },
      },
    });
    expect(card({ variant: 'elevated' })).toBe('shadow-md');
    expect(card({ variant: 'elevated', isHovered: true })).toBe('shadow-lg');
  });

  it('handles deeply nested conditions', () => {
    const styles = ntv<{
      isSelected?: boolean;
      isEmphasized?: boolean;
      isDisabled?: boolean;
    }>({
      default: 'bg-gray-100',
      isSelected: {
        default: 'bg-neutral',
        isEmphasized: 'bg-accent',
        isDisabled: 'bg-gray-400',
      },
    });

    expect(styles({})).toBe('bg-gray-100');
    expect(styles({ isSelected: true })).toBe('bg-neutral');
    expect(styles({ isSelected: true, isEmphasized: true })).toBe('bg-accent');
    expect(styles({ isSelected: true, isDisabled: true })).toBe('bg-gray-400');
  });

  it('applies conditions from multiple levels', () => {
    const card = ntv<{ variant?: 'elevated'; isHovered?: boolean }>({
      isHovered: 'scale-105',
      variant: {
        elevated: {
          isHovered: 'shadow-xl',
        },
      },
    });
    const result = card({ variant: 'elevated', isHovered: true });
    expect(result).toContain('shadow-xl');
    expect(result).toContain('scale-105');
  });

  it('resolves conflicting classes via tailwind-merge', () => {
    const button = ntv<{ isActive?: boolean }>({
      default: 'bg-gray-100 p-4',
      isActive: 'bg-blue-500',
    });
    expect(button({ isActive: true })).toBe('p-4 bg-blue-500');
  });
});

describe('createNTV', () => {
  it('disables tailwind-merge when twMerge is false', () => {
    const ntvNoMerge = createNTV({ twMerge: false });
    const button = ntvNoMerge<{ isActive?: boolean }>({
      default: 'bg-gray-100',
      isActive: 'bg-blue-500',
    });
    expect(button({ isActive: true })).toBe('bg-gray-100 bg-blue-500');
  });

  it('uses custom twMergeConfig', () => {
    const customNTV = createNTV({
      twMergeConfig: {
        extend: {
          classGroups: {
            'custom-group': ['custom-a', 'custom-b'],
          },
        },
      },
    });
    const button = customNTV<{ isActive?: boolean }>({
      default: 'custom-a',
      isActive: 'custom-b',
    });
    expect(button({ isActive: true })).toBe('custom-b');
  });
});

describe('composeNtv', () => {
  it('composes multiple style functions', () => {
    const base = ntv<{ size?: 'sm' | 'lg' }>({
      default: 'rounded',
      size: { sm: 'text-sm', lg: 'text-lg' },
    });
    const colors = ntv<{ variant?: 'primary' }>({
      variant: { primary: 'bg-blue-500' },
    });

    const button = composeNtv(base, colors);
    expect(button({ size: 'lg', variant: 'primary' })).toBe('rounded text-lg bg-blue-500');
  });

  it('resolves class conflicts between composed functions', () => {
    const base = ntv<{ isActive?: boolean }>({ default: 'bg-gray-100' });
    const overlay = ntv<{ isActive?: boolean }>({ isActive: 'bg-blue-500' });

    const combined = composeNtv(base, overlay);
    expect(combined({ isActive: true })).toBe('bg-blue-500');
  });
});

describe('createComposeNtv', () => {
  it('disables tailwind-merge when twMerge is false', () => {
    const composeNtvNoMerge = createComposeNtv({ twMerge: false });

    const base = ntv<{ isActive?: boolean }>({ default: 'bg-gray-100' });
    const overlay = ntv<{ isActive?: boolean }>({ isActive: 'bg-blue-500' });

    const combined = composeNtvNoMerge(base, overlay);
    expect(combined({ isActive: true })).toBe('bg-gray-100 bg-blue-500');
  });

  it('uses custom twMergeConfig', () => {
    const customComposeNtv = createComposeNtv({
      twMergeConfig: {
        extend: {
          classGroups: {
            'custom-group': ['custom-a', 'custom-b'],
          },
        },
      },
    });

    const base = ntv<{ isActive?: boolean }>({ default: 'custom-a' });
    const overlay = ntv<{ isActive?: boolean }>({ isActive: 'custom-b' });

    const combined = customComposeNtv(base, overlay);
    expect(combined({ isActive: true })).toBe('custom-b');
  });
});
