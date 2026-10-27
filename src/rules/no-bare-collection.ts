import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';
import { closestAncestor } from '../utils/ancestors';
import { BUILT_INS } from '../utils/collaborators';
import { createRule } from '../utils/createRule';
import { FunctionLike, functionName } from '../utils/functionName';

type MessageIds = 'bareCollection';

type Finding = { node: TSESTree.Node; name: string; element: string };

/** Types the language ships, which name no concept of the domain. */
const AMBIENT: ReadonlySet<string> = new Set([
  ...BUILT_INS,
  'Awaited',
  'Buffer',
  'NonNullable',
  'Omit',
  'Partial',
  'Pick',
  'Readonly',
  'ReadonlyArray',
  'Record',
  'Required',
  'ReturnType',
  'Uint8Array',
]);

const ABSENCE = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.TSUndefinedKeyword,
  AST_NODE_TYPES.TSNullKeyword,
]);

const ARRAYS = new Set(['Array', 'ReadonlyArray']);

/** The nodes a property signature can belong to, nearest first. */
const HOLDERS = new Set<AST_NODE_TYPES>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.PropertyDefinition,
  AST_NODE_TYPES.TSInterfaceDeclaration,
  AST_NODE_TYPES.TSMethodSignature,
  AST_NODE_TYPES.TSParameterProperty,
  AST_NODE_TYPES.TSTypeAliasDeclaration,
]);

const declaresTypeParameter =
  (name: string) =>
  (node: TSESTree.Node): boolean =>
    'typeParameters' in node &&
    node.typeParameters?.type === AST_NODE_TYPES.TSTypeParameterDeclaration &&
    node.typeParameters.params.some((param) => param.name.name === name);

/** A type the domain declares: PascalCase, not ambient, not a type parameter. */
const domainTypeOf = (node: TSESTree.TypeNode | undefined): string | undefined =>
  node?.type === AST_NODE_TYPES.TSTypeReference &&
  node.typeName.type === AST_NODE_TYPES.Identifier &&
  /^[A-Z]/.test(node.typeName.name) &&
  !AMBIENT.has(node.typeName.name) &&
  !closestAncestor(node, declaresTypeParameter(node.typeName.name))
    ? node.typeName.name
    : undefined;

const onlyPresent = (
  union: TSESTree.TSUnionType,
): TSESTree.TypeNode | undefined => {
  const [only, ...others] = union.types.filter(
    (member) => !ABSENCE.has(member.type),
  );

  return others.length === 0 ? only : undefined;
};

const referenceName = (annotation: TSESTree.TypeNode): string | undefined =>
  annotation.type === AST_NODE_TYPES.TSTypeReference &&
  annotation.typeName.type === AST_NODE_TYPES.Identifier
    ? annotation.typeName.name
    : undefined;

const firstTypeArgument = (
  annotation: TSESTree.TypeNode,
): TSESTree.TypeNode | undefined =>
  annotation.type === AST_NODE_TYPES.TSTypeReference
    ? annotation.typeArguments?.params[0]
    : undefined;

/** What `readonly`, absence and a promise wrap, so they can be seen through. */
const wrapped = (
  annotation: TSESTree.TypeNode,
): TSESTree.TypeNode | undefined => {
  if (annotation.type === AST_NODE_TYPES.TSTypeOperator) {
    return annotation.typeAnnotation;
  }

  if (annotation.type === AST_NODE_TYPES.TSUnionType) {
    return onlyPresent(annotation);
  }

  return referenceName(annotation) === 'Promise'
    ? firstTypeArgument(annotation)
    : undefined;
};

/** The element type of `T[]`, `Array<T>` or `ReadonlyArray<T>`. */
const arrayElement = (
  annotation: TSESTree.TypeNode,
): TSESTree.TypeNode | undefined => {
  if (annotation.type === AST_NODE_TYPES.TSArrayType) {
    return annotation.elementType;
  }

  return ARRAYS.has(referenceName(annotation) ?? '')
    ? firstTypeArgument(annotation)
    : undefined;
};

/**
 * The domain type a bare array of it is declared as, seen through
 * `readonly`, a promise, and absence: `Promise<readonly Total[] | undefined>`
 * is a bare `Total[]`.
 */
const elementOf = (
  annotation: TSESTree.TypeNode | undefined,
): string | undefined => {
  const inner = annotation && wrapped(annotation);

  return inner
    ? elementOf(inner)
    : domainTypeOf(annotation && arrayElement(annotation));
};

const childTypes = (annotation: TSESTree.TypeNode): TSESTree.TypeNode[] => {
  if (
    annotation.type === AST_NODE_TYPES.TSIntersectionType ||
    annotation.type === AST_NODE_TYPES.TSUnionType
  ) {
    return annotation.types;
  }

  if (annotation.type === AST_NODE_TYPES.TSTypeOperator) {
    return annotation.typeAnnotation ? [annotation.typeAnnotation] : [];
  }

  return annotation.type === AST_NODE_TYPES.TSTypeReference
    ? (annotation.typeArguments?.params ?? [])
    : [];
};

/** Every type a state or construction annotation names, so its shape counts as owned. */
const referencedNames = (
  annotation: TSESTree.TypeNode | undefined,
): string[] => {
  const name = annotation && referenceName(annotation);

  return annotation
    ? [...(name ? [name] : []), ...childTypes(annotation).flatMap(referencedNames)]
    : [];
};

