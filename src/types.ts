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

// ============================================================================
// Scheme Types
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type NestedScheme<TProps extends Props = {}> = {
  $base?: ClassValue;
  $default?: ClassValue | NestedScheme<TProps>;
} & PropConditions<TProps>;

type VariantMapping<
  TVariant extends string,
  TProps extends Props,
  TAllowDefault extends boolean,
> = {
  [V in TVariant]?: ClassValue | NestedScheme<TProps>;
} & (TAllowDefault extends true
  ? { $default?: ClassValue | NestedScheme<TProps> }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {});

type PropConditions<TProps extends Props> = {
  [K in keyof TProps & string]?: NonNullable<TProps[K]> extends boolean
    ? ClassValue | NestedScheme<TProps>
    : NonNullable<TProps[K]> extends string
      ? VariantMapping<NonNullable<TProps[K]>, TProps, undefined extends TProps[K] ? true : false>
      : never;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Scheme<TProps extends Props = {}> = {
  $base?: ClassValue;
  $default?: ClassValue;
} & PropConditions<TProps>;

// ============================================================================
// StyleFunction Types
// ============================================================================

type NormalizeProps<T> = Flatten<
  { [K in RequiredKeys<T>]: T[K] } & { [K in OptionalKeys<T>]?: T[K] }
>;

export type StyleFunction<TProps = Props> = (RequiredKeys<TProps> extends never
  ? (props?: Flatten<NormalizeProps<TProps> & ClassProp>) => string
  : (props: Flatten<NormalizeProps<TProps> & ClassProp>) => string) & {
  readonly __ntvProps?: TProps;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyStyleFunction = ((...args: any[]) => string) & {
  readonly __ntvProps?: unknown;
};

// ============================================================================
// Merge Utilities
// ============================================================================

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
