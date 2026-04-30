import { describe, expect, it } from 'vitest';

import { API_KEY_SCOPES, normalizeApiKeyScopes, scopesFromJson, scopesToJson } from './api-key-scopes';

describe('api-key-scopes', () => {
	it('normalizes and sorts unique scopes', () => {
		const s = normalizeApiKeyScopes(['software:write', 'export:run', 'software:write']);
		expect(s).toEqual(['export:run', 'software:write']);
	});

	it('rejects empty array', () => {
		expect(() => normalizeApiKeyScopes([])).toThrow(/nicht-leeres Array/);
	});

	it('rejects unknown scope', () => {
		expect(() => normalizeApiKeyScopes(['export:run', 'evil:scope'])).toThrow(/ungültiger Scope/);
	});

	it('round-trips JSON', () => {
		const json = scopesToJson(['packages:read', 'export:run'] as const);
		expect(JSON.parse(json)).toEqual(['export:run', 'packages:read']);
		expect(scopesFromJson(json)).toEqual(['export:run', 'packages:read']);
	});

	it('documents all declared scopes', () => {
		expect(API_KEY_SCOPES.length).toBeGreaterThan(0);
		for (const s of API_KEY_SCOPES) {
			expect(normalizeApiKeyScopes([s])).toEqual([s]);
		}
	});
});
