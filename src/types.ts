import type { ClassNameValue as ClassValue, extendTailwindMerge } from 'tailwind-merge';

export type { ClassValue };

// ============================================================================
// Primitive Types
// ============================================================================

export type PropValue = boolean | string;
export type Props = Record<string, PropValue | undefined>;

export type ClassProp =
  | { class?: ClassValue; className?: never }
  | { class?: never; className?: ClassValue };

// ============================================================================
// Internal Utilities
// ============================================================================

type Flatten<T> = { [K in keyof T]: T[K] };

type RequiredKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

// Union type utilities
type KeysOfUnion<T> = T extends unknown ? keyof T : never;

type IsRequiredInAny<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? K extends RequiredKeys<T>
      ? true
      : never
    : never
  : never;

type ValueFromUnion<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? Exclude<T[K], undefined>
    : never
  : never;

// ============================================================================
// Scheme Types
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type NestedScheme<TProps extends Props = {}> = {
  $base?: ClassValue;
  $default?: ClassValue | NestedScheme<TProps>;
} & PropConditions<TProps>;

type VariantMapping<TVariant extends string, TProps extends Props> = {
  [V in TVariant]?: ClassValue | NestedScheme<TProps>;
} & {
  $default?: ClassValue | NestedScheme<TProps>;
};

/**
 * Determines the value type for a property condition based on the property's type.
 * - Boolean properties map to ClassValue or NestedScheme
 * - String properties map to VariantMapping with their possible values
 */
type GetPropConditionValue<TProps extends Props, K extends PropertyKey> =
  NonNullable<ValueFromUnion<TProps, K>> extends boolean
    ? ClassValue | NestedScheme<TProps>
    : NonNullable<ValueFromUnion<TProps, K>> extends string
      ? VariantMapping<NonNullable<ValueFromUnion<TProps, K>>, TProps>
      : never;

type PropConditions<TProps extends Props> = {
  [K in KeysOfUnion<TProps> & string]?: GetPropConditionValue<TProps, K>;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Scheme<TProps extends Props = {}> = {
  $base?: ClassValue;
  $default?: ClassValue;
} & PropConditions<TProps>;

// ============================================================================
// StyleFunction Types
// ============================================================================

type NormalizeProps<T, TOriginal = T> = T extends unknown
  ? Flatten<
      { [K in RequiredKeys<T>]: T[K] } & { [K in OptionalKeys<T>]?: T[K] } & {
        [K in Exclude<KeysOfUnion<TOriginal>, keyof T>]?: never;
      }
    >
  : never;

/**
 * Checks if a props type has at least one required key.
 */
type HasRequiredKey<T> = true extends IsRequiredInAny<T, KeysOfUnion<T>> ? true : false;

/**
 * Function signature for style functions.
 * If the props have no required keys, the props parameter is optional.
 * Otherwise, the props parameter is required.
 */
type StyleFunctionSignature<TProps> =
  HasRequiredKey<TProps> extends false
    ? (props?: NormalizeProps<TProps> & ClassProp) => string
    : (props: NormalizeProps<TProps> & ClassProp) => string;

/**
 * A style function that generates class names based on props.
 * Includes metadata about its expected props type for type merging.
 */
export type StyleFunction<TProps = Props> = StyleFunctionSignature<TProps> & {
  readonly __ntvProps?: TProps;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStyleFunction = ((...args: any[]) => string) & {
  readonly __ntvProps?: unknown;
};

// ============================================================================
// Merge Utilities
// ============================================================================

/**
 * Merges a union of props types into a single props type.
 * Required properties stay required if they are required in ANY union member.
 * Optional properties stay optional only if they are optional in ALL union members.
 */
type MergeProps<T> = Flatten<
  {
    [K in KeysOfUnion<T> as true extends IsRequiredInAny<T, K> ? K : never]: ValueFromUnion<T, K>;
  } & {
    [K in KeysOfUnion<T> as true extends IsRequiredInAny<T, K> ? never : K]?: ValueFromUnion<T, K>;
  }
>;

/**
 * Applies MergeProps distributively across all combinations of two union types.
 * This ensures that each combination of union members is properly merged.
 *
 * Example: MergeTwoUnions<A | B, C | D> = MergeProps<A | C> | MergeProps<A | D> | MergeProps<B | C> | MergeProps<B | D>
 */
type MergeTwoUnions<TFirst, TSecond> = TFirst extends unknown
  ? TSecond extends unknown
    ? MergeProps<TFirst | TSecond>
    : never
  : never;

/**
 * Recursively merges a tuple of props types, applying distributive merge at each step.
 * This handles complex cases where multiple style functions with union types are merged.
 *
 * Example: MergeAllProps<[A | B, C, D | E]> produces all combinations:
 *   MergeProps<A | C | D> | MergeProps<A | C | E> | MergeProps<B | C | D> | MergeProps<B | C | E>
 */
type MergeAllProps<TTuple extends readonly unknown[]> = TTuple extends readonly []
  ? unknown
  : TTuple extends readonly [infer TOnly]
    ? TOnly
    : TTuple extends readonly [infer TFirst, infer TSecond, ...infer TRest]
      ? MergeAllProps<[MergeTwoUnions<TFirst, TSecond>, ...TRest]>
      : unknown;

/**
 * Extracts the props type from a style function.
 * Style functions store their props type in the __ntvProps property.
 */
type ExtractStyleFunctionProps<T> = T extends { readonly __ntvProps?: infer P }
  ? NonNullable<P>
  : never;

/**
 * Merges the props types from multiple style functions.
 * Handles union types distributively to ensure all type combinations are properly merged.
 */
export type MergeStyleFunctionProps<T extends readonly AnyStyleFunction[]> = MergeAllProps<{
  [K in keyof T]: ExtractStyleFunctionProps<T[K]>;
}>;

// ============================================================================
// Configuration Types
// ============================================================================

export type TwMergeConfig = Parameters<typeof extendTailwindMerge>[0];

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
