import { describe, expect, it } from 'vitest';

import { isApiPathSessionPublic, normalizeApiPathname } from './api-public-paths';

describe('normalizeApiPathname', () => {
	it('entfernt trailing slash', () => {
		expect(normalizeApiPathname('/api/software/')).toBe('/api/software');
	});
});

describe('isApiPathSessionPublic', () => {
	it('erlaubt CSRF-Token und Auth-Config', () => {
		expect(isApiPathSessionPublic('/api/csrf-token', 'GET')).toBe(true);
		expect(isApiPathSessionPublic('/api/csrf-token/', 'HEAD')).toBe(true);
		expect(isApiPathSessionPublic('/api/auth/config', 'GET')).toBe(true);
	});

	it('erlaubt Login-POSTs', () => {
		expect(isApiPathSessionPublic('/api/auth/login', 'POST')).toBe(true);
		expect(isApiPathSessionPublic('/api/auth/dev-login', 'POST')).toBe(true);
	});

	it('erlaubt GET/HEAD /api/auth/me (Portfolio: Gast-Session oder bestehende Session)', () => {
		expect(isApiPathSessionPublic('/api/auth/me', 'GET')).toBe(true);
		expect(isApiPathSessionPublic('/api/auth/me', 'HEAD')).toBe(true);
	});

	it('verweigert sonst geschützte Routen', () => {
		expect(isApiPathSessionPublic('/api/software', 'GET')).toBe(false);
		expect(isApiPathSessionPublic('/api/auth/login', 'GET')).toBe(false);
	});
});
