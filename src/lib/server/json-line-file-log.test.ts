import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('json-line-file-log', () => {
	let dir: string;

	beforeEach(() => {
		dir = path.join(tmpdir(), `pf-log-${Date.now()}-${Math.random().toString(36).slice(2)}`);
		vi.stubEnv('LOG_FILE_ENABLED', 'true');
		vi.stubEnv('LOG_DIR', dir);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		try {
			fs.rmSync(dir, { recursive: true, force: true });
		} catch {
			/* ignore */
		}
	});

	it('schreibt http_access und audit in getrennte Dateien', async () => {
		const { appendStructuredJsonLine } = await import('./json-line-file-log');
		appendStructuredJsonLine('http_access', '{"a":1}');
		appendStructuredJsonLine('audit', '{"b":2}');
		expect(fs.readFileSync(path.join(dir, 'http-access.log'), 'utf8').trim()).toBe('{"a":1}');
		expect(fs.readFileSync(path.join(dir, 'audit.log'), 'utf8').trim()).toBe('{"b":2}');
	});

	it('rotiert wenn LOG_MAX_BYTES überschritten', async () => {
		vi.stubEnv('LOG_MAX_BYTES', '80');
		const { appendStructuredJsonLine } = await import('./json-line-file-log');
		const chunk = 'x'.repeat(50);
		appendStructuredJsonLine('http_access', chunk);
		appendStructuredJsonLine('http_access', chunk);
		appendStructuredJsonLine('http_access', '{}');
		const names = fs.readdirSync(dir);
		expect(names.some((n) => /^http-access\.\d+\.log$/.test(n))).toBe(true);
		expect(fs.readFileSync(path.join(dir, 'http-access.log'), 'utf8').trim()).toBe('{}');
	});

	it('löscht alte rotierte http-access-Dateien bei Retention', async () => {
		vi.stubEnv('LOG_RETENTION_DAYS_HTTP', '1');
		fs.mkdirSync(dir, { recursive: true });
		const stale = path.join(dir, 'http-access.111.log');
		fs.writeFileSync(stale, 'old', 'utf8');
		const old = new Date('2000-01-01');
		fs.utimesSync(stale, old, old);
		const { __test_runRetentionNow } = await import('./json-line-file-log');
		__test_runRetentionNow(dir);
		expect(fs.existsSync(stale)).toBe(false);
	});
});
