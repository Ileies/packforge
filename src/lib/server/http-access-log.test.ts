import { describe, expect, it } from 'vitest';

import { traceIdFromRequest } from './trace-request-id';

describe('traceIdFromRequest', () => {
	it('übernimmt x-request-id', () => {
		const id = 'client-trace-abc';
		const r = new Request('http://localhost/', { headers: { 'x-request-id': id } });
		expect(traceIdFromRequest(r)).toBe(id);
	});

	it('erzeugt UUID wenn kein Header', () => {
		const r = new Request('http://localhost/');
		const t = traceIdFromRequest(r);
		expect(t).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
	});
});
