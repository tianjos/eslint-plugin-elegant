import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ max: number; ignoreDecorated: boolean }];
type MessageIds = 'tooManyFields';

const DEFAULT_MAX = 5;

/** Every shape a declared instance field takes: plain, abstract, or `accessor`. */
type Field =
  | TSESTree.PropertyDefinition
  | TSESTree.TSAbstractPropertyDefinition
  | TSESTree.AccessorProperty;

const isField = (member: TSESTree.ClassElement): member is Field =>
  member.type === AST_NODE_TYPES.PropertyDefinition ||
  member.type === AST_NODE_TYPES.TSAbstractPropertyDefinition ||
  member.type === AST_NODE_TYPES.AccessorProperty;

const named = (
  key: TSESTree.Node,
  sourceCode: TSESLint.SourceCode,
): string =>
  key.type === AST_NODE_TYPES.Identifier ? key.name : sourceCode.getText(key);

/**
 * Properties declared in the class body. A decorated one is skipped by default:
 * `@Column`, `@IsString` and friends map a field to a table or a payload, which
 * is framework shape rather than state the class chose to carry.
 */
const declared = (
  member: TSESTree.ClassElement,
  sourceCode: TSESLint.SourceCode,
  ignoreDecorated: boolean,
): string[] =>
  isField(member) &&
  !member.static &&
  !(ignoreDecorated && member.decorators.length > 0)
    ? [named(member.key, sourceCode)]
    : [];

/**
 * Constructor parameter properties. `ignoreDecorated` deliberately does not
 * reach them: a decorator on a parameter is injection (`@Inject(TOKEN)`), so the
 * field is a genuine collaborator and has to stay inside the budget.
 */
const promoted = (
  member: TSESTree.ClassElement,
  sourceCode: TSESLint.SourceCode,
): string[] => {
  if (
    member.type !== AST_NODE_TYPES.MethodDefinition ||
    member.kind !== 'constructor'
  ) {
    return [];
  }

  return member.value.params.flatMap((param) =>
    param.type === AST_NODE_TYPES.TSParameterProperty
      ? [named(param.parameter, sourceCode)]
      : [],
  );
};

export default createRule<Options, MessageIds>({
  name: 'max-class-fields',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a maximum number of instance fields per class to keep objects from becoming data bags.',
    },
    messages: {
      tooManyFields:
        "Class '{{name}}' holds {{count}} fields (max {{max}}): {{names}}. Consider grouping related fields into a value object.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'integer', minimum: 1 },
          ignoreDecorated: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ max: DEFAULT_MAX, ignoreDecorated: true }],
  create(context, [{ max, ignoreDecorated }]) {
    const sourceCode = context.sourceCode;

    return {
      ClassBody(node): void {
        const fields = node.body.flatMap((member) => [
          ...declared(member, sourceCode, ignoreDecorated),
          ...promoted(member, sourceCode),
        ]);

        if (fields.length <= max) {
          return;
        }

        const classNode = node.parent as
          | TSESTree.ClassDeclaration
          | TSESTree.ClassExpression;

        context.report({
          node: classNode.id ?? node,
          messageId: 'tooManyFields',
          data: {
            name: classNode.id?.name ?? '(anonymous)',
            count: fields.length,
            max,
            names: fields.join(', '),
          },
        });
      },
    };
  },
});
