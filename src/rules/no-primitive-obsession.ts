import {
  ASTUtils,
  AST_NODE_TYPES,
  TSESLint,
  TSESTree,
} from '@typescript-eslint/utils';
import { closestAncestor } from '../utils/ancestors';
import { createRule } from '../utils/createRule';

type MessageIds = 'wrappedParameter' | 'wrappedState' | 'discardedValueObject';

/** `Type.factory(...)`: a call on a class, read from its name alone. */
type Construction = {
  type: string;
  factory: string;
};

type Field = { name: string; annotation: TSESTree.TypeNode | undefined };

type Unwrap = { call: TSESTree.CallExpression; method: string };

type PrimitiveParameter = { name: TSESTree.Identifier; primitive: string };

type Finding = {
  node: TSESTree.Node;
  messageId: MessageIds;
  data: Record<string, string>;
};

const PRIMITIVES = new Map<AST_NODE_TYPES, string>([
  [AST_NODE_TYPES.TSStringKeyword, 'string'],
  [AST_NODE_TYPES.TSNumberKeyword, 'number'],
  [AST_NODE_TYPES.TSBigIntKeyword, 'bigint'],
]);

const ABSENCE = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.TSUndefinedKeyword,
  AST_NODE_TYPES.TSNullKeyword,
]);

