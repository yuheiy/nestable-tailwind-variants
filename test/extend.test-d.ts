import { twMerge } from 'tailwind-merge';
import { describe, expectTypeOf, it } from 'vite-plus/test';

import { createNtv } from '../src/index.js';

const ntv = createNtv({ twMerge });
const numericIndex = (props: Record<number, number>) => String(props[0]);
const numericChoiceIndex = (props: Record<number, 1 | 2>) => String(props[0]);
const stringChoiceIndex = (props: Record<string, 'primary'>) => props['tone'] ?? '';

describe('base functions', () => {
  it('accepts zero or one object argument and a string result', () => {
    ntv.extend(() => 'constant')({})();
    // @ts-expect-error Composition passes a props object, not a primitive.
    ntv.extend((value: string) => value)({});
    // @ts-expect-error Composition cannot supply a second required argument.
    ntv.extend((_props: { tone: string }, required: string) => required)({});
    // @ts-expect-error Every input must return a class string.
    ntv.extend(() => 1)({});
  });

  it('excludes caller overrides from the base input contract', () => {
    // @ts-expect-error Bases receive props without class.
    ntv.extend((props: { class: string }) => props.class);
    // @ts-expect-error Bases receive props without className.
    ntv.extend((props: { className: string }) => props.className);
    const styles = ntv.extend((props: { className?: string }) => props.className ?? '')({});
    styles({ className: ['extra', false] });
    // @ts-expect-error Caller overrides remain mutually exclusive.
    styles({ class: 'a', className: 'b' });
  });
});

