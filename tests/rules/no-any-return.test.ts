import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-any-return';

const ruleTester = new RuleTester();

ruleTester.run('no-any-return', rule, {
  valid: [
    {
      name: '`unknown` hands the caller a value it still has to narrow',
      code: 'function readJson(response: Response): unknown { return response.json(); }',
    },
    {
      name: 'a concrete return type is the point of the rule',
      code: 'function rate(origin: Origin): number { return origin.initialRate; }',
    },
    {
      name: 'a generic return is the caller\'s claim, made in the caller\'s types',
      code: 'function request<T>(path: string): Promise<T> { return fetch(path); }',
    },
    {
      name: 'a parameter typed `any` is a different defect, owned by no-explicit-any',
      code: 'function log(payload: any): void { console.log(payload); }',
    },
    {
      name: 'a variable annotated `any` never crosses a function boundary',
      code: 'const cached: any = load();',
    },
    {
      name: '`any` nested in a type argument that is not the awaited value',
      code: 'function keys(record: Record<string, any>): string[] { return Object.keys(record); }',
    },
  ],
  invalid: [
    {
      name: 'a function declaration returning `any` widens without saying so',
      code: 'function readJson(response: Response): any { return response.json(); }',
      errors: [{ messageId: 'anyReturn' }],
    },
    {
      name: 'an arrow function is the shape the laundering usually takes',
      code: 'const readJson = async (response: Response): Promise<any> => response.json();',
      errors: [{ messageId: 'anyReturn' }],
    },
    {
      name: 'a method is no different from a free function',
      code: 'class Client { private parse(body: string): any { return JSON.parse(body); } }',
      errors: [{ messageId: 'anyReturn' }],
    },
    {
      name: 'an interface method signature declares the same contract',
      code: 'interface Parser { parse(body: string): any; }',
      errors: [{ messageId: 'anyReturn' }],
    },
    {
      name: 'a function type alias declares it too',
      code: 'type Parse = (body: string) => any;',
      errors: [{ messageId: 'anyReturn' }],
    },
  ],
});
