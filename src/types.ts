import type { ClassNameValue as ClassValue, extendTailwindMerge } from 'tailwind-merge';

export type { ClassValue };

// ============================================================================
// Base Types
// ============================================================================

// Flexible props type that accepts any object including interfaces
export type Props = Record<string, any>;

export type ClassProp =
  | { class?: ClassValue; className?: never }
  | { class?: never; className?: ClassValue };

// ============================================================================
// Type Utilities
// ============================================================================

// Flattens an intersection type for better readability in IntelliSense
type Flatten<T> = { [K in keyof T]: T[K] };

// Gets keys that are required (not optional) in type T
type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

// Gets keys that are optional in type T
type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

// Gets all keys from a union type (distributive)
type KeysOfUnion<T> = T extends unknown ? keyof T : never;

/**
 * Checks if a key is required in at least one member of a union type.
 * Returns `true` if the key is required in any member, `never` otherwise.
 *
 * @example
 * ```ts
 * // Usage: `true extends IsRequiredInAny<T, K> ? ... : ...`
 * // When K is required in any union member, the result includes `true`,
 * // so `true extends (true | never)` evaluates to true.
 * ```
 */
type IsRequiredInAny<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? K extends RequiredKeys<T>
      ? true
      : never
    : never
  : never;

// Gets the value type for a key across all members of a union type
type ValueFromUnion<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? Exclude<T[K], undefined>
    : never
  : never;

// ============================================================================
// Props Validation
// ============================================================================

// Finds keys with invalid prop values (not boolean or string)
type InvalidPropKey<T> = {
  [K in keyof T]: NonNullable<T[K]> extends boolean | string ? never : K;
}[keyof T];

// Validates that all prop values are boolean or string
export type ValidateProps<T, TInvalidKey = InvalidPropKey<T>> = [TInvalidKey] extends [never]
  ? T
  : `Error: Property '${TInvalidKey & string}' must be boolean or string`;

// ============================================================================
// Scheme Types
// ============================================================================

// A nested scheme that can contain conditions and nested schemes
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

// The root scheme type for defining style variants
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Scheme<TProps extends Props = {}> = {
  $base?: ClassValue;
  $default?: ClassValue;
} & PropConditions<TProps>;

// ============================================================================
// StyleFunction Types
// ============================================================================

// Normalizes props by separating required and optional keys
type NormalizeProps<T, TOriginal = T> = T extends unknown
  ? Flatten<
      { [K in RequiredKeys<T>]: T[K] } & { [K in OptionalKeys<T>]?: T[K] } & {
        [K in Exclude<KeysOfUnion<TOriginal>, keyof T>]?: never;
      }
    >
  : never;

// Checks if a props type has at least one required key
type HasRequiredKey<T> = true extends IsRequiredInAny<T, KeysOfUnion<T>> ? true : false;

// Function signature that makes props parameter optional when all props are optional
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

// A style function with any props type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStyleFunction = ((...args: any[]) => string) & {
  readonly __ntvProps?: unknown;
};

// ============================================================================
// Props Merging
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
 * Example: MergeTwoUnions<A | B, C | D> = MergeProps<A | C> | MergeProps<A | D> | MergeProps<B | C> | MergeProps<B | D>
 */
type MergeTwoUnions<TFirst, TSecond> = TFirst extends unknown
  ? TSecond extends unknown
    ? MergeProps<TFirst | TSecond>
    : never
  : never;

/**
 * Recursively merges a tuple of props types, applying distributive merge at each step.
 * Example: MergeAllProps<[A | B, C, D | E]> produces all combinations.
 */
type MergeAllProps<TTuple extends readonly unknown[]> = TTuple extends readonly []
  ? unknown
  : TTuple extends readonly [infer TOnly]
    ? TOnly
    : TTuple extends readonly [infer TFirst, infer TSecond, ...infer TRest]
      ? MergeAllProps<[MergeTwoUnions<TFirst, TSecond>, ...TRest]>
      : unknown;

// Extracts the props type from a style function's __ntvProps property
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
