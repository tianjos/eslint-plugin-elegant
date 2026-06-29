import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type MessageIds = 'statement' | 'computation';

const isThisMember = (node: TSESTree.Node): boolean =>
  node.type === AST_NODE_TYPES.MemberExpression &&
  node.object.type === AST_NODE_TYPES.ThisExpression;

const isSuperCall = (node: TSESTree.Expression): boolean =>
  node.type === AST_NODE_TYPES.CallExpression &&
  node.callee.type === AST_NODE_TYPES.Super;

/** Strip assertions/non-null so `this.x = y as T` is judged by its inner value. */
const unwrap = (node: TSESTree.Expression): TSESTree.Expression => {
  if (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSNonNullExpression ||
    node.type === AST_NODE_TYPES.TSTypeAssertion
  ) {
    return unwrap(node.expression);
  }
  return node;
};

/** A value the constructor merely *stores*, as opposed to one it *computes*. */
const isPlainValue = (node: TSESTree.Expression): boolean => {
  const inner = unwrap(node);
  switch (inner.type) {
    case AST_NODE_TYPES.Identifier:
    case AST_NODE_TYPES.Literal:
    case AST_NODE_TYPES.ThisExpression:
    case AST_NODE_TYPES.MemberExpression:
      return true;
    default:
      return false;
  }
};

export default createRule<[], MessageIds>({
  name: 'no-logic-in-constructor',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow logic in constructors. A constructor may only assign its arguments to fields; computation belongs in a static factory or a method.',
    },
    messages: {
      statement:
        'Constructors must be code-free: only `this.field = value` assignments and a `super(...)` call are allowed here.',
      computation:
        'Constructor assignments must store a plain value, not compute one. Move the logic to a static factory or use a default parameter value.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const checkBody = (body: TSESTree.Statement[]): void => {
      for (const statement of body) {
        if (statement.type !== AST_NODE_TYPES.ExpressionStatement) {
          context.report({ node: statement, messageId: 'statement' });
          continue;
        }

        const { expression } = statement;
        if (isSuperCall(expression)) {
          continue;
        }

        if (
          expression.type !== AST_NODE_TYPES.AssignmentExpression ||
          expression.operator !== '=' ||
          !isThisMember(expression.left)
        ) {
          context.report({ node: statement, messageId: 'statement' });
          continue;
        }

        if (!isPlainValue(expression.right)) {
          context.report({
            node: expression.right,
            messageId: 'computation',
          });
        }
      }
    };

    return {
      'MethodDefinition[kind="constructor"]'(
        node: TSESTree.MethodDefinition,
      ): void {
        if (node.value.body) {
          checkBody(node.value.body.body);
        }
      },
    };
  },
});
