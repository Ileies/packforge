import { describe, expect, it } from 'vitest';

import { APP_LOCALE, formatDateTime, formatListRelativeHint } from './locale-format';

describe('locale-format', () => {
	it('APP_LOCALE ist de-DE', () => {
		expect(APP_LOCALE).toBe('de-DE');
	});

	it('formatDateTime liefert — für leere Werte', () => {
		expect(formatDateTime(null)).toBe('—');
		expect(formatDateTime('')).toBe('—');
	});

	it('formatDateTime formatiert SQLite-ähnliche Zeitstempel', () => {
		const s = formatDateTime('2026-04-29 14:30:00');
		expect(s).not.toBe('—');
		expect(s.length).toBeGreaterThan(4);
	});

	it('formatListRelativeHint: Heute mit Minuten', () => {
		const now = new Date('2026-04-30T15:00:00');
		const h = formatListRelativeHint('2026-04-30T14:50:00', { now });
		expect(h?.badge).toBe('Heute');
		expect(h?.suffix).toBeTruthy();
		expect(h?.absoluteTitle).toBeTruthy();
	});

	it('formatListRelativeHint: Gestern', () => {
		const now = new Date('2026-04-30T12:00:00');
		const h = formatListRelativeHint('2026-04-29T18:00:00', { now });
		expect(h?.badge).toBe('Gestern');
		expect(h?.suffix).toBeNull();
	});

	it('formatListRelativeHint: älter als Fenster ohne Suffix', () => {
		const now = new Date('2026-04-30T12:00:00');
		const h = formatListRelativeHint('2026-03-01T10:00:00', { now, maxDaysForSuffix: 14 });
		expect(h?.badge).toBeNull();
		expect(h?.suffix).toBeNull();
	});
});
