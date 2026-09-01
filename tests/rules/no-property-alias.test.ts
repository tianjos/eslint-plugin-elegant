import { RuleTester } from '@typescript-eslint/rule-tester';
import rule from '../../src/rules/no-property-alias';

const ruleTester = new RuleTester();

ruleTester.run('no-property-alias', rule, {
  valid: [
    {
      name: 'an initialiser that is not a property read',
      code: 'const total = compute(order); use(total);',
    },
    {
      name: 'destructuring is a different shape, owned by its own rule',
      code: 'const { status } = obj; use(status);',
    },
    {
      name: 'reading an environment variable once and guarding it is fail-fast, not aliasing',
      code: "const topicArn = process.env.SNS_ERROR_TOPIC; if (topicArn === undefined) { throw new Error('SNS_ERROR_TOPIC is unset'); } publish(topicArn);",
    },
    {
      name: 'a local read inside a nested function is carrying a narrowed type across the callback boundary',
      code: 'function totals(obj) { const status = obj.status; if (status === undefined) { return []; } return obj.items.map((n) => n + status.length); }',
    },
    {
      name: 'a local reassigned later is mutable state, not an alias',
      code: "let status = obj.status; if (stale) { status = 'EXPIRED'; } use(status);",
    },
    {
      name: 'a property of a call result is not an object already in hand',
      code: 'const startDate = resolveDates(query).startDate; use(startDate);',
    },
    {
      name: 'a computed link in the chain makes inlining worse, not better',
      code: 'const metadata = repo.save.mock.calls[1][0].metadata; use(metadata);',
    },
  ],
  invalid: [
    {
      name: 'a local that only renames a property of an object in hand',
      code: "const obj = { status: 'ACTIVE' }; const objStatus = obj.status; use(objStatus);",
      errors: [
        {
          messageId: 'aliasesProperty',
          data: { name: 'objStatus', path: 'obj.status' },
        },
      ],
    },
    {
      name: 'a local renaming a field of the class it lives in',
      code: 'class Onboarding { private readonly cognitoRegion: string; register() { const region = this.cognitoRegion; return sdk.for(region); } }',
      errors: [{ messageId: 'aliasesProperty' }],
    },
    {
      name: 'a local renaming a deeper property along a plain chain',
      code: 'const authHeader = request.headers.authorization; verify(authHeader);',
      errors: [{ messageId: 'aliasesProperty' }],
    },
    {
      name: 'each aliased property is reported on its own declaration',
      code: 'const cognitoSub = decodedToken.sub; const email = decodedToken.email; upsert(cognitoSub, email);',
      errors: [
        { messageId: 'aliasesProperty' },
        { messageId: 'aliasesProperty' },
      ],
    },
    {
      name: 'allowEnv: false holds environment reads to the same standard',
      code: 'const topicArn = process.env.SNS_ERROR_TOPIC; publish(topicArn);',
      options: [{ allowEnv: false }],
      errors: [{ messageId: 'aliasesProperty' }],
    },
  ],
});
