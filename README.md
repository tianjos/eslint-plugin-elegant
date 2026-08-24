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

The `recommended` config enables every custom rule plus two native ones,
[`max-params`](https://eslint.org/docs/latest/rules/max-params) and
[`no-else-return`](https://eslint.org/docs/latest/rules/no-else-return).

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
| `elegant/no-else-after-throw`          | custom | An `else` branch when the `then` branch always throws                           | `error`       |
| `elegant/no-interpolated-log-message`  | custom | Log messages built by interpolation or concatenation                            | `error`       |
| `elegant/max-returns`                  | custom | Functions returning from more places than `max`                                 | `warn` (max 3) |
| `max-params`                           | native | Functions declaring more than `max` parameters                                  | `warn` (max 3) |
| `no-else-return`                       | native | An `else` branch when the `then` branch always returns (`allowElseIf: false`)   | `error`       |

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

#### `no-else-after-throw`

When the `then` branch throws, control never reaches what follows, so `else`
carries no information and only deepens nesting. Drop it and let the alternative
sit at the outer level, where it reads as the normal path rather than one of two
symmetric cases:

```ts
// before
if (amount < 0) {
  throw new NegativeAmount(amount);
} else {
  process(amount);
}

// after
if (amount < 0) {
  throw new NegativeAmount(amount);
}
process(amount);
```

A branch counts as always throwing when it is a bare `throw` or a block whose
**last** statement is one. The check does not recurse, which is deliberate: a
block ending in a nested `if` may or may not throw, and there `else` still says
something.

`else if` is flagged too, since the same rewrite applies. The rule has no
options and no autofix — dedenting a block reliably is the formatter's job, not
a linter's.

Its sibling for `return` is the native
[`no-else-return`](https://eslint.org/docs/latest/rules/no-else-return), which
`recommended` enables with `allowElseIf: false` to match. Prefer the native
rule's defaults? Override it in one line:

```js
'no-else-return': 'error',
```

#### `no-interpolated-log-message`

A log message should be a constant, with everything that varies passed as
structured data. This is not a style preference: `` `order ${id} confirmed` ``
produces one distinct message per order, which no aggregator can group, and it
buries `id` inside prose instead of leaving it as a field you can filter on.

```ts
// before — N messages, and the id is not queryable
this.logger.log(`order ${id} confirmed for ${customer}`);

// after — one message, two fields
this.logger.log('order confirmed', { orderId: id, customer });
```

The rule looks only at the **message argument**, which it takes to be the first
argument that is not an object literal. That lands on the message under either
convention — `info(message, data)` as in NestJS and winston, `info(data,
message)` as in pino — so the rule never dictates where your data goes. An
interpolated *later* argument is left alone, since that position is context
rather than the message.

Flagged: template literals with expressions, and `+` concatenation. A plain
identifier passes, so `logger.info(message)` is fine — chasing that would need
type information, which no rule in this plugin requires.

A call counts as logging when the method is a level (`log`, `info`, `warn`,
`error`, `debug`, `verbose`, `trace`, `fatal`) and the receiver is named `logger`
or `log`, whether local or a field (`this.logger.info`). Both lists are widened
with `{ objects: string[], methods: string[] }`:

```js
'elegant/no-interpolated-log-message': ['error', { objects: ['audit'] }],
```

**Known limitation.** When the first argument is an identifier, it is taken for
the message, so pino's error form slips through:

```ts
logger.error(err, `order ${id} failed`); // not reported
```

Telling that apart from `logger.info(message)` needs type information. The case
is pinned by a test so the behaviour is deliberate rather than accidental.

#### `max-returns`

A port of Checkstyle's `ReturnCount`, but not of its threshold. qulice sets it
to `1` — a single exit — which reads well in Java and badly here, because it
outlaws the guard clause that `no-else-after-throw` in this very preset pushes
you towards. Two rules in one config should not disagree.

At `max: 3` the rule stops arguing about single exit and measures sprawl
instead. Two or three guards followed by a final `return` pass; a function
leaving from six different places is the one worth splitting.

```ts
// passes — idiomatic guards
function charge(amount: number): number {
  if (amount < 0) return 0;
  if (amount > limit) return limit;
  return amount;
}
```

Every function gets its own budget, so a callback's exits are never charged to
the function hosting it. Bare `return;` counts — leaving early is leaving,
value or not. An arrow with an expression body has no `return` statement at all
and never trips the rule.

Functions are reported by the name that binds them — a declaration's own, a
method's key, or the `const` or class field holding an arrow — falling back to
`(anonymous)` for an inline callback. Configurable via `{ max: number }`
(default `3`).

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
