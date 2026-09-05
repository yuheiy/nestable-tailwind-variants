import { twMerge } from 'tailwind-merge';
import { describe, expectTypeOf, it } from 'vitest';

import { createNtv } from '../src/index.js';

const ntv = createNtv({ twMerge });

describe('combined props', () => {
  it('accepts functions that can be called with one props object', () => {
    ntv.combine(() => 'constant')();
    // @ts-expect-error Composition passes a props object, not a primitive.
    ntv.combine((value: string) => value);
    // @ts-expect-error Composition cannot supply a second required argument.
    ntv.combine((_props: { tone: string }, required: string) => required);
    // @ts-expect-error Every input must return a class string.
    ntv.combine(() => 1);
  });

  it('unions shared values and keeps a key required if any function requires it', () => {
    const first = ntv<{ tone: 'primary' }>({});
    const second = ntv<{ tone?: 'secondary' }>({});
    const styles = ntv.combine(first, second);
    styles({ tone: 'primary' });
    expectTypeOf<Parameters<typeof styles>[0]['tone']>().toEqualTypeOf<'primary' | 'secondary'>();
    // @ts-expect-error The first function requires tone.
    styles();
  });

  it('retains optional keys across composition and empty or singleton input', () => {
    const first = ntv<{ tone?: 'primary' }>({});
    const second = ntv<{ tone?: 'secondary' }>({});
    const styles = ntv.combine(first, second);
    styles();
    expectTypeOf<NonNullable<Parameters<typeof styles>[0]>['tone']>().toEqualTypeOf<
      'primary' | 'secondary' | undefined
    >();
    ntv.combine()();
    ntv.combine(first)({ tone: 'primary' });
  });

  it('retains required non-style props through repeated and ordinary callable composition', () => {
    const first = ntv<{ count: number; tone?: 'primary' }>({ tone: { primary: 'primary' } });
    const styles = ntv.combine(
      ntv.combine(first),
      (props: { data: { id: number } }) => String(props.data.id),
      () => 'constant',
    );
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
    const styles = ntv.combine(ntv.combine(state, focus), action);
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
    const styles = ntv.combine(...sources);
    styles({ tone: 'primary' });
    // @ts-expect-error Dynamic arrays retain the source prop contract.
    styles({ tone: 'secondary' });
  });

  it('allows a source to contribute a key excluded by another source union branch', () => {
    const state = ntv<{ tone: 'primary' } | { isActive: boolean }>({});
    const tone = ntv<{ tone: 'secondary' }>({});
    const styles = ntv.combine(state, tone);
    styles({ tone: 'primary' });
    styles({ tone: 'secondary' });
    styles({ tone: 'secondary', isActive: true });
    // @ts-expect-error primary belongs to the state branch that excludes isActive.
    styles({ tone: 'primary', isActive: true });
  });
});
