import { twMerge as cnMerge } from 'cn';
import { extendTailwindMerge, twMerge } from 'tailwind-merge';
import { expect, it } from 'vitest';

import { createNtv } from '../src/index.js';

const mergers = {
  'tailwind-merge': twMerge,
  'cn.twMerge': cnMerge,
} satisfies Record<string, Parameters<typeof createNtv>[0]['twMerge']>;

it.each(Object.entries(mergers))('resolves conflicts with %s', (_name, mergeClasses) => {
  const ntv = createNtv({ twMerge: mergeClasses });

  const button = ntv<{ isPressed?: boolean }>({
    $base: ['p-2', ['m-1', false, null, undefined, 0, 0n]] as const,
    $default: 'bg-blue-500',
    isPressed: ['p-4', 'bg-blue-700'],
  });
  const size = ntv<{ size?: 'lg' }>({
    size: { lg: ['p-6 text-sm', ['hover:p-2', 'hover:p-4']] },
  });
  const combined = ntv.combine(button, size);
  expect(button()).toBe('p-2 m-1 bg-blue-500');
  expect(button({ isPressed: true, className: 'p-8' })).toBe('m-1 bg-blue-700 p-8');
  expect(combined({ isPressed: true, size: 'lg', class: ['p-8', [false, 'text-lg']] })).toBe(
    'm-1 bg-blue-700 hover:p-4 p-8 text-lg',
  );
});

it('delegates custom conflict rules to the configured merger', () => {
  const ntv = createNtv({
    twMerge: extendTailwindMerge({
      extend: { classGroups: { 'font-size': [{ text: ['huge'] }] } },
    }),
  });
  const normal = createNtv({ twMerge });
  const huge = ntv({ $base: 'text-huge' });
  expect(huge({ class: 'text-sm' })).toBe('text-sm');
  expect(ntv.combine(huge, ntv({ $base: 'text-sm' }))()).toBe('text-sm');
  expect(normal({ $base: 'text-huge' })({ class: 'text-sm' })).toBe('text-huge text-sm');
});
