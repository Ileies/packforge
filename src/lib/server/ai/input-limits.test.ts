import { describe, expect, it } from 'vitest';

import { rejectIfTooLong } from './input-limits';

describe('rejectIfTooLong', () => {
	it('akzeptiert kurze Strings', () => {
		expect(rejectIfTooLong('X', 'hi', 10)).toBe(null);
	});

	it('lehnt zu lange Strings ab', () => {
		expect(rejectIfTooLong('Feld', 'abc', 2)).toContain('Feld');
		expect(rejectIfTooLong('Feld', 'abc', 2)).toContain('2');
	});
});
