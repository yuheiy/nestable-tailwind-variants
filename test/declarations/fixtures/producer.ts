import { createNtv } from 'nestable-tailwind-variants';
import { twMerge } from 'tailwind-merge';

export const ntv = createNtv({ twMerge });
export const button = ntv<{ tone: 'primary'; count: number; isActive?: boolean }>({
  $default: {
    $base: 'p-1',
    $default: 'p-0',
    tone: { primary: 'p-3' },
  },
  tone: { primary: 'p-2' },
  isActive: {
    $default: {
      $default: 'p-5',
      tone: { primary: 'p-6' },
    },
  },
});
export const combined = ntv.combine(button, ntv({ $base: 'm-1' }));
