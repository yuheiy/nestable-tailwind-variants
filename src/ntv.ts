import type {
  AnyStyle,
  BaseProps,
  CheckedBases,
  ClassProps,
  ClassValue,
  Conditions,
  Extension,
  Ntv,
  Options,
} from './types.js';

function isConditions(value: ClassValue | Conditions): value is Conditions {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolve(value: ClassValue | Conditions, props: Record<string, unknown>): ClassValue {
  if (!isConditions(value)) return value;

  const { $base, $default } = value;
  const classes: ClassValue[] = [];
  let matchedBoolean = false;

  for (const key of Object.keys(value)) {
    if (key === '$base' || key === '$default') continue;

    const branch = value[key];
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

export function createNtv({ twMerge }: Options): Ntv {
  function construct(
    scheme: Conditions,
    bases: readonly ((props: Record<string, unknown>) => string)[] = [],
  ) {
    for (const key of ['class', 'className']) {
      if (key in scheme) {
        throw new Error(`The "${key}" property is not allowed in ntv scheme. Use "$base" instead.`);
      }
    }

    return ({ class: class_, className, ...props }: Record<string, unknown> & ClassProps = {}) =>
      twMerge(...bases.map((base) => base(props)), resolve(scheme, props), class_, className);
  }

  function extend<const F extends readonly AnyStyle[]>(
    ...bases: F & NoInfer<CheckedBases<F>>
  ): Extension<BaseProps<F>>;
  function extend(...bases: ((props: Record<string, unknown>) => string)[]) {
    return (scheme: Conditions) => construct(scheme, bases);
  }

  return Object.assign(construct, { extend });
}
