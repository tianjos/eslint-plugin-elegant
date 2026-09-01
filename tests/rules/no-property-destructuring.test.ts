import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-property-destructuring';

const ruleTester = new RuleTester();

ruleTester.run('no-property-destructuring', rule, {
  valid: [
    {
      name: 'a parameter pattern is the signature, not a copy of an object in hand',
      code: 'function create({ id, name }) { return register(id, name); }',
    },
    {
      name: 'a loop binding names each element rather than reaching into one object',
      code: 'for (const { id, total } of rows) { emit(id, total); }',
    },
    {
      name: 'a catch binding has no object to ask',
      code: 'try { charge(); } catch ({ message }) { log(message); }',
    },
    {
      name: 'the result of an awaited call was never an object in hand',
      code: 'const { csvContent, filename } = await service.exportCsv(query); send(csvContent, filename);',
    },
    {
      name: 'the result of a call was never an object in hand',
      code: 'const { startDate, endDate } = resolveDates(query); query(startDate, endDate);',
    },
    {
      name: 'a computed link in the chain makes inlining worse, not better',
      code: 'const { where } = repo.find.mock.calls[0][0]; expect(where).toBeDefined();',
    },
    {
      name: 'array destructuring is a different shape and untouched',
      code: 'const [rows, total] = await repo.findAndCount(); page(rows, total);',
    },
    {
      name: 'assigning into existing bindings is not a declaration',
      code: 'let app; let dataSource; ({ app, dataSource } = createApp()); boot(app, dataSource);',
    },
    {
      name: 'a local reassigned later is mutable state, not a copy',
      code: "let { status, id } = obj; if (stale) { status = 'EXPIRED'; } persist(id, status);",
    },
    {
      name: 'a local read inside a nested function is carrying a narrowed type across the callback boundary',
      code: 'function totals(obj) { const { status, items } = obj; if (status === undefined) { return []; } return items.map((n) => n + status.length); }',
    },
    {
      name: 'a default value would be duplicated at every use site once inlined',
      code: 'const { max = 3, min } = options; clamp(min, max);',
    },
    {
      name: 'a rest element builds a new object by omission, which no member access expresses',
      code: 'const { authorization: _auth, ...safe } = headers; log(safe);',
    },
  ],
  invalid: [
    {
      name: 'destructuring an object already in hand',
      code: 'const { status, enabled } = obj; use(status, enabled);',
      errors: [
        {
          messageId: 'destructuresObject',
          data: { name: 'obj', count: 2 },
        },
      ],
    },
    {
      name: 'a single property is still a copy of the object state',
      code: 'const { statusCode } = response; log(statusCode);',
      errors: [{ messageId: 'destructuresObject' }],
    },
    {
      name: 'destructuring a property of an object in hand',
      code: 'const { access_token, expires_in } = response.data; cache(access_token, expires_in);',
      errors: [
        {
          messageId: 'destructuresObject',
          data: { name: 'response.data', count: 2 },
        },
      ],
    },
    {
      name: 'destructuring a field of the class it lives in',
      code: 'class Onboarding { register() { const { region, poolId } = this.config; return sdk(region, poolId); } }',
      errors: [{ messageId: 'destructuresObject' }],
    },
    {
      name: 'destructuring the instance itself',
      code: 'class Onboarding { register() { const { region } = this; return sdk(region); } }',
      errors: [{ messageId: 'destructuresObject' }],
    },
    {
      name: 'renaming on the way out is still copying state',
      code: 'const { ingestion: failure, resolution } = row; resolve(failure, resolution);',
      errors: [{ messageId: 'destructuresObject' }],
    },
  ],
});
