export type ClassValue = string | false | null | undefined | 0 | 0n | readonly ClassValue[];

export type ClassProps =
  | { class?: ClassValue; className?: never }
  | { class?: never; className?: ClassValue };

export interface Options {
  twMerge: (...classes: ClassValue[]) => string;
}

export type Conditions = { readonly [key: string]: ClassValue | Conditions };

export type UntypedScheme = {
  $base?: ClassValue;
  $default?: ClassValue | UntypedScheme;
  class?: never;
  className?: never;
} & Conditions;

type KnownProps<T> = {
  [
    K in keyof T as string extends K
      ? never
      : number extends K
        ? never
        : symbol extends K
          ? never
          : K
  ]: T[K];
};

type IndexProps<T> = {
  [
    K in keyof T as string extends K ? K : number extends K ? K : symbol extends K ? K : never
  ]: T[K];
};

type Keys<T> = T extends unknown ? keyof T : never;

type Value<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? Exclude<T[K], undefined>
    : never
  : never;

type RequiredKeys<T> = T extends unknown
  ? RequiredKeysOf<KnownProps<T>> | RequiredKeysOf<IndexProps<T>>
  : never;

type RequiredKeysOf<T> = { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T];

type Simplify<T> = { [K in keyof T]: T[K] };

type IsBooleanKey<K extends string> = K extends `${'is' | 'allows'}${infer First}${infer _Rest}`
  ? First extends ''
    ? false
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' extends `${string}${First}${string}`
      ? true
      : false
  : false;

type Condition<P, K extends string, V = NonNullable<Value<P, K>>, Open extends boolean = false> =
  IsBooleanKey<K> extends true
    ? [V] extends [boolean]
      ? ClassValue | SchemeFor<P, Open>
      : never
    : [V] extends [string]
      ? { [Choice in Extract<V, string>]?: ClassValue | SchemeFor<P, Open> } & {
          $default?: ClassValue | SchemeFor<P, Open>;
        }
      : never;

export type Scheme<P> = SchemeFor<P, false>;

type SchemeFor<P, Open extends boolean> = Simplify<
  {
    $base?: ClassValue;
    $default?: ClassValue | SchemeFor<P, Open>;
    class?: never;
    className?: never;
  } & {
    [
      K in Exclude<
        Keys<Open extends true ? KnownProps<P> : P> & string,
        '$base' | '$default' | 'class' | 'className'
      >
    ]?: Condition<P, K, NonNullable<Value<Open extends true ? KnownProps<P> : P, K>>, Open>;
  } & {
    [K in keyof IndexProps<P> & string as Open extends true ? K : never]?: unknown extends Value<
      P,
      K
    >
      ? ClassValue | SchemeFor<P, Open>
      : Condition<P, K, NonNullable<Value<P, K>>, Open>;
  }
>;

type Normalize<P, All = P> = P extends unknown
  ? NormalizeKnown<KnownProps<P>, KnownProps<All>> & IndexProps<P>
  : never;

type NormalizeKnown<P, All> = P extends unknown
  ? Simplify<
      { [K in RequiredKeys<P>]: P[K] } & {
        [K in Exclude<keyof P, RequiredKeys<P>>]?: P[K];
      } & { [K in Exclude<Keys<All>, keyof P>]?: never }
    >
  : never;

type CallableStyle<P> = [RequiredKeys<P>] extends [never]
  ? (props?: Normalize<P> & ClassProps) => string
  : (props: Normalize<P> & ClassProps) => string;

export type AnyStyle = (props: never) => string;

export type StyleArguments<F extends readonly AnyStyle[]> = {
  [K in keyof F]: Parameters<F[K]> extends [props?: object | undefined] ? F[K] : never;
};

type WithoutClasses<P> = P extends unknown
  ? Omit<KnownProps<NonNullable<P>>, 'class' | 'className'> & IndexProps<NonNullable<P>>
  : never;

type StyleProps<F extends AnyStyle> =
  Parameters<F> extends [] ? object : WithoutClasses<NonNullable<Parameters<F>[0]>>;

type MergeValues<T> = Simplify<MergeEntries<KnownProps<T>> & MergeEntries<IndexProps<T>>>;

type MergeEntries<T> = Simplify<
  { [K in RequiredKeys<T>]: Value<T, K> } & {
    [K in Exclude<Keys<T>, RequiredKeys<T>>]?: Value<T, K>;
  }
>;

type MergeProps<A, B> = A extends unknown
  ? B extends unknown
    ? MergeValues<A | B>
    : never
  : never;

export type ExtensionProps<F extends readonly AnyStyle[]> = F extends readonly [
  infer Head extends AnyStyle,
  ...infer Tail extends AnyStyle[],
]
  ? MergeProps<StyleProps<Head>, ExtensionProps<Tail>>
  : number extends F['length']
    ? MergeValues<StyleProps<F[number]>>
    : object;

export type Style<P, Inferred = P> = ((props: Inferred & Normalize<P> & ClassProps) => string) &
  CallableStyle<P>;

export interface Ntv {
  <Args extends [props?: object | undefined]>(
    scheme: Scheme<NonNullable<Args[0]>>,
  ): ContextStyle<object, Args>;
  <P extends object>(scheme: Scheme<P>): Style<P>;
  (scheme: UntypedScheme): Style<Record<string, unknown>>;
  extend<const F extends readonly AnyStyle[]>(
    ...bases: F & NoInfer<StyleArguments<F>>
  ): Extension<ExtensionProps<F>>;
}

type ExtensionScheme<Base, P> = SchemeFor<MergeProps<Base, P>, true>;

type ContextStyle<Base, Args extends [props?: object | undefined]> = ((
  ...args: Args & [props?: Normalize<MergeProps<Base, NonNullable<Args[0]>>> & ClassProps]
) => string) &
  ((props?: Normalize<MergeProps<Base, NonNullable<Args[0]>>> & ClassProps) => string);

export interface Extension<Base> {
  <Args extends [props?: object | undefined]>(
    scheme: [RequiredKeys<Base>] extends [never]
      ? ExtensionScheme<Base, NonNullable<Args[0]>>
      : never,
  ): ContextStyle<Base, Args>;
  <P extends object = object>(scheme: ExtensionScheme<Base, P>): Style<MergeProps<Base, P>, P>;
}
