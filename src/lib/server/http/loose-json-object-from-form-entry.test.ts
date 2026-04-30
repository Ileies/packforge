import { describe, expect, it } from 'vitest';

import { looseJsonObjectFromFormEntry } from './loose-json-object-from-form-entry';

describe('looseJsonObjectFromFormEntry', () => {
	it('parst gültiges Objekt', () => {
		expect(looseJsonObjectFromFormEntry('{"a":1}')).toEqual({ a: 1 });
	});

	it('liefert {} bei ungültigem JSON', () => {
		expect(looseJsonObjectFromFormEntry('{')).toEqual({});
	});

	it('liefert {} bei Array oder Primitiv', () => {
		expect(looseJsonObjectFromFormEntry('[1]')).toEqual({});
		expect(looseJsonObjectFromFormEntry('"x"')).toEqual({});
	});

	it('null/undefined → {}', () => {
		expect(looseJsonObjectFromFormEntry(null)).toEqual({});
	});
});
