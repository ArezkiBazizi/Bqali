// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Textes FR avec apostrophes — désactivé en secours si la fusion flat échoue en CI
      'react/no-unescaped-entities': 'off',
    },
  },
]);
