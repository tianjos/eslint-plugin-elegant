import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-instanceof';

const ruleTester = new RuleTester();

ruleTester.run('no-instanceof', rule, {
  valid: [
    { code: 'if (shape.isRound()) { draw(); }' },
    { code: 'const kind = typeof value;' },
  ],
  invalid: [
    {
      code: 'if (shape instanceof Circle) { draw(); }',
      errors: [{ messageId: 'noInstanceof' }],
    },
    {
      code: 'const isError = value instanceof Error;',
      errors: [{ messageId: 'noInstanceof' }],
    },
  ],
});
