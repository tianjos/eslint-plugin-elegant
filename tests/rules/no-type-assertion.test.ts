import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-type-assertion';

const ruleTester = new RuleTester();

ruleTester.run('no-type-assertion', rule, {
  valid: [
    { code: 'const palette = ["red", "green"] as const;' },
    { code: 'const total: number = compute();' },
  ],
  invalid: [
    {
      code: 'const id = value as string;',
      errors: [{ messageId: 'noAssertion' }],
    },
    {
      code: 'const id = <string>value;',
      errors: [{ messageId: 'noAssertion' }],
    },
  ],
});
