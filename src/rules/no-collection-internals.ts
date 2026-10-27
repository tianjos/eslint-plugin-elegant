import { ASTUtils, AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { closestAncestor } from '../utils/ancestors';
import { createRule } from '../utils/createRule';

type MessageIds = 'foreignPipeline' | 'positionalAccess';

const PIPELINES = new Set([
  'every',
  'filter',
  'find',
  'findIndex',
  'findLast',
  'findLastIndex',
  'flatMap',
  'forEach',
  'map',
  'reduce',
  'reduceRight',
  'some',
]);

/** Methods that hand back the same collection, reshaped: a chain flows through them. */
const RESHAPES = new Set([
  ...PIPELINES,
  'concat',
  'flat',
  'reverse',
  'slice',
  'sort',
  'toReversed',
  'toSorted',
]);

/** Static helpers that turn their argument into an array of what it holds. */
const VIEWS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['Array', new Set(['from'])],
  ['Object', new Set(['entries', 'keys', 'values'])],
]);

/** String and regex methods, whose results are indexed by position by design. */
const MATCHES = new Set(['exec', 'match', 'split']);

/** How far a chain of locals is followed back to its source. */
const MAX_HOPS = 5;

const methodOf = (node: TSESTree.Node): string | undefined =>
  node.type === AST_NODE_TYPES.CallExpression &&
  node.callee.type === AST_NODE_TYPES.MemberExpression &&
  !node.callee.computed &&
  node.callee.property.type === AST_NODE_TYPES.Identifier
    ? node.callee.property.name
    : undefined;

const receiverOf = (node: TSESTree.CallExpression): TSESTree.Expression | undefined =>
  node.callee.type === AST_NODE_TYPES.MemberExpression ? node.callee.object : undefined;

const isPipeline = (node: TSESTree.Node): node is TSESTree.CallExpression =>
  PIPELINES.has(methodOf(node) ?? '');

/** `Object.entries(source)` and `Array.from(source)`, read as `source`. */
const viewedSource = (node: TSESTree.CallExpression): TSESTree.Node | undefined => {
  const receiver = receiverOf(node);
  const views =
    receiver?.type === AST_NODE_TYPES.Identifier ? VIEWS.get(receiver.name) : undefined;

  return views?.has(methodOf(node) ?? '') ? node.arguments[0] : undefined;
};

/** One step back towards where a collection comes from, or `undefined` at its source. */
const stepBack = (node: TSESTree.Node): TSESTree.Node | undefined => {
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return node.object;
  }

  if (
    node.type === AST_NODE_TYPES.ChainExpression ||
    node.type === AST_NODE_TYPES.TSNonNullExpression
  ) {
    return node.expression;
  }

  return node.type === AST_NODE_TYPES.CallExpression
    ? (RESHAPES.has(methodOf(node) ?? '') ? receiverOf(node) : undefined) ??
        viewedSource(node)
    : undefined;
};

/**
 * Where a collection comes from: members and pipelines walked back, so
 * `this.props.totals.filter(isOpen)` comes from `this`, and
 * `this.repository.all()` from a call nobody here owns.
 */
const sourceOf = (node: TSESTree.Node): TSESTree.Node => {
  let current = node;
  let previous = stepBack(current);

  while (previous) {
    current = previous;
    previous = stepBack(current);
  }

  return current;
};

/** The initialiser a `const` local was declared with. */
const initialiserOf = (
  identifier: TSESTree.Identifier,
  scope: TSESLint.Scope.Scope,
): TSESTree.Expression | undefined => {
  const definition = ASTUtils.findVariable(scope, identifier)?.defs[0];

  return definition?.type === TSESLint.Scope.DefinitionType.Variable &&
    definition.parent.kind === 'const'
    ? (definition.node.init ?? undefined)
    : undefined;
};

/**
 * Whether a collection is the receiver's own state: it comes from `this`,
 * directly or through a `const` that was itself derived from `this`. An array
 * literal belongs to whoever wrote it, so `[a, b].filter(Boolean)` is owned
 * where it stands; one that spreads a collection is owned only if that
 * collection is, so `[...this.items].sort(byDay)` passes and `[...days]` does
 * not.
 */
