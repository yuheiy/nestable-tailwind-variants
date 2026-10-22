# Working in this repository

## Use Vite+

- Run `vp install` before starting work and after pulling remote changes.
- Use `vp run <name>` for scripts in `package.json` and tasks in `vite.config.ts`. `vp <name>` invokes a built-in command, which can behave differently.
- Use `vp run build` to build this library with its TypeScript build script.
- For Vite+ command details, use `vp <command> --help` or read `node_modules/vite-plus/docs`.
- If setup, runtime, or package-manager behavior fails, run `vp env doctor` and include the output when reporting the problem.

## Validate changes

Run these checks before handing off changes.

```sh
vp run check
vp run knip
vp run test
```

Use `vp run test` for the full suite, including type checks, declaration output, and editor completions. `vp test` alone skips the declaration and completion tests.

## Write commit messages

- Use Conventional Commits in the form `type: subject`. Use `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, or `perf` as the type.
- For breaking changes, add `!` before the colon, as in `feat!: remove the deprecated API`.
