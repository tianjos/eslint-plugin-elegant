import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/max-class-methods';

const ruleTester = new RuleTester();

ruleTester.run('max-class-methods', rule, {
  valid: [
    {
      code: 'class Calculator { add() {} subtract() {} }',
      options: [{ max: 2 }],
    },
    {
      code: 'class Order { constructor() {} total() {} confirm() {} }',
      options: [{ max: 2 }],
    },
  ],
  invalid: [
    {
      code: 'class God { a() {} b() {} c() {} }',
      options: [{ max: 2 }],
      errors: [{ messageId: 'tooManyMethods' }],
    },
    {
      code: 'class Service { one() {} two() {} }',
      options: [{ max: 1 }],
      errors: [{ messageId: 'tooManyMethods' }],
    },
  ],
});
