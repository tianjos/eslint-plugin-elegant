import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { closestAncestor } from './ancestors';

const FUNCTIONS = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

/**
 * Whether the node sits inside a function that declares a type predicate,
 * `value is X` or `asserts value is X`. That signature is the one place a
 * check states what it is doing: the answer leaves as a narrowed type rather
 * than as a bare boolean, and the project ends up with one greppable guard per
 * question instead of the check repeated mid-method. Only the innermost
 * function counts, so a guard cannot lend its exemption to code that merely
 * follows it.
 */
export const isInsideTypeGuard = (node: TSESTree.Node): boolean => {
  const fn = closestAncestor(node, (candidate) =>
    FUNCTIONS.has(candidate.type),
  );

  return (
    fn !== undefined &&
    'returnType' in fn &&
    fn.returnType?.typeAnnotation.type === AST_NODE_TYPES.TSTypePredicate
  );
};
