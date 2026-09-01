import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-anonymous-param-type';

const ruleTester = new RuleTester();

ruleTester.run('no-anonymous-param-type', rule, {
  valid: [
    {
      name: 'a named type is the whole point of the rule',
      code: 'class Proposals { register(input: RegisterProposal) { return input; } }',
    },
    {
      name: 'primitives are not shapes',
      code: 'function charge(amount: number, currency: string) { return [amount, currency]; }',
    },
    {
      name: 'an unannotated parameter has no shape to inspect',
      code: 'function charge(amount) { return amount; }',
    },
    {
      name: 'a named generic carries no literal of its own',
      code: 'class Rows { ingest(raw: Record<string, unknown>) { return raw; } }',
    },
    {
      name: 'a function expression handed to a call is a callback too',
      code: 'register(function (i: { ccbNumber: string; total: number }) { return i.total; });',
    },
    {
      name: 'an inline callback annotates a value that has no type to borrow',
      code: 'const numbers = res.body.items.map((i: { ccbNumber: string; total: number }) => i.total);',
    },
    {
      name: 'a single-property shape is not yet a bag worth naming',
      code: 'class Rows { asString(opts?: { required?: boolean }) { return opts; } }',
    },
  ],
  invalid: [
    {
      name: 'minMembers: 1 holds a single-property shape to the same standard',
      code: 'class Rows { asString(opts?: { required?: boolean }) { return opts; } }',
      options: [{ minMembers: 1 }],
      errors: [{ messageId: 'anonymousParamType' }],
    },
    {
      name: 'a function declaration is a signature like any other',
      code: 'async function seedCession(args: { cpf: string; originCode: string; amount: number }) { return args; }',
      errors: [
        {
          messageId: 'anonymousParamType',
          data: { name: 'args', count: 3 },
        },
      ],
    },
    {
      name: 'a call signature in type position',
      code: 'type Handler = (params: { action: string; reason: string }) => void;',
      errors: [{ messageId: 'anonymousParamType' }],
    },
    {
      name: 'a method signature on an interface',
      code: 'interface Repo { find(query: { page: number; pageSize: number }): void; }',
      errors: [{ messageId: 'anonymousParamType' }],
    },
    {
      name: 'destructuring in the signature does not hide the bag',
      code: 'function create({ id, name }: { id: string; name: string }) { return [id, name]; }',
      errors: [
        {
          messageId: 'anonymousParamType',
          data: { name: '(destructured)', count: 2 },
        },
      ],
    },
    {
      name: 'a default value does not hide the bag either',
      code: 'function celcoinBody(over: { ccbNumber?: string; eventId?: string } = {}) { return over; }',
      errors: [{ messageId: 'anonymousParamType' }],
    },
    {
      name: 'a parameter reachable through two shapes is reported once',
      code: 'class Rows { pick(row: { a: string; b: string } | { c: string; d: string }) { return row; } }',
      errors: [{ messageId: 'anonymousParamType' }],
    },
    {
      name: 'each offending parameter is reported on its own',
      code: 'class Pools { link(portal: { userPoolId: string; clientId: string }, api: { clientId: string; region: string }) { return [portal, api]; } }',
      errors: [
        { messageId: 'anonymousParamType' },
        { messageId: 'anonymousParamType' },
      ],
    },
    {
      name: 'a constructor parameter property is a field, and its shape is still unnamed',
      code: 'class Client { constructor(private readonly config: { host: string; port: number }) {} }',
      errors: [{ messageId: 'anonymousParamType' }],
    },
    {
      name: 'a shape intersected onto a named type is the unnamed half',
      code: "class Pix { sanitize(data: LookupRequest & { payerId: string; payerName: string }) { return data; } }",
      errors: [{ messageId: 'anonymousParamType' }],
    },
    {
      name: 'a shape in an array type is still an unnamed row',
      code: 'class Reports { chart(rows: { day: string; count: string }[]) { return rows; } }',
      errors: [{ messageId: 'anonymousParamType' }],
    },
    {
      name: 'a shape in a union with null is still unnamed',
      code: 'class Offers { hasAmount(offer: { id: string; amount: number } | null) { return offer; } }',
      errors: [{ messageId: 'anonymousParamType' }],
    },
    {
      name: 'a shape inside a generic argument is still an unnamed row',
      code: 'class Reports { chart(rows: Array<{ day: string; count: string }>) { return rows; } }',
      errors: [
        {
          messageId: 'anonymousParamType',
          data: { name: 'rows', count: 2 },
        },
      ],
    },
    {
      name: 'a method parameter typed as an anonymous shape',
      code: 'class Groups { toResponse(group: { id: string; name: string }) { return group; } }',
      errors: [
        {
          messageId: 'anonymousParamType',
          data: { name: 'group', count: 2 },
        },
      ],
    },
  ],
});
