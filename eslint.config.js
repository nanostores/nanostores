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
  },
  {
    files: ['**/*.test.js', '**/*.test.ts'],
    rules: {
      'n/no-unsupported-features/node-builtins': 'off'
    }
  },
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'n/no-unsupported-features/node-builtins': 'off'
    }
  }
]
