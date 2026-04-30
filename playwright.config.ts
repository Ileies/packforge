import { defineConfig } from '@playwright/test';

/** Eigener Port, damit `bun run e2e` nicht mit einem laufenden Dev-Server auf 5173 kollidiert. */
const devPort = process.env.PLAYWRIGHT_DEV_PORT || '9299';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${devPort}`;

export default defineConfig({
	testDir: 'e2e',
	timeout: 60_000,
	use: {
		baseURL,
		trace: 'on-first-retry'
	},
	retries: process.env.CI ? 1 : 0,
	webServer: {
		command: `bun run dev -- --host 127.0.0.1 --port ${devPort}`,
		url: `${baseURL}/login`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
		env: {
			...process.env,
			LOG_FILE_ENABLED: 'false'
		}
	}
});
