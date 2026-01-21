import type { ClassNameValue as ClassValue, extendTailwindMerge } from 'tailwind-merge';

export type { ClassValue };

/**
 * Union type for class prop - ensures only one of class or className is used.
 * This prevents ambiguity when passing class names to components.
 */
export type ClassProp =
  | { class?: ClassValue; className?: never }
  | { class?: never; className?: ClassValue };

/**
 * Props type constraint for NTV style functions.
 * Props are either boolean flags or string variant selections.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NtvProps {}

/**
 * Merge all properties from a union type into a single object type.
 * Combines props from multiple style functions by creating unions of their values.
 */
type MergeUnion<T> = {
  [K in T extends unknown ? keyof T : never]: T extends unknown
    ? K extends keyof T
      ? T[K]
      : never
    : never;
};

/**
 * Extract and merge props types from an array of style functions.
 * Used by mergeNtv to create a combined props type.
 */
export type MergeStyleFunctionProps<T extends readonly StyleFunction<any>[]> = MergeUnion<
  {
    [K in keyof T]: T[K] extends StyleFunction<infer P> ? P : never;
  }[number]
>;

/**
 * Make all properties optional and allow undefined values.
 * Ensures proper handling of missing props in style functions.
 */
type PartialWithUndefined<T> = {
  [K in keyof T]?: T[K] | undefined;
};

/**
 * Flatten intersection types for better IDE display.
 */
type Simplify<T> = { [K in keyof T]: T[K] };

/**
 * Function signature for style generators.
 * Accepts optional props and returns a string of class names.
 */
export type StyleFunction<TProps> = (
  props?: Simplify<PartialWithUndefined<TProps> & ClassProp>,
) => string;

/**
 * Boolean scheme entry - class value or nested scheme with conditions.
 */
type BooleanSchemeEntry<TProps extends NtvProps> =
  | ClassValue
  | (SchemeFor<TProps> & { $base?: ClassValue; $default?: ClassValue });

/**
 * Variant scheme entry - maps variant values to class values or nested schemes.
 */
type VariantSchemeEntry<TVariant extends string, TProps extends NtvProps> = {
  [V in TVariant]?:
    | ClassValue
    | (SchemeFor<TProps> & { $base?: ClassValue; $default?: ClassValue });
} & { $default?: ClassValue | (SchemeFor<TProps> & { $base?: ClassValue; $default?: ClassValue }) };

/**
 * Scheme conditions based on the props type.
 * Maps each prop to its appropriate scheme entry type.
 */
type SchemeConditions<TProps extends NtvProps> = {
  [K in keyof TProps & string]?: NonNullable<TProps[K]> extends boolean
    ? BooleanSchemeEntry<TProps>
    : NonNullable<TProps[K]> extends string
      ? VariantSchemeEntry<NonNullable<TProps[K]>, TProps>
      : never;
};

/**
 * Main scheme type for NTV style definitions.
 * Validated against TProps to ensure type safety.
 */
export type SchemeFor<TProps extends NtvProps> = {
  $base?: ClassValue;
  $default?: ClassValue;
} & SchemeConditions<TProps>;

/**
 * Runtime scheme interface for NTV style definitions.
 * Untyped version used for JavaScript or when types aren't available.
 */
export interface NtvScheme {
  $base?: ClassValue;
  $default?: ClassValue;
  [key: string]: unknown;
}

export type TwMergeConfig = Parameters<typeof extendTailwindMerge>[0];

/**
 * Configuration options for NTV function behavior.
 */
export interface NtvOptions {
  /**
   * Whether to merge the class names with `tailwind-merge` library.
   * It's avoid to have duplicate tailwind classes. (Recommended)
   * @see https://github.com/dcastil/tailwind-merge
   * @default true
   */
  twMerge?: boolean;
  /**
   * The config object for `tailwind-merge` library.
   * @see https://github.com/dcastil/tailwind-merge/blob/main/docs/configuration.md
   */
  twMergeConfig?: TwMergeConfig;
}