const isOwnState = (
  node: TSESTree.Node,
  scope: TSESLint.Scope.Scope,
  hops = 0,
): boolean => {
  const source = sourceOf(node);
  const initialiser =
    source.type === AST_NODE_TYPES.Identifier && hops < MAX_HOPS
      ? initialiserOf(source, scope)
      : undefined;

  return (
    source.type === AST_NODE_TYPES.ThisExpression ||
    (source.type === AST_NODE_TYPES.ArrayExpression &&
      source.elements.every(
        (element) =>
          element?.type !== AST_NODE_TYPES.SpreadElement ||
          isOwnState(element.argument, scope, hops + 1),
      )) ||
    (initialiser !== undefined && isOwnState(initialiser, scope, hops + 1))
  );
};

/** A static method is a secondary constructor: building a collection from rows is its job. */
const isInsideFactory = (node: TSESTree.Node): boolean =>
  closestAncestor(
    node,
    (candidate) =>
      candidate.type === AST_NODE_TYPES.MethodDefinition && candidate.static,
  ) !== undefined;

const isNumber = (node: TSESTree.Node): boolean =>
  (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'number') ||
  (node.type === AST_NODE_TYPES.UnaryExpression &&
    node.operator === '-' &&
    isNumber(node.argument));

/** `x.length - n`, the way the last positions are spelled. */
const isFromEnd = (node: TSESTree.Node): boolean =>
  node.type === AST_NODE_TYPES.BinaryExpression &&
  node.operator === '-' &&
  node.left.type === AST_NODE_TYPES.MemberExpression &&
  !node.left.computed &&
  node.left.property.type === AST_NODE_TYPES.Identifier &&
  node.left.property.name === 'length';

const isMatchResult = (node: TSESTree.Node): boolean =>
  MATCHES.has(methodOf(node) ?? '');

/** The collection a positional read targets: `x[0]`, `x[x.length - 1]` or `x.at(-1)`. */
const positionallyRead = (node: TSESTree.Node): TSESTree.Expression | undefined => {
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return node.computed && (isNumber(node.property) || isFromEnd(node.property))
      ? node.object
      : undefined;
  }

  const [position] = node.type === AST_NODE_TYPES.CallExpression ? node.arguments : [];

  return methodOf(node) === 'at' && position && isNumber(position) && node.type === AST_NODE_TYPES.CallExpression
    ? receiverOf(node)
    : undefined;
};

export default createRule<[], MessageIds>({
  name: 'no-collection-internals',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Disallow reading a collection by position or running a pipeline over it outside its owner: only the class whose state it is, or a static factory building one, works on an array's internals.",
    },
    messages: {
      foreignPipeline:
        "'{{collection}}.{{method}}(...)' works on a collection from outside its owner. Move the operation into the collection's class, where the array is private state, and ask it for the result.",
      positionalAccess:
        "'{{collection}}' is read by position. Positions are the collection's internals: ask its owner for what the position means, such as first(), last() or range().",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const isOwned = (node: TSESTree.Node, collection: TSESTree.Node): boolean =>
      isInsideFactory(node) ||
      isOwnState(collection, context.sourceCode.getScope(node));

    const checkPosition = (node: TSESTree.MemberExpression | TSESTree.CallExpression): void => {
      const collection = positionallyRead(node);

      if (!collection || isMatchResult(collection) || isOwned(node, collection)) {
        return;
      }

      context.report({
        node,
        messageId: 'positionalAccess',
        data: { collection: context.sourceCode.getText(collection) },
      });
    };

    const checkPipeline = (node: TSESTree.CallExpression): void => {
      const collection = receiverOf(node);

      if (!collection || isPipeline(collection) || isOwned(node, collection)) {
        return;
      }

      context.report({
        node,
        messageId: 'foreignPipeline',
        data: {
          method: methodOf(node),
          collection: context.sourceCode.getText(collection),
        },
      });
    };

    return {
      MemberExpression: checkPosition,
      CallExpression: (node) => {
        checkPosition(node);

        if (isPipeline(node)) {
          checkPipeline(node);
        }
      },
    };
  },
});
