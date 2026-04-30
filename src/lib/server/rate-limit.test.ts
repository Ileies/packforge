import { describe, expect, it } from 'vitest';

import { rateLimitCategory } from './rate-limit-paths';

describe('rateLimitCategory', () => {
	it('erkennt Login-POST', () => {
		expect(rateLimitCategory('/api/auth/login', 'POST')).toBe('login');
		expect(rateLimitCategory('/api/auth/dev-login', 'POST')).toBe('login');
		expect(rateLimitCategory('/api/auth/login', 'GET')).toBe(null);
	});

	it('erkennt KI-Pfad', () => {
		expect(rateLimitCategory('/api/ai/enrichment', 'POST')).toBe('ai');
		expect(rateLimitCategory('/api/ai/test-openai', 'GET')).toBe('ai');
	});

	it('überspringt andere APIs', () => {
		expect(rateLimitCategory('/api/auth/me', 'GET')).toBe(null);
		expect(rateLimitCategory('/api/software', 'GET')).toBe(null);
	});

	it('erkennt schwere Schreib-POSTs', () => {
		expect(rateLimitCategory('/api/software', 'POST')).toBe('api_write');
		expect(rateLimitCategory('/api/formfields/import', 'POST')).toBe('api_write');
		expect(rateLimitCategory('/api/admin/instance-export', 'POST')).toBe('api_write');
		expect(rateLimitCategory('/api/software', 'PUT')).toBe(null);
	});
});
