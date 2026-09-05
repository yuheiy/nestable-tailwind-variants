# nestable-tailwind-variants

Define Tailwind CSS variants with nested conditions. Keep related states together, such as a button’s hover and pressed styles inside its primary variant.

Inspired by [React Spectrum’s conditional styles](https://react-spectrum.adobe.com/styling#conditional-styles) and [Tailwind Variants](https://www.tailwind-variants.org/).

## Get started

Install the package and your class merger:

```bash
npm install nestable-tailwind-variants tailwind-merge
```

Create an `ntv` instance with your class merger:

```ts
import { createNtv } from 'nestable-tailwind-variants';
import { twMerge } from 'tailwind-merge';

const ntv = createNtv({ twMerge });

interface ButtonProps {
  variant: 'primary' | 'secondary';
  isHovered?: boolean;
  isPressed?: boolean;
}

const button = ntv<ButtonProps>({
  $base: 'rounded px-4 py-2',
  variant: {
    primary: {
      $base: 'text-white',
      $default: 'bg-blue-500',
      isHovered: 'bg-blue-600',
      isPressed: 'bg-blue-700',
    },
    secondary: {
      $base: 'text-gray-800',
      $default: 'bg-gray-200',
      isHovered: 'bg-gray-300',
    },
  },
});

button({ variant: 'primary' });
// => 'rounded px-4 py-2 text-white bg-blue-500'

button({ variant: 'primary', isHovered: true, isPressed: true });
// => 'rounded px-4 py-2 text-white bg-blue-700'
```

Export the configured `ntv` from a shared module and import it wherever you define styles.

## Define conditions and defaults

### Conditions

Boolean condition names start with `is` or `allows`, followed by an uppercase letter, such as `isDisabled` or `allowsRemoval`. They apply their classes or nested conditions when the prop is `true`.

Other names define string variants. Each entry maps a prop value to classes or nested conditions, as `variant.primary` does in the first example.

Conditions can be nested to any depth. All matching conditions contribute classes in definition order. With `twMerge`, later conflicting classes replace earlier ones.

### Defaults and fallbacks

At each level, `$base` always applies. Use `$default` for classes that apply when no boolean condition at that level matches:

```ts
const panel = ntv<{ isSelected?: boolean }>({
  $base: 'rounded',
  $default: 'border',
  isSelected: 'ring-2',
});

panel();
// => 'rounded border'

panel({ isSelected: true });
// => 'rounded ring-2'
```

Inside a string variant map, `$default` supplies classes or nested conditions when the prop is missing or has no matching entry:

```ts
const badge = ntv<{ tone?: 'info' | 'quiet' }>({
  tone: {
    $default: 'bg-gray-100',
    info: 'bg-blue-100',
  },
});

badge();
// => 'bg-gray-100'

badge({ tone: 'info' });
// => 'bg-blue-100'

badge({ tone: 'quiet' });
// => 'bg-gray-100'
```

Selecting a string variant does not suppress the surrounding level’s `$default`. Each nested level evaluates its own default independently.

## Type props

Pass a props type to check condition names, variant values, and calls. Optional props allow a call without arguments. Required props require an argument with those props:

```ts
const optional = ntv<{ size?: 'sm' | 'lg' }>({
  size: { sm: 'text-sm', lg: 'text-lg' },
});
optional();
optional({ size: 'lg' });

const required = ntv<{ size: 'sm' | 'lg' }>({
  size: { sm: 'text-sm', lg: 'text-lg' },
});
required({ size: 'sm' });

// @ts-expect-error Missing required size.
required();
// @ts-expect-error Unknown variant value.
required({ size: 'xl' });
```

## Override classes

Pass either `class` or `className` to override individual classes:

```ts
const box = ntv({ $base: 'rounded p-4' });

box({ class: 'p-8' });
// => 'rounded p-8'

box({ className: ['shadow-lg', false, ['p-2']] });
// => 'rounded shadow-lg p-2'
```

## Combine styles

Use `ntv.combine` to combine existing styles:

```ts
const spacing = ntv<{ size: 'sm' | 'md' }>({
  $base: 'rounded p-2',
  size: {
    sm: 'text-sm',
    md: 'text-base',
  },
});

const color = ntv<{ tone?: 'primary' }>({
  $base: 'p-4',
  tone: { primary: 'bg-blue-500' },
});

const button = ntv.combine(spacing, color);

button({ size: 'sm', tone: 'primary' });
// => 'rounded text-sm p-4 bg-blue-500'

button({ size: 'sm', className: 'p-8' });
// => 'rounded text-sm p-8'
```

With `twMerge`, styles listed later take precedence. Pass `class` or `className` to override the result.

Required props remain required after combining.

## Configure the merger

The package has no runtime dependency on a merger. Pass the merger you want to use to `createNtv`.

### Use `cn`

Install `cn` alongside this package:

```bash
npm install nestable-tailwind-variants cn
```

Pass `twMerge` to `createNtv`:

```ts
import { twMerge } from 'cn';
import { createNtv } from 'nestable-tailwind-variants';

const ntv = createNtv({ twMerge });
const box = ntv({ $base: 'p-4' });

box({ class: 'p-8' });
// => 'p-8'
```

### Configure custom Tailwind classes

Configure the merger before passing it to `createNtv`. For example, register `text-huge` as a font-size utility:

```ts
import { createNtv } from 'nestable-tailwind-variants';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['huge'] }],
    },
  },
});

const ntv = createNtv({ twMerge });
const heading = ntv({ $base: 'text-huge' });

heading({ class: 'text-sm' });
// => 'text-sm'
```

## License

MIT
