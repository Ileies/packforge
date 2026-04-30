import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('appLog', () => {
	let warnSpy: ReturnType<typeof vi.spyOn>;
	let logSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it('unterdrückt warn bei LOG_LEVEL=error und NODE_ENV=test', async () => {
		vi.stubEnv('NODE_ENV', 'test');
		vi.stubEnv('LOG_LEVEL', 'error');
		const { appLog } = await import('./app-log');
		appLog.warn('x');
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('gibt warn aus bei LOG_LEVEL=warn', async () => {
		vi.stubEnv('NODE_ENV', 'test');
		vi.stubEnv('LOG_LEVEL', 'warn');
		const { appLog } = await import('./app-log');
		appLog.warn('hi');
		expect(warnSpy).toHaveBeenCalledWith('hi');
	});

	it('gibt info aus bei LOG_LEVEL=info', async () => {
		vi.stubEnv('NODE_ENV', 'test');
		vi.stubEnv('LOG_LEVEL', 'info');
		const { appLog } = await import('./app-log');
		appLog.info('line');
		expect(logSpy).toHaveBeenCalledWith('line');
	});

	it('unterdrückt info bei LOG_LEVEL=warn', async () => {
		vi.stubEnv('NODE_ENV', 'test');
		vi.stubEnv('LOG_LEVEL', 'warn');
		const { appLog } = await import('./app-log');
		appLog.info('nope');
		expect(logSpy).not.toHaveBeenCalled();
	});
});
