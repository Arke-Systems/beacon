import tseslint from 'typescript-eslint';
import globals from 'globals';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

const tsProjects = [
	'./tsconfig.json',
	'./tsconfig.test.json',
	'./cli/src/tsconfig.json',
];

/**
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
	{
		// Global ignores
		ignores: [
			'cli/dist/',
			'cli/src/cs/api/cma-openapi-3.d.ts',
			'node_modules/',
			'src/models/cs.d.ts',
		],
	},

	{
		// Base-level rules that always apply to every file.
		files: ['**/*.js', '**/*.ts'],
		languageOptions: { globals: { ...globals.node } },
		linterOptions: { reportUnusedDisableDirectives: true },
		rules: {
			...js.configs.recommended.rules,
			...prettier.rules,
			'block-scoped-var': 'error',
			complexity: ['error', { max: 20 }],
			eqeqeq: 'error',
			'max-classes-per-file': 'error',
			'max-depth': 'error',
			'max-lines': ['error', { max: 300, skipComments: true }],
			'max-lines-per-function': ['error', { max: 50, skipComments: true }],
			'max-nested-callbacks': 'error',
			'no-alert': 'error',
			'no-bitwise': 'error',
			'no-constructor-return': 'error',
			'no-else-return': 'error',
			'no-eval': 'error',
			'no-lone-blocks': 'error',
			'no-lonely-if': 'error',
			'no-magic-numbers': [
				'error',
				{ ignore: [0, 1, -1], ignoreArrayIndexes: true },
			],
			'no-new-wrappers': 'error',
			'no-shadow': 'error',
			'no-template-curly-in-string': 'error',
			'no-throw-literal': 'error',
			'no-unneeded-ternary': 'error',
			'no-unused-expressions': 'error',
			'no-useless-catch': 'error',
			'no-useless-concat': 'error',
			'no-useless-constructor': 'error',
			'no-useless-rename': 'error',
			'no-useless-return': 'error',
			'no-var': 'error',
			'prefer-arrow-callback': 'error',
			'prefer-const': 'error',
			'prefer-destructuring': 'error',
			'prefer-named-capture-group': 'error',
			'prefer-numeric-literals': 'error',
			'prefer-object-has-own': 'error',
			'prefer-object-spread': 'error',
			'prefer-promise-reject-errors': 'error',
			'prefer-regex-literals': 'error',
			'prefer-rest-params': 'error',
			'prefer-spread': 'error',
			'require-await': 'error',
			'require-unicode-regexp': 'error',
			'sort-keys': 'error',
		},
	},
	{
		// Additional base-level rules for TypeScript files.
		files: ['**/*.ts'],

		languageOptions: {
			globals: { ...globals.node },
			parser: tseslint.parser,
			parserOptions: {
				project: tsProjects,
				sourceType: 'module',
			},
		},

		plugins: {
			'@typescript-eslint': tseslint.plugin,
		},

		rules: {
			...extractTsLintConfig(tseslint.configs.stylisticTypeChecked),
			...extractTsLintConfig(tseslint.configs.strictTypeChecked),
			...prettier.rules,

			'@typescript-eslint/class-methods-use-this': [
				'error',
				{
					ignoreClassesThatImplementAnInterface: 'public-fields',
					ignoreOverrideMethods: true,
				},
			],

			'@typescript-eslint/consistent-type-exports': 'error',
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/member-ordering': 'error',
			'@typescript-eslint/no-confusing-void-expression': [
				'error',
				{
					ignoreArrowShorthand: true,
					ignoreVoidOperator: true,
				},
			],
			'@typescript-eslint/no-import-type-side-effects': 'error',
			'@typescript-eslint/no-magic-numbers': [
				'error',
				{
					ignore: [0, 1, -1],
					ignoreArrayIndexes: true,
					ignoreTypeIndexes: true,
				},
			],
			'@typescript-eslint/no-meaningless-void-operator': 'error',
			'@typescript-eslint/no-require-imports': 'error',
			'@typescript-eslint/no-shadow': 'error',
			'@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ ignoreRestSiblings: true },
			],
			'@typescript-eslint/no-useless-constructor': 'error',
			'@typescript-eslint/no-useless-empty-export': 'error',
			'@typescript-eslint/prefer-destructuring': 'error',
			'@typescript-eslint/prefer-enum-initializers': 'error',
			'@typescript-eslint/prefer-includes': 'error',
			'@typescript-eslint/prefer-readonly': 'error',
			'@typescript-eslint/promise-function-async': 'error',
			'@typescript-eslint/restrict-template-expressions': [
				'error',
				{
					allowBoolean: true,
					allowNullish: true,
					allowNumber: true,
				},
			],
			'@typescript-eslint/sort-type-constituents': 'error',
			'@typescript-eslint/unified-signatures': [
				'error',
				{ ignoreDifferentlyNamedParameters: true },
			],
			'class-methods-use-this': 'off',
			'no-dupe-class-members': 'off',
			'no-magic-numbers': 'off',

			// Getting false positives from the base eslint rule, and the TypeScript
			// compiler already emits warnings about this anyway.
			'no-redeclare': 'off',

			'no-restricted-syntax': [
				'error',
				{
					message: 'Use #private instead.',
					selector:
						':matches(PropertyDefinition, MethodDefinition)[accessibility="private"]:not([kind="constructor"])',
				},
			],

			'no-shadow': 'off',
			'no-undef': 'off',
			'no-useless-constructor': 'off',
			'prefer-destructuring': 'off',
		},
	},
	{
		// Due to the need to control terminal output, only a subset of the CLI
		// sub-project is allowed to use the console object.
		files: ['cli/src/**/*.ts'],
		ignores: ['cli/src/ui/**/*.ts'],
		rules: { 'no-console': 'error' },
	},
	{
		// Additional rules that apply only to tests.
		files: ['test/**/*.ts', 'cli/src/**/*.test.ts'],

		// eslint-plugin-vitest is not compatible with current versions of
		// eslint / typescript-eslint, so we can't use it yet.
		// plugins: { vitest },

		rules: {
			// ...vitest.configs.recommended.rules

			// Willing to tolerate non-null assertions in a test context, as failures
			// will throw errors and therefore fail tests.
			'@typescript-eslint/no-non-null-assertion': 'off',

			// Too many false positives caused by use of vitest's expect.any() method.
			'@typescript-eslint/no-unsafe-assignment': 'off',

			// Unit tests defined in suites tend to go on for a while.
			'max-lines-per-function': 'off',
		},
	},
	{
		// vitest performs pre-processing on test contexts and and requires usage
		// of an object destructuring pattern, even for an empty use-case;
		// see https://vitest.dev/guide/test-context.html#fixture-initialization
		files: ['test/**/*TestContext.ts'],
		rules: { 'no-empty-pattern': 'off' },
	},
];

export default config;

// typescript-eslint has decided to "fully support" flat file configs by
// wrapping everything in their own utility function that works only on the
// most basic config. Now, we need to extract the necessary information from
// its complex structure.
function extractTsLintConfig(tsLintConfig) {
	if (!Array.isArray(tsLintConfig)) {
		throw new Error('typescript-eslint configuration is not as expected');
	}

	const extractedConfig = {};

	for (const item of tsLintConfig) {
		const { rules } = item;

		if (rules) {
			for (const [name, value] of Object.entries(rules)) {
				extractedConfig[name] = value;
			}
		}
	}

	return extractedConfig;
}
