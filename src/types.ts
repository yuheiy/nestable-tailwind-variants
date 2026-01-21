import type { ClassNameValue as ClassValue, extendTailwindMerge } from 'tailwind-merge';

export type { ClassValue };

// Prop values can be either boolean or string
export type PropValue = boolean | string;

// Component properties constraint
export type Props = Record<string, PropValue>;

// Ensures class and className are mutually exclusive
export type ClassProp =
  | { class?: ClassValue; className?: never }
  | { class?: never; className?: ClassValue };

// Base structure for schemes with optional $base and $default properties
type SchemeBase<TAllowNestedDefault extends boolean = false> = {
  $base?: ClassValue;
  $default?: TAllowNestedDefault extends true ? ClassValue | NestedScheme : ClassValue;
};

// Nested scheme allows recursive nesting with conditions
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type NestedScheme<TProps extends Props = {}> = SchemeBase<true> & NestedConditions<TProps>;

// Maps props to their corresponding condition types for nested contexts
type NestedConditions<TProps extends Props> = {
  [K in keyof TProps & string]?: NonNullable<TProps[K]> extends boolean
    ? ClassValue | NestedScheme<TProps>
    : NonNullable<TProps[K]> extends string
      ? VariantCondition<NonNullable<TProps[K]>, TProps>
      : never;
};

// Variant condition maps variant values to schemes with optional $default
type VariantCondition<TVariant extends string, TProps extends Props> = {
  [V in TVariant]?: ClassValue | NestedScheme<TProps>;
} & {
  $default?: ClassValue | NestedScheme<TProps>;
};

// Main scheme type - top-level schemes don't allow nested $default
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Scheme<TProps extends Props = {}> = SchemeBase<false> & NestedConditions<TProps>;

// Utility types for type manipulation
type PartialWithUndefined<T> = {
  [K in keyof T]?: T[K] | undefined;
};

type Simplify<T> = { [K in keyof T]: T[K] };

// Style function that accepts props and returns class names
export type StyleFunction<TProps = Props> = (
  props?: Simplify<PartialWithUndefined<TProps> & ClassProp>,
) => string;

// Merges union types into a single type
type MergeUnion<T> = {
  [K in T extends unknown ? keyof T : never]: T extends unknown
    ? K extends keyof T
      ? T[K]
      : never
    : never;
};

// Extracts and merges props from an array of StyleFunctions
export type MergeStyleFunctionProps<T extends readonly StyleFunction<any>[]> = MergeUnion<
  {
    [K in keyof T]: T[K] extends StyleFunction<infer P> ? P : never;
  }[number]
>;

// Configuration for tailwind-merge
export type TwMergeConfig = Parameters<typeof extendTailwindMerge>[0];

// Options for ntv functions
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
