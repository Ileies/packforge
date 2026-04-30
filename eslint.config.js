import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import ts from 'typescript-eslint';

export default ts.config(
	{
		ignores: [
			'**/node_modules/**',
			'**/build/**',
			'**/.svelte-kit/**',
			'**/dist/**',
			'**/drizzle/**',
			// shadcn-Generat: Import-Reihenfolge & Kit-Resolve-Regeln nicht manuell pflegen
			'src/lib/components/ui/**'
		]
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		plugins: {
			'simple-import-sort': simpleImportSort
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error'
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte'],
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			'svelte/no-navigation-without-resolve': 'off',
			'svelte/require-each-key': 'off',
			'svelte/prefer-writable-derived': 'off',
			'@typescript-eslint/no-floating-promises': 'error'
		}
	},
	{
		files: ['src/**/*.ts', 'tests/**/*.ts'],
		ignores: ['**/node_modules/**', '**/build/**', '**/.svelte-kit/**', 'src/lib/components/ui/**'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			'@typescript-eslint/no-floating-promises': 'error'
		}
	},
	prettier
);
