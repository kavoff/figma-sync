module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  globals: {
    Buffer: true,
    process: true,
    console: true,
  },
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'off',
  },
};