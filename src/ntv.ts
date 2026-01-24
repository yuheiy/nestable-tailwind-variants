import { twJoin, twMerge } from 'tailwind-merge';
import type { ClassProp, ClassValue, NtvOptions, Scheme, StyleFunction } from './types.js';
import { getCachedTwMerge } from './cache.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolves conditions from scheme based on provided props to generate class values.
 *
 * $default behavior:
 * - If no conditions match at a level, that level's $default is applied
 * - If a variant matches, only the nested evaluation result is used
 * - When no conditions match, $defaults accumulate from each unmatched level
 */
function resolveConditions(
  { $base, $default, ...conditions }: Record<string, unknown>,
  props: Record<string, unknown>,
): ClassValue[] {
  const classes: ClassValue[] = [];
  let hasMatchedCondition = false;

  function toClassValues(value: unknown): ClassValue[] {
    return isPlainObject(value) ? resolveConditions(value, props) : [value as ClassValue];
  }

  for (const [key, value] of Object.entries(conditions)) {
    const propValue = props[key];

    if (propValue === '$default') {
      throw new Error(
        `"$default" is reserved for defining fallback styles and cannot be used as a value for "${key}".`,
      );
    }

    // Boolean conditions (isXxx or allowsXxx)
    if (/^is[A-Z]/.test(key) || /^allows[A-Z]/.test(key)) {
      if (propValue) {
        hasMatchedCondition = true;
        classes.push(...toClassValues(value));
      }
      continue;
    }

    // Variant conditions (nested objects)
    if (isPlainObject(value)) {
      const matched = typeof propValue === 'string' && propValue in value;
      if (matched) {
        hasMatchedCondition = true;
      }
      classes.push(...toClassValues(value[matched ? propValue : '$default']));
    }
  }

  if (!hasMatchedCondition) {
    classes.unshift($default as ClassValue);
  }

  classes.unshift($base as ClassValue);

  return classes;
}

/**
 * Create a nestable tailwind variants style function.
 *
 * @param scheme - The scheme object defining variants and conditions
 * @param options - Optional settings for tailwind-merge behavior
 * @returns A style function that accepts props and returns merged class names
 *
 * @example
 * ```ts
 * type ButtonProps = { variant?: 'primary' | 'secondary'; isDisabled?: boolean };
 *
 * const button = ntv<ButtonProps>({
 *   $base: 'px-4 py-2 rounded',
 *   variant: {
 *     primary: 'bg-blue-500 text-white',
 *     secondary: 'bg-gray-200 text-gray-800',
 *   },
 *   isDisabled: 'opacity-50 cursor-not-allowed',
 * });
 *
 * button({ variant: 'primary' }); // 'px-4 py-2 rounded bg-blue-500 text-white'
 * button({ variant: 'primary', isDisabled: true }); // 'px-4 py-2 rounded bg-blue-500 text-white opacity-50 cursor-not-allowed'
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function ntv<TProps extends {}>(
  scheme: Scheme<TProps>,
  options?: NtvOptions,
): StyleFunction<TProps>;
export function ntv(
  scheme: Scheme & Record<string, unknown>,
  options?: NtvOptions,
): StyleFunction<any>;
export function ntv(
  scheme: Scheme,
  { twMerge: usesTwMerge = true, twMergeConfig }: NtvOptions = {},
): StyleFunction<any> {
  if ('class' in scheme) {
    throw new Error('The "class" property is not allowed in ntv scheme. Use "$base" instead.');
  }

  if ('className' in scheme) {
    throw new Error('The "className" property is not allowed in ntv scheme. Use "$base" instead.');
  }

  const mergeFn = usesTwMerge
    ? twMergeConfig
      ? getCachedTwMerge(twMergeConfig)
      : twMerge
    : twJoin;

  return function styleFn({
    class: slotClass,
    className: slotClassName,
    ...props
  }: Record<string, unknown> & ClassProp = {}): string {
    const resolvedClasses = resolveConditions(scheme, props);
    return mergeFn(...resolvedClasses, slotClass, slotClassName);
  };
}

/**
 * Create a pre-configured ntv function with fixed options.
 *
 * @param defaultOptions - Default options to apply to all ntv calls
 * @returns A pre-configured ntv function
 *
 * @example
 * ```ts
 * const myNtv = createNtv({
 *   twMergeConfig: {
 *     extend: {
 *       classGroups: {
 *         'font-size': [{ text: ['huge', 'tiny'] }],
 *       },
 *     },
 *   },
 * });
 *
 * const button = myNtv({
 *   $base: 'text-huge',
 *   variant: {
 *     primary: 'bg-blue-500',
 *     secondary: 'bg-gray-200',
 *   },
 * });
 * ```
 */
export function createNtv(defaultOptions?: NtvOptions): {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  <TProps extends {}>(scheme: Scheme<TProps>): StyleFunction<TProps>;
  (scheme: Scheme & Record<string, unknown>): StyleFunction<any>;
} {
  return function configuredNtv(scheme: Scheme & Record<string, unknown>) {
    return ntv(scheme, defaultOptions);
  };
}
