import { button, combined, ntv } from './types/producer.js';

button({ tone: 'primary', count: 1 });
combined({ tone: 'primary', count: 1, className: 'p-8' });
ntv.combine(button, combined)({ tone: 'primary', count: 1 });

// @ts-expect-error Required non-style props survive declaration generation.
combined({ tone: 'primary' });
// @ts-expect-error Variant values remain constrained in the generated declarations.
button({ tone: 'secondary', count: 1 });
// @ts-expect-error The class overrides remain mutually exclusive.
combined({ tone: 'primary', count: 1, class: 'p-2', className: 'p-4' });

ntv<{ tone?: 'primary'; isActive?: boolean }>({
  tone: {
    primary: {
      isActive: {
        tone: {
          // @ts-expect-error Recursive schemes retain their types after declaration generation.
          secondary: 'p-4',
        },
      },
    },
  },
});
