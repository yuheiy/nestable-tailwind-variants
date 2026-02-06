import type { ClassNameValue as ClassValue, extendTailwindMerge } from 'tailwind-merge';

export type { ClassValue };

// ============================================================================
// Base Types
// ============================================================================

export type Props = Record<string, any>;

export type ClassProp =
  | { class?: ClassValue; className?: never }
  | { class?: never; className?: ClassValue };

// ============================================================================
// Type Utilities
// ============================================================================

type Flatten<T> = { [K in keyof T]: T[K] };

type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

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
// Props Validation
// ============================================================================

type InvalidPropKey<T> = {
  [K in keyof T]: NonNullable<T[K]> extends boolean | string ? never : K;
}[keyof T];

export type ValidateProps<T, TInvalidKey = InvalidPropKey<T>> = [TInvalidKey] extends [never]
  ? T
  : `Error: Property '${TInvalidKey & string}' must be boolean or string`;

// ============================================================================
// Scheme Types
// ============================================================================

type NestedScheme<TProps extends Props = {}> = {
  $base?: ClassValue;
  $default?: ClassValue | NestedScheme<TProps>;
} & PropConditions<TProps>;

type VariantMapping<TVariant extends string, TProps extends Props> = {
  [V in TVariant]?: ClassValue | NestedScheme<TProps>;
} & {
  $default?: ClassValue | NestedScheme<TProps>;
};

type GetPropConditionValue<
  TProps extends Props,
  K extends PropertyKey,
  TValue = NonNullable<ValueFromUnion<TProps, K>>,
> = TValue extends boolean
  ? ClassValue | NestedScheme<TProps>
  : TValue extends string
    ? VariantMapping<TValue, TProps>
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

type HasRequiredKey<T> = true extends IsRequiredInAny<T, KeysOfUnion<T>> ? true : false;

type StyleFunctionSignature<TProps> =
  HasRequiredKey<TProps> extends false
    ? (props?: NormalizeProps<TProps> & ClassProp) => string
    : (props: NormalizeProps<TProps> & ClassProp) => string;

export type StyleFunction<TProps = Props> = StyleFunctionSignature<TProps> & {
  readonly __ntvProps?: TProps;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStyleFunction = ((...args: any[]) => string) & {
  readonly __ntvProps?: unknown;
};

// ============================================================================
// Props Merging
// ============================================================================

type MergeProps<T> = Flatten<
  {
    [K in KeysOfUnion<T> as true extends IsRequiredInAny<T, K> ? K : never]: ValueFromUnion<T, K>;
  } & {
    [K in KeysOfUnion<T> as true extends IsRequiredInAny<T, K> ? never : K]?: ValueFromUnion<T, K>;
  }
>;

type MergeTwoUnions<TFirst, TSecond> = TFirst extends unknown
  ? TSecond extends unknown
    ? MergeProps<TFirst | TSecond>
    : never
  : never;

type MergeAllProps<TTuple extends readonly unknown[]> = TTuple extends readonly []
  ? unknown
  : TTuple extends readonly [infer TOnly]
    ? TOnly
    : TTuple extends readonly [infer TFirst, infer TSecond, ...infer TRest]
      ? MergeAllProps<[MergeTwoUnions<TFirst, TSecond>, ...TRest]>
      : unknown;

type ExtractStyleFunctionProps<T> = T extends { readonly __ntvProps?: infer P }
  ? NonNullable<P>
  : never;

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
   * This avoids duplicate tailwind classes. (Recommended)
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
