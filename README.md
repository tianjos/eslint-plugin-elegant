# @tianjos/eslint-plugin-elegant

[![npm version](https://img.shields.io/npm/v/@tianjos/eslint-plugin-elegant.svg)](https://www.npmjs.com/package/@tianjos/eslint-plugin-elegant)
[![license](https://img.shields.io/npm/l/@tianjos/eslint-plugin-elegant.svg)](./LICENSE)
[![CI](https://github.com/tianjos/eslint-plugin-elegant/actions/workflows/ci.yml/badge.svg)](https://github.com/tianjos/eslint-plugin-elegant/actions/workflows/ci.yml)

Opinionated ESLint rules for **elegant, behavior-rich TypeScript**. The plugin
pushes code toward intention-revealing functions, honest types, and
encapsulated domain models — the kind of constraints that pay off in NestJS
services and DDD-style codebases.

## Install

```bash
npm install --save-dev @tianjos/eslint-plugin-elegant
```

```bash
pnpm add -D @tianjos/eslint-plugin-elegant
```

```bash
yarn add -D @tianjos/eslint-plugin-elegant
```

### Peer dependencies

This plugin does not bundle ESLint or the TypeScript toolchain. Install them
alongside it:

| Peer                          | Required version |
| ----------------------------- | ---------------- |
| `eslint`                      | `>=9`            |
| `typescript`                  | `>=5`            |
| `@typescript-eslint/parser`   | `>=8`            |

```bash
npm install --save-dev eslint typescript @typescript-eslint/parser
```

## Usage

This plugin targets **flat config** (`eslint.config.mjs`). The fastest way to
adopt it is to spread the `recommended` ruleset:

```js
// eslint.config.mjs
import parser from '@typescript-eslint/parser';
import elegant from '@tianjos/eslint-plugin-elegant';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { elegant },
    rules: {
      ...elegant.configs.recommended.rules,
    },
  },
];
```

A complete, copy-pasteable example (including test-file overrides) lives in
[`eslint.config.example.mjs`](./eslint.config.example.mjs).

## Rules

The `recommended` config enables every custom rule plus the native
[`max-params`](https://eslint.org/docs/latest/rules/max-params) rule.

| Rule                                   | Source | What it catches                                                                 | `recommended` |
| -------------------------------------- | ------ | ------------------------------------------------------------------------------- | ------------- |
| `elegant/no-boolean-param`             | custom | Boolean parameters (flag arguments) on functions, methods, and constructors     | `error`       |
| `elegant/max-class-methods`            | custom | Classes with more methods than the configured `max` (constructors excluded)     | `warn` (max 10) |
| `elegant/max-class-dependencies`       | custom | Classes depending on more distinct collaborators than `max` (constructor injections plus `new`) | `warn` (max 4) |
| `elegant/max-class-fields`             | custom | Classes holding more instance fields than `max` (declared fields plus parameter properties) | `warn` (max 5) |
| `elegant/no-type-assertion`            | custom | `value as T` and `<T>value` assertions (`as const` is allowed)                  | `error`       |
| `elegant/no-null-return`               | custom | `return null` statements                                                        | `error`       |
| `elegant/no-public-mutable-props`      | custom | Public, non-`readonly` class properties and public constructor parameter props  | `error`       |
| `elegant/no-logic-in-constructor`      | custom | Any constructor code beyond `this.field = value` stores and a `super(...)` call  | `error`       |
| `elegant/no-getters-setters`           | custom | `get`/`set` accessors (and `getX`/`setX` methods with `{ methods: true }`)        | `error`       |
| `elegant/no-instanceof`                | custom | Use of the `instanceof` operator                                                | `error`       |
| `elegant/no-static-members`            | custom | Static methods, properties, accessors, and blocks (`allowReadonly` to permit constants) | `error` |
| `elegant/no-null`                      | custom | The `null` literal as a value (type annotations and direct `return null` excepted) | `error`     |
| `elegant/no-comments-in-function-body` | custom | Comments inside function bodies (directives and empty blocks excepted)          | `error`       |
| `max-params`                           | native | Functions declaring more than `max` parameters                                  | `warn` (max 3) |

### Rule details

#### `no-boolean-param`

A boolean argument almost always means the callee does two things. Prefer two
intention-revealing functions or an options object. Flags both annotated
(`flag: boolean`) and boolean-defaulted (`flag = false`) parameters.

#### `max-class-methods`

A proxy for the Single Responsibility Principle. Constructors are not counted;
getters and setters are. Configurable via `{ max: number }` (default `10`).

#### `max-class-dependencies`

The coupling counterpart to `max-class-methods`: a class that needs six
collaborators to do its job is coordinating, not modelling. Counts the distinct
types annotated on constructor parameters plus every type instantiated with
`new` inside the class body — so a dependency hidden behind `new HttpClient()`
weighs the same as an injected one.

De-duplication keeps type arguments, so `Repository<Order>` and
`Repository<Customer>` count as two collaborators while the same `Clock`
injected twice counts as one. Nested classes are budgeted independently of their
host.

Three things never count: primitives and inline types (they are not type
references), a default list of ambient built-ins (`Date`, `Map`, `Set`,
`Promise`, `Error`, `Array`, `RegExp`, `URL`, `WeakMap`, `WeakSet`), and
exceptions raised with `throw new ...`. That last exclusion is what makes the
rule usable in NestJS, where `throw new NotFoundException()` is routine and says
nothing about a class's design.

Configurable via `{ max: number, ignore: string[] }` (default `max: 4`).
`ignore` adds to the built-in list — reach for it when an ambient concern such
as `Logger` or `ConfigService` is in every constructor and you would rather not
budget for it:

```js
'elegant/max-class-dependencies': ['warn', { max: 4, ignore: ['Logger'] }],
```

#### `max-class-fields`

The third axis of class size, after methods and collaborators: a class carrying
a dozen fields is a record with a namespace, not a model. Counts instance fields
declared in the body — plain, `abstract`, or `accessor` — plus every constructor
parameter property. Methods and accessors belong to `max-class-methods`, and
`static` members to `no-static-members`, so neither is counted here.

Decorated properties are skipped by default. `@Column`, `@IsString` and
`@ApiProperty` map a field to a table or a payload, so a DTO or an ORM entity
declares one field per column by design and has no business inside a budget:

```ts
class CreateOrderDto {
  @IsString() customerId: string; // not counted
  @IsInt() quantity: number; // not counted
}
```

**The exemption stops at the constructor.** A decorator on a parameter is
injection, not mapping, so `@Inject(TOKEN) private readonly repo: Repo` stays
inside the budget — otherwise a service wired entirely through tokens would
count zero fields, which is exactly the class the rule exists to catch. Set
`{ ignoreDecorated: false }` to budget mapped properties too.

Configurable via `{ max: number, ignoreDecorated: boolean }` (default `max: 5`,
`ignoreDecorated: true`). The default leaves room for the four collaborators
`max-class-dependencies` allows plus one field of genuine state; past that the
two rules deliberately overlap, because a class over both budgets is over-sized
on both axes.

#### `no-type-assertion`

Assertions silence the type checker. Reach for a type guard, a generic, or a
correctly typed value instead. `as const` is permitted because it narrows rather
than widens.

#### `no-null-return`

Keeps absence out of return values; model it with an explicit domain type or
throw.

#### `no-public-mutable-props`

Public state should be `readonly` so callers cannot break an aggregate's
invariants. `private`/`protected` members and `readonly` members are allowed.

#### `no-logic-in-constructor`

A constructor should only wire arguments to fields. Validation, transformation,
and I/O belong in a static factory or a method, keeping object construction
predictable. Parameter properties (`constructor(private readonly x: T)`) and a
leading `super(...)` are allowed; computed right-hand sides (`this.x = x * 2`,
`this.items = items.slice()`) and any non-assignment statement are flagged.

#### `no-getters-setters`

Getters and setters turn objects into data bags; prefer methods that expose
behavior. Native `get`/`set` accessors (and `accessor` fields) are always
flagged. The opt-in `{ methods: true }` option also flags conventional
`getX`/`setX` methods — useful for strict Elegant Objects style, but noisy
around repositories and framework hooks, so it stays off in `recommended`.

#### `no-instanceof`

`instanceof` is type discrimination that belongs inside a polymorphic method on
the object. Pairs with `no-type-assertion` to keep type-based branching out of
the codebase.

#### `no-static-members`

Static state and behavior cannot be injected, substituted, or mocked. Prefer
instances (with dependency injection) and a module-level `const` for shared
values. The `{ allowReadonly: true }` option permits `static readonly`
constants. Note this also flags `static` factory methods (`static create()`),
which are common; relax per-file if your design relies on them.

#### `no-null`

Completes `no-null-return` by banning the `null` literal as a value everywhere
(`const x = null`, `x === null`, `fn(null)`), pushing absence into explicit types
or `undefined`. `null` in type positions (`string | null`) and a direct
`return null` (owned by `no-null-return`) are left alone. This is strict and will
flag idioms like `JSON.stringify(x, null, 2)` — relax it in the files where you
interoperate with null-based APIs.

#### `no-comments-in-function-body`

A comment inside a body is usually a name that never got written: it labels a
run of statements that wanted to be its own function. Move the explanation to a
docblock above the function, or extract what it describes and let the call read
as the sentence the comment was trying to be.

Applies to every function with a block body — methods, constructors, function
declarations, and arrow functions. Comments outside a body are untouched, so
docblocks, module-level notes, and comments between class members are fine. Each
comment is attributed to the innermost function containing it, so one in a
nested arrow is reported once, against that arrow.

Two things are never reported:

- **Directives**, which the toolchain reads rather than a human:
  `eslint-disable*`, `@ts-expect-error`, `@ts-ignore`, `prettier-ignore`,
  `istanbul ignore`, `c8 ignore`, `v8 ignore`, `webpackChunkName`,
  `@vite-ignore`. Extend the list with `{ allow: string[] }` for project
  conventions such as `@codegen`.
- **Comments alone in an empty block**, where there is no code to name and the
  comment is the only thing explaining the silence. The check looks at the
  innermost block, not the function, so an empty `catch` keeps its note even
  inside a busy function:

```ts
function run(): void {
  try {
    go();
  } catch {
    // the failure is expected here
  }
}
```

## Configuration

### Overriding thresholds

`max-class-methods`, `max-class-dependencies`, `max-class-fields`, and the
native `max-params` all take a `max` option:

```js
rules: {
  ...elegant.configs.recommended.rules,
  'elegant/max-class-methods': ['warn', { max: 15 }],
  'elegant/max-class-dependencies': ['warn', { max: 6 }],
  'elegant/max-class-fields': ['warn', { max: 8 }],
  'max-params': ['warn', { max: 4 }],
}
```

### Relaxing rules in test files

Tests routinely use flag arguments and larger fixtures. Add a second config
block scoped to your spec globs:

```js
{
  files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
  rules: {
    'elegant/no-boolean-param': 'off',
    'elegant/max-class-methods': 'off',
    'elegant/max-class-dependencies': 'off',
    'elegant/max-class-fields': 'off',
    'elegant/no-comments-in-function-body': 'off',
    'max-params': 'off',
  },
}
```

## Compatibility

The package ships a single CommonJS build that is consumable as both
`require('@tianjos/eslint-plugin-elegant')` and an ESM
`import elegant from '@tianjos/eslint-plugin-elegant'`. The exported object
exposes `{ meta, rules, configs }`.

## Prior art

This plugin is a TypeScript adaptation of [Elegant Objects](https://www.elegantobjects.org/)
(Yegor Bugayenko) and [qulice](https://github.com/yegor256/qulice) — the Java
quality enforcer that codifies those principles on top of Checkstyle and PMD.
Rules such as `no-logic-in-constructor` (qulice's `ConstructorsCodeFreeCheck`),
`max-class-dependencies` (Checkstyle's `ClassDataAbstractionCoupling`),
`max-class-fields` (PMD's `TooManyFields`),
`no-comments-in-function-body` (`MethodBodyCommentsCheck`), `no-null`,
`no-getters-setters`, and `no-static-members` are ports of that
philosophy. The concepts are reimplemented from scratch against the TypeScript
AST; no qulice code is used.

## License

[MIT](./LICENSE) © Thiago
