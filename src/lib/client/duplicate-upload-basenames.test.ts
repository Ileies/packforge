import { describe, expect, it } from 'vitest';

import { duplicateUploadBasenames } from './duplicate-upload-basenames';

describe('duplicateUploadBasenames', () => {
	it('leer', () => {
		expect(duplicateUploadBasenames([])).toEqual([]);
	});

	it('ohne Duplikat', () => {
		expect(duplicateUploadBasenames([{ name: 'a.exe' }, { name: 'b.msi' }])).toEqual([]);
	});

	it('case-insensitive', () => {
		expect(duplicateUploadBasenames([{ name: 'A.exe' }, { name: 'a.exe' }])).toEqual(['a.exe']);
	});

	it('mehrfach vorkommender Name nur einmal in der Ergebnisliste', () => {
		expect(duplicateUploadBasenames([{ name: 'x.txt' }, { name: 'x.txt' }, { name: 'x.txt' }])).toEqual([
			'x.txt'
		]);
	});
});
