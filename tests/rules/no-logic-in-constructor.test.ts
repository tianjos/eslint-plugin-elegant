import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-logic-in-constructor';

const ruleTester = new RuleTester();

ruleTester.run('no-logic-in-constructor', rule, {
  valid: [
    // Parameter properties: the most code-free form of all.
    { code: 'class Money { constructor(private readonly amount: number) {} }' },
    // Plain stores, including a super() call.
    {
      code: 'class Account { private balance: number; constructor(balance: number) { this.balance = balance; } }',
    },
    {
      code: 'class Savings extends Account { private rate: number; constructor(balance: number, rate: number) { super(balance); this.rate = rate; } }',
    },
  ],
  invalid: [
    {
      code: 'class Service { constructor() { this.init(); } }',
      errors: [{ messageId: 'statement' }],
    },
    {
      code: 'class Money { private amount: number; constructor(amount: number) { if (amount < 0) { this.amount = 0; } } }',
      errors: [{ messageId: 'statement' }],
    },
    {
      code: 'class Money { private amount: number; constructor(amount: number) { this.amount = amount * 2; } }',
      errors: [{ messageId: 'computation' }],
    },
    {
      code: 'class Basket { private items: number[]; constructor(items: number[]) { this.items = items.slice(); } }',
      errors: [{ messageId: 'computation' }],
    },
  ],
});
