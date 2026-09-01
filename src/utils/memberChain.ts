import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/**
 * Whether the expression denotes an object the reader already holds: a name,
 * `this`, or a run of plain `.prop` accesses rooted at one of those. A computed
 * link (`calls[1][0].metadata`) or a call in the middle
 * (`resolveDates(query).startDate`) fails — nobody gains by inlining those.
 */
export const isObjectInHand = (node: TSESTree.Node): boolean => {
  let current: TSESTree.Node = node;

  while (current.type === AST_NODE_TYPES.MemberExpression) {
    if (current.computed) {
      return false;
    }
    current = current.object;
  }

  return (
    current.type === AST_NODE_TYPES.Identifier ||
    current.type === AST_NODE_TYPES.ThisExpression
  );
};
