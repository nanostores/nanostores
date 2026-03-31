import loguxOxlintConfig from '@logux/oxc-configs/lint'
import { defineConfig } from 'oxlint'

export default defineConfig({
  extends: [loguxOxlintConfig],
  ignorePatterns: ['*/errors.ts'],
  rules: {
    'unicorn/consistent-function-scoping': 'off',

    'typescript/unbound-method': 'off',

    'no-unused-expressions': 'off'
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
      rules: {
        'typescript/no-explicit-any': 'off'
      }
    },
    {
      files: [
        'deep-map/index.test.ts',
        'index.d.ts',
        'warn/index.js',
        'computed/*.{ts,js}',
        'task/types.ts'
      ],
      rules: {
        'typescript/no-deprecated': 'off',

        'no-console': 'off'
      }
    }
  ]
})
