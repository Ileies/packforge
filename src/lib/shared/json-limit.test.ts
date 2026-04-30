import { describe, expect, it } from 'vitest';

import { assertJsonFileWithinLimit, MAX_JSON_IMPORT_BYTES, parseContentLengthHeader } from './json-limit';

describe('assertJsonFileWithinLimit', () => {
	it('erlaubt leere/kleine Dateien', () => {
		expect(() => assertJsonFileWithinLimit(0)).not.toThrow();
		expect(() => assertJsonFileWithinLimit(MAX_JSON_IMPORT_BYTES)).not.toThrow();
	});

	it('wirft über Limit', () => {
		expect(() => assertJsonFileWithinLimit(MAX_JSON_IMPORT_BYTES + 1)).toThrow(/zu groß/);
	});
});

describe('parseContentLengthHeader', () => {
	it('liefert null bei Fehlen oder Ungültigem', () => {
		expect(parseContentLengthHeader(null)).toBeNull();
		expect(parseContentLengthHeader('')).toBeNull();
		expect(parseContentLengthHeader('x')).toBeNull();
	});

	it('parst gültige Länge', () => {
		expect(parseContentLengthHeader(' 42 ')).toBe(42);
	});
});
