import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ max: number }];
type MessageIds = 'tooManyMethods';

const DEFAULT_MAX = 10;

export default createRule<Options, MessageIds>({
  name: 'max-class-methods',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a maximum number of methods per class to keep classes cohesive and single-purpose.',
    },
    messages: {
      tooManyMethods:
        "Class '{{name}}' has {{count}} methods (max {{max}}). Consider splitting its responsibilities.",
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
    return {
      ClassBody(node): void {
        const methods = node.body.filter(
          (member): member is TSESTree.MethodDefinition =>
            member.type === AST_NODE_TYPES.MethodDefinition &&
            member.kind !== 'constructor',
        );

        if (methods.length <= max) {
          return;
        }

        const classNode = node.parent as
          | TSESTree.ClassDeclaration
          | TSESTree.ClassExpression;
        const name = classNode.id?.name ?? '(anonymous)';

        context.report({
          node: classNode.id ?? node,
          messageId: 'tooManyMethods',
          data: { name, count: methods.length, max },
        });
      },
    };
  },
});
