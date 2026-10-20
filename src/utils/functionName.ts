import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

export type FunctionLike =
  | TSESTree.ArrowFunctionExpression
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression;

/**
 * The key of a method, a class field, or an object property holding the
 * function. A computed key (`[key]() {}`) is an expression evaluated at
 * runtime, not a name, so it does not count.
 */
const keyOf = (holder: TSESTree.Node): TSESTree.Identifier | undefined =>
  (holder.type === AST_NODE_TYPES.MethodDefinition ||
    holder.type === AST_NODE_TYPES.PropertyDefinition ||
    holder.type === AST_NODE_TYPES.Property) &&
  !holder.computed &&
  holder.key.type === AST_NODE_TYPES.Identifier
    ? holder.key
    : undefined;

/** The variable a function expression or arrow is assigned to. */
const bindingOf = (holder: TSESTree.Node): TSESTree.Identifier | undefined =>
  holder.type === AST_NODE_TYPES.VariableDeclarator &&
  holder.id.type === AST_NODE_TYPES.Identifier
    ? holder.id
    : undefined;

/**
 * The identifier a reader knows a function by. Declarations carry their own;
 * the rest borrow it from whatever binds them, so a method, a class field and
 * an arrow assigned to a `const` are all named. An inline callback has none.
 */
export const functionName = (
  node: FunctionLike,
): TSESTree.Identifier | undefined =>
  node.id ?? keyOf(node.parent) ?? bindingOf(node.parent);
