import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [];
type MessageIds = 'elseAfterThrow';

/**
 * Whether the branch leaves through a `throw` no matter what. A bare `throw`
 * qualifies, as does a block whose last statement is one. The check does not
 * recurse: a block ending in a nested `if` may or may not throw, and `else`
 * still carries information there.
 */
const alwaysThrows = (branch: TSESTree.Statement): boolean => {
  if (branch.type === AST_NODE_TYPES.ThrowStatement) {
    return true;
  }

  if (branch.type !== AST_NODE_TYPES.BlockStatement) {
    return false;
  }

  return branch.body.at(-1)?.type === AST_NODE_TYPES.ThrowStatement;
};

export default createRule<Options, MessageIds>({
  name: 'no-else-after-throw',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow an else branch when the then branch always throws.',
    },
    messages: {
      elseAfterThrow:
        "The 'then' branch always throws, so 'else' adds nothing but nesting. Drop it and let the alternative sit at the outer level.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      IfStatement(node): void {
        if (node.alternate === null || !alwaysThrows(node.consequent)) {
          return;
        }

        const keyword = sourceCode.getTokenBefore(node.alternate);

        context.report({
          node: keyword ?? node.alternate,
          messageId: 'elseAfterThrow',
        });
      },
    };
  },
});