describe('composed props', () => {
  it('accepts only shared values accepted by every base', () => {
    const first = ntv<{ tone: 'primary' | 'secondary' }>({});
    const styles = ntv.extend(first, (props: { tone?: 'primary' }) => props.tone ?? '')({});
    styles({ tone: 'primary' });
    // @ts-expect-error The second base cannot accept secondary.
    styles({ tone: 'secondary' });
    // @ts-expect-error The first base requires tone.
    styles();
    // @ts-expect-error Incompatible bases fail when the extension is defined.
    ntv.extend(first, (props: { tone: 'quiet' }) => props.tone);
  });

  it('rejects impossible required inputs but retains usable alternatives', () => {
    // @ts-expect-error A required value cannot be both string and number.
    ntv.extend(ntv<{ value: string }>({}), ntv<{ value: number }>({}));
    ntv.extend(ntv<{ value?: string }>({}), ntv<{ value?: number }>({}))({})();
    // @ts-expect-error A named required value must satisfy the other base's index signature.
    ntv.extend(ntv<{ value: string }>({}), (props: Record<string, number>) =>
      String(props['value']),
    );
    const state = ntv<{ state: 'pending'; request: string } | { state: 'ready'; result: number }>(
      {},
    );
    ntv.extend(state, ntv<{ state: 'ready' }>({}))({})({ state: 'ready', result: 1 });
    const sources = [ntv<{ tone: 'primary' }>({}), ntv<{ tone: 'secondary' }>({})];
    // @ts-expect-error Dynamic arrays require a usable input for all their members.
    ntv.extend(...sources);
  });

  it('checks required numeric and symbol keys against index signatures', () => {
    // @ts-expect-error Required numeric values must satisfy the number index signature.
    ntv.extend(numericIndex, (props: { 0: string }) => props[0]);
    // @ts-expect-error Canonical numeric string keys also satisfy the number index signature.
    ntv.extend(numericIndex, (props: { '0': string }) => props['0']);
    ntv.extend(numericIndex, (props: { 0: number }) => String(props[0]))({})({ 0: 1 });
    ntv.extend(numericIndex, (props: { '0': number }) => String(props['0']))({})({ '0': 1 });
    ntv.extend(numericIndex, (props: { '01': string }) => props['01'])({})({ '01': 'value' });
    // @ts-expect-error Non-finite numeric string keys satisfy the number index signature.
    ntv.extend(numericIndex, (props: { Infinity: string }) => props.Infinity);
    // @ts-expect-error Negative infinity also satisfies the number index signature.
    ntv.extend(numericIndex, (props: { '-Infinity': string }) => props['-Infinity']);
    // @ts-expect-error NaN also satisfies the number index signature.
    ntv.extend(numericIndex, (props: { NaN: string }) => props.NaN);
    ntv.extend(numericIndex, (props: { Infinity: number }) => String(props.Infinity))({})({
      Infinity: 1,
    });
    ntv.extend(numericIndex, (props: { 0?: string }) => props[0] ?? '')({})();
    const key = Symbol('key');
    const symbolic = (props: Record<symbol, number>) => String(props[key]);
    // @ts-expect-error Required symbol values must satisfy the symbol index signature.
    ntv.extend(symbolic, (props: { [key]: string }) => props[key]);
    ntv.extend(symbolic, (props: { [key]: number }) => String(props[key]))({})({ [key]: 1 });
    ntv.extend(symbolic, (props: { [key]?: string }) => props[key] ?? '')({})();
    ntv.extend(numericIndex, (props: { 0: string } | { value: string }) =>
      'value' in props ? props.value : props[0],
    )({})({ value: 'value' });
  });

  it('keeps optional props optional with zero, one, or several bases', () => {
    const first = ntv<{ tone?: 'primary' }>({});
    const styles = ntv.extend(first, ntv<{ isActive?: boolean }>({}))({});
    styles();
    styles({ tone: 'primary', isActive: true });
    ntv.extend()({})();
    ntv.extend(first)({})({ tone: 'primary' });
  });

  it('requires every base input through repeated composition and dynamic arrays', () => {
    const count = ntv<{ count: number; tone?: 'primary' }>({});
    const sources = [count, (props: { data: { id: number } }) => String(props.data.id)];
    const styles = ntv.extend(...sources)({});
    const repeated = ntv.extend(styles, () => 'constant')({});
    styles({ count: 1, data: { id: 2 } });
    repeated({ count: 1, data: { id: 2 }, tone: 'primary' });
    // @ts-expect-error A dynamic array retains every required input.
    styles({ count: 1 });
    // @ts-expect-error Repeated composition retains every required input.
    repeated({ data: { id: 2 } });
  });

  it('preserves alternatives within each base input', () => {
    const state = ntv<{ state: 'pending'; request: string } | { state: 'ready'; result: number }>(
      {},
    );
    const styles = ntv.extend(state, ntv<{ isFocused: boolean }>({}))({});
    styles({ state: 'pending', request: 'id', isFocused: true });
    styles({ state: 'ready', result: 1, isFocused: true });
    // @ts-expect-error The selected union member requires its own data.
    styles({ state: 'pending', result: 1, isFocused: true });
    // @ts-expect-error A separate base still requires its props.
    styles({ state: 'ready', result: 1 });
  });

  it('keeps union members exclusive through repeated composition', () => {
    const state = ntv<{ isPending: boolean } | { isCurrent: boolean }>({});
    const action = ntv<{ isPressed: boolean } | { allowsRemoval: boolean }>({});
    const styles = ntv.extend(ntv.extend(state, ntv<{ isFocused: boolean }>({}))({}), action)({});
    styles({ isPending: true, isFocused: true, isPressed: true });
    styles({ isCurrent: true, isFocused: true, allowsRemoval: true });
    // @ts-expect-error State alternatives remain exclusive without explicit never properties.
    styles({ isPending: true, isCurrent: true, isFocused: true, isPressed: true });
    // @ts-expect-error Action alternatives remain exclusive after repeated composition.
    styles({ isPending: true, isFocused: true, isPressed: true, allowsRemoval: true });
  });

  it('retains known required props beside index signatures', () => {
    interface Props {
      tone: 'primary';
      [key: string]: unknown;
    }
    const first = ntv.extend((props: Props) => props.tone)({ tone: { primary: 'primary' } });
    const styles = ntv.extend(first)<{ isActive?: boolean }>({ isActive: 'active' });
    styles({ tone: 'primary', isActive: true, count: 1 });
    // @ts-expect-error An index signature does not erase a known required prop.
    styles({ isActive: true });
    // @ts-expect-error Known props retain their declared value types.
    styles({ tone: 'secondary' });
    const numeric = ntv.extend((props: Record<string, number>) => String(props['count']))({});
    numeric();
    numeric({ count: 1 });
    ntv.extend((props: Record<string, number>) => String(props['count']))({
      // @ts-expect-error Numeric index values cannot define style conditions.
      count: { primary: 'invalid' },
    });
    // @ts-expect-error Index signatures retain their value types.
    numeric({ count: 'invalid' });
  });
});

