import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/auth/session-cookies.js', () => ({
	setSessionCookie: vi.fn(),
	rotateCsrfCookie: vi.fn()
}));

import * as authService from '$lib/server/auth/auth-service.js';
import { API_DOC_ERROR_REF } from '$lib/server/http/errors.js';

import { POST as postAuthLogin } from '../../src/routes/api/auth/login/+server.js';
import { GET as getAuthMe } from '../../src/routes/api/auth/me/+server.js';
import { GET as getPackages } from '../../src/routes/api/packages/+server.js';

async function expectApiJsonError(res: Response, status: number, code: string) {
	expect(res.status).toBe(status);
	const body = (await res.json()) as { code?: string; docRef?: string; error?: string };
	expect(body.code, JSON.stringify(body)).toBe(code);
	expect(body.docRef).toBe(API_DOC_ERROR_REF);
	expect(typeof body.error).toBe('string');
	expect((body.error ?? '').length).toBeGreaterThan(0);
}

function kitLocals(over: Partial<App.Locals> = {}): App.Locals {
	return { traceId: 'api-contract-test', ...over };
}

describe('API-Fehlerantwort (HTTP-Status, PF_*-Code, docRef)', () => {
	const savedPublicPortfolio = process.env.PUBLIC_OPEN_PORTFOLIO_MODE;

	afterEach(() => {
		vi.restoreAllMocks();
		if (savedPublicPortfolio === undefined) delete process.env.PUBLIC_OPEN_PORTFOLIO_MODE;
		else process.env.PUBLIC_OPEN_PORTFOLIO_MODE = savedPublicPortfolio;
	});

	beforeEach(() => {
		delete process.env.PUBLIC_OPEN_PORTFOLIO_MODE;
	});

	it('GET /api/packages ohne Session → 401 PF_AUTH_REQUIRED', async () => {
		const res = await getPackages({
			request: new Request('http://localhost/api/packages'),
			url: new URL('http://localhost/api/packages'),
			locals: kitLocals()
		} as Parameters<typeof getPackages>[0]);
		await expectApiJsonError(res, 401, 'PF_AUTH_REQUIRED');
	});

	it('GET /api/auth/me ohne Session → 401 PF_AUTH_REQUIRED', async () => {
		const res = await getAuthMe({
			request: new Request('http://localhost/api/auth/me'),
			url: new URL('http://localhost/api/auth/me'),
			locals: kitLocals()
		} as Parameters<typeof getAuthMe>[0]);
		await expectApiJsonError(res, 401, 'PF_AUTH_REQUIRED');
	});

	it('POST /api/auth/login mit leerem JSON-Body → 400 PF_SCHEMA_VALIDATION', async () => {
		const req = new Request('http://localhost/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});
		const res = await postAuthLogin({
			request: req,
			cookies: {},
			locals: kitLocals()
		} as Parameters<typeof postAuthLogin>[0]);
		await expectApiJsonError(res, 400, 'PF_SCHEMA_VALIDATION');
	});

	it('POST /api/auth/login bei fehlgeschlagenem Entra → 401 PF_LOGIN_FAILED', async () => {
		const spy = vi.spyOn(authService, 'loginWithEntra').mockResolvedValue({
			success: false as const,
			error: 'bad token'
		});
		const req = new Request('http://localhost/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ accessToken: 'x' })
		});
		const res = await postAuthLogin({
			request: req,
			cookies: {},
			locals: kitLocals()
		} as Parameters<typeof postAuthLogin>[0]);
		await expectApiJsonError(res, 401, 'PF_LOGIN_FAILED');
		spy.mockRestore();
	});
});