/**
 * A constructor or a static method: what it receives is the input it builds
 * an object from, so an array arriving there is about to be owned.
 */
const isConstruction = (node: TSESTree.Node): boolean =>
  node.parent?.type === AST_NODE_TYPES.MethodDefinition &&
  (node.parent.static || node.parent.kind === 'constructor');

/** A private method works on the internals; what it returns never leaves the owner. */
const isPrivateMethod = (node: TSESTree.Node): boolean =>
  node.parent?.type === AST_NODE_TYPES.MethodDefinition &&
  (node.parent.accessibility === 'private' ||
    node.parent.key.type === AST_NODE_TYPES.PrivateIdentifier);

const isFunction = (node: TSESTree.Node): node is FunctionLike =>
  node.type === AST_NODE_TYPES.ArrowFunctionExpression ||
  node.type === AST_NODE_TYPES.FunctionDeclaration ||
  node.type === AST_NODE_TYPES.FunctionExpression;

const isWithinParams = (fn: FunctionLike, node: TSESTree.Node): boolean =>
  fn.params.some(
    (param) => param.range[0] <= node.range[0] && node.range[1] <= param.range[1],
  );

/**
 * Whether a property signature describes a class's own state or the input of
 * its construction: a props type a field or factory names, or an inline shape
 * written right there.
 */
const isOwned = (
  signature: TSESTree.TSPropertySignature,
  owned: ReadonlySet<string>,
): boolean => {
  const holder = closestAncestor(signature, (node) => HOLDERS.has(node.type));

  return (
    holder?.type === AST_NODE_TYPES.PropertyDefinition ||
    holder?.type === AST_NODE_TYPES.TSParameterProperty ||
    ((holder?.type === AST_NODE_TYPES.TSTypeAliasDeclaration ||
      holder?.type === AST_NODE_TYPES.TSInterfaceDeclaration) &&
      owned.has(holder.id.name)) ||
    (holder !== undefined &&
      isFunction(holder) &&
      isConstruction(holder) &&
      isWithinParams(holder, signature))
  );
};

const parameterName = (
  param: TSESTree.Parameter,
): TSESTree.Identifier | undefined => {
  const name =
    param.type === AST_NODE_TYPES.AssignmentPattern ? param.left : param;

  return name.type === AST_NODE_TYPES.Identifier ? name : undefined;
};

const parameterFinding = (param: TSESTree.Parameter): Finding | undefined => {
  const name = parameterName(param);
  const element = elementOf(name?.typeAnnotation?.typeAnnotation);

  return name && element ? { node: name, name: name.name, element } : undefined;
};

const returnFinding = (
  returnType: TSESTree.TSTypeAnnotation | undefined,
  name: string,
): Finding | undefined => {
  const element = elementOf(returnType?.typeAnnotation);

  return returnType && element ? { node: returnType, name, element } : undefined;
};

const keyName = (key: TSESTree.Node): string | undefined =>
  key.type === AST_NODE_TYPES.Identifier ? key.name : undefined;

const signatureFinding = (
  signature: TSESTree.TSPropertySignature,
  owned: ReadonlySet<string>,
): Finding | undefined => {
  const name = keyName(signature.key);
  const element = elementOf(signature.typeAnnotation?.typeAnnotation);

  return name && element && !signature.computed && !isOwned(signature, owned)
    ? { node: signature.key, name, element }
    : undefined;
};

export default createRule<[], MessageIds>({
  name: 'no-bare-collection',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow arrays of domain types in signatures. A collection the domain passes around deserves a name: a class that keeps the array private and offers the operations callers need.',
    },
    messages: {
      bareCollection:
        "'{{name}}' exposes a bare {{element}}[]. Give the collection a name: a class that keeps the array private and offers the operations its callers need.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const owned = new Set<string>();
    const signatures = new Set<TSESTree.TSPropertySignature>();

    const report = (finding: Finding | undefined): void => {
      if (finding) {
        context.report({
          node: finding.node,
          messageId: 'bareCollection',
          data: { name: finding.name, element: finding.element },
        });
      }
    };

    const own = (annotation: TSESTree.TypeNode | undefined): void => {
      referencedNames(annotation).forEach((name) => owned.add(name));
    };

    const checkFunction = (node: FunctionLike): void => {
      if (isPrivateMethod(node)) {
        return;
      }

      node.params.forEach((param) =>
        isConstruction(node)
          ? own(parameterName(param)?.typeAnnotation?.typeAnnotation)
          : report(parameterFinding(param)),
      );
      report(returnFinding(node.returnType, functionName(node)?.name ?? '(anonymous)'));
    };

    return {
      ArrowFunctionExpression: checkFunction,
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      PropertyDefinition: (node) => own(node.typeAnnotation?.typeAnnotation),
      TSParameterProperty: (node) =>
        own(parameterName(node.parameter)?.typeAnnotation?.typeAnnotation),
      TSMethodSignature: (node) => {
        node.params.forEach((param) => report(parameterFinding(param)));
        report(returnFinding(node.returnType, keyName(node.key) ?? '(anonymous)'));
      },
      TSPropertySignature: (node) => signatures.add(node),
      'Program:exit': () => {
        signatures.forEach((signature) => report(signatureFinding(signature, owned)));
      },
    };
  },
});
