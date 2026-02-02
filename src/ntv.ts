import { twJoin, twMerge } from 'tailwind-merge';
import type {
  ClassProp,
  ClassValue,
  NtvOptions,
  Props,
  Scheme,
  StyleFunction,
  ValidateProps,
} from './types.js';
import { getCachedTwMerge } from './cache.js';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolves conditions from scheme based on provided props to generate class values.
 *
 * $default behavior:
 * - At each level, $default is applied unless a boolean condition (isXxx/allowsXxx) matches
 * - Variant matches do NOT suppress $default at their level
 * - Nested levels evaluate their own $default independently
 */
function resolveConditions(
  scheme: Record<string, unknown>,
  props: Record<string, unknown>,
): ClassValue[] {
  const { $base, $default, ...conditions } = scheme;
  const classes: ClassValue[] = [];
  let hasMatchedBooleanCondition = false;

  function toClassValues(value: unknown): ClassValue[] {
    if (isPlainObject(value)) {
      return resolveConditions(value, props);
    }
    return [value as ClassValue];
  }

  for (const [key, value] of Object.entries(conditions)) {
    const propValue = props[key];

    // Validate reserved values
    if (propValue === '$default') {
      throw new Error(
        `"$default" is reserved for defining fallback styles and cannot be used as a value for "${key}".`,
      );
    }

    // Handle boolean conditions (isXxx or allowsXxx patterns)
    if (/^(is|allows)[A-Z]/.test(key)) {
      if (propValue) {
        hasMatchedBooleanCondition = true;
        classes.push(...toClassValues(value));
      }
      continue;
    }

    // Handle variant conditions (nested objects with variant mapping)
    if (isPlainObject(value)) {
      const selectedVariant =
        typeof propValue === 'string' && propValue in value ? propValue : '$default';
      classes.push(...toClassValues(value[selectedVariant]));
    }
  }

  // Apply $default if no boolean conditions matched
  if (!hasMatchedBooleanCondition) {
    classes.unshift($default as ClassValue);
  }

  // Always apply $base first
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
export function ntv<TProps extends Props>(
  scheme: ValidateProps<TProps> extends TProps ? Scheme<TProps> : ValidateProps<TProps>,
  options?: NtvOptions,
): StyleFunction<TProps>;
export function ntv(
  scheme: Scheme & Record<string, unknown>,
  options?: NtvOptions,
): StyleFunction<any>;
export function ntv(scheme: Scheme, options: NtvOptions = {}): StyleFunction<any> {
  // Validate that reserved properties are not used
  if ('class' in scheme) {
    throw new Error('The "class" property is not allowed in ntv scheme. Use "$base" instead.');
  }
  if ('className' in scheme) {
    throw new Error('The "className" property is not allowed in ntv scheme. Use "$base" instead.');
  }

  // Determine the class merging strategy
  const { twMerge: usesTwMerge = true, twMergeConfig } = options;
  const mergeClassNames = usesTwMerge
    ? twMergeConfig
      ? getCachedTwMerge(twMergeConfig)
      : twMerge
    : twJoin;

  return function styleFunction({
    class: slotClass,
    className: slotClassName,
    ...props
  }: Record<string, unknown> & ClassProp = {}): string {
    const resolvedClasses = resolveConditions(scheme, props);
    return mergeClassNames(...resolvedClasses, slotClass, slotClassName);
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
  <TProps extends Props>(
    scheme: ValidateProps<TProps> extends TProps ? Scheme<TProps> : ValidateProps<TProps>,
  ): StyleFunction<TProps>;
  (scheme: Scheme & Record<string, unknown>): StyleFunction<any>;
} {
  return function ntvWithDefaults(scheme: Scheme & Record<string, unknown>) {
    return ntv(scheme, defaultOptions);
  };
}
