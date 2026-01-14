import { describe, expect, it } from 'vitest';
import { composeNtv, createComposeNtv } from '../src/composeNtv';
import { ntv } from '../src/ntv';

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
