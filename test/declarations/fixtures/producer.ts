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
export const extended = ntv.extend(button, ntv({ $base: 'm-1' }))({});

export const explicitExtension = ntv.extend(button)<{ size: 'sm' | 'lg' }>({
  size: { sm: { isActive: 'font-bold' } },
});

export const contextualCallbacks = {
  className: ntv.extend(ntv<{ tone?: 'primary' }>({}))({
    tone: { primary: { isHovered: 'bg-blue-600' } },
    $default: { isHovered: 'bg-blue-500' },
  }),
} satisfies { className: (state: { isHovered: boolean }) => string };

export const callableExtension = ntv.extend(
  button,
  (props: { tone: 'primary' | 'secondary'; isDisabled: boolean }) =>
    props.isDisabled ? 'cursor-not-allowed' : '',
)({ isDisabled: 'opacity-50' });

export const exclusive = ntv<{ isPending: boolean } | { tone: 'primary' }>({});
export const exclusiveExtension = ntv.extend(exclusive)({});

export const openExtension = ntv.extend(ntv({ tone: { primary: 'base' } }))<{
  isDisabled?: boolean;
}>({
  tone: { primary: 'extended' },
  isDisabled: { $default: { tone: { primary: 'disabled' } } },
});
