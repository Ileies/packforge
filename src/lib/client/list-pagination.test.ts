import { describe, expect, it } from 'vitest';

import { listPageDisplayedBounds, listTotalPages } from './list-pagination';

describe('listTotalPages', () => {
	it('liefert mindestens 1', () => {
		expect(listTotalPages(0, 24)).toBe(1);
		expect(listTotalPages(1, 24)).toBe(1);
	});

	it('rundet auf', () => {
		expect(listTotalPages(25, 24)).toBe(2);
		expect(listTotalPages(48, 24)).toBe(2);
		expect(listTotalPages(49, 24)).toBe(3);
	});
});

describe('listPageDisplayedBounds', () => {
	it('bei total 0', () => {
		expect(listPageDisplayedBounds(0, 0, 24, 0)).toEqual({ start: 0, end: 0 });
	});

	it('erste Seite voll', () => {
		expect(listPageDisplayedBounds(100, 0, 24, 24)).toEqual({ start: 1, end: 24 });
	});

	it('letzte Seite gekürzt', () => {
		expect(listPageDisplayedBounds(100, 4, 24, 4)).toEqual({ start: 97, end: 100 });
	});
});
