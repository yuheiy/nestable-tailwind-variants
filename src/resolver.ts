import type { ClassValue } from './types.js';
import { isPlainObject } from './utils.js';

/**
 * Resolves conditions from scheme based on provided props to generate class values.
 *
 * $default behavior:
 * - If no conditions match at a level, that level's $default is applied
 * - If a variant matches, only the nested evaluation result is used
 * - When no conditions match, $defaults accumulate from each unmatched level
 */
export function resolveConditions(
  { $base, $default, ...conditions }: Record<string, unknown>,
  props: Record<string, unknown>,
): ClassValue[] {
  const classes: ClassValue[] = [];
  let hasMatchedCondition = false;

  function toClassValues(value: unknown): ClassValue[] {
    return isPlainObject(value) ? resolveConditions(value, props) : [value as ClassValue];
  }

  for (const [key, value] of Object.entries(conditions)) {
    const propValue = props[key];

    if (propValue === '$default') {
      throw new Error(
        `The value "$default" cannot be passed as a runtime value for "${key}". "$default" is a reserved keyword.`,
      );
    }

    // Boolean conditions (isXxx or allowsXxx)
    if (/^is[A-Z]/.test(key) || /^allows[A-Z]/.test(key)) {
      if (propValue) {
        hasMatchedCondition = true;
        classes.push(...toClassValues(value));
      }
      continue;
    }

    // Variant conditions (nested objects)
    if (isPlainObject(value)) {
      const matched = typeof propValue === 'string' && propValue in value;
      if (matched) {
        hasMatchedCondition = true;
      }
      classes.push(...toClassValues(value[matched ? propValue : '$default']));
    }
  }

  if (!hasMatchedCondition) {
    classes.unshift($default as ClassValue);
  }

  classes.unshift($base as ClassValue);

  return classes;
}
