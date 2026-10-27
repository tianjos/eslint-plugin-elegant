import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/** `Type.factory(...)`: a call on a class, read from its name alone. */
export type Construction = {
  type: string;
  factory: string;
};

/** Namespaces of the language and the platform, whose calls convert rather than model. */
const NAMESPACES: ReadonlySet<string> = new Set([
  'AbortSignal',
  'Array',
  'BigInt',
  'Boolean',
  'Buffer',
  'Date',
  'Intl',
  'JSON',
  'Math',
  'Number',
  'Object',
  'Promise',
  'Reflect',
  'String',
  'Symbol',
]);

/** PascalCase, so `Money` is a type and `UUID_PATTERN` is a constant. */
const isTypeName = (name: string): boolean =>
  /^[A-Z][a-z]/.test(name) && !NAMESPACES.has(name);

/** The type and factory a call names, when it is `Type.factory(...)` on a class of the domain. */
export const constructionOf = (
  node: TSESTree.CallExpression,
): Construction | undefined =>
  node.callee.type === AST_NODE_TYPES.MemberExpression &&
  !node.callee.computed &&
  node.callee.object.type === AST_NODE_TYPES.Identifier &&
  node.callee.property.type === AST_NODE_TYPES.Identifier &&
  isTypeName(node.callee.object.name)
    ? { type: node.callee.object.name, factory: node.callee.property.name }
    : undefined;
