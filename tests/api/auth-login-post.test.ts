import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/auth/auth-service.js', () => ({
	loginWithEntra: vi.fn()
}));

vi.mock('$lib/server/auth/session-cookies.js', () => ({
	setSessionCookie: vi.fn(),
	rotateCsrfCookie: vi.fn()
}));

import { loginWithEntra } from '$lib/server/auth/auth-service.js';

import { POST } from '../../src/routes/api/auth/login/+server.js';

describe('POST /api/auth/login', () => {
	beforeEach(() => {
		vi.mocked(loginWithEntra).mockReset();
	});

	it('returns 400 when JSON body invalid for schema', async () => {
		const req = new Request('http://localhost/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});
		const res = await POST({ request: req, cookies: {} } as unknown as Parameters<typeof POST>[0]);
		expect(res.status).toBe(400);
	});

	it('returns 401 when Entra login fails', async () => {
		vi.mocked(loginWithEntra).mockResolvedValue({
			success: false as const,
			error: 'bad token'
		});
		const req = new Request('http://localhost/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ accessToken: 'x' })
		});
		const res = await POST({ request: req, cookies: {} } as unknown as Parameters<typeof POST>[0]);
		expect(res.status).toBe(401);
	});

	it('returns 200 when login succeeds', async () => {
		vi.mocked(loginWithEntra).mockResolvedValue({
			success: true as const,
			token: 'session-jwt',
			user: {
				username: 'test',
				displayName: 'Test',
				role: 'admin',
				permissions: []
			}
		});
		const req = new Request('http://localhost/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ accessToken: 'valid-looking-token' })
		});
		const res = await POST({ request: req, cookies: {} } as unknown as Parameters<typeof POST>[0]);
		expect(res.status).toBe(200);
		const body = (await res.json()) as { success?: boolean };
		expect(body.success).toBe(true);
	});
});
