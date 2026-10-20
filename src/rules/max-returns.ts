import { createRule } from '../utils/createRule';
import { FunctionLike, functionName } from '../utils/functionName';

type Options = [{ max: number }];
type MessageIds = 'tooManyReturns';

const DEFAULT_MAX = 3;

/** One function's exit tally, kept on a stack so nested functions never mix. */
type Exits = { node: FunctionLike; count: number };

export default createRule<Options, MessageIds>({
  name: 'max-returns',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a maximum number of return statements per function.',
    },
    messages: {
      tooManyReturns:
        "Function '{{name}}' returns from {{count}} places (max {{max}}). Consider collapsing the branches or extracting them into named functions.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ max: DEFAULT_MAX }],
  create(context, [{ max }]) {
    const sourceCode = context.sourceCode;
    const scopes: Exits[] = [];

    const enter = (node: FunctionLike): void => {
      scopes.push({ node, count: 0 });
    };

    const leave = (): void => {
      const scope = scopes.pop();

      if (scope === undefined || scope.count <= max) {
        return;
      }

      const signature =
        scope.node.id ?? sourceCode.getFirstToken(scope.node);

      context.report({
        loc: (signature ?? scope.node).loc,
        messageId: 'tooManyReturns',
        data: {
          name: functionName(scope.node)?.name ?? '(anonymous)',
          count: scope.count,
          max,
        },
      });
    };

    return {
      ArrowFunctionExpression: enter,
      'ArrowFunctionExpression:exit': leave,
      FunctionDeclaration: enter,
      'FunctionDeclaration:exit': leave,
      FunctionExpression: enter,
      'FunctionExpression:exit': leave,

      ReturnStatement(): void {
        const scope = scopes[scopes.length - 1];

        if (scope !== undefined) {
          scope.count += 1;
        }
      },
    };
  },
});
