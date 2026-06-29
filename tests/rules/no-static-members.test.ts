import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-static-members';

const ruleTester = new RuleTester();

ruleTester.run('no-static-members', rule, {
  valid: [
    { code: 'class Service { run(): void {} }' },
    {
      code: 'class Config { static readonly MAX = 10; }',
      options: [{ allowReadonly: true }],
    },
  ],
  invalid: [
    {
      code: 'class Factory { static create() { return new Factory(); } }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      code: 'class Config { static MAX = 10; }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      code: 'class Config { static readonly MAX = 10; }',
      errors: [{ messageId: 'staticMember' }],
    },
    {
      code: 'class Bootstrap { static {} }',
      errors: [{ messageId: 'staticMember' }],
    },
  ],
});
