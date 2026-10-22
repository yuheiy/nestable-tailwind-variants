import { button, explicitExtension, extended, ntv } from './types/producer.js';

button({ tone: 'primary', count: 1 });
extended({ tone: 'primary', count: 1, className: 'p-8' });
ntv.extend(button, extended)({})({ tone: 'primary', count: 1 });

// @ts-expect-error Required non-style props survive declaration generation.
extended({ tone: 'primary' });
// @ts-expect-error Variant values remain constrained in the generated declarations.
button({ tone: 'secondary', count: 1 });
// @ts-expect-error The class overrides remain mutually exclusive.
extended({ tone: 'primary', count: 1, class: 'p-2', className: 'p-4' });

ntv<{ tone?: 'primary'; isActive?: boolean }>({
  $default: {
    tone: {
      $default: {
        isActive: {
          $default: {
            tone: {
              // @ts-expect-error Recursive schemes retain their types after declaration generation.
              secondary: 'p-4',
            },
          },
        },
      },
    },
  },
});

explicitExtension({ tone: 'primary', count: 1, size: 'sm' });
// @ts-expect-error Extension required props survive declaration generation.
explicitExtension({ tone: 'primary', count: 1 });

// @ts-expect-error The typed builder has no untyped fallback in declarations.
ntv.extend(button)({ isActve: 'invalid' });
