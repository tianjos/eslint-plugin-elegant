import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

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
    const measure = (
      node: TSESTree.Node,
      name: string,
      key: TSESTree.Node,
    ): void => {
      const count = node.loc.end.line - node.loc.start.line + 1;

      if (count <= max) {
        return;
      }

      context.report({
        node: key,
        messageId: 'tooManyLines',
        data: { name, count, max },
      });
    };

    return {
      MethodDefinition(node): void {
        if (node.key.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        measure(node, node.key.name, node.key);
      },
      FunctionDeclaration(node): void {
        if (node.id === null) {
          return;
        }

        measure(node, node.id.name, node.id);
      },
      VariableDeclarator(node): void {
        if (
          node.id.type !== AST_NODE_TYPES.Identifier ||
          node.init === null ||
          (node.init.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
            node.init.type !== AST_NODE_TYPES.FunctionExpression)
        ) {
          return;
        }

        measure(node.init, node.id.name, node.id);
      },
    };
  },
});
