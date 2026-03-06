# AGENTS.md

## Commands

**Always use `pnpm`, not `npm`**.

```shell
pnpm install          # Install dependencies
pnpm run build        # Clean dist/ and compile with tsc
pnpm run test         # Run all tests (vitest, single-run)
pnpm run lint         # Lint and typecheck with oxlint
pnpm run lint:fix     # Lint and auto-fix
pnpm run format       # Format with oxfmt
pnpm run format:check # Check formatting
pnpm run knip         # Check for unused dependencies/exports
```

There is no single-test filter in the scripts — use `pnpm vitest --run test/ntv.test.ts` or `pnpm vitest --run -t "test name"` to run specific tests.
