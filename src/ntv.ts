import { twJoin, twMerge } from 'tailwind-merge';
import type {
  ClassProp,
  NtvOptions,
  NtvProps,
  NtvScheme,
  SchemeFor,
  StyleFunction,
} from './types.js';
import { getCachedTwMerge } from './cache.js';
import { resolveConditions } from './resolver.js';

function validateScheme(scheme: NtvScheme): void {
  if ('class' in scheme) {
    throw new Error('The "class" property is not allowed in ntv scheme. Use "$base" instead.');
  }

  if ('className' in scheme) {
    throw new Error('The "className" property is not allowed in ntv scheme. Use "$base" instead.');
  }
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
 * type ButtonProps = { variant: 'primary' | 'secondary'; isDisabled: boolean };
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
export function ntv<TProps extends NtvProps>(
  scheme: SchemeFor<TProps>,
  options?: NtvOptions,
): StyleFunction<TProps>;
export function ntv(scheme: NtvScheme, options?: NtvOptions): StyleFunction<any>;
export function ntv(
  scheme: NtvScheme,
  { twMerge: usesTwMerge = true, twMergeConfig }: NtvOptions = {},
): StyleFunction<any> {
  validateScheme(scheme);

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
    return mergeFn(...resolveConditions(scheme, props), slotClass, slotClassName);
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
export function createNtv(defaultOptions: NtvOptions): {
  <TProps extends NtvProps>(scheme: SchemeFor<TProps>): StyleFunction<TProps>;
  (scheme: NtvScheme): StyleFunction<any>;
} {
  return function configuredNtv(scheme: NtvScheme) {
    return ntv(scheme, defaultOptions);
  };
}
