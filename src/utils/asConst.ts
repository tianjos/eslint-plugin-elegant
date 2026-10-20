import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

/** `value as const`, which narrows a literal rather than widening a type. */
export const isAsConst = (node: TSESTree.TSAsExpression): boolean =>
  node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference &&
  node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier &&
  node.typeAnnotation.typeName.name === 'const';
