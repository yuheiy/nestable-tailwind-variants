# nestable-tailwind-variants

A variant styling library for Tailwind CSS that expresses complex style combinations through nested condition definitions instead of flat `compoundVariants` patterns.

Inspired by [React Spectrum's conditional styles](https://react-spectrum.adobe.com/styling#conditional-styles), with some ideas from [tailwind-variants](https://www.tailwind-variants.org/).

## Installation

```bash
npm install nestable-tailwind-variants
```

## Basic Usage

The `ntv` function creates a style function from a nested style definition. Conditions can be nested to express compound states like "primary variant when hovered":

```tsx
import { ntv } from 'nestable-tailwind-variants';

interface ButtonStyleProps {
  variant?: 'primary' | 'secondary';
  isHovered?: boolean;
}

const button = ntv<ButtonStyleProps>({
  default: 'px-4 py-2 rounded font-medium',
  variant: {
    primary: {
      default: 'bg-blue-500 text-white',
      isHovered: 'bg-blue-600',
    },
    secondary: {
      default: 'bg-gray-200 text-gray-800',
      isHovered: 'bg-gray-300',
    },
  },
});

button({ variant: 'primary' });
// => 'px-4 py-2 rounded font-medium bg-blue-500 text-white'

button({ variant: 'primary', isHovered: true });
// => 'px-4 py-2 rounded font-medium bg-blue-600 text-white'
```

Conditions at the same level are mutually exclusive and ordered—the last matching condition takes precedence. Class conflicts are automatically resolved by [tailwind-merge](https://github.com/dcastil/tailwind-merge).

## Why Nested?

When combining multiple conditions like `variant` + `isHovered`, tailwind-variants requires a flat `compoundVariants` array.

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

With nestable-tailwind-variants, you can nest conditions directly under each variant.

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

Nesting keeps related styles grouped together, making it easier to see which hover/pressed states belong to which variant.

## With React Aria Components

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

## Composing Styles

Combine multiple style functions using `composeNtv`. This is useful for reusing common styles across multiple components:

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

## VS Code Integration

With [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) installed, add the following to your VS Code settings (`settings.json`) to enable autocomplete in `ntv` calls:

```json
{
  "tailwindCSS.classFunctions": ["ntv"]
}
```

## ESLint Integration

To lint Tailwind classes inside `ntv` calls with [eslint-plugin-better-tailwindcss](https://github.com/schoero/eslint-plugin-better-tailwindcss), extend the default callees in your ESLint configuration:

```js
import { getDefaultCallees } from 'eslint-plugin-better-tailwindcss/api/defaults';

export default [
  {
    settings: {
      'better-tailwindcss': {
        callees: [...getDefaultCallees(), ['ntv', [{ match: 'objectValues' }]]],
      },
    },
  },
];
```

## API

### `ntv<Props>(style)`

Creates a style function from a nested style definition.

- `style` - Style definition object
  - `default` - Base styles (skipped when other conditions match at the same level)
  - `[variantKey]` - Style definitions for each variant value
  - `is*` / `allows*` - Styles applied when the boolean prop is `true`
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
