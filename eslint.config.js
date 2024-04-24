import loguxTsConfig from '@logux/eslint-config/ts'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  { ignores: ['**/errors.ts'] },
  ...loguxTsConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/unified-signatures': 'off',
      'camelcase': 'off',
      'consistent-return': 'off',
      'symbol-description': 'off'
    }
  },
  {
    files: ['deprecated/index.js'],
    rules: {
      'no-console': 'off'
    }
  }
]
