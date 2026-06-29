# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] - 2026-06-29

### Fixed

- Each rule's `meta.docs.url` pointed at a non-existent `docs/rules/<name>.md`
  page (a 404 in ESLint output and IDEs). The URLs now resolve to the matching
  rule section in the README, and the "Rule details" entries became per-rule
  headings so the anchors are stable.

## [0.3.1] - 2026-06-29

### Changed

- CI/tooling only (no changes to rules or published runtime): the publish
  workflow now runs `npm publish --ignore-scripts` to avoid repeating the
  build/test already run as explicit steps, and the GitHub Actions
  (`actions/checkout`, `actions/setup-node`) were bumped off the deprecated
  Node 20 runtime.

## [0.3.0] - 2026-06-29

### Added

- **`no-static-members`** — disallows static methods, properties, accessors, and
  static blocks (the `{ allowReadonly: true }` option permits `static readonly`
  constants). Enabled as `error` in the `recommended` config.
- **`no-null`** — disallows the `null` literal as a value anywhere except inside
  type annotations; direct `return null` remains owned by `no-null-return`.
  Enabled as `error` in the `recommended` config.

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

[Unreleased]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.3.2...HEAD
[0.3.2]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tianjos/eslint-plugin-elegant/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tianjos/eslint-plugin-elegant/releases/tag/v0.1.0
