import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type MessageIds = 'noAssertion';

const isAsConst = (node: TSESTree.TSAsExpression): boolean =>
  node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
  node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
  node.typeAnnotation.typeName.name === 'const';

export default createRule<[], MessageIds>({
  name: 'no-type-assertion',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow type assertions, which bypass the type checker. Prefer type guards, generics, or honest types. `as const` is allowed.',
    },
    messages: {
      noAssertion:
        'Type assertions silence the type checker. Use a type guard, a generic, or a correctly typed value instead.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TSAsExpression(node): void {
        if (isAsConst(node)) {
          return;
        }
        context.report({ node, messageId: 'noAssertion' });
      },
      TSTypeAssertion(node): void {
        context.report({ node, messageId: 'noAssertion' });
      },
    };
  },
});
