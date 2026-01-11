import { twMerge, extendTailwindMerge } from 'tailwind-merge';

export type TWMergeConfig = Parameters<typeof extendTailwindMerge>[0];

export interface NTVConfig {
  /**
   * Whether to use `tailwind-merge` to resolve conflicting Tailwind classes.
   * @see https://github.com/dcastil/tailwind-merge
   * @default true
   */
  twMerge?: boolean;

  /**
   * Custom configuration for `tailwind-merge`.
   * @see https://github.com/dcastil/tailwind-merge/blob/main/docs/configuration.md
   */
  twMergeConfig?: TWMergeConfig;
}

type BooleanConditionKey = `is${Capitalize<string>}` | `allows${Capitalize<string>}`;

type ExtractBooleanKeys<Props> = {
  [K in keyof Props]: K extends BooleanConditionKey ? K : never;
}[keyof Props];

type ExtractVariantKeys<Props> = Exclude<keyof Props, ExtractBooleanKeys<Props>>;

type NestedStyleValue<Props> = string | StyleDefinition<Props>;

type StyleDefinition<Props> = {
  default?: string;
} & {
  [K in ExtractBooleanKeys<Props>]?: NestedStyleValue<Props>;
} & {
  [K in ExtractVariantKeys<Props>]?: {
    [V in Extract<Props[K], string>]?: NestedStyleValue<Props>;
  };
};

type StyleFunction<P = Record<string, unknown>> = (props: Partial<P>) => string;

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type ExtractProps<T> = T extends StyleFunction<infer P> ? P : never;

interface EvaluationContext<Props> {
  props: Partial<Props>;
  skipConditions: Set<string>;
  classes: string[];
}

function isStyleDefinition(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function evaluateDefinition<Props extends Record<string, any>>(
  definition: StyleDefinition<Props> | string,
  context: EvaluationContext<Props>,
): void {
  if (typeof definition === 'string') {
    context.classes.push(definition);
    return;
  }

  if (!isStyleDefinition(definition)) {
    return;
  }

  const entries = Object.entries(definition);

  let defaultValue: unknown = undefined;
  const conditions: Array<[string, unknown]> = [];

  for (const [key, value] of entries) {
    if (key === 'default') {
      defaultValue = value;
    } else {
      conditions.push([key, value]);
    }
  }

  const allConditionKeys = conditions.map(([key]) => key);
  const subSkipConditions = new Set([...context.skipConditions, ...allConditionKeys]);

  if (defaultValue !== undefined) {
    evaluateDefinition(defaultValue as StyleDefinition<Props> | string, {
      ...context,
      skipConditions: subSkipConditions,
    });
  }

  for (const [key, value] of conditions) {
    if (context.skipConditions.has(key)) {
      continue;
    }

    subSkipConditions.delete(key);

    const propValue = context.props[key as keyof Props];

    if (/^(is|allows)[A-Z]/.test(key) && propValue) {
      const nestedSkipConditions = new Set([...subSkipConditions, key]);
      evaluateDefinition(value as StyleDefinition<Props> | string, {
        props: context.props,
        skipConditions: nestedSkipConditions,
        classes: context.classes,
      });
    } else if (key !== 'default' && propValue !== undefined) {
      if (isStyleDefinition(value)) {
        const variantValue = value[propValue as string];
        if (variantValue !== undefined) {
          const nestedSkipConditions = new Set([...subSkipConditions, key]);
          evaluateDefinition(variantValue as StyleDefinition<Props> | string, {
            props: context.props,
            skipConditions: nestedSkipConditions,
            classes: context.classes,
          });
        }
      }
    }
  }
}

function joinClasses(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates a customized `ntv` function with the specified options.
 *
 * @example
 * ```ts
 * // Disable tailwind-merge
 * const ntvNoMerge = createNTV({ twMerge: false });
 *
 * // With custom tailwind-merge config
 * const customNTV = createNTV({
 *   twMergeConfig: {
 *     extend: {
 *       theme: {
 *         shadow: ['100', '200', '300'],
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function createNTV(
  options: NTVConfig = {},
): <Props extends Record<string, any>>(style: StyleDefinition<Props>) => StyleFunction<Props> {
  const { twMerge: useTwMerge = true, twMergeConfig } = options;

  const mergeClasses = useTwMerge
    ? twMergeConfig
      ? extendTailwindMerge(twMergeConfig)
      : twMerge
    : joinClasses;

  return function ntv<Props extends Record<string, any>>(
    style: StyleDefinition<Props>,
  ): StyleFunction<Props> {
    return (props) => {
      const context: EvaluationContext<Props> = {
        props,
        skipConditions: new Set(),
        classes: [],
      };

      evaluateDefinition(style, context);

      return mergeClasses(...context.classes);
    };
  };
}

/**
 * Creates a style function from a nested style definition.
 *
 * @example
 * ```ts
 * const button = ntv<{ variant?: 'primary' | 'secondary'; isDisabled?: boolean }>({
 *   default: 'px-4 py-2 rounded',
 *   variant: {
 *     primary: 'bg-blue-500 text-white',
 *     secondary: 'bg-gray-200 text-gray-800',
 *   },
 *   isDisabled: 'opacity-50 cursor-not-allowed',
 * });
 *
 * button({ variant: 'primary' });
 * // => 'px-4 py-2 rounded bg-blue-500 text-white'
 *
 * button({ variant: 'primary', isDisabled: true });
 * // => 'px-4 py-2 rounded bg-blue-500 text-white opacity-50 cursor-not-allowed'
 * ```
 */
export const ntv = createNTV();

/**
 * Creates a customized `composeNtv` function with the specified options.
 *
 * @example
 * ```ts
 * // Disable tailwind-merge
 * const composeNtvNoMerge = createComposeNtv({ twMerge: false });
 *
 * // With custom tailwind-merge config
 * const customComposeNtv = createComposeNtv({
 *   twMergeConfig: {
 *     extend: {
 *       theme: {
 *         shadow: ['100', '200', '300'],
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function createComposeNtv(
  options: NTVConfig = {},
): <T extends StyleFunction[]>(
  ...fns: T
) => StyleFunction<UnionToIntersection<ExtractProps<T[number]>>> {
  const { twMerge: useTwMerge = true, twMergeConfig } = options;

  const mergeClasses = useTwMerge
    ? twMergeConfig
      ? extendTailwindMerge(twMergeConfig)
      : twMerge
    : joinClasses;

  return (...fns) =>
    (props) =>
      mergeClasses(...fns.map((fn) => fn(props)));
}

/**
 * Composes multiple style functions into a single function.
 *
 * @example
 * ```ts
 * const baseButton = ntv<{ size?: 'sm' | 'lg' }>({
 *   default: 'rounded font-medium',
 *   size: { sm: 'px-2 py-1 text-sm', lg: 'px-4 py-2 text-lg' },
 * });
 *
 * const coloredButton = ntv<{ variant?: 'primary' | 'secondary' }>({
 *   variant: { primary: 'bg-blue-500 text-white', secondary: 'bg-gray-200' },
 * });
 *
 * const button = composeNtv(baseButton, coloredButton);
 *
 * button({ size: 'lg', variant: 'primary' });
 * // => 'rounded font-medium px-4 py-2 text-lg bg-blue-500 text-white'
 * ```
 */
export const composeNtv = createComposeNtv();
