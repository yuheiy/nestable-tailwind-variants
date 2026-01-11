# nestable-tailwind-variants

A variant styling library for Tailwind CSS that expresses complex style combinations through nested condition definitions instead of flat `compoundVariants` patterns.

Inspired by [React Spectrum's `style` macro](https://react-spectrum.adobe.com/styling), with some ideas from [tailwind-variants](https://www.tailwind-variants.org/).

## Installation

```bash
npm install nestable-tailwind-variants
```

## Basic Usage

Define variants with string union types:

```tsx
import { ntv } from 'nestable-tailwind-variants';

const button = ntv<{ variant?: 'primary' | 'secondary' }>({
  default: 'px-4 py-2 rounded font-medium',
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
  },
});

button({ variant: 'primary' });
// => 'px-4 py-2 rounded font-medium bg-blue-500 text-white'
```

Boolean conditions starting with `is` or `allows` can be used directly:

```tsx
const button = ntv<{ isDisabled?: boolean }>({
  default: 'bg-blue-500',
  isDisabled: 'bg-gray-300 cursor-not-allowed',
});

button({ isDisabled: true });
// => 'bg-gray-300 cursor-not-allowed'
```

Since `ntv` returns a function, it works directly with [React Aria Components](https://react-aria.adobe.com/)' render props:

```tsx
import { Checkbox, type CheckboxRenderProps } from 'react-aria-components';
import { ntv } from 'nestable-tailwind-variants';

<Checkbox
  className={ntv<CheckboxRenderProps>({
    default: 'bg-gray-100',
    isHovered: 'bg-gray-200',
    isSelected: 'bg-gray-900',
  })}
/>;
```

## Why Nested?

With tailwind-variants, compound conditions require `compoundVariants`:

**tailwind-variants:**

```tsx
const button = tv({
  base: 'rounded font-medium',
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-800',
    },
    isHovered: { true: '' },
    isPressed: { true: '' },
  },
  compoundVariants: [
    { variant: 'primary', isHovered: true, class: 'bg-blue-600' },
    { variant: 'primary', isPressed: true, class: 'bg-blue-700' },
    { variant: 'secondary', isHovered: true, class: 'bg-gray-300' },
    { variant: 'secondary', isPressed: true, class: 'bg-gray-400' },
  ],
});
```

**nestable-tailwind-variants:**

```tsx
interface ButtonStyleProps {
  variant?: 'primary' | 'secondary';
  isHovered?: boolean;
  isPressed?: boolean;
}

const button = ntv<ButtonStyleProps>({
  default: 'rounded font-medium',
  variant: {
    primary: {
      default: 'bg-blue-500 text-white',
      isHovered: 'bg-blue-600',
      isPressed: 'bg-blue-700',
    },
    secondary: {
      default: 'bg-gray-200 text-gray-800',
      isHovered: 'bg-gray-300',
      isPressed: 'bg-gray-400',
    },
  },
});
```

Nesting groups related styles together, reflecting the logical hierarchy of conditions in your code.

## Guide

### Class Conflict Resolution

Class conflicts are automatically resolved by [tailwind-merge](https://github.com/dcastil/tailwind-merge):

```tsx
const button = ntv<{ isActive?: boolean }>({
  default: 'bg-gray-100 p-4',
  isActive: 'bg-blue-500',
});

button({ isActive: true });
// => 'p-4 bg-blue-500'
```

When `isActive` is true, `bg-gray-100` is automatically replaced by `bg-blue-500`.

### Nested Conditions

Nest conditions to define styles that apply when multiple conditions are true:

```tsx
interface CardStyleProps {
  variant?: 'elevated';
  isHovered?: boolean;
}

const card = ntv<CardStyleProps>({
  variant: {
    elevated: {
      default: 'shadow-md',
      isHovered: 'shadow-xl',
    },
  },
});

card({ variant: 'elevated' });
// => 'shadow-md'

card({ variant: 'elevated', isHovered: true });
// => 'shadow-xl'
```

### Composing Styles

Combine multiple style functions using `composeNtv`:

```tsx
import { ntv, composeNtv } from 'nestable-tailwind-variants';

const baseButton = ntv<{ size?: 'sm' | 'lg' }>({
  default: 'rounded font-medium',
  size: {
    sm: 'px-2 py-1 text-sm',
    lg: 'px-4 py-2 text-lg',
  },
});

const coloredButton = ntv<{ variant?: 'primary' | 'secondary' }>({
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
  },
});

const button = composeNtv(baseButton, coloredButton);

button({ size: 'lg', variant: 'primary' });
// => 'rounded font-medium px-4 py-2 text-lg bg-blue-500 text-white'
```

## API

### `ntv<Props>(style)`

Creates a style function from a nested style definition.

- `style` - Style definition object
  - `default` - Base styles (skipped when other conditions match at the same level)
  - `[variantKey]` - Style definitions for each variant value
  - `is*` / `allows*` - Boolean condition styles
- Returns `(props: Partial<Props>) => string`

### `composeNtv(...fns)`

Composes multiple style functions into a single function.

- `fns` - Style functions to compose
- Returns `(props: Partial<Props>) => string`

### `createNTV(options)`

Creates a customized `ntv` function.

- `options.twMerge` (`boolean`, default: `true`) - Enable tailwind-merge
- `options.twMergeConfig` (`object`) - Custom tailwind-merge configuration
- Returns customized `ntv` function

```tsx
const ntvNoMerge = createNTV({ twMerge: false });

const customNTV = createNTV({
  twMergeConfig: {
    extend: {
      theme: {
        shadow: ['100', '200', '300'],
      },
    },
  },
});
```

### `createComposeNtv(options)`

Creates a customized `composeNtv` function.

- `options.twMerge` (`boolean`, default: `true`) - Enable tailwind-merge
- `options.twMergeConfig` (`object`) - Custom tailwind-merge configuration
- Returns customized `composeNtv` function

```tsx
const composeNtvNoMerge = createComposeNtv({ twMerge: false });

const customComposeNtv = createComposeNtv({
  twMergeConfig: {
    extend: {
      theme: {
        shadow: ['100', '200', '300'],
      },
    },
  },
});
```

## ESLint Configuration

To lint Tailwind classes inside `ntv` calls with [eslint-plugin-better-tailwindcss](https://github.com/schoero/eslint-plugin-better-tailwindcss), add the following to your ESLint configuration:

```jsonc
{
  "settings": {
    "better-tailwindcss": {
      "callees": [["ntv", [{ "match": "objectValues" }]]],
    },
  },
}
```
