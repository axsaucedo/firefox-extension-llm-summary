module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true,
        webextensions: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    globals: {
        browser: 'readonly',
        chrome: 'readonly'
    },
    rules: {
        // Code quality
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'no-console': 'warn',
        'prefer-const': 'error',
        'no-var': 'error',

        // Style preferences
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],

        // Best practices
        'eqeqeq': 'error',
        'curly': 'error',
        'no-throw-literal': 'error',
        'no-return-assign': 'error',

        // ES6+
        'arrow-spacing': 'error',
        'object-shorthand': 'error',
        'prefer-arrow-callback': 'error',
        'prefer-template': 'error'
    },
    overrides: [
        {
            files: ['tests/**/*.js'],
            rules: {
                'no-console': 'off' // Allow console in tests
            }
        }
    ]
};