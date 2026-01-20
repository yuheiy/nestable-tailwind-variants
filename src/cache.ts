import { extendTailwindMerge } from 'tailwind-merge';
import type { TwMergeConfig } from './types.js';

type TwMergeFn = ReturnType<typeof extendTailwindMerge>;

const cache = new Map<TwMergeConfig, TwMergeFn>();

export function getCachedTwMerge(config: TwMergeConfig): TwMergeFn {
  let cached = cache.get(config);
  if (!cached) {
    cached = extendTailwindMerge(config);
    cache.set(config, cached);
  }
  return cached;
}
