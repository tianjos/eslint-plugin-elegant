import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-null';

const ruleTester = new RuleTester();

ruleTester.run('no-null', rule, {
  valid: [
    // Null in a type position is fine — it is not a value literal.
    { code: 'let value: string | null;' },
    // Direct `return null` is delegated to no-null-return.
    { code: 'function find() { return null; }' },
    { code: 'const empty = undefined;' },
    {
      name: 'a declared type guard narrows null away',
      code: 'const isPresent = <T>(value: T | null): value is T => value !== null;',
    },
    {
      name: 'a guard declared as a function narrows null away',
      code: 'function isSettled(row: Row): row is SettledRow { return row.settledAt !== null; }',
    },
    {
      name: 'an assertion function narrows null away by throwing',
      code: 'function assertDisbursed(row: Row): asserts row is DisbursedRow { if (row.disbursedAt === null) { throw new ContractNotDisbursedError(row.id); } }',
    },
    {
      name: 'null may sit on either side of the comparison',
      code: 'const isPresent = <T>(value: T | null): value is T => null !== value;',
    },
    {
      name: 'a loose comparison narrows null and undefined together',
      code: 'const isPresent = <T>(value: T | null | undefined): value is T => value != null;',
    },
  ],
  invalid: [
    {
      code: 'const value = null;',
      errors: [{ messageId: 'noNull' }],
    },
    {
      code: 'JSON.stringify(data, null, 2);',
      errors: [{ messageId: 'noNull' }],
    },
    {
      code: 'const isNull = x === null;',
      errors: [{ messageId: 'noNull' }],
    },
    {
      name: 'a comparison in a function returning a bare boolean is not a guard',
      code: 'const isMissing = (row: Row): boolean => row.disbursedAt === null;',
      errors: [{ messageId: 'noNull' }],
    },
    {
      name: 'a guard may compare against null, not produce it',
      code: 'const isSettled = (row: Row): row is SettledRow => { const fallback = null; return row.settledAt !== fallback; };',
      errors: [{ messageId: 'noNull' }],
    },
    {
      name: 'a null produced by a ternary inside a guard is still reported',
      code: 'const isPresent = <T>(value: T | null): value is T => (value === null ? null : value) !== undefined;',
      errors: [{ messageId: 'noNull', column: 73 }],
    },
    {
      name: 'a guard does not lend its exemption to a callback inside it',
      code: 'const hasGaps = (rows: Row[]): rows is GappedRow[] => rows.some((row) => row.at === null);',
      errors: [{ messageId: 'noNull' }],
    },
    {
      name: 'guards are held to the same standard when allowTypeGuards is off',
      code: 'const isPresent = <T>(value: T | null): value is T => value !== null;',
      options: [{ allowTypeGuards: false }],
      errors: [{ messageId: 'noNull' }],
    },
  ],
});
