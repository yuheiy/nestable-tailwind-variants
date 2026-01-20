import type { ClassValue } from './types.js';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Resolves conditions from scheme based on provided props to generate class values.
 *
 * $default behavior:
 * - If no conditions match at a level, that level's $default is applied
 * - If a variant matches, only the nested evaluation result is used
 * - When no conditions match, $defaults accumulate from each unmatched level
 */
export function resolveConditions(
  { $default, ...conditions }: Record<string, unknown>,
  props: Record<string, unknown>,
): ClassValue[] {
  const classes: ClassValue[] = [];
  let hasMatchedCondition = false;

  function addClasses(value: unknown): void {
    if (isObject(value)) {
      classes.push(...resolveConditions(value, props));
    } else {
      classes.push(value as ClassValue);
    }
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
        addClasses(value);
      }
      continue;
    }

    // Variant conditions (nested objects)
    if (isObject(value)) {
      if (typeof propValue === 'string' && propValue in value) {
        hasMatchedCondition = true;
        addClasses(value[propValue]);
      } else {
        classes.push(value['$default'] as ClassValue);
      }
    }
  }

  if (!hasMatchedCondition) {
    classes.unshift($default as ClassValue);
  }

  return classes;
}
