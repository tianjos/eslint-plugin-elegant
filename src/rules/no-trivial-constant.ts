import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { constructionOf } from '../utils/construction';
import { createRule } from '../utils/createRule';

type MessageIds = 'emptyConstant' | 'literalValueObject';

const EMPTY_COLLECTIONS = new Set(['Map', 'Set', 'WeakMap', 'WeakSet']);

/** Calls that fill or drain a collection in place. */
const MUTATORS = new Set([
  'add',
  'clear',
  'delete',
  'pop',
  'push',
  'set',
  'shift',
  'splice',
  'unshift',
]);

/** What a constant holds once an assertion or `Object.freeze` is set aside. */
const heldValue = (node: TSESTree.Expression): TSESTree.Node => {
  if (
    node.type === AST_NODE_TYPES.TSAsExpression ||
    node.type === AST_NODE_TYPES.TSSatisfiesExpression
  ) {
    return heldValue(node.expression);
  }

  const [frozen] =
    node.type === AST_NODE_TYPES.CallExpression &&
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.object.type === AST_NODE_TYPES.Identifier &&
    node.callee.object.name === 'Object' &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === 'freeze'
      ? node.arguments
      : [];

  return frozen && frozen.type !== AST_NODE_TYPES.SpreadElement
    ? heldValue(frozen)
    : node;
};

const emptyCollectionOf = (node: TSESTree.Node): string | undefined =>
  node.type === AST_NODE_TYPES.NewExpression &&
  node.arguments.length === 0 &&
  node.callee.type === AST_NODE_TYPES.Identifier &&
  EMPTY_COLLECTIONS.has(node.callee.name)
    ? `new ${node.callee.name}()`
    : undefined;

/** `[]`, `{}`, or a `Map` or `Set` built with nothing in it. */
const emptyOf = (node: TSESTree.Node): string | undefined => {
  if (node.type === AST_NODE_TYPES.ArrayExpression) {
    return node.elements.length === 0 ? '[]' : undefined;
  }

  if (node.type === AST_NODE_TYPES.ObjectExpression) {
    return node.properties.length === 0 ? '{}' : undefined;
  }

  return emptyCollectionOf(node);
};

const isLiteral = (node: TSESTree.Node): boolean =>
  (node.type === AST_NODE_TYPES.Literal && !('regex' in node)) ||
  (node.type === AST_NODE_TYPES.TemplateLiteral &&
    node.expressions.length === 0) ||
  (node.type === AST_NODE_TYPES.UnaryExpression && isLiteral(node.argument));

const isMutatorOf = (
  member: TSESTree.Node | undefined,
  identifier: TSESTree.Identifier | TSESTree.JSXIdentifier,
): boolean =>
  member?.type === AST_NODE_TYPES.MemberExpression &&
  member.object === identifier &&
  member.property.type === AST_NODE_TYPES.Identifier &&
  MUTATORS.has(member.property.name);

const isMutatedThrough = (reference: TSESLint.Scope.Reference): boolean =>
  isMutatorOf(reference.identifier.parent, reference.identifier);

/**
 * A module-level cache or registry starts empty and is filled as the module
 * runs. It is state the module keeps, not an empty value given a name.
 */
const isFilledLater = (
  declarator: TSESTree.VariableDeclarator,
  sourceCode: Readonly<TSESLint.SourceCode>,
): boolean =>
  sourceCode
    .getDeclaredVariables(declarator)
    .some((variable) => variable.references.some(isMutatedThrough));

/** Classes this file declares: a constant next to its own type is that type's knowledge. */
const declaredClasses = (program: TSESTree.Program): Set<string> =>
  new Set(
    program.body.flatMap((statement) => {
      const declaration =
        statement.type === AST_NODE_TYPES.ExportNamedDeclaration ||
        statement.type === AST_NODE_TYPES.ExportDefaultDeclaration
          ? statement.declaration
          : statement;

      return declaration?.type === AST_NODE_TYPES.ClassDeclaration &&
        declaration.id
        ? [declaration.id.name]
        : [];
    }),
  );

const moduleConstantsOf = (
  statement: TSESTree.ProgramStatement,
): TSESTree.VariableDeclarator[] => {
  const declaration =
    statement.type === AST_NODE_TYPES.ExportNamedDeclaration
      ? statement.declaration
      : statement;

  return declaration?.type === AST_NODE_TYPES.VariableDeclaration &&
    declaration.kind === 'const'
    ? declaration.declarations
    : [];
};

export default createRule<[], MessageIds>({
  name: 'no-trivial-constant',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Disallow module constants that only name an empty collection or a value object built from literals: that value is the type's knowledge, not the module's.",
    },
    messages: {
      emptyConstant:
        "'{{name}}' only names an empty {{empty}}. Let the type it stands for name its empty value, such as Shares.none(), or write the literal where it is used.",
      literalValueObject:
        "'{{name}}' builds {{type}}.{{factory}}(...) from literals. That value is {{type}}'s knowledge: give {{type}} a named factory, such as {{type}}.zero(), so every module asks for the same one.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const checkConstant = (
      declarator: TSESTree.VariableDeclarator,
      ownClasses: ReadonlySet<string>,
    ): void => {
      const value = declarator.init && heldValue(declarator.init);
      const empty = value && emptyOf(value);
      const construction =
        value?.type === AST_NODE_TYPES.CallExpression &&
        value.arguments.length > 0 &&
        value.arguments.every(isLiteral)
          ? constructionOf(value)
          : undefined;

      if (declarator.id.type !== AST_NODE_TYPES.Identifier) {
        return;
      }

      if (empty && !isFilledLater(declarator, context.sourceCode)) {
        context.report({
          node: declarator.id,
          messageId: 'emptyConstant',
          data: { name: declarator.id.name, empty },
        });
      } else if (construction && !ownClasses.has(construction.type)) {
        context.report({
          node: declarator.id,
          messageId: 'literalValueObject',
          data: { name: declarator.id.name, ...construction },
        });
      }
    };

    return {
      Program(program) {
        const ownClasses = declaredClasses(program);

        program.body
          .flatMap(moduleConstantsOf)
          .forEach((declarator) => checkConstant(declarator, ownClasses));
      },
    };
  },
});