/** Namespaces of the language and the platform, whose calls convert rather than model. */
const NAMESPACES = new Set([
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

const UNWRAPS = new Set(['toString', 'toNumber', 'toPrimitives', 'valueOf']);

/** PascalCase, so `Money` is a type and `UUID_PATTERN` is a constant. */
const isTypeName = (name: string): boolean =>
  /^[A-Z][a-z]/.test(name) && !NAMESPACES.has(name);

const constructionOf = (
  node: TSESTree.CallExpression,
): Construction | undefined =>
  node.callee.type === AST_NODE_TYPES.MemberExpression &&
  !node.callee.computed &&
  node.callee.object.type === AST_NODE_TYPES.Identifier &&
  node.callee.property.type === AST_NODE_TYPES.Identifier &&
  isTypeName(node.callee.object.name)
    ? { type: node.callee.object.name, factory: node.callee.property.name }
    : undefined;

/**
 * The primitive an annotation reduces to once absence is set aside, so
 * `amount?: number` and `amount: number | undefined` read as the `number` they
 * are. A union of two primitives is not one concept and is left alone.
 */
const primitiveOf = (
  annotation: TSESTree.TypeNode | undefined,
): string | undefined => {
  if (annotation?.type !== AST_NODE_TYPES.TSUnionType) {
    return annotation && PRIMITIVES.get(annotation.type);
  }

  const [only, ...others] = annotation.types.filter(
    (member) => !ABSENCE.has(member.type),
  );

  return others.length === 0 ? primitiveOf(only) : undefined;
};

/** A static method is a secondary constructor: wrapping is its job. */
const isFactory = (node: TSESTree.Node): boolean =>
  node.parent?.type === AST_NODE_TYPES.MethodDefinition && node.parent.static;

const isClass = (
  node: TSESTree.Node,
): node is TSESTree.ClassDeclaration | TSESTree.ClassExpression =>
  node.type === AST_NODE_TYPES.ClassDeclaration ||
  node.type === AST_NODE_TYPES.ClassExpression;

/**
 * `this.amount` reads `['amount']` and `this.props.amount` reads
 * `['props', 'amount']`. Anything deeper is someone else's state.
 */
const ownStatePath = (argument: TSESTree.Node): string[] | undefined => {
  const path: string[] = [];
  let node = argument;

  while (
    node.type === AST_NODE_TYPES.MemberExpression &&
    !node.computed &&
    node.property.type === AST_NODE_TYPES.Identifier
  ) {
    path.unshift(node.property.name);
    node = node.object;
  }

  return node.type === AST_NODE_TYPES.ThisExpression && path.length <= 2
    ? path
    : undefined;
};

const fieldOfParameter = (
  param: TSESTree.Parameter,
): Field | undefined => {
  const target =
    param.type === AST_NODE_TYPES.TSParameterProperty ? param.parameter : undefined;
  const name =
    target?.type === AST_NODE_TYPES.AssignmentPattern ? target.left : target;

  return name?.type === AST_NODE_TYPES.Identifier
    ? { name: name.name, annotation: name.typeAnnotation?.typeAnnotation }
    : undefined;
};

const fieldOfMember = (member: TSESTree.ClassElement): Field | undefined =>
  member.type === AST_NODE_TYPES.PropertyDefinition &&
  !member.computed &&
  member.key.type === AST_NODE_TYPES.Identifier
    ? { name: member.key.name, annotation: member.typeAnnotation?.typeAnnotation }
    : undefined;

const parametersOf = (member: TSESTree.ClassElement): TSESTree.Parameter[] =>
  member.type === AST_NODE_TYPES.MethodDefinition && member.kind === 'constructor'
    ? member.value.params
    : [];

/** The declared field or parameter property called `name`, with the type it declares. */
const fieldNamed = (
  body: TSESTree.ClassBody,
  name: string | undefined,
): Field | undefined =>
  [
    ...body.body.map(fieldOfMember),
    ...body.body.flatMap(parametersOf).map(fieldOfParameter),
  ].find((field) => field?.name === name);

/** The members of an alias or interface this file declares by `name`. */
const declaredMembers = (
  name: string,
  program: TSESTree.Program,
): TSESTree.TypeElement[] => {
  const declaration = program.body
    .map((statement) =>
      statement.type === AST_NODE_TYPES.ExportNamedDeclaration
        ? statement.declaration
        : statement,
    )
    .find(
      (candidate) =>
        (candidate?.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
          candidate?.type === AST_NODE_TYPES.TSInterfaceDeclaration) &&
        candidate.id.name === name,
    );

  if (declaration?.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
    return declaration.body.body;
  }

  return declaration?.type === AST_NODE_TYPES.TSTypeAliasDeclaration
    ? membersOf(declaration.typeAnnotation, program)
    : [];
};

/**
 * The members a type declares, when this file can see them: an inline shape,
 * or an alias or interface declared here. A type imported from elsewhere is
 * not guessed at.
 */
const membersOf = (
  annotation: TSESTree.TypeNode | undefined,
  program: TSESTree.Program,
): TSESTree.TypeElement[] => {
  if (annotation?.type === AST_NODE_TYPES.TSTypeLiteral) {
    return annotation.members;
  }

  return annotation?.type === AST_NODE_TYPES.TSTypeReference &&
    annotation.typeName.type === AST_NODE_TYPES.Identifier
    ? declaredMembers(annotation.typeName.name, program)
    : [];
};

const memberAnnotation = (
  members: TSESTree.TypeElement[],
  name: string,
): TSESTree.TypeNode | undefined =>
  members.find(
    (member): member is TSESTree.TSPropertySignature =>
      member.type === AST_NODE_TYPES.TSPropertySignature &&
      !member.computed &&
      member.key.type === AST_NODE_TYPES.Identifier &&
      member.key.name === name,
  )?.typeAnnotation?.typeAnnotation;

/** The type a class declares for `this.field` or `this.field.member`. */
const stateAnnotation = (
  owner: TSESTree.ClassDeclaration | TSESTree.ClassExpression,
  [field, member]: string[],
  program: TSESTree.Program,
): TSESTree.TypeNode | undefined => {
  const declared = fieldNamed(owner.body, field);

  return member === undefined
    ? declared?.annotation
    : memberAnnotation(membersOf(declared?.annotation, program), member);
};

/**
 * The value a call wraps. With one argument, that argument is the value; among
 * several, it is just one of the things a factory is told.
 */
const wrappedArgument = (
  node: TSESTree.CallExpression,
): TSESTree.CallExpressionArgument | undefined =>
  node.arguments.length === 1 ? node.arguments[0] : undefined;

const isUnwrapMember = (
  member: TSESTree.Node,
  node: TSESTree.CallExpression,
): member is TSESTree.MemberExpression & { property: TSESTree.Identifier } =>
  member.type === AST_NODE_TYPES.MemberExpression &&
  member.object === node &&
  !member.computed &&
  member.property.type === AST_NODE_TYPES.Identifier &&
  UNWRAPS.has(member.property.name);

const isCallOf = (
  call: TSESTree.Node | undefined,
  member: TSESTree.MemberExpression,
): call is TSESTree.CallExpression =>
  call?.type === AST_NODE_TYPES.CallExpression &&
  call.callee === member &&
  call.arguments.length === 0;

/** The call that unwraps `node` on the spot: `Type.create(raw).toString()`. */
const unwrapOf = (node: TSESTree.CallExpression): Unwrap | undefined =>
  isUnwrapMember(node.parent, node) && isCallOf(node.parent.parent, node.parent)
    ? { call: node.parent.parent, method: node.parent.property.name }
    : undefined;

/**
 * The parameter an identifier reads, when it is declared as a primitive by a
 * function that is not a factory.
 */
const primitiveParameter = (
  argument: TSESTree.Identifier,
  scope: TSESLint.Scope.Scope,
): PrimitiveParameter | undefined => {
  const definition = ASTUtils.findVariable(scope, argument)?.defs[0];

  if (
    definition?.type !== TSESLint.Scope.DefinitionType.Parameter ||
    definition.name.type !== AST_NODE_TYPES.Identifier ||
    isFactory(definition.node)
  ) {
    return undefined;
  }

  const primitive = primitiveOf(
    definition.name.typeAnnotation?.typeAnnotation,
  );

  return primitive ? { name: definition.name, primitive } : undefined;
};

const isProgram = (node: TSESTree.Node): node is TSESTree.Program =>
  node.type === AST_NODE_TYPES.Program;

/** The primitive a class declares for the state a call wraps, unless it wraps itself. */
const primitiveState = (
  node: TSESTree.CallExpression,
  path: string[],
  { type }: Construction,
): string | undefined => {
  const owner = closestAncestor(node, isClass);
  const program = closestAncestor(node, isProgram);

  return owner &&
    isClass(owner) &&
    program &&
    isProgram(program) &&
    owner.id?.name !== type
    ? primitiveOf(stateAnnotation(owner, path, program))
    : undefined;
};

const discardedFinding = (
  node: TSESTree.CallExpression,
  construction: Construction,
): Finding | undefined => {
  const unwrap = unwrapOf(node);

  return unwrap && {
    node: unwrap.call,
    messageId: 'discardedValueObject',
    data: { ...construction, unwrap: unwrap.method },
  };
};

const parameterFinding = (
  node: TSESTree.CallExpression,
  { type }: Construction,
  scope: TSESLint.Scope.Scope,
): Finding | undefined => {
  const argument = wrappedArgument(node);
  const parameter =
    argument?.type === AST_NODE_TYPES.Identifier
      ? primitiveParameter(argument, scope)
      : undefined;

  return parameter && {
    node: parameter.name,
    messageId: 'wrappedParameter',
    data: { name: parameter.name.name, primitive: parameter.primitive, type },
  };
};

const stateFinding = (
  node: TSESTree.CallExpression,
  construction: Construction,
): Finding | undefined => {
  const argument = wrappedArgument(node);
  const path = argument && ownStatePath(argument);
  const name = path?.[path.length - 1];
  const primitive =
    path && name ? primitiveState(node, path, construction) : undefined;

  return name && primitive
    ? {
        node,
        messageId: 'wrappedState',
        data: { name, primitive, type: construction.type },
      }
    : undefined;
};

export default createRule<[], MessageIds>({
  name: 'no-primitive-obsession',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow carrying a primitive that the code itself turns into a value object: a parameter wrapped outside a factory, state wrapped on every read, or a value object built only to be unwrapped.',
    },
    messages: {
      wrappedParameter:
        "'{{name}}' arrives as {{primitive}} and is turned into {{type}} here. Take a {{type}} instead, so the caller wraps it once, at the boundary.",
      wrappedState:
        "'{{name}}' is stored as {{primitive}} and turned into {{type}} on every read. Store it as a value object, built once in the factory.",
      discardedValueObject:
        '{{type}}.{{factory}}(...) is unwrapped with {{unwrap}}() as soon as it is built: the validation runs and the value object is thrown away. Keep the {{type}}.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const reported = new Set<TSESTree.Node>();

    const reportOnce = (finding: Finding | undefined): void => {
      if (finding && !reported.has(finding.node)) {
        reported.add(finding.node);
        context.report(finding);
      }
    };

    return {
      CallExpression(node) {
        const construction = constructionOf(node);

        if (!construction) {
          return;
        }

        [
          discardedFinding(node, construction),
          parameterFinding(node, construction, context.sourceCode.getScope(node)),
          stateFinding(node, construction),
        ].forEach(reportOnce);
      },
    };
  },
});
