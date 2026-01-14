import { extendTailwindMerge } from 'tailwind-merge';

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

export type StyleFunction<P = Record<string, unknown>> = (props: Partial<P>) => string;
