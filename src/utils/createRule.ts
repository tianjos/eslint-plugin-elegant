import { ESLintUtils } from '@typescript-eslint/utils';

/**
 * Factory for all rules in this plugin. Centralises the docs URL convention so
 * every rule links back to its documentation by name.
 */
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/tianjos/eslint-plugin-elegant/blob/main/docs/rules/${name}.md`,
);
