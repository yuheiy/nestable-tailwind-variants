import { defineConfig } from 'vite-plus';

export default defineConfig({
  staged: {
    '*': 'vp fmt --no-error-on-unmatched-pattern',
    '*.{js,jsx,ts,tsx,mjs,cjs}': 'vp lint',
  },
  fmt: {
    sortImports: {},
    singleQuote: true,
  },
  lint: {
    ignorePatterns: ['test/declarations/fixtures/**', 'test/completions/fixture.tsx'],
    categories: {
      correctness: 'error',
      perf: 'error',
      suspicious: 'error',
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    jsPlugins: [
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
  },
});
