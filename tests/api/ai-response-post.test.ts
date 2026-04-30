import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$lib/server/auth/api-route-guards.js', () => ({
	requireSessionApi: vi.fn(async () => ({
		ok: true as const,
		user: {
			username: 'test',
			role: 'Admin',
			id: 'test-id',
			displayName: 'Test',
			entraRoles: [],
			entraGroups: []
		}
	})),
	forbiddenWithoutPermission: vi.fn(() => null),
	forbiddenUnlessAnyPermission: vi.fn(() => null)
}));

vi.mock('$lib/server/ai/model-selector.js', () => ({
	createAiResponse: vi.fn().mockResolvedValue({})
}));

import { MAX_AI_USER_TEXT_CHARS } from '$lib/server/ai/input-limits.js';
import { createAiResponse } from '$lib/server/ai/model-selector.js';

import { POST } from '../../src/routes/api/ai/response/+server.js';

describe('POST /api/ai/response', () => {
	beforeEach(() => {
		vi.mocked(createAiResponse).mockClear();
		vi.mocked(createAiResponse).mockResolvedValue({} as Awaited<ReturnType<typeof createAiResponse>>);
	});

	it('returns 400 when neither prompt nor promptId', async () => {
		const req = new Request('http://localhost/api/ai/response', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});
		const res = await POST({ request: req } as Parameters<typeof POST>[0]);
		expect(res.status).toBe(400);
		const body = (await res.json()) as { error?: string };
		expect(body.error).toContain('prompt');
		expect(body.error).toContain('promptId');
	});

	it('calls createAiResponse when promptId is set', async () => {
		const req = new Request('http://localhost/api/ai/response', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ promptId: 'p1' })
		});
		const res = await POST({ request: req } as Parameters<typeof POST>[0]);
		expect(res.status).toBe(200);
		expect(createAiResponse).toHaveBeenCalled();
	});

	it('returns JSON body when prompt is set (no SSE)', async () => {
		const req = new Request('http://localhost/api/ai/response', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt: 'hello' })
		});
		const res = await POST({ request: req } as Parameters<typeof POST>[0]);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toContain('application/json');
		const body = (await res.json()) as { success?: boolean; response?: unknown };
		expect(body.success).toBe(true);
		expect(body.response).toBeDefined();
	});

	it('returns 400 PF_AI_INPUT_TOO_LONG when prompt exceeds limit', async () => {
		const req = new Request('http://localhost/api/ai/response', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt: 'x'.repeat(MAX_AI_USER_TEXT_CHARS + 1) })
		});
		const res = await POST({ request: req } as Parameters<typeof POST>[0]);
		expect(res.status).toBe(400);
		const body = (await res.json()) as { code?: string; error?: string };
		expect(body.code).toBe('PF_AI_INPUT_TOO_LONG');
		expect(body.error).toContain('Prompt');
		expect(createAiResponse).not.toHaveBeenCalled();
	});
});
