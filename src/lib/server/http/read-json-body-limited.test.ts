import { describe, expect, it } from 'vitest';

import { readJsonBodyLimited } from './read-json-body-limited';

describe('readJsonBodyLimited', () => {
	it('akzeptiert kleinen Body ohne Content-Length (Stream-Pfad)', async () => {
		const req = new Request('http://x', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ok: true })
		});
		const out = await readJsonBodyLimited(req, 500);
		expect(out.ok).toBe(true);
		if (out.ok) expect(out.raw).toEqual({ ok: true });
	});

	it('lehnt Stream ab, wenn Limit überschritten', async () => {
		const payload = JSON.stringify({ x: 'y'.repeat(200) });
		const req = new Request('http://x', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: payload
		});
		const out = await readJsonBodyLimited(req, 32);
		expect(out.ok).toBe(false);
		if (!out.ok) {
			const j = (await out.response.json()) as { code?: string };
			expect(j.code).toBe('PF_REQUEST_BODY_TOO_LARGE');
		}
	});
});
