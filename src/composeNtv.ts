import { extendTailwindMerge, twMerge } from 'tailwind-merge';
import type { NTVConfig, StyleFunction } from './types';
import { joinClasses } from './utils';

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type ExtractProps<T> = T extends StyleFunction<infer P> ? P : never;

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

  return function composeNtv(...fns) {
    return (props) => mergeClasses(...fns.map((fn) => fn(props)));
  };
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
