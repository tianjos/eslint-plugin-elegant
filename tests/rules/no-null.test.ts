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
  ],
});
