module.exports = {
  env: {
    es2021: true
  },
  extends: ['standard-with-typescript', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  overrides: [
  ],
  ignorePatterns: ['.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  root: true,
  rules: {
    'no-console': 'warn',
    "semi": ["error", "always"],
    "@typescript-eslint/semi": ["error", "always"]
  }
}
