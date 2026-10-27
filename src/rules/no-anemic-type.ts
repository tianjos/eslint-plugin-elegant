import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ minFunctions: number }];
type MessageIds = 'anemicType';

const DEFAULT_MIN_FUNCTIONS = 2;

/** The declaration an `export` wraps, or the statement itself. */
const declarationOf = (
  statement: TSESTree.ProgramStatement,
): TSESTree.Node | null | undefined =>
  statement.type === AST_NODE_TYPES.ExportNamedDeclaration
    ? statement.declaration
    : statement;

/** Only properties: a member that is a method makes the type a contract. */
const isData = (members: TSESTree.TypeElement[]): boolean =>
  members.length > 0 &&
  members.every((member) => member.type === AST_NODE_TYPES.TSPropertySignature);

/** A shape of properties, alone or intersected with other types. */
const isDataShape = (annotation: TSESTree.TypeNode): boolean => {
  if (annotation.type === AST_NODE_TYPES.TSTypeLiteral) {
    return isData(annotation.members);
  }

  return (
    annotation.type === AST_NODE_TYPES.TSIntersectionType &&
    annotation.types.some(
      (member) =>
        member.type === AST_NODE_TYPES.TSTypeLiteral && isData(member.members),
    )
  );
};

/** The identifier of a type alias or interface that only carries data. */
const dataTypeOf = (
  node: TSESTree.Node | null | undefined,
): TSESTree.Identifier | undefined => {
  if (node?.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
    return isData(node.body.body) ? node.id : undefined;
  }

  return node?.type === AST_NODE_TYPES.TSTypeAliasDeclaration &&
    isDataShape(node.typeAnnotation)
    ? node.id
    : undefined;
};

const referenceName = (
  annotation: TSESTree.TypeNode | undefined,
): string | undefined =>
  annotation?.type === AST_NODE_TYPES.TSTypeReference &&
  annotation.typeName.type === AST_NODE_TYPES.Identifier
    ? annotation.typeName.name
    : undefined;

/** The type a parameter is declared as, seen through `Readonly<...>`. */
const typeOfParameter = (
  param: TSESTree.Parameter | undefined,
): string | undefined => {
  const target =
    param?.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;
  const annotation =
    target?.type === AST_NODE_TYPES.Identifier
      ? target.typeAnnotation?.typeAnnotation
      : undefined;
  const name = referenceName(annotation);

  return name === 'Readonly' && annotation?.type === AST_NODE_TYPES.TSTypeReference
    ? referenceName(annotation.typeArguments?.params[0])
    : name;
};

type ModuleFunction = { name: string; receiver: string | undefined };

const isFunction = (
  node: TSESTree.Node | null | undefined,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression =>
  node?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
  node?.type === AST_NODE_TYPES.FunctionExpression;

const boundFunctionOf = (
  declarator: TSESTree.VariableDeclarator,
): ModuleFunction | undefined =>
  declarator.id.type === AST_NODE_TYPES.Identifier && isFunction(declarator.init)
    ? { name: declarator.id.name, receiver: typeOfParameter(declarator.init.params[0]) }
    : undefined;

/**
 * The functions a module declares at its top level, each with the type of its
 * first parameter: the one a method would receive as `this`.
 */
const moduleFunctionsOf = (
  node: TSESTree.Node | null | undefined,
): (ModuleFunction | undefined)[] => {
  if (node?.type === AST_NODE_TYPES.FunctionDeclaration && node.id) {
    return [{ name: node.id.name, receiver: typeOfParameter(node.params[0]) }];
  }

  return node?.type === AST_NODE_TYPES.VariableDeclaration
    ? node.declarations.map(boundFunctionOf)
    : [];
};

export default createRule<Options, MessageIds>({
  name: 'no-anemic-type',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow data types that free functions in the same file operate on: the type is a class taken apart, with its state on one side and its behaviour on the other.',
    },
    messages: {
      anemicType:
        "'{{name}}' is data that {{count}} functions in this file take as their first parameter ({{functions}}). Make it a class and turn them into its methods.",
    },
    schema: [
      {
        type: 'object',
        properties: { minFunctions: { type: 'integer', minimum: 2 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ minFunctions: DEFAULT_MIN_FUNCTIONS }],
  create(context, [{ minFunctions }]) {
    return {
      Program(program) {
        const declarations = program.body.map(declarationOf);
        const operations = new Map<string, string[]>();

        declarations.flatMap(moduleFunctionsOf).forEach((fn) => {
          if (fn?.receiver) {
            operations.set(fn.receiver, [...(operations.get(fn.receiver) ?? []), fn.name]);
          }
        });

        declarations.map(dataTypeOf).forEach((type) => {
          const functions = (type && operations.get(type.name)) ?? [];

          if (type && functions.length >= minFunctions) {
            context.report({
              node: type,
              messageId: 'anemicType',
              data: {
                name: type.name,
                count: functions.length,
                functions: functions.join(', '),
              },
            });
          }
        });
      },
    };
  },
});
