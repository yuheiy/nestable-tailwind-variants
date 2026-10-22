import {
  button,
  callableExtension,
  contextualCallbacks,
  explicitExtension,
  exclusive,
  exclusiveExtension,
  extended,
  ntv,
  openExtension,
} from './types/producer.js';

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

contextualCallbacks.className({ isHovered: true, tone: 'primary' });
// @ts-expect-error Contextual callback state survives declaration generation.
contextualCallbacks.className({ isHovered: 'invalid' });

callableExtension({ tone: 'primary', count: 1, isDisabled: true });
// @ts-expect-error The input must satisfy the narrower button base.
callableExtension({ tone: 'secondary', count: 1, isDisabled: true });
// @ts-expect-error Required ordinary function props survive declaration generation.
callableExtension({ tone: 'primary', count: 1 });

// @ts-expect-error Local widening fails before the style is called.
ntv.extend(button)<{ tone: 'primary' | 'secondary' }>({});
// @ts-expect-error Incompatible bases fail before a scheme is supplied.
ntv.extend(button, ntv<{ tone: 'secondary' }>({}));

const indexed = (props: Record<string, 'primary'>) => props['tone'] ?? '';
// @ts-expect-error Index signatures constrain local declarations before any call.
ntv.extend(indexed)<{ tone?: 'primary' | 'secondary' }>({});
// @ts-expect-error Local index signatures cannot widen a named base property.
ntv.extend(ntv<{ tone?: 'primary' }>({}))<Record<string, 'primary' | 'secondary'>>({});
const numeric = (props: Record<number, number>) => String(props[0]);
// @ts-expect-error Required numeric keys must satisfy the base index signature.
ntv.extend(numeric, (props: { 0: string }) => props[0]);
const key = Symbol('key');
const symbolic = (props: Record<symbol, number>) => String(props[key]);
// @ts-expect-error Required symbol keys must satisfy the base index signature.
ntv.extend(symbolic, (props: { [key]: string }) => props[key]);

exclusive({ isPending: true });
exclusiveExtension({ tone: 'primary' });
// @ts-expect-error Union members remain exclusive in emitted declarations.
exclusive({ isPending: true, tone: 'primary' });
// @ts-expect-error Extensions preserve the base union's exclusions.
exclusiveExtension({ isPending: true, tone: 'primary' });

openExtension({ tone: 'primary', isDisabled: true });
ntv.extend(openExtension)({ tone: { primary: 'repeated' } });
// @ts-expect-error Known props stay checked beside open scheme keys.
openExtension({ isDisabled: 'invalid' });
