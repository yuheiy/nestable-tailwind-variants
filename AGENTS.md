# Development Workflow

**Always use `pnpm`, not `npm`**.

```sh
# 1. Make changes

# 2. Typecheck
pnpm run typecheck

# 3. Run tests
pnpm run test

# 4. Detect dead code and types
pnpm run knip
```

# Commit Message Guidelines

This project follows Conventional Commits.

## Rules

1. All messages MUST be in English
2. Use imperative mood ("add" not "added")
3. **IMPORTANT**: Subject appears directly in CHANGELOG - be clear and specific

## Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Test changes
- `chore`: Maintenance (dependencies, build config)
- `ci`: CI/CD changes

## Breaking Changes

Indicate with `!` and `BREAKING CHANGE:` in footer:

```
refactor!: remove mergeNtvWithOptions in favor of mergeNtv options parameter

BREAKING CHANGE: mergeNtvWithOptions has been removed. Pass options directly to mergeNtv as the last argument instead.
```
