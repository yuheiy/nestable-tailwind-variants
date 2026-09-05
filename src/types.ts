export type ClassValue = string | false | null | undefined | 0 | 0n | readonly ClassValue[];

export type ClassProps =
  | { class?: ClassValue; className?: never }
  | { class?: never; className?: ClassValue };

export interface Options {
  twMerge: (...classes: ClassValue[]) => string;
}

export type Conditions = { readonly [key: string]: ClassValue | Conditions };

type Base = {
  $base?: ClassValue;
  $default?: ClassValue;
  class?: never;
  className?: never;
};

export type UntypedScheme = Base & Conditions;

type Keys<T> = T extends unknown ? keyof T : never;

type Value<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? Exclude<T[K], undefined>
    : never
  : never;

type RequiredKeys<T> = T extends unknown
  ? { [K in keyof T]-?: undefined extends T[K] ? never : K }[keyof T]
  : never;

type Simplify<T> = { [K in keyof T]: T[K] };

type IsBooleanKey<K extends string> = K extends `${'is' | 'allows'}${infer First}${infer _Rest}`
  ? First extends ''
    ? false
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' extends `${string}${First}${string}`
      ? true
      : false
  : false;

type Condition<P, K extends string, V = NonNullable<Value<P, K>>> =
  IsBooleanKey<K> extends true
    ? [V] extends [boolean]
      ? ClassValue | Scheme<P>
      : never
    : [V] extends [string]
      ? { [Choice in Extract<V, string>]?: ClassValue | Scheme<P> } & {
          $default?: ClassValue | Scheme<P>;
        }
      : never;

export type Scheme<P> = Simplify<
  Base & {
    [K in Exclude<Keys<P> & string, keyof Base>]?: Condition<P, K>;
  }
>;

type Normalize<P, All = P> = P extends unknown
  ? Simplify<
      { [K in RequiredKeys<P>]: P[K] } & {
        [K in Exclude<keyof P, RequiredKeys<P>>]?: P[K];
      } & { [K in Exclude<Keys<All>, keyof P>]?: never }
    >
  : never;

export type Style<P> = [RequiredKeys<P>] extends [never]
  ? (props?: Normalize<P> & ClassProps) => string
  : (props: Normalize<P> & ClassProps) => string;

export type AnyStyle = (props: never) => string;

export type StyleArguments<F extends readonly AnyStyle[]> = {
  [K in keyof F]: Parameters<F[K]> extends [props?: object | undefined] ? F[K] : never;
};

type WithoutClasses<P> = P extends unknown ? Omit<NonNullable<P>, 'class' | 'className'> : never;

type StyleProps<F extends AnyStyle> =
  Parameters<F> extends [] ? object : WithoutClasses<NonNullable<Parameters<F>[0]>>;

type Combine<T> = Simplify<
  { [K in RequiredKeys<T>]: Value<T, K> } & {
    [K in Exclude<Keys<T>, RequiredKeys<T>>]?: Value<T, K>;
  }
>;

type CombinePair<A, B> = A extends unknown ? (B extends unknown ? Combine<A | B> : never) : never;

export type CombinedProps<F extends readonly AnyStyle[]> = F extends readonly [
  infer Head extends AnyStyle,
  ...infer Tail extends AnyStyle[],
]
  ? CombinePair<StyleProps<Head>, CombinedProps<Tail>>
  : number extends F['length']
    ? Combine<StyleProps<F[number]>>
    : object;
