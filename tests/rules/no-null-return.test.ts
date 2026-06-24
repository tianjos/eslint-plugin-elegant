import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-null-return';

const ruleTester = new RuleTester();

ruleTester.run('no-null-return', rule, {
  valid: [
    { code: 'function find() { return undefined; }' },
    { code: 'function noop() { return; }' },
  ],
  invalid: [
    {
      code: 'function find() { return null; }',
      errors: [{ messageId: 'noNullReturn' }],
    },
    {
      code: 'const find = () => { return null; };',
      errors: [{ messageId: 'noNullReturn' }],
    },
  ],
});
