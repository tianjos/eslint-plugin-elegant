import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-getters-setters';

const ruleTester = new RuleTester();

ruleTester.run('no-getters-setters', rule, {
  valid: [
    {
      code: "class User { private name = ''; fullName(): string { return this.name; } }",
    },
    // `methods` defaults to false, so conventional names are allowed.
    { code: 'class Repo { getById(id: string) { return id; } }' },
  ],
  invalid: [
    {
      code: 'class User { get name() { return this.n; } }',
      errors: [{ messageId: 'accessor' }],
    },
    {
      code: 'class User { set name(value: string) { this.n = value; } }',
      errors: [{ messageId: 'accessor' }],
    },
    {
      code: 'class Repo { getById(id: string) { return id; } }',
      options: [{ methods: true }],
      errors: [{ messageId: 'namedAccessor' }],
    },
    {
      code: 'class User { setName(name: string) { this.n = name; } }',
      options: [{ methods: true }],
      errors: [{ messageId: 'namedAccessor' }],
    },
  ],
});
