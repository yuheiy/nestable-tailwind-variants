import { createNtv } from 'nestable-tailwind-variants';
import { twMerge } from 'tailwind-merge';

export const ntv = createNtv({ twMerge });
export const button = ntv<{ tone: 'primary'; count: number; isActive?: boolean }>({
  tone: { primary: 'p-2' },
  isActive: 'p-4',
});
export const combined = ntv.combine(button, ntv({ $base: 'm-1' }));
