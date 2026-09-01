import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-generic-error';

const ruleTester = new RuleTester();

ruleTester.run('no-generic-error', rule, {
  valid: [
    {
      name: 'a named exception is the whole point',
      code: "function find(): void { throw new ProposalNotFound(id); }",
    },
    {
      name: 'rethrowing preserves whatever the original was',
      code: 'function run(): void { try { work(); } catch (error) { log(error); throw error; } }',
    },
    {
      name: 'a factory decides which exception to build',
      code: 'function parse(raw: string): void { throw invalidRow(raw); }',
    },
    {
      name: 'a subclass of Error is a named exception',
      code: "class ProposalNotFound extends Error {} function find(): void { throw new ProposalNotFound('x'); }",
    },
    {
      name: 'building an Error without throwing it is another rule\'s business',
      code: "function reject(): Promise<never> { return Promise.reject(new Error('nope')); }",
    },
  ],
  invalid: [
    {
      name: 'TypeError is as anonymous as Error',
      code: "function coerce(value: unknown): void { throw new TypeError('not a number'); }",
      errors: [{ messageId: 'genericError', data: { name: 'TypeError' } }],
    },
    {
      name: 'throwing the built-in Error says nothing a caller can act on',
      code: "function publish(): void { throw new Error('RETRY_BATCH_QUEUE_URL not configured'); }",
      errors: [{ messageId: 'genericError', data: { name: 'Error' } }],
    },
  ],
});
