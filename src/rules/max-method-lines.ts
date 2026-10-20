import { createRule } from '../utils/createRule';
import { FunctionLike, functionName } from '../utils/functionName';

type Options = [{ max: number }];
type MessageIds = 'tooManyLines';

const DEFAULT_MAX = 50;

export default createRule<Options, MessageIds>({
  name: 'max-method-lines',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a maximum length, in lines, for a named function or method. An inline callback is measured through the function hosting it.',
    },
    messages: {
      tooManyLines:
        "'{{name}}' spans {{count}} lines (max {{max}}). A body that long is holding several ideas; give each one a name.",
    },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ max: DEFAULT_MAX }],
  create(context, [{ max }]) {
    const measure = (node: FunctionLike): void => {
      const name = functionName(node);
      const count = node.loc.end.line - node.loc.start.line + 1;

      if (name === undefined || count <= max) {
        return;
      }

      context.report({
        node: name,
        messageId: 'tooManyLines',
        data: { name: name.name, count, max },
      });
    };

    return {
      ArrowFunctionExpression: measure,
      FunctionDeclaration: measure,
      FunctionExpression: measure,
    };
  },
});
