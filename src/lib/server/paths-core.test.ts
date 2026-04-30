import { describe, expect, it } from 'vitest';

import { pathsFromRoot, resolveDataRoot } from './paths-core';

describe('paths-core', () => {
	it('nutzt ./data relativ zum cwd ohne Override', () => {
		const root = resolveDataRoot('/app/packforge');
		expect(root).toBe('/app/packforge/data');
	});

	it('Override DATA_ROOT', () => {
		expect(resolveDataRoot('/x', '/tmp/d')).toBe('/tmp/d');
	});

	it('pathsFromRoot', () => {
		const p = pathsFromRoot('/data');
		expect(p.mainDb).toMatch(/database[/\\]packforge\.db$/);
		expect(p.prompts).toBe('/data/prompts');
	});
});
