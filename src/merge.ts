import { twJoin, twMerge } from 'tailwind-merge';
import type {
  AnyStyleFunction,
  ClassProp,
  MergeStyleFunctionProps,
  NtvOptions,
  StyleFunction,
} from './types.js';
import { getCachedTwMerge } from './cache.js';

/**
 * Create a merged style function with custom options (curried version).
 *
 * @param styleFns - Style functions to merge
 * @returns A function that accepts options and returns a merged style function
 *
 * @example
 * ```ts
 * const styles = mergeNtvWithOptions(baseStyles, overrideStyles)({ twMerge: false });
 * styles({ variant: 'primary' });
 * ```
 */
export function mergeNtvWithOptions<T extends readonly AnyStyleFunction[]>(
  ...styleFns: T
): (options?: NtvOptions) => StyleFunction<MergeStyleFunctionProps<T>> {
  return function createMergedStyleFn({
    twMerge: usesTwMerge = true,
    twMergeConfig,
  }: NtvOptions = {}): StyleFunction<MergeStyleFunctionProps<T>> {
    const mergeFn = usesTwMerge
      ? twMergeConfig
        ? getCachedTwMerge(twMergeConfig)
        : twMerge
      : twJoin;

    return function mergedStyleFn({
      class: slotClass,
      className: slotClassName,
      ...props
    }: Record<string, unknown> & ClassProp = {}): string {
      const styleResults = styleFns.map((fn) => fn(props as any));
      return mergeFn(...styleResults, slotClass, slotClassName);
    } as unknown as StyleFunction<MergeStyleFunctionProps<T>>;
  };
}

/**
 * Merge multiple style functions into a single style function.
 * Later functions take precedence over earlier ones (via tailwind-merge).
 *
 * @param styleFns - Style functions to merge
 * @returns A merged style function that accepts combined props from all input functions
 *
 * @example
 * ```ts
 * const colorStyles = ntv<{ color?: 'red' | 'blue' }>({
 *   color: { red: 'text-red', blue: 'text-blue' },
 * });
 *
 * const sizeStyles = ntv<{ size?: 'sm' | 'lg' }>({
 *   size: { sm: 'text-sm', lg: 'text-lg' },
 * });
 *
 * const styles = mergeNtv(colorStyles, sizeStyles);
 * styles({ color: 'red', size: 'lg' }); // 'text-red text-lg'
 * ```
 */
export function mergeNtv<T extends readonly AnyStyleFunction[]>(
  ...styleFns: T
): StyleFunction<MergeStyleFunctionProps<T>> {
  return mergeNtvWithOptions(...styleFns)() as unknown as StyleFunction<MergeStyleFunctionProps<T>>;
}

/**
 * Create a pre-configured mergeNtv function with fixed options.
 *
 * @param defaultOptions - Default options to apply to all mergeNtv calls
 * @returns A pre-configured mergeNtv function
 *
 * @example
 * ```ts
 * const myMergeNtv = createMergeNtv({
 *   twMergeConfig: {
 *     extend: {
 *       classGroups: {
 *         'font-size': [{ text: ['huge', 'tiny'] }],
 *       },
 *     },
 *   },
 * });
 *
 * const styles = myMergeNtv(baseStyles, overrideStyles);
 * ```
 */
export function createMergeNtv(
  defaultOptions: NtvOptions,
): <T extends readonly AnyStyleFunction[]>(
  ...styleFns: T
) => StyleFunction<MergeStyleFunctionProps<T>> {
  return function configuredMergeNtv<T extends readonly AnyStyleFunction[]>(
    ...styleFns: T
  ): StyleFunction<MergeStyleFunctionProps<T>> {
    return mergeNtvWithOptions(...styleFns)(defaultOptions) as unknown as StyleFunction<
      MergeStyleFunctionProps<T>
    >;
  };
}
