import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-self-mutation';

const ruleTester = new RuleTester();

ruleTester.run('no-self-mutation', rule, {
  valid: [
    {
      name: 'a top-level write has no object and no constructor to look for',
      code: 'this.token = "x";',
    },
    {
      name: 'an old-style constructor function is building, not mutating',
      code: 'function Money(amount) { this.amount = amount; }',
    },
    {
      name: 'writing to another object is that object\'s business',
      code: 'class Cache { store(box: Box, value: string): void { box.value = value; } }',
    },
    {
      name: 'a computed write names no field and belongs to other rules',
      code: 'class Bag { set(key: string, value: string): void { this[key] = value; } }',
    },
    {
      name: 'a local is not the object',
      code: 'class Auth { refresh(): void { let token = read(); token = token.trim(); use(token); } }',
    },
    {
      name: 'a Nest lifecycle hook is construction the framework runs late',
      code: 'class Monitor { private timer: Timer | undefined; onModuleInit(): void { this.timer = setInterval(tick, 1000); } }',
    },
    {
      name: 'the teardown half of the same lifecycle',
      code: 'class Monitor { private timer: Timer | undefined; onModuleDestroy(): void { this.timer = undefined; } }',
    },
    {
      name: 'the constructor is where an object is built',
      code: 'class Auth { private token: string; constructor(token: string) { this.token = token; } }',
    },
  ],
  invalid: [
    {
      name: 'a callback the constructor schedules runs after construction returned',
      code: 'class Auth { private token = ""; constructor() { setTimeout(() => { this.token = load(); }, 0); } }',
      errors: [{ messageId: 'mutatesSelf' }],
    },
    {
      name: 'an arrow inside a method is still the method mutating its object',
      code: 'class Auth { private token = ""; refresh(): void { fetchToken().then((next) => { this.token = next; }); } }',
      errors: [{ messageId: 'mutatesSelf' }],
    },
    {
      name: 'a lazily built singleton is state with a lifecycle',
      code: 'class Logger { private client: Client | null = null; private connect(): Client { this.client = new Client(); return this.client; } }',
      errors: [{ messageId: 'mutatesSelf' }],
    },
    {
      name: 'allowedMethods: [] holds the lifecycle hooks to the same standard',
      code: 'class Monitor { private timer: Timer | undefined; onModuleInit(): void { this.timer = setInterval(tick, 1000); } }',
      options: [{ allowedMethods: [] }],
      errors: [{ messageId: 'mutatesSelf' }],
    },
    {
      name: 'an increment is a write like any other',
      code: 'class Counter { private count = 0; tick(): void { this.count += 1; } }',
      errors: [{ messageId: 'mutatesSelf' }],
    },
    {
      name: 'a post-increment is a write like any other',
      code: 'class Counter { private count = 0; tick(): void { this.count++; } }',
      errors: [{ messageId: 'mutatesSelf' }],
    },
    {
      name: 'a method writing to a field of its own object',
      code: 'class Auth { private token: string; refresh(next: string): void { this.token = next; } }',
      errors: [{ messageId: 'mutatesSelf', data: { name: 'token' } }],
    },
  ],
});
