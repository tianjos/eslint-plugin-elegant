import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { closestAncestor } from '../utils/ancestors';
import { createRule } from '../utils/createRule';
import { isCaughtBinding } from '../utils/locals';

type Options = [{ allowSelfGuard: boolean; allowCaughtValues: boolean }];
type MessageIds = 'noInstanceof';

/** The name of the class a node sits inside, if it sits inside a named one. */
const enclosingClass = (node: TSESTree.Node): string | undefined => {
  const found = closestAncestor(
    node,
    (candidate) =>
      candidate.type === AST_NODE_TYPES.ClassDeclaration ||
      candidate.type === AST_NODE_TYPES.ClassExpression,
  );

  return found?.type === AST_NODE_TYPES.ClassDeclaration ||
    found?.type === AST_NODE_TYPES.ClassExpression
    ? found.id?.name
    : undefined;
};

/**
 * `other instanceof Money` inside `class Money`. Value equality has to guard
 * its own type before comparing fields, and a structurally typed language
 * offers no polymorphic way to do it: the method is already on the object, so
 * the rule's own advice has nowhere left to go.
 */
const isSelfGuard = (node: TSESTree.BinaryExpression): boolean =>
  node.right.type === AST_NODE_TYPES.Identifier &&
  node.right.name === enclosingClass(node);

export default createRule<Options, MessageIds>({
  name: 'no-instanceof',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow the `instanceof` operator. Type discrimination breaks polymorphism; let the object decide via a method instead.',
    },
    messages: {
      noInstanceof:
        'Avoid `instanceof`. Replace type discrimination with a polymorphic method on the object.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowSelfGuard: { type: 'boolean' },
          allowCaughtValues: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ allowSelfGuard: true, allowCaughtValues: true }],
  create(context, [{ allowSelfGuard, allowCaughtValues }]) {
    return {
      'BinaryExpression[operator="instanceof"]'(
        node: TSESTree.BinaryExpression,
      ): void {
        if (allowSelfGuard && isSelfGuard(node)) {
          return;
        }

        if (
          allowCaughtValues &&
          node.left.type === AST_NODE_TYPES.Identifier &&
          isCaughtBinding(
            context.sourceCode.getScope(node),
            node.left.name,
          )
        ) {
          return;
        }

        context.report({ node, messageId: 'noInstanceof' });
      },
    };
  },
});
