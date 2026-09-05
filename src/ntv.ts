import type {
  AnyStyle,
  ClassProps,
  ClassValue,
  CombinedProps,
  Conditions,
  Options,
  Scheme,
  Style,
  StyleArguments,
  UntypedScheme,
} from './types.js';

function isConditions(value: ClassValue | Conditions): value is Conditions {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolve(value: ClassValue | Conditions, props: Record<string, unknown>): ClassValue {
  if (!isConditions(value)) return value;

  const { $base, $default, ...conditions } = value;
  const classes: ClassValue[] = [];
  let matchedBoolean = false;

  for (const [key, branch] of Object.entries(conditions)) {
    const selected = props[key];
    if (selected === '$default') {
      throw new Error(
        `"$default" is reserved for defining fallback styles and cannot be used as a value for "${key}".`,
      );
    }

    if (/^(is|allows)[A-Z]/.test(key)) {
      if (selected) {
        matchedBoolean = true;
        classes.push(resolve(branch, props));
      }
    } else if (isConditions(branch)) {
      const variant =
        typeof selected === 'string' && Object.hasOwn(branch, selected) ? selected : '$default';
      classes.push(resolve(branch[variant], props));
    }
  }

  return [
    isConditions($base) ? undefined : $base,
    matchedBoolean ? undefined : resolve($default, props),
    ...classes,
  ];
}

export function createNtv({ twMerge }: Options) {
  function ntv<P extends object>(scheme: Scheme<P>): Style<P>;
  function ntv(scheme: UntypedScheme): Style<Record<string, unknown>>;
  function ntv(scheme: Conditions) {
    for (const key of ['class', 'className']) {
      if (key in scheme) {
        throw new Error(`The "${key}" property is not allowed in ntv scheme. Use "$base" instead.`);
      }
    }

    return ({ class: extra, className, ...props }: Record<string, unknown> & ClassProps = {}) =>
      twMerge(resolve(scheme, props), extra, className);
  }

  function combine<const F extends readonly AnyStyle[]>(
    ...styles: F & StyleArguments<F>
  ): Style<CombinedProps<F>>;
  function combine(...styles: ((props: Record<string, unknown>) => string)[]) {
    return ({ class: extra, className, ...props }: Record<string, unknown> & ClassProps = {}) =>
      twMerge(...styles.map((style) => style(props)), extra, className);
  }

  return Object.assign(ntv, { combine });
}
