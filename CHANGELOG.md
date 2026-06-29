# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-06-29

### Added

- **`no-logic-in-constructor`** — disallows logic in constructors, allowing only
  `this.field = value` stores and a `super(...)` call (inspired by qulice's
  `ConstructorsCodeFreeCheck` / the Elegant Objects "code-free constructors"
  principle). Enabled as `error` in the `recommended` config.
- **`no-getters-setters`** — disallows `get`/`set` accessors (and, with
  `{ methods: true }`, `getX`/`setX`-style methods), which expose objects as data
  bags. Enabled as `error` in the `recommended` config (accessors only by default).
- **`no-instanceof`** — disallows the `instanceof` operator; type discrimination
  should be replaced by polymorphism. Enabled as `error` in the `recommended` config.

## [0.1.0] - 2026-06-24

### Added

- Initial release with a `recommended` flat config and five custom TypeScript rules:
  - **`no-boolean-param`** — disallows boolean parameters (flag arguments) on functions, methods, and constructors.
  - **`max-class-methods`** — enforces a configurable maximum number of methods per class (default `10`, constructors excluded).
  - **`no-type-assertion`** — disallows `as` and `<T>` type assertions; `as const` is permitted.
  - **`no-null-return`** — disallows `return null`.
  - **`no-public-mutable-props`** — disallows public mutable class properties, including public constructor parameter properties.
- `recommended` config wiring the five rules plus the native `max-params` rule (max `3`).

[Unreleased]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tianjos/eslint-plugin-elegant/releases/tag/v0.1.0
