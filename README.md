# nestable-tailwind-variants

Tailwind CSS variant library with nestable conditions for compound styling instead of flat compoundVariants.

Inspired by [React Spectrum's conditional styles](https://react-spectrum.adobe.com/styling#conditional-styles) and [Tailwind Variants](https://www.tailwind-variants.org/).

## Why nestable-tailwind-variants?

With [Tailwind Variants](https://www.tailwind-variants.org/), combining variants with [React Aria Components render props](https://react-aria.adobe.com/styling#render-props) like `isHovered` and `isPressed` requires `compoundVariants`. This quickly becomes verbose as combinations grow:

```tsx
import { tv } from 'tailwind-variants';

const button = tv({
  base: 'px-4 py-2 rounded',
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
    // ... one entry for every variant × condition combination
  ],
});

button({ variant: 'primary', isHovered: true });
// => 'px-4 py-2 rounded bg-blue-500 text-white bg-blue-600'
```

nestable-tailwind-variants solves this by letting you nest conditions directly inside variants, keeping related logic together:

```tsx
import { ntv } from 'nestable-tailwind-variants';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  isHovered?: boolean;
  isPressed?: boolean;
}

const button = ntv<ButtonProps>({
  $base: 'px-4 py-2 rounded',
  variant: {
    primary: {
      $default: 'bg-blue-500 text-white',
      isHovered: 'bg-blue-600',
      isPressed: 'bg-blue-700',
    },
    secondary: {
      $default: 'bg-gray-200 text-gray-800',
      isHovered: 'bg-gray-300',
    },
  },
});

button({ variant: 'primary', isHovered: true });
// => 'px-4 py-2 rounded bg-blue-600'
```

## Installation

```bash
npm install nestable-tailwind-variants
```

## Core Concepts

### `$base` - Always-applied styles

The `$base` property defines styles that are always applied at that level. It can be used at the top level or nested inside variants and conditions:

```ts
interface CardProps {
  variant?: 'elevated' | 'flat';
}

const card = ntv<CardProps>({
  $base: 'rounded-lg shadow-md p-4',
  variant: {
    elevated: 'shadow-xl',
    flat: 'shadow-none',
  },
});

card();
// => 'rounded-lg shadow-md p-4'

card({ variant: 'elevated' });
// => 'rounded-lg shadow-xl p-4'
// Note: shadow-md is replaced by shadow-xl via tailwind-merge
```

When nested inside a variant or condition, `$base` applies whenever that context is entered:

```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'lg';
}

const button = ntv<ButtonProps>({
  $base: 'px-4 py-2',
  variant: {
    primary: {
      $base: 'bg-blue-500 text-white', // Applied when variant='primary'
      size: {
        sm: 'text-sm',
        lg: 'text-lg',
      },
    },
    secondary: 'bg-gray-500',
  },
});

button({ variant: 'primary' });
// => 'px-4 py-2 bg-blue-500 text-white'

button({ variant: 'primary', size: 'sm' });
// => 'px-4 py-2 bg-blue-500 text-white text-sm'
```

### `$default` - Fallback styles

Use `$default` for styles applied when no **boolean conditions** (`isXxx`/`allowsXxx`) match at that level. Variant matches do not suppress `$default`. Within variants, `$default` can also contain nested conditions:

```ts
interface ChipProps {
  variant?: 'filled' | 'outlined';
  isSelected?: boolean;
}

const chip = ntv<ChipProps>({
  $base: 'inline-flex items-center rounded-full px-3 py-1',
  variant: {
    $default: {
      $base: 'bg-gray-100', // Applied when variant is not specified
      isSelected: 'bg-gray-200', // Applied when isSelected and no variant
    },
    filled: {
      $default: 'bg-gray-200 text-gray-800', // Applied when isSelected is false
      isSelected: 'bg-blue-500 text-white',
    },
    outlined: {
      $default: 'border border-gray-300 text-gray-800',
      isSelected: 'border-blue-500 text-blue-500',
    },
  },
});

chip();
// => 'inline-flex items-center rounded-full px-3 py-1 bg-gray-100'

chip({ isSelected: true });
// => 'inline-flex items-center rounded-full px-3 py-1 bg-gray-200'

chip({ variant: 'filled' });
// => 'inline-flex items-center rounded-full px-3 py-1 bg-gray-200 text-gray-800'

chip({ variant: 'filled', isSelected: true });
// => 'inline-flex items-center rounded-full px-3 py-1 bg-blue-500 text-white'
```

> **Note:** Within variant conditions, `$default` is only available when the variant key is optional. Required variant keys always have a value provided, so there's no fallback case:
>
> ```ts
> // ❌ Error: variant is required, so $default is not allowed
> ntv<{ variant: 'a' | 'b' }>({
>   variant: {
>     a: 'a-class',
>     b: 'b-class',
>     $default: 'default-class', // TypeScript error
>   },
> });
>
> // ✅ OK: variant is optional, so $default is allowed
> ntv<{ variant?: 'a' | 'b' }>({
>   variant: {
>     a: 'a-class',
>     b: 'b-class',
>     $default: 'default-class',
>   },
> });
> ```

### `$base` vs `$default`

- **`$base`**: Always applied, regardless of whether conditions match
- **`$default`**: Applied when no boolean conditions (`isXxx`/`allowsXxx`) match. Variant matches do not affect `$default` at the same level.

```ts
interface ButtonProps {
  isDisabled?: boolean;
}

const button = ntv<ButtonProps>({
  $base: 'px-4 py-2', // Always applied
  $default: 'bg-blue-500', // Only applied when isDisabled is false
  isDisabled: 'bg-gray-300 cursor-not-allowed',
});

button();
// => 'px-4 py-2 bg-blue-500'

button({ isDisabled: true });
// => 'px-4 py-2 bg-gray-300 cursor-not-allowed'
```

Here's an example showing how `$default` interacts with both boolean conditions and variants:

```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  isHovered?: boolean;
}

const button = ntv<ButtonProps>({
  $base: 'px-4 py-2 rounded',
  $default: 'bg-gray-100',
  isHovered: 'bg-gray-200',
  variant: {
    $default: 'text-gray-800',
    primary: 'text-white',
  },
});

button();
// => 'px-4 py-2 rounded bg-gray-100 text-gray-800'

button({ variant: 'primary' });
// => 'px-4 py-2 rounded bg-gray-100 text-white'
// Note: $default (bg-gray-100) is still applied because variant matches don't suppress it

button({ isHovered: true });
// => 'px-4 py-2 rounded bg-gray-200 text-gray-800'
// Note: $default is NOT applied because isHovered matches
```

### Variants - String-based selection

Define variants as objects mapping variant values to class names:

```ts
interface BadgeProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'info' | 'success' | 'warning';
}

const badge = ntv<BadgeProps>({
  $base: 'px-2 py-1 rounded text-sm',
  size: {
    sm: 'text-xs px-1.5',
    md: 'text-sm px-2',
    lg: 'text-base px-3',
  },
  color: {
    info: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
  },
});

badge({ size: 'lg', color: 'success' });
// => 'py-1 rounded text-base px-3 bg-green-100 text-green-800'
```

### Boolean Conditions - `is[A-Z]` / `allows[A-Z]` patterns

Keys matching `is[A-Z]*` or `allows[A-Z]*` are treated as boolean conditions:

```ts
interface InputProps {
  isFocused?: boolean;
  isDisabled?: boolean;
  isInvalid?: boolean;
  allowsClearing?: boolean;
}

const input = ntv<InputProps>({
  $base: 'border rounded px-3 py-2',
  isFocused: 'ring-2 ring-blue-500 border-blue-500',
  isDisabled: 'bg-gray-100 text-gray-400 cursor-not-allowed',
  isInvalid: 'border-red-500 text-red-600',
  allowsClearing: 'pr-8',
});

input({ isFocused: true });
// => 'border rounded px-3 py-2 ring-2 ring-blue-500 border-blue-500'

input({ isDisabled: true, isInvalid: true });
// => 'border rounded px-3 py-2 bg-gray-100 text-gray-400 cursor-not-allowed border-red-500 text-red-600'
```

## Nested Conditions

The core feature of nestable-tailwind-variants is the ability to nest conditions inside variants.

### Boolean conditions inside variants

```ts
interface ChipProps {
  variant?: 'filled' | 'outlined';
  isSelected?: boolean;
}

const chip = ntv<ChipProps>({
  $base: 'inline-flex items-center rounded-full px-3 py-1',
  variant: {
    filled: {
      $default: 'bg-gray-200 text-gray-800',
      isSelected: 'bg-blue-500 text-white',
    },
    outlined: {
      $default: 'border border-gray-300 text-gray-800',
      isSelected: 'border-blue-500 text-blue-500',
    },
  },
});

chip({ variant: 'filled' });
// => 'inline-flex items-center rounded-full px-3 py-1 bg-gray-200 text-gray-800'

chip({ variant: 'filled', isSelected: true });
// => 'inline-flex items-center rounded-full px-3 py-1 bg-blue-500 text-white'

chip({ variant: 'outlined', isSelected: true });
// => 'inline-flex items-center rounded-full px-3 py-1 border-blue-500 text-blue-500'
```

### Multi-level nesting

You can nest conditions to any depth:

```ts
interface ButtonProps {
  variant?: 'primary';
  isHovered?: boolean;
  isPressed?: boolean;
  isDisabled?: boolean;
}

const button = ntv<ButtonProps>({
  $base: 'px-4 py-2 rounded font-medium transition-colors',
  variant: {
    primary: {
      $default: 'bg-blue-500 text-white',
      isHovered: 'bg-blue-600',
      isPressed: 'bg-blue-700',
      isDisabled: {
        $default: 'bg-blue-300 cursor-not-allowed',
        isHovered: 'bg-blue-300', // Prevent hover effect when disabled
      },
    },
  },
});

button({ variant: 'primary' });
// => 'px-4 py-2 rounded font-medium transition-colors bg-blue-500 text-white'

button({ variant: 'primary', isHovered: true });
// => 'px-4 py-2 rounded font-medium transition-colors bg-blue-600'

button({ variant: 'primary', isDisabled: true });
// => 'px-4 py-2 rounded font-medium transition-colors bg-blue-300 cursor-not-allowed'

button({ variant: 'primary', isDisabled: true, isHovered: true });
// => 'px-4 py-2 rounded font-medium transition-colors bg-blue-300'
```

## Composing Styles

Merge multiple style functions into one. Later functions take precedence:

```ts
import { ntv, mergeNtv } from 'nestable-tailwind-variants';

interface BaseButtonProps {
  size?: 'sm' | 'md';
}

const baseButton = ntv<BaseButtonProps>({
  $base: 'rounded font-medium transition-colors',
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
  },
});

interface ColoredButtonProps {
  variant?: 'primary' | 'secondary';
}

const coloredButton = ntv<ColoredButtonProps>({
  variant: {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  },
});

const button = mergeNtv(baseButton, coloredButton);

button({ size: 'md', variant: 'primary' });
// => 'rounded font-medium transition-colors px-4 py-2 text-base bg-blue-500 text-white hover:bg-blue-600'
```

## Passing Additional Classes

Pass additional classes using `class` or `className`:

```ts
interface BoxProps {
  variant?: 'primary' | 'secondary';
}

const box = ntv<BoxProps>({
  $base: 'p-4 rounded',
  variant: {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-200',
  },
});

box({ variant: 'primary', class: 'mt-4 p-8' });
// => 'rounded bg-blue-500 mt-4 p-8'
// Note: p-8 overrides p-4 via tailwind-merge

box({ variant: 'secondary', className: 'shadow-lg' });
// => 'p-4 rounded bg-gray-200 shadow-lg'
```

## React Aria Components Integration

nestable-tailwind-variants is designed to work seamlessly with [React Aria Components render props](https://react-aria.adobe.com/styling#render-props):

```tsx
import {
  Button as RACButton,
  composeRenderProps,
  type ButtonProps as RACButtonProps,
  type ButtonRenderProps,
} from 'react-aria-components';
import { ntv } from 'nestable-tailwind-variants';

interface ButtonStyleProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const button = ntv<ButtonRenderProps & ButtonStyleProps>({
  $base:
    'inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors focus:outline-none',
  variant: {
    primary: {
      $default: 'bg-blue-500 text-white',
      isHovered: 'bg-blue-600',
      isPressed: 'bg-blue-700',
      isFocusVisible: 'ring-2 ring-blue-500 ring-offset-2',
    },
    secondary: {
      $default: 'bg-gray-200 text-gray-800',
      isHovered: 'bg-gray-300',
      isPressed: 'bg-gray-400',
      isFocusVisible: 'ring-2 ring-gray-500 ring-offset-2',
    },
  },
  size: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg',
  },
  isDisabled: 'opacity-50 cursor-not-allowed',
});

function Button({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: RACButtonProps & ButtonStyleProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        // renderProps includes isHovered, isPressed, isFocusVisible, isDisabled
        button({ ...renderProps, variant, size, className }),
      )}
    >
      {children}
    </RACButton>
  );
}
```

## Type Safety

The recommended approach is to define a props type and pass it as a type argument to `ntv`. This provides clear documentation, better IDE support, and ensures type safety:

```ts
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  isDisabled: boolean;
}

const button = ntv<ButtonProps>({
  $base: 'rounded',
  variant: {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-200',
  },
  size: {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  },
  isDisabled: 'opacity-50',
});

// All props are required - props parameter is mandatory
button({ variant: 'primary', size: 'lg', isDisabled: false }); // ✅ OK
button({ variant: 'tertiary' }); // ❌ Error: 'tertiary' is not assignable
button({ variant: 'primary' }); // ❌ Error: missing 'size' and 'isDisabled'
```

Use optional properties (`?`) when you want to allow calling the style function without providing all props:

```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isDisabled?: boolean;
}

const button = ntv<ButtonProps>({
  $base: 'rounded',
  variant: {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-200',
  },
  size: {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  },
  isDisabled: 'opacity-50',
});

// All props are optional - props parameter can be omitted
button(); // ✅ OK
button({ variant: 'primary' }); // ✅ OK
button({ variant: 'primary', size: 'lg' }); // ✅ OK
```

Omitting the type argument when the scheme has keys disables type checking. Provide explicit type arguments when possible for better type safety.

## Options

`ntv` accepts an options object as the second argument. For `mergeNtv`, use `mergeNtvWithOptions` to pass options.

### Disabling tailwind-merge

By default, [tailwind-merge](https://github.com/dcastil/tailwind-merge) is used to resolve class conflicts. To disable it, pass `{ twMerge: false }`.

For `ntv`:

```ts
const styles = ntv(
  {
    $base: 'p-4',
  },
  { twMerge: false },
);

styles({ class: 'p-8' });
// => 'p-4 p-8' (no merge, both classes kept)
```

For `mergeNtvWithOptions`:

```ts
const styles = mergeNtvWithOptions(baseStyles, overrideStyles)({ twMerge: false });
```

### Custom tailwind-merge configuration

If you've extended Tailwind with custom classes (e.g., custom font sizes via `@theme`), you need to tell tailwind-merge about them so it can resolve conflicts correctly:

```css
/* app.css */
@theme {
  --font-size-huge: 4rem;
}
```

For `ntv`:

```ts
const heading = ntv(
  { $base: 'text-huge' },
  {
    twMergeConfig: {
      extend: {
        classGroups: {
          'font-size': [{ text: ['huge'] }],
        },
      },
    },
  },
);

heading({ class: 'text-6xl' });
// => 'text-6xl' (text-huge is correctly replaced by text-6xl)
```

For `mergeNtvWithOptions`:

```ts
const styles = mergeNtvWithOptions(
  baseStyles,
  overrideStyles,
)({
  twMergeConfig: {
    extend: {
      classGroups: {
        'font-size': [{ text: ['huge'] }],
      },
    },
  },
});
```

Without this configuration, tailwind-merge wouldn't recognize `text-huge` as a font-size class and would keep both `text-huge` and `text-6xl`.

### Pre-configured factories

Use `createNtv` or `createMergeNtv` to create functions with shared options:

```ts
import { createNtv, createMergeNtv, type TwMergeConfig } from 'nestable-tailwind-variants';

const twMergeConfig: TwMergeConfig = {
  extend: {
    classGroups: {
      'font-size': [{ text: ['huge', 'tiny'] }],
    },
  },
};

const ntv = createNtv({ twMergeConfig });
const mergeNtv = createMergeNtv({ twMergeConfig });
```

## Tooling

### Tailwind CSS IntelliSense

Add to `.vscode/settings.json` for [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) class autocomplete:

```json
{
  "tailwindCSS.experimental.classRegex": ["ntv\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
}
```

### prettier-plugin-tailwindcss

Add to your Prettier config for [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) automatic class sorting:

```json
{
  "tailwindFunctions": ["ntv"]
}
```

### eslint-plugin-better-tailwindcss

Add to your ESLint config for [eslint-plugin-better-tailwindcss](https://github.com/schoero/eslint-plugin-better-tailwindcss) linting:

```js
import { getDefaultCallees } from 'eslint-plugin-better-tailwindcss/defaults';

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

## API Reference

### Functions

| Function                                     | Description                                             |
| -------------------------------------------- | ------------------------------------------------------- |
| `ntv(scheme, options?)`                      | Create a style function from a scheme                   |
| `createNtv(options)`                         | Create a pre-configured `ntv` with default options      |
| `mergeNtv(...styleFns)`                      | Merge multiple style functions into one                 |
| `mergeNtvWithOptions(...styleFns)(options?)` | Merge style functions with custom options               |
| `createMergeNtv(options)`                    | Create a pre-configured `mergeNtv` with default options |

### Types

| Type            | Description                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- |
| `ClassValue`    | Valid class value (string, array, or object)                                                |
| `ClassProp`     | Props for runtime class override (`{ class?: ClassValue }` or `{ className?: ClassValue }`) |
| `NtvOptions`    | Options for ntv functions (`{ twMerge?: boolean; twMergeConfig?: TwMergeConfig }`)          |
| `TwMergeConfig` | Configuration object for tailwind-merge                                                     |

### Scheme Properties

| Property       | Description                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------- |
| `$base`        | Classes always applied at that level (can be used at top-level or nested within conditions) |
| `$default`     | Fallback classes when no conditions match at that level                                     |
| `is[A-Z]*`     | Boolean condition (e.g., `isSelected`, `isDisabled`)                                        |
| `allows[A-Z]*` | Boolean condition (e.g., `allowsRemoving`)                                                  |
| `[key]`        | Variant object mapping values to classes                                                    |

## License

MIT
