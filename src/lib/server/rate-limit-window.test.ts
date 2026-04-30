import { describe, expect, it } from 'vitest';

import { createSlidingWindowLimiter } from './rate-limit-window';

describe('createSlidingWindowLimiter', () => {
	it('blockiert nach max Treffern im Fenster', () => {
		const lim = createSlidingWindowLimiter();
		const t0 = 1_700_000_000_000;
		expect(lim('a', 2, 10_000, t0).allowed).toBe(true);
		expect(lim('a', 2, 10_000, t0).allowed).toBe(true);
		expect(lim('a', 2, 10_000, t0).allowed).toBe(false);
	});

	it('erlaubt wieder nach Ablauf des Fensters', () => {
		const lim = createSlidingWindowLimiter();
		expect(lim('b', 1, 1000, 0).allowed).toBe(true);
		expect(lim('b', 1, 1000, 500).allowed).toBe(false);
		expect(lim('b', 1, 1000, 1001).allowed).toBe(true);
	});

	it('trennt Schlüssel', () => {
		const lim = createSlidingWindowLimiter();
		expect(lim('x', 1, 1000, 0).allowed).toBe(true);
		expect(lim('y', 1, 1000, 0).allowed).toBe(true);
	});
});
