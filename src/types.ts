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

type HasRequiredKey<T> = true extends IsRequiredInAny<T, KeysOfUnion<T>> ? true : false;

export type StyleFunction<TProps = Props> = (HasRequiredKey<TProps> extends false
  ? (props?: NormalizeProps<TProps> & ClassProp) => string
  : (props: NormalizeProps<TProps> & ClassProp) => string) & {
  readonly __ntvProps?: TProps;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStyleFunction = ((...args: any[]) => string) & {
  readonly __ntvProps?: unknown;
};

// ============================================================================
// Merge Utilities
// ============================================================================

type MergeProps<T> = Flatten<
  {
    [K in KeysOfUnion<T> as true extends IsRequiredInAny<T, K> ? K : never]: ValueFromUnion<T, K>;
  } & {
    [K in KeysOfUnion<T> as true extends IsRequiredInAny<T, K> ? never : K]?: ValueFromUnion<T, K>;
  }
>;

type ExtractProps<T> = T extends { readonly __ntvProps?: infer P } ? NonNullable<P> : never;

export type MergeStyleFunctionProps<T extends readonly AnyStyleFunction[]> = MergeProps<
  { [K in keyof T]: ExtractProps<T[K]> }[number]
>;

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
