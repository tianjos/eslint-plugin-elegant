# Contributing

## Development

```bash
npm ci          # install
npm run build   # compile dist/ with tsc
npm test        # run the rule tests (jest + @typescript-eslint/rule-tester)
npm run typecheck
```

Rules live in `src/rules/`, each created through the shared `createRule`
factory in `src/utils/createRule.ts`. Every rule must ship with a matching
test file in `tests/rules/`.

## Releasing

Releases are driven by [`standard-version`](https://github.com/conventional-changelog/standard-version),
which derives the next version from [Conventional Commits](https://www.conventionalcommits.org/),
updates `CHANGELOG.md`, bumps `package.json`, and creates an annotated git tag —
all in one command:

```bash
npm run release           # auto-detect patch/minor/major from commits
npm run release -- --release-as minor
git push --follow-tags origin main
```

Pushing a `v*` tag triggers the publish workflow
(`.github/workflows/publish.yml`), which builds, tests, and runs `npm publish`.

### Commit message conventions

| Prefix             | Bump  |
| ------------------ | ----- |
| `fix:`             | patch |
| `feat:`            | minor |
| `feat!:` / `BREAKING CHANGE:` | major |

The package is published under the `@tianjos` scope with public access
(`publishConfig.access = "public"`).
