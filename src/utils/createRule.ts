import { ESLintUtils } from '@typescript-eslint/utils';

/**
 * Factory for all rules in this plugin. Centralises the docs URL convention so
 * every rule links back to its section in the README. The anchor matches the
 * `#### \`<name>\`` heading GitHub generates for each rule under "Rule details".
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/tianjos/eslint-plugin-elegant/blob/main/README.md#${name}`,
);
