import { describe, expect, it } from 'vitest';

import { escapeFtsTrigramPhrase } from './packages-search-fts';

describe('escapeFtsTrigramPhrase', () => {
	it('setzt Phrase in Anführungszeichen und escaped doppelte Anführungszeichen', () => {
		expect(escapeFtsTrigramPhrase('a"b')).toBe('"a""b"');
	});

	it('normalisiert Whitespace', () => {
		expect(escapeFtsTrigramPhrase('  x  \n y  ')).toBe('"x y"');
	});
});
