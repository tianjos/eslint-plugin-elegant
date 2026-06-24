import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-public-mutable-props';

const ruleTester = new RuleTester();

ruleTester.run('no-public-mutable-props', rule, {
  valid: [
    { code: 'class Money { readonly amount = 0; }' },
    { code: 'class Money { private balance = 0; }' },
  ],
  invalid: [
    {
      code: 'class Money { amount = 0; }',
      errors: [{ messageId: 'mutableProp' }],
    },
    {
      code: 'class Account { constructor(public balance: number) {} }',
      errors: [{ messageId: 'mutableProp' }],
    },
  ],
});
