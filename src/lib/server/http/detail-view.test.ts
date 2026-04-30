import { describe, expect, it } from 'vitest';

import { resolveDetailView } from './detail-view';

function url(s: string) {
	return new URL(s, 'https://example.test');
}

describe('resolveDetailView', () => {
	it('defaults to full', () => {
		expect(resolveDetailView(url('/x'))).toEqual({ ok: true, view: 'full' });
		expect(resolveDetailView(url('/x?view='))).toEqual({ ok: true, view: 'full' });
	});

	it('accepts full, detail, summary, minimal', () => {
		expect(resolveDetailView(url('/?view=full'))).toEqual({ ok: true, view: 'full' });
		expect(resolveDetailView(url('/?view=detail'))).toEqual({ ok: true, view: 'full' });
		expect(resolveDetailView(url('/?view=summary'))).toEqual({ ok: true, view: 'summary' });
		expect(resolveDetailView(url('/?view=minimal'))).toEqual({ ok: true, view: 'summary' });
	});

	it('rejects unknown view', () => {
		const r = resolveDetailView(url('/?view=compact'));
		expect(r.ok).toBe(false);
		if (!r.ok) expect(r.response.status).toBe(400);
	});
});
