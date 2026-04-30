import { describe, expect, it } from 'vitest';
import z from 'zod';

import { parseRequestJson } from './parse-request-json';

describe('parseRequestJson', () => {
	it('returns data for valid JSON', async () => {
		const schema = z.object({ a: z.number() });
		const req = new Request('http://x', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ a: 1 })
		});
		const out = await parseRequestJson(req, schema);
		expect(out.ok).toBe(true);
		if (out.ok) expect(out.data).toEqual({ a: 1 });
	});

	it('returns 400 for invalid JSON', async () => {
		const schema = z.object({ a: z.number() });
		const req = new Request('http://x', {
			method: 'POST',
			body: 'not-json'
		});
		const out = await parseRequestJson(req, schema);
		expect(out.ok).toBe(false);
		if (!out.ok) {
			expect(out.response.status).toBe(400);
			const j = (await out.response.json()) as { code?: string; error?: string };
			expect(j.code).toBe('PF_JSON_INVALID');
			expect(j.error).toMatch(/gültiges JSON/i);
		}
	});

	it('returns 400 when Content-Length exceeds JSON limit', async () => {
		const schema = z.object({ a: z.number() });
		const req = new Request('http://x', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': String(9 * 1024 * 1024)
			},
			body: JSON.stringify({ a: 1 })
		});
		const out = await parseRequestJson(req, schema);
		expect(out.ok).toBe(false);
		if (!out.ok) {
			expect(out.response.status).toBe(400);
			const j = (await out.response.json()) as { code?: string };
			expect(j.code).toBe('PF_REQUEST_BODY_TOO_LARGE');
		}
	});

	it('returns first Zod issue message', async () => {
		const schema = z.object({ x: z.string().min(2, 'too short') });
		const req = new Request('http://x', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ x: 'a' })
		});
		const out = await parseRequestJson(req, schema);
		expect(out.ok).toBe(false);
		if (!out.ok) {
			const j = (await out.response.json()) as { error?: string; code?: string };
			expect(j.error).toBe('too short');
			expect(j.code).toBe('PF_SCHEMA_VALIDATION');
		}
	});
});
