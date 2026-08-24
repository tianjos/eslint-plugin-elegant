import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ max: number; ignore: string[] }];
type MessageIds = 'tooManyDependencies';

const DEFAULT_MAX = 4;

/**
 * Ambient types every codebase reaches for. Instantiating a `Date` or a `Map` is
 * not a design decision worth budgeting, so they never count as collaborators.
 */
const BUILT_INS = [
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
];

/**
 * `key` identifies the collaborator for de-duplication and carries its type
 * arguments, so `Repository<Order>` and `Repository<Customer>` count separately.
 * `root` drops them, so exclusions match on the bare name.
 */
type Dependency = { key: string; root: string };

/** Distinct collaborator keys gathered for a single class body. */
type Dependencies = Set<string>;

const injected = (
  body: TSESTree.ClassBody,
  sourceCode: TSESLint.SourceCode,
): Dependency[] => {
  const constructor = body.body.find(
    (member): member is TSESTree.MethodDefinition =>
      member.type === AST_NODE_TYPES.MethodDefinition &&
      member.kind === 'constructor',
  );

  return (constructor?.value.params ?? []).flatMap((param) => {
    const target =
      param.type === AST_NODE_TYPES.TSParameterProperty
        ? param.parameter
        : param;
    const annotation = target.typeAnnotation?.typeAnnotation;

    return annotation?.type === AST_NODE_TYPES.TSTypeReference
      ? [
          {
            key: sourceCode.getText(annotation),
            root: sourceCode.getText(annotation.typeName),
          },
        ]
      : [];
  });
};

const instantiated = (
  node: TSESTree.NewExpression,
  sourceCode: TSESLint.SourceCode,
): Dependency => {
  const root = sourceCode.getText(node.callee);
  const args = node.typeArguments;

  return {
    key: `${root}${args === undefined ? '' : sourceCode.getText(args)}`,
    root,
  };
};

export default createRule<Options, MessageIds>({
  name: 'max-class-dependencies',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a maximum number of distinct collaborators a class depends on.',
    },
    messages: {
      tooManyDependencies:
        "Class '{{name}}' depends on {{count}} types (max {{max}}): {{names}}. Consider extracting a collaborator.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'integer', minimum: 1 },
          ignore: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ max: DEFAULT_MAX, ignore: [] }],
  create(context, [{ max, ignore }]) {
    const sourceCode = context.sourceCode;
    const ignored = new Set([...BUILT_INS, ...ignore]);
    const scopes: Dependencies[] = [];

    const record = (
      scope: Dependencies | undefined,
      dependency: Dependency,
    ): void => {
      if (scope !== undefined && !ignored.has(dependency.root)) {
        scope.add(dependency.key);
      }
    };

    return {
      ClassBody(node): void {
        const scope: Dependencies = new Set();
        scopes.push(scope);

        for (const dependency of injected(node, sourceCode)) {
          record(scope, dependency);
        }
      },

      NewExpression(node): void {
        if (node.parent.type === AST_NODE_TYPES.ThrowStatement) {
          return;
        }

        record(scopes[scopes.length - 1], instantiated(node, sourceCode));
      },

      'ClassBody:exit'(node: TSESTree.ClassBody): void {
        const dependencies = scopes.pop() ?? new Set<string>();

        if (dependencies.size <= max) {
          return;
        }

        const classNode = node.parent as
          | TSESTree.ClassDeclaration
          | TSESTree.ClassExpression;

        context.report({
          node: classNode.id ?? node,
          messageId: 'tooManyDependencies',
          data: {
            name: classNode.id?.name ?? '(anonymous)',
            count: dependencies.size,
            max,
            names: [...dependencies].join(', '),
          },
        });
      },
    };
  },
});
