## Commit Conventions

This project follows Conventional Commits. Subject lines appear directly in CHANGELOG.

All messages MUST be in English.

- **Types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `ci`

### Subject

Write for the library consumer, not the code reviewer. Name the affected component or API, and describe the user-visible change — not the implementation.

Good: `fix: $default classes not applied when all boolean conditions are false`
Bad: `fix: fix ntv`
Bad: `feat: refactor mergeNtv to use Map for scheme resolution`

### Breaking Changes

Indicate with `!` and `BREAKING CHANGE:` in footer:

```
refactor!: remove createNtv in favor of direct ntv options

BREAKING CHANGE: Removed `createNtv()`. Pass options directly to `ntv()` as the second argument instead.
```
