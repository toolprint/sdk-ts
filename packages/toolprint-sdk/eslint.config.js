import { config } from '@repo/eslint-config/base'

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    rules: {
      // Allow console statements in test files and specific contexts
      'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
      // Allow any types for integration points with external libraries
      '@typescript-eslint/no-explicit-any': 'off',
      // Disable unused vars rule in favor of more granular control
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ]
    }
  },
  {
    files: ['**/*.test.ts', '**/*.test.js'],
    rules: {
      // Allow console statements in test files
      'no-console': 'off',
      // Allow any types in test files for mock data
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]
