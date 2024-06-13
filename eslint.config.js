import antfu from '@antfu/eslint-config'

export default await antfu({
  vue: {
    overrides: {
      'vue/block-order': ['error', { order: [['template', 'script'], 'style'] }],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/one-component-per-file': 'off',
      'vue/define-macros-order': ['off'],
      'vue/max-attributes-per-line': ['error'],
    },
  },
  typescript: {
    overrides: {
      'ts/no-confusing-void-expression': 'off',
      'ts/no-floating-promises': 'off',
      'ts/no-misused-promises': 'off',
      'ts/no-non-null-assertion': 'off',
      'ts/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports', prefer: 'type-imports' }],
    },
  },
  rules: {
    'no-console': ['warn', { allow: ['debug', 'error', 'warn'] }],
    'no-unused-expressions': 'off',
    'curly': ['error', 'all'],
    'style/brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'n/prefer-global/process': 'off',
  },
}, {
  ignores: ['node_modules', 'generated', 'types/generated/schema.ts', '.nuxt', 'build', 'dist'],
})
