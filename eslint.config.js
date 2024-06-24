import js from '@eslint/js'
import globals from 'globals'
import jsdoc from 'eslint-plugin-jsdoc'

export default [
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    plugins: {
      jsdoc
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'error',
      'require-await': 'error',
      'no-return-await': 'error',
      'no-unreachable': 'error',
      'no-await-in-loop': 'error',

      'jsdoc/require-param-description': 'off',
      'jsdoc/require-property-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-jsdoc': 'off'
    }
  }
]
