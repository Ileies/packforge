/**
 * Standard-Unit-Tests: nur `environment: 'node'`.
 * DOM-/Svelte-Komponenten-Strategie: siehe CURSOR.md → „Env, Tests, Doku“ (Vitest).
 */
import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
		globals: false,
		env: {
			LOG_FILE_ENABLED: 'false'
		}
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, 'src/lib'),
			'$env/dynamic/private': path.resolve(__dirname, 'tests/mocks/env-dynamic-private.ts')
		}
	}
});
