module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true, // Assuming Mocha is used for tests
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended', // Enforce Node.js best practices
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'node/no-unpublished-require': 'off', // Allow requiring devDependencies in test/script files if needed
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn about unused variables, ignore if prefixed with _
    'node/no-missing-require': 'off', // Often flags dynamic requires incorrectly
    // Add any project-specific rules here
  },
  overrides: [
      {
          files: ['tests/**/*.js'], // Specific rules for test files
          rules: {
              'node/no-unpublished-require': 'off',
              'node/no-unpublished-import': 'off', // Allow importing unpublished modules in tests
              'node/no-unsupported-features/es-syntax': ['error', {
                  ignores: ['modules', 'dynamicImport'] // Allow dynamic imports in test files
              }]
          }
      }
  ]
}; 