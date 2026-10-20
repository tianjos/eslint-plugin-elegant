import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';

/**
 * Ambient types every codebase reaches for. Instantiating a `Date` or a `Map` is
 * not a design decision worth budgeting, so they never count as collaborators.
 */
export const BUILT_INS: ReadonlySet<string> = new Set([
  'Array',
  'Date',
  'Error',
  'Map',
  'Promise',
  'RegExp',
  'Set',
  'URL',
  'WeakMap',
  'WeakSet',
]);

/** The type reference a constructor parameter is annotated with, if it names one. */
export const annotatedReference = (
  param: TSESTree.Parameter,
): TSESTree.TSTypeReference | undefined => {
  const target =
    param.type === AST_NODE_TYPES.TSParameterProperty ? param.parameter : param;
  const annotation = target.typeAnnotation?.typeAnnotation;

  return annotation?.type === AST_NODE_TYPES.TSTypeReference
    ? annotation
    : undefined;
};

/**
 * Whether a type name is one `max-class-dependencies` budgets as a
 * collaborator, as opposed to an ambient value type.
 */
export const isCollaborator = (
  typeName: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): boolean => !BUILT_INS.has(sourceCode.getText(typeName));
