export type ClassValue = string | false | null | undefined | 0 | 0n | readonly ClassValue[];

export type ClassProps =
  | { class?: ClassValue; className?: never }
  | { class?: never; className?: ClassValue };

export interface Options {
  twMerge: (...classes: ClassValue[]) => string;
}

type KnownProps<P> = {
  [
    K in keyof P as string extends K
      ? never
      : number extends K
        ? never
        : symbol extends K
          ? never
          : K
  ]: P[K];
};

type Keys<P> = P extends unknown ? keyof P : never;

type KnownKeys<P> = Keys<KnownProps<P>>;

type DeclaredValue<P, K extends PropertyKey> = P extends unknown
  ? K extends keyof P
    ? Required<P>[K]
    : never
  : never;

type BooleanKey<K extends string> = K extends `${'is' | 'allows'}${infer First}${string}`
  ? First extends ''
    ? false
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' extends `${string}${First}${string}`
      ? true
      : false
  : false;

type Branch<P, Open extends boolean> = ClassValue | SchemeFor<P, Open>;

type Condition<P, K extends string, V, Open extends boolean> =
  BooleanKey<K> extends true
    ? [V] extends [boolean]
      ? Branch<P, Open>
      : never
    : [V] extends [string]
      ? { [Choice in Extract<V, string>]?: Branch<P, Open> } & { $default?: Branch<P, Open> }
      : never;

type Simplify<T> = { [K in keyof T]: T[K] };

export type Scheme<P> = SchemeFor<P, false>;

type SchemeFor<P, Open extends boolean> = Simplify<
  {
    $base?: ClassValue;
    $default?: Branch<P, Open>;
    class?: never;
    className?: never;
  } & {
    [
      K in Exclude<
        (Open extends true ? KnownKeys<P> : Keys<P>) & string,
        '$base' | '$default' | 'class' | 'className'
      >
    ]?: Condition<P, K, NonNullable<DeclaredValue<Open extends true ? KnownProps<P> : P, K>>, Open>;
  } & {
    [
      K in keyof P & string as Open extends true ? (string extends K ? K : never) : never
    ]?: unknown extends DeclaredValue<P, K>
      ? Branch<P, Open>
      : Condition<P, K, NonNullable<DeclaredValue<P, K>>, Open>;
  }
>;

export type Conditions = { readonly [key: string]: ClassValue | Conditions };

export type UntypedScheme = {
  $base?: ClassValue;
  $default?: ClassValue | UntypedScheme;
  class?: never;
  className?: never;
} & Conditions;

type ExclusiveProps<P, All = P> = P extends unknown
  ? P & { [K in Exclude<KnownKeys<All>, keyof KnownProps<P>>]?: never }
  : never;

export type Style<P> = {} extends P
  ? (props?: ExclusiveProps<P> & ClassProps) => string
  : (props: ExclusiveProps<P> & ClassProps) => string;

export type AnyStyle = (props: never) => string;

type WithoutOverrides<P> = {
  [K in keyof P as K extends 'class' | 'className' ? never : K]: P[K];
};

export type CheckedBases<F extends readonly AnyStyle[]> = CheckPossible<BaseProps<F>> & {
  [K in keyof F]: Parameters<F[K]> extends [props?: object | undefined]
    ? [WithoutOverrides<NonNullable<Parameters<F[K]>[0]>>] extends [
        NonNullable<Parameters<F[K]>[0]>,
      ]
      ? F[K]
      : never
    : never;
};

export type BaseProps<F extends readonly AnyStyle[]> = F[number] extends (props: infer P) => string
  ? WithoutOverrides<NonNullable<P>>
  : object;

type NumericKey<K> = K extends number
  ? K
  : K extends 'Infinity' | '-Infinity' | 'NaN'
    ? number
    : K extends `${infer N extends number}`
      ? `${N}` extends K
        ? N
        : never
      : never;

type MatchingKeys<P, K extends PropertyKey> = P extends unknown
  ? K extends keyof P
    ? K
    : K extends number
      ? `${K}` extends keyof P
        ? `${K}`
        : never
      : NumericKey<K> extends keyof P
        ? NumericKey<K>
        : never
  : never;

type WiderKeysAt<Base, P, K extends PropertyKey> = K extends unknown
  ? [MatchingKeys<Base, K>] extends [never]
    ? never
    : [MatchingKeys<P, K>] extends [never]
      ? never
      : [DeclaredValue<P, MatchingKeys<P, K>>] extends [DeclaredValue<Base, MatchingKeys<Base, K>>]
        ? never
        : K
  : never;

type WiderKeys<Base, P> =
  | WiderKeysAt<Base, P, KnownKeys<P> | KnownKeys<Base>>
  | WiderKeysAt<Base, P, Keys<P> | Keys<Base>>;

type CheckLocal<Base, P> = [WiderKeys<Base, P>] extends [never] ? unknown : never;

type IndexValue<P, K extends PropertyKey> = (K extends string | number
  ? string extends keyof P
    ? P[string]
    : unknown
  : unknown) &
  ([NumericKey<K>] extends [never] ? unknown : number extends keyof P ? P[number] : unknown) &
  (K extends symbol ? (symbol extends keyof P ? P[symbol] : unknown) : unknown);

type RequiredNeverKeys<P> = {
  [K in keyof KnownProps<P>]-?: {} extends Pick<P, K>
    ? never
    : [P[K] & IndexValue<P, K>] extends [never]
      ? K
      : never;
}[keyof KnownProps<P>];

type UsableProps<P> = P extends unknown
  ? [RequiredNeverKeys<P>] extends [never]
    ? P
    : never
  : never;

type CheckPossible<P> = [UsableProps<P>] extends [never] ? never : unknown;

type ContextStyle<Base, Args extends [props?: object | undefined]> = ((
  ...args: Args & [props?: ExclusiveProps<Base & NonNullable<Args[0]>> & ClassProps]
) => string) &
  ((props?: ExclusiveProps<Base & NonNullable<Args[0]>> & ClassProps) => string);

export interface Extension<Base> {
  <Args extends [props?: object | undefined]>(
    scheme: ({} extends Base ? SchemeFor<Base & NonNullable<Args[0]>, true> : never) &
      NoInfer<CheckLocal<Base, NonNullable<Args[0]>>>,
  ): ContextStyle<Base, Args>;
  <P extends object = object>(
    scheme: SchemeFor<Base & P, true> & NoInfer<CheckLocal<Base, P> & CheckPossible<Base & P>>,
  ): Style<Base & P>;
}

export interface Ntv {
  <Args extends [props?: object | undefined]>(
    scheme: Scheme<NonNullable<Args[0]>>,
  ): ContextStyle<object, Args>;
  <P extends object>(scheme: Scheme<P>): Style<P>;
  (scheme: UntypedScheme): Style<Record<string, unknown>>;
  extend<const F extends readonly AnyStyle[]>(
    ...bases: F & NoInfer<CheckedBases<F>>
  ): Extension<BaseProps<F>>;
}
