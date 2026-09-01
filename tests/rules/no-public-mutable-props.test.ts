import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-public-mutable-props';

const ruleTester = new RuleTester();

ruleTester.run('no-public-mutable-props', rule, {
  valid: [
    {
      name: 'parameterProperties: public leaves a private collaborator alone',
      code: 'class Service { constructor(private repo: Repository<Proposal>) {} }',
      options: [{ parameterProperties: 'public' }],
    },
    { code: 'class Money { readonly amount = 0; }' },
    { code: 'class Money { private balance = 0; }' },
  ],
  invalid: [
    {
      name: 'parameterProperties: public keeps the rule to what its name says',
      code: 'class Service { constructor(public repo: Repository<Proposal>) {} }',
      options: [{ parameterProperties: 'public' }],
      errors: [{ messageId: 'mutableProp' }],
    },
    {
      name: 'an injected collaborator that can be reassigned is mutable state, whatever its visibility',
      code: 'class Service { constructor(private repo: Repository<Proposal>) {} }',
      errors: [{ messageId: 'mutableProp' }],
    },

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