describe('extension schemes', () => {
  it('checks inherited keys and adds explicit local props', () => {
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
    // @ts-expect-error Unknown inherited keys are rejected.
    ntv.extend(base)({ isActve: 'invalid' });
    // @ts-expect-error New props need a type argument or callback context.
    ntv.extend(base)({ tone: { primary: 'invalid' } });
    // @ts-expect-error Inherited choice values remain constrained.
    ntv.extend(base)({ size: { xl: 'invalid' } });
  });

  it('rejects wider local values when the extension is defined', () => {
    const base = ntv<{ tone: 'primary' }>({});
    // @ts-expect-error The local declaration includes a value the base cannot accept.
    ntv.extend(base)<{ tone?: 'primary' | 'secondary' }>({});
    // @ts-expect-error Disjoint local values fail at definition too.
    ntv.extend(base)<{ tone: 'secondary' }>({});
    // @ts-expect-error Explicit null widens the declared value domain.
    ntv.extend(base)<{ tone?: 'primary' | null }>({});
    // @ts-expect-error Explicit undefined also widens the declared value domain.
    ntv.extend(base)<{ tone?: 'primary' | undefined }>({});
    const broad = ntv<{ tone: 'primary' | 'secondary' }>({});
    ntv.extend(broad)<{ tone: 'primary' }>({})({ tone: 'primary' });
    const extended = ntv.extend(base)<{ tone?: 'primary'; isActive?: boolean }>({
      tone: { primary: 'primary' },
      isActive: 'active',
    });
    extended({ tone: 'primary', isActive: true });
    // @ts-expect-error The base still requires tone.
    extended();
  });

  it('checks local values against inherited index signatures in both directions', () => {
    const named = ntv<{ tone?: 'primary' }>({});
    // @ts-expect-error A named local value cannot widen an inherited string index value.
    ntv.extend(stringChoiceIndex)<{ tone?: 'primary' | 'secondary' }>({});
    // @ts-expect-error A local string index value cannot widen an inherited named value.
    ntv.extend(named)<Record<string, 'primary' | 'secondary'>>({});
    // @ts-expect-error A local string index value cannot widen an inherited string index value.
    ntv.extend(stringChoiceIndex)<Record<string, 'primary' | 'secondary'>>({});
    ntv.extend(stringChoiceIndex)<{ tone?: 'primary' }>({})({ tone: 'primary' });
    ntv.extend(named)<Record<string, 'primary'>>({})({ tone: 'primary' });
    // @ts-expect-error A named local value cannot widen an inherited number index value.
    ntv.extend(numericChoiceIndex)<{ 0?: 1 | 3 }>({});
    // @ts-expect-error Numeric string keys also inherit number index values.
    ntv.extend(numericChoiceIndex)<{ '0'?: 1 | 3 }>({});
    // @ts-expect-error Local number index values cannot widen inherited numeric string keys.
    ntv.extend((props: { '0'?: 1 }) => String(props['0']))<Record<number, 1 | 2>>({});
    ntv.extend(numericChoiceIndex)<{ 0?: 1 }>({})({ 0: 1 });
    ntv.extend(numericChoiceIndex)<{ '0'?: 1 }>({})({ '0': 1 });
    ntv.extend(numericChoiceIndex)<{ '01'?: string }>({})({ '01': 'value' });
    // @ts-expect-error Non-finite numeric string keys inherit number index values.
    ntv.extend(numericChoiceIndex)<{ Infinity?: 1 | 3 }>({});
    // @ts-expect-error Negative infinity inherits number index values.
    ntv.extend(numericChoiceIndex)<{ '-Infinity'?: 1 | 3 }>({});
    // @ts-expect-error NaN inherits number index values.
    ntv.extend(numericChoiceIndex)<{ NaN?: 1 | 3 }>({});
    ntv.extend(numericChoiceIndex)<{ Infinity?: 1 }>({})({ Infinity: 1 });
    ntv.extend(numericChoiceIndex)<{ '-0'?: string }>({})({ '-0': 'value' });
    ntv.extend(numericChoiceIndex)<Record<number, 1>>({})({ 0: 1 });
    // @ts-expect-error A local string index value cannot widen an inherited number index value.
    ntv.extend(numericChoiceIndex)<Record<string, 1 | 3>>({});
    ntv.extend(numericChoiceIndex)<Record<string, 1>>({})({ 0: 1 });
    // @ts-expect-error A local number index value cannot widen an inherited string index value.
    ntv.extend(stringChoiceIndex)<Record<number, 'primary' | 'secondary'>>({});
    ntv.extend(stringChoiceIndex)<Record<number, 'primary'>>({})({ 0: 'primary' });
    const key = Symbol('key');
    const symbolic = (props: Record<symbol, 1 | 2>) => String(props[key]);
    // @ts-expect-error A named local symbol value cannot widen an inherited symbol index value.
    ntv.extend(symbolic)<{ [key]?: 1 | 3 }>({});
    // @ts-expect-error Local symbol index values cannot widen inherited named symbol values.
    ntv.extend((props: { [key]?: 1 }) => String(props[key]))<Record<symbol, 1 | 2>>({});
    ntv.extend(symbolic)<{ [key]?: 1 }>({})({ [key]: 1 });
    ntv.extend(symbolic)<Record<symbol, 1>>({})({ [key]: 1 });
  });

  it('extends untyped bases while preserving explicit props', () => {
    const base = ntv({ tone: { primary: 'primary' } });
    ntv.extend(base)({ tone: { primary: 'extended' } });
    const extended = ntv.extend(base)<{ isDisabled?: boolean }>({
      isDisabled: { tone: { primary: 'disabled' } },
      $default: { tone: { $default: { size: { sm: 'small' } } } },
    });
    ntv.extend(base)<{ isDisabled?: boolean }>({
      // @ts-expect-error Open schemes still check known boolean conditions.
      isDisabled: 123,
    });
    ntv.extend(base)<{ tone?: 'primary' }>({
      // @ts-expect-error Open schemes still check known variant choices.
      tone: { secondary: 'invalid' },
    });
    const repeated = ntv.extend(extended, (props: { count: number }) => String(props.count))({});
    repeated({ tone: 'primary', isDisabled: true, count: 1 });
    // @ts-expect-error Required props survive an untyped base.
    repeated({ isDisabled: true });
    // @ts-expect-error Explicit props retain their types beside an index signature.
    extended({ isDisabled: 'invalid' });
  });

  it('infers optional callback state only when base props permit it', () => {
    type State = { isFocused: boolean; tone: 'primary' };
    const base = ntv<{ isFocused?: boolean }>({ isFocused: 'ring-2' });
    const callback: (state?: State) => string = ntv.extend(base)({ tone: { primary: 'primary' } });
    expectTypeOf(callback).returns.toBeString();
    const explicit = ntv.extend(base)<State>({});
    // @ts-expect-error Explicit required props need callback state.
    const requiredCallback: (state?: State) => string = explicit;
    expectTypeOf(requiredCallback).returns.toBeString();
    const required = ntv<{ count: number; isFocused?: boolean }>({});
    // @ts-expect-error The callback cannot supply count.
    const missing: (state: State) => string = ntv.extend(required)({ isFocused: 'ring-2' });
    expectTypeOf(missing).returns.toBeString();
  });
});
