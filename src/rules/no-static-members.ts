import { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/createRule';

type Options = [{ allowReadonly: boolean }];
type MessageIds = 'staticMember';

export default createRule<Options, MessageIds>({
  name: 'no-static-members',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow static members. Static state and behavior cannot be injected, substituted, or mocked; prefer instances and a module-level value when you need a constant.',
    },
    messages: {
      staticMember:
        'Avoid static members. Use an injectable instance, or a module-level constant for shared values.',
    },
    schema: [
      {
        type: 'object',
        properties: { allowReadonly: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ allowReadonly: false }],
  create(context, [{ allowReadonly }]) {
    const reportKey = (key: TSESTree.Node): void => {
      context.report({ node: key, messageId: 'staticMember' });
    };

    return {
      MethodDefinition(node): void {
        if (node.static) {
          reportKey(node.key);
        }
      },
      PropertyDefinition(node): void {
        if (node.static && !(allowReadonly && node.readonly)) {
          reportKey(node.key);
        }
      },
      AccessorProperty(node): void {
        if (node.static) {
          reportKey(node.key);
        }
      },
      StaticBlock(node): void {
        context.report({ node, messageId: 'staticMember' });
      },
    };
  },
});
