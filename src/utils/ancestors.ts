import { TSESTree } from '@typescript-eslint/utils';

/**
 * The innermost ancestor a predicate accepts, or `undefined` if the walk
 * reaches the top without one.
 *
 * `Program.parent` is `null` rather than `undefined`, so a walk that only
 * guards against `undefined` runs off the top of the tree and throws — which
 * takes the whole lint run for that file down with it.
 */
export const closestAncestor = (
  node: TSESTree.Node,
  matches: (candidate: TSESTree.Node) => boolean,
): TSESTree.Node | undefined => {
  let current: TSESTree.Node | null | undefined = node.parent;

  while (current !== null && current !== undefined) {
    if (matches(current)) {
      return current;
    }
    current = current.parent;
  }

  return undefined;
};
