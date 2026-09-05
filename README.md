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

At each level, `$base` always applies. `$default` applies when no boolean condition at that level matches. It accepts classes or nested conditions:

```ts
const panel = ntv<{ isDisabled?: boolean; isHovered?: boolean }>({
  $base: 'rounded',
  isDisabled: 'opacity-50',
  $default: {
    $base: 'bg-blue-500',
    isHovered: 'bg-blue-600',
  },
});

panel();
// => 'rounded bg-blue-500'

panel({ isHovered: true });
// => 'rounded bg-blue-600'

panel({ isDisabled: true, isHovered: true });
// => 'rounded opacity-50'
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

Selecting a string variant does not suppress the surrounding level’s `$default`. Each nested level uses the same props and evaluates its own default independently.

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

A props type can also include values such as numbers or objects. These props are accepted by calls but cannot define conditions.

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

## Use with React Aria Components

Pass [React Aria Components render props](https://react-aria.adobe.com/styling#render-props) to your styles to respond to hover, pressed, focus, and disabled states:

```tsx
import { createNtv } from 'nestable-tailwind-variants';
import {
  Button as RACButton,
  composeRenderProps,
  type ButtonProps as RACButtonProps,
  type ButtonRenderProps,
} from 'react-aria-components';
import { twMerge } from 'tailwind-merge';

const ntv = createNtv({ twMerge });

interface ButtonStyleProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const button = ntv<ButtonRenderProps & ButtonStyleProps>({
  $base: 'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  variant: {
    primary: {
      $base: 'bg-blue-500 text-white',
      isHovered: 'bg-blue-600',
      isPressed: 'bg-blue-700',
    },
    secondary: {
      $base: 'bg-gray-200 text-gray-800',
      isHovered: 'bg-gray-300',
      isPressed: 'bg-gray-400',
    },
  },
  size: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg',
  },
  isFocusVisible: 'ring-2 ring-blue-500 ring-offset-2',
  isDisabled: 'opacity-50 cursor-not-allowed',
});

function Button({ variant = 'primary', size = 'md', ...props }: RACButtonProps & ButtonStyleProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        button({ ...renderProps, variant, size, className }),
      )}
    />
  );
}
```

`composeRenderProps` preserves the caller’s `className`, whether it is a string or a function, and applies those classes as overrides.

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

## Tooling

These examples assume the instance returned by `createNtv` is named `ntv`. Adjust the function names if you use a different name, and replace `src/app.css` with your CSS entry point.

### VS Code

Install [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) and add this configuration to `.vscode/settings.json` to recognize classes in `ntv` calls:

```json
{
  "tailwindCSS.experimental.classRegex": [
    ["\\bntv(?:<[\\s\\S]*?>)?\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*,?\\s*\\)", "[\"'`]([^\"'`]*)[\"'`]"],
    "\\b(?:class|className)\\s*:\\s*[\"'`]([^\"'`]*)[\"'`]"
  ]
}
```

Use `experimental.classRegex` for calls with type arguments, such as `ntv<ButtonProps>({...})`. `tailwindCSS.classFunctions` does not currently recognize these calls. See [the upstream issue](https://github.com/tailwindlabs/tailwindcss-intellisense/issues/1539).

### Zed

Add this configuration to `.zed/settings.json` for [Zed’s Tailwind CSS support](https://zed.dev/docs/languages/tailwindcss) to recognize classes in `ntv` calls:

```json
{
  "lsp": {
    "tailwindcss-language-server": {
      "settings": {
        "experimental": {
          "classRegex": [
            [
              "\\bntv(?:<[\\s\\S]*?>)?\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*,?\\s*\\)",
              "[\"'`]([^\"'`]*)[\"'`]"
            ],
            "\\b(?:class|className)\\s*:\\s*[\"'`]([^\"'`]*)[\"'`]"
          ]
        }
      }
    }
  }
}
```

### prettier-plugin-tailwindcss

Add `ntv` to `tailwindFunctions` in your Prettier configuration to sort classes with [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss):

```json
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./src/app.css",
  "tailwindFunctions": ["ntv"]
}
```

### eslint-plugin-tailwindcss

Add `ntv` to `functions` to lint classes in nested conditions with [eslint-plugin-tailwindcss](https://github.com/francoismassart/eslint-plugin-tailwindcss). Keep your existing TypeScript parser configuration.

```js
import { defineConfig } from 'eslint/config';
import tailwindcss from 'eslint-plugin-tailwindcss';

export default defineConfig([
  {
    extends: [tailwindcss.configs.recommended],
    settings: {
      tailwindcss: {
        cssConfigPath: './src/app.css',
        functions: ['ntv'],
        ignoredKeys: [],
      },
    },
  },
]);
```

The `functions` list replaces the defaults. Include any other class helpers you use.

### eslint-plugin-better-tailwindcss

Add a selector for `ntv` to lint classes in nested conditions with [eslint-plugin-better-tailwindcss](https://github.com/schoero/eslint-plugin-better-tailwindcss). Keep your existing TypeScript parser configuration.

```js
import { defineConfig } from 'eslint/config';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { getDefaultSelectors } from 'eslint-plugin-better-tailwindcss/defaults';
import { MatcherType, SelectorKind } from 'eslint-plugin-better-tailwindcss/types';

export default defineConfig([
  {
    extends: [betterTailwindcss.configs.recommended],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/app.css',
        selectors: [
          ...getDefaultSelectors(),
          {
            kind: SelectorKind.Callee,
            name: '^ntv$',
            match: [{ type: MatcherType.ObjectValue }],
          },
        ],
      },
    },
  },
]);
```

## License

MIT
