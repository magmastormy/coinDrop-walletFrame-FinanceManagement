import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['dist', 'backend/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/*.test.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern:
            '^_|^e$|^err$|^(onAddCategory|activeInsight|categories|viewMode|theme|user|store)$',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_|^e$|^err$',
          varsIgnorePattern:
            '^(React|_|[A-Z].*|theme|isDarkMode|isLoading|loading|error|txError|contextSuggestions|openGallery|newContentCount|savedCount|isUserEducation|selectedPost|setSelectedPost|showFullContent|handleCardClick|engagementRate|imageFiles|isUploading|handleImageUpload|setFilterType|store|cn|motion)$',
          ignoreRestSiblings: true,
        },
      ],
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'react/no-unescaped-entities': 'error',
      'react-refresh/only-export-components': 'off',
      'react/display-name': 'off',
    },
  },
]
