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
    {
      name: 'a non-null assertion overrides the checker the same way `as` does',
      code: 'const rate = origin.subsequentRate!;',
      errors: [{ messageId: 'nonNullAssertion' }],
    },
    {
      name: 'the operator is reported wherever it sits, not only in a declaration',
      code: 'function rate(origin: Origin): number { return origin.subsequentRate!; }',
      errors: [{ messageId: 'nonNullAssertion' }],
    },
  ],
});
