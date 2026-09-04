import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import plugin from '../src/index';

/**
 * The published package is a single CommonJS build that has to load through
 * `require`, through `require(...).default`, and through an ESM
 * `import elegant from ...`. That works by way of `export =` plus a
 * self-reference assigned at the bottom of src/index.ts — a shape that would
 * break silently under a change to tsconfig's module target or to the exports
 * map, on the consumer's machine rather than here.
 *
 * These run real Node against dist/ rather than the TypeScript sources, since
 * the interop being checked exists only after compilation. What dist reports
 * is compared against the source plugin, so a stale build fails here rather
 * than shipping.
 */
const dist = join(__dirname, '..', 'dist', 'index.js');

const runNode = (type: 'module' | 'commonjs', source: string): string =>
  execFileSync(process.execPath, ['--input-type', type, '-e', source], {
    encoding: 'utf8',
  }).trim();

describe('the built package', () => {
  it('is built before these run', () => {
    expect(existsSync(dist)).toBe(true);
  });

  it('loads through require, and through require().default as the same object', () => {
    const output = runNode(
      'commonjs',
      `const a = require(${JSON.stringify(dist)});
       const b = a.default;
       console.log(JSON.stringify({
         rules: Object.keys(a.rules).length,
         name: a.meta.name,
         version: a.meta.version,
         sameObject: a === b,
         configs: Object.keys(a.configs).sort(),
       }));`,
    );

    expect(JSON.parse(output)).toEqual({
      rules: Object.keys(plugin.rules).length,
      name: plugin.meta.name,
      version: plugin.meta.version,
      sameObject: true,
      configs: ['recommended', 'starter'],
    });
  });

  it('loads through an ESM default import', () => {
    const output = runNode(
      'module',
      `import elegant from ${JSON.stringify(dist)};
       console.log(JSON.stringify({
         rules: Object.keys(elegant.rules).length,
         recommended: Boolean(elegant.configs.recommended.rules),
         starter: Boolean(elegant.configs.starter.rules),
       }));`,
    );

    expect(JSON.parse(output)).toEqual({
      rules: Object.keys(plugin.rules).length,
      recommended: true,
      starter: true,
    });
  });
});
