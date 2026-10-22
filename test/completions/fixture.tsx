import { createNtv } from '../../src/index.js';

const ntv = createNtv({ twMerge: () => '' });
type State = { isDisabled: boolean; isFocused: boolean; tone: 'primary' | 'secondary' };
type Props = { className?: string | ((state: State) => string) };
const base = ntv<{ size?: 'sm' | 'lg' }>({});

export const directChoice: Props = {
  className: ntv({ tone: { primary: {/* direct-choice */} } }),
};
export const extendedDefault: Props = {
  className: ntv.extend(base)({ $default: {/* extended-default */} }),
};
export const inherited = ntv.extend(base)({/* inherited */});
export const choiceValues: Props = {
  className: ntv.extend(base)({ tone: {/* choice-values */} }),
};

declare function Checkbox(props: Props): null;
export const directJsx = <Checkbox className={ntv({ isDisabled: {/* direct-jsx */} })} />;
export const extendedJsx = (
  <Checkbox className={ntv.extend(base)({ isDisabled: {/* extended-jsx */} })} />
);

export const optionalCallback: (state?: State) => string = ntv.extend(base)({
  $default: {/* optional-callback */},
});
