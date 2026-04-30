import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createMinimalFormfieldsImportPackage } from './factories/formfield.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('tests/fixtures', () => {
	it('formfields-minimal.json ist gültiges Import-Paket', () => {
		const raw = readFileSync(join(__dirname, 'fixtures', 'formfields-minimal.json'), 'utf-8');
		const j = JSON.parse(raw) as { formfields: unknown[] };
		expect(Array.isArray(j.formfields)).toBe(true);
		expect(j.formfields.length).toBeGreaterThan(0);
	});

	it('Factory createMinimalFormfieldsImportPackage entspricht Fixture-Struktur', () => {
		const f = createMinimalFormfieldsImportPackage({ exportedAt: '2026-04-29T00:00:00.000Z' });
		expect(f.version).toBe('1.0');
		expect(Array.isArray(f.formfields)).toBe(true);
		expect(f.formfields[0]).toMatchObject({ name: 'TestField', field_scope: 'both' });
	});
});
