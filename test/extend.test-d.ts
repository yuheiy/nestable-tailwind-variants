import { twMerge } from 'tailwind-merge';
import { describe, expectTypeOf, it } from 'vitest';

import { createNtv } from '../src/index.js';

const ntv = createNtv({ twMerge });

describe('extended props', () => {
  it('accepts functions that can be called with one props object', () => {
    ntv.extend(() => 'constant')({})();
    // @ts-expect-error Composition passes a props object, not a primitive.
    ntv.extend((value: string) => value)({});
    // @ts-expect-error Composition cannot supply a second required argument.
    ntv.extend((_props: { tone: string }, required: string) => required)({});
    // @ts-expect-error Every input must return a class string.
    ntv.extend(() => 1)({});
  });

  it('unions shared values and keeps a key required if any function requires it', () => {
    const first = ntv<{ tone: 'primary' }>({});
    const second = ntv<{ tone?: 'secondary' }>({});
    const styles = ntv.extend(first, second)({});
    styles({ tone: 'primary' });
    expectTypeOf<Parameters<typeof styles>[0]['tone']>().toEqualTypeOf<'primary' | 'secondary'>();
    // @ts-expect-error The first function requires tone.
    styles();
  });

  it('retains optional keys across composition and empty or singleton input', () => {
    const first = ntv<{ tone?: 'primary' }>({});
    const second = ntv<{ tone?: 'secondary' }>({});
    const styles = ntv.extend(first, second)({});
    styles();
    expectTypeOf<NonNullable<Parameters<typeof styles>[0]>['tone']>().toEqualTypeOf<
      'primary' | 'secondary' | undefined
    >();
    ntv.extend()({})();
    ntv.extend(first)({})({ tone: 'primary' });
  });

  it('retains required non-style props through repeated and ordinary callable composition', () => {
    const first = ntv<{ count: number; tone?: 'primary' }>({ tone: { primary: 'primary' } });
    const styles = ntv.extend(
      ntv.extend(first)({}),
      (props: { data: { id: number } }) => String(props.data.id),
      () => 'constant',
    )({});
    styles({ count: 1, data: { id: 2 }, tone: 'primary' });
    expectTypeOf<Parameters<typeof styles>[0]['data']>().toEqualTypeOf<{ id: number }>();
    // @ts-expect-error Required props must survive composition.
    styles({ data: { id: 2 } });
    // @ts-expect-error Ordinary callables contribute required props too.
    styles({ count: 1 });
  });

  it('distributes multiple unions and preserves exclusions after repeated composition', () => {
    const state = ntv<{ isPending: boolean } | { isCurrent: boolean }>({});
    const focus = ntv<{ isFocused: boolean; tone?: 'primary' }>({});
    const action = ntv<{ isPressed: boolean } | { allowsRemoval: boolean }>({});
    const styles = ntv.extend(ntv.extend(state, focus)({}), action)({});
    styles({ isPending: true, isFocused: true, isPressed: true });
    styles({ isCurrent: true, isFocused: true, isPressed: true });
    styles({ isPending: true, isFocused: true, allowsRemoval: true });
    styles({ isCurrent: true, isFocused: true, allowsRemoval: true, tone: 'primary' });
    // @ts-expect-error State union members remain exclusive.
    styles({ isPending: true, isCurrent: true, isFocused: true, isPressed: true });
    // @ts-expect-error Action union members remain exclusive.
    styles({ isPending: true, isFocused: true, isPressed: true, allowsRemoval: true });
    // @ts-expect-error Required props from the middle function remain required.
    styles({ isPending: true, isPressed: true });
  });

  it('retains props when functions are spread from an array', () => {
    const sources = [ntv<{ tone: 'primary' }>({}), ntv<{ tone: 'primary' }>({})];
    const styles = ntv.extend(...sources)({});
    styles({ tone: 'primary' });
    // @ts-expect-error Dynamic arrays retain the source prop contract.
    styles({ tone: 'secondary' });
  });

  it('allows a source to contribute a key excluded by another source union branch', () => {
    const state = ntv<{ tone: 'primary' } | { isActive: boolean }>({});
    const tone = ntv<{ tone: 'secondary' }>({});
    const styles = ntv.extend(state, tone)({});
    styles({ tone: 'primary' });
    styles({ tone: 'secondary' });
    styles({ tone: 'secondary', isActive: true });
    // @ts-expect-error primary belongs to the state branch that excludes isActive.
    styles({ tone: 'primary', isActive: true });
  });

  it('checks inherited schemes and merges explicit extension props', () => {
    const base = ntv<{ size: 'sm' | 'lg'; isActive?: boolean }>({});
    const extended = ntv.extend(base)<{ tone?: 'primary'; count: number }>({
      size: { sm: { tone: { primary: 'bg-blue-500' } } },
      tone: { primary: { isActive: 'font-bold' } },
    });
    extended({ size: 'sm', count: 1 });
    // @ts-expect-error Inherited required props remain required.
    extended({ count: 1 });
    // @ts-expect-error New required props remain required.
    extended({ size: 'sm' });
    // @ts-expect-error Unknown inherited keys are rejected without a fallback overload.
    ntv.extend(base)({ isActve: 'invalid' });
    // @ts-expect-error Standalone new extension props require an explicit generic.
    ntv.extend(base)({ tone: { primary: 'invalid' } });
    // @ts-expect-error Inherited choice values remain constrained.
    ntv.extend(base)({ size: { xl: 'invalid' } });
  });

  it('unions values shared by the base and the local scheme props', () => {
    const base = ntv<{ tone: 'primary' }>({});
    const extended = ntv.extend(base)<{ tone?: 'secondary' }>({
      tone: { primary: 'primary', secondary: 'secondary' },
    });
    expectTypeOf<Parameters<typeof extended>[0]['tone']>().toEqualTypeOf<'primary' | 'secondary'>();
    extended({ tone: 'secondary' });
    // @ts-expect-error A required inherited prop stays required.
    extended();
  });

  it('accepts optional callback state when base props are optional', () => {
    type State = { isFocused: boolean; tone: 'primary' };
    const base = ntv<{ isFocused?: boolean }>({ isFocused: 'ring-2' });
    const direct: (state?: State) => string = ntv({});
    const callback: (state?: State) => string = ntv.extend(base)({ tone: { primary: 'primary' } });
    expectTypeOf(direct).returns.toBeString();
    expectTypeOf(callback).returns.toBeString();
    const optionalFields: (state?: Partial<State>) => string = ntv.extend(base)({});
    expectTypeOf(optionalFields).returns.toBeString();
    const explicit = ntv.extend(base)<State>({});
    // @ts-expect-error Explicit required props cannot accept omitted callback state.
    const requiredCallback: (state?: State) => string = explicit;
    expectTypeOf(requiredCallback).returns.toBeString();
  });

  it('extends untyped bases with inherited conditions and explicit props', () => {
    const base = ntv({ tone: { primary: 'primary' } });
    ntv.extend(base)({ tone: { primary: 'extended' } })({ tone: 'primary' });
    const extended = ntv.extend(base)<{ isDisabled?: boolean }>({
      isDisabled: { tone: { primary: 'disabled' } },
    });
    const repeated = ntv.extend(extended, (props: { count: number }) => String(props.count))({});
    repeated({ tone: 'primary', isDisabled: true, count: 1 });
    const sources = [extended, (props: { count: number }) => String(props.count)];
    const spread = ntv.extend(...sources)({});
    spread({ count: 1, isDisabled: true });
    // @ts-expect-error Array composition retains known required props beside an untyped base.
    spread({ isDisabled: true });
    // @ts-expect-error Known required props survive untyped bases and repeated extension.
    repeated({ isDisabled: true });
    // @ts-expect-error Explicit extension props retain their types.
    extended({ isDisabled: 'invalid' });
  });

  it('retains typed index signatures from ordinary callables', () => {
    const styles = ntv.extend((props: Record<string, number>) => String(props['count']))({});
    styles({ count: 1 });
    ntv.extend((props: Record<string, number>) => String(props['count']))({
      // @ts-expect-error Numeric index props cannot define string variant conditions.
      count: { primary: 'invalid' },
    });
    // @ts-expect-error Indexed values retain the source contract.
    styles({ count: 'invalid' });
    // @ts-expect-error An indexed callable still requires its props object.
    styles();
  });

  it('requires callback state to supply required base props', () => {
    const base = ntv<{ count: number; isFocused?: boolean }>({});
    const props: { className: (state: { isFocused: boolean }) => string } = {
      // @ts-expect-error The callback cannot supply the count required by the base.
      className: ntv.extend(base)({ isFocused: 'ring-2' }),
    };
    expectTypeOf(props.className).returns.toBeString();
  });
});
