import { describe, expect, it } from 'vitest';

import { signSessionJwt, verifySessionJwt } from './session-jwt-core';

describe('session-jwt-core', () => {
	it('sign und verify', async () => {
		const secret = 'unit-test-secret-32chars-min!!';
		const token = await signSessionJwt(secret, {
			username: 'u',
			role: 'Admin',
			id: '1',
			displayName: 'U',
			entraRoles: [],
			entraGroups: []
		});
		const out = await verifySessionJwt(secret, token);
		expect(out?.username).toBe('u');
		expect(out?.role).toBe('Admin');
	});

	it('falsches Secret', async () => {
		const t = await signSessionJwt('a', {
			username: 'u',
			role: 'Admin',
			id: '1',
			displayName: 'U',
			entraRoles: [],
			entraGroups: []
		});
		expect(await verifySessionJwt('b', t)).toBeNull();
	});
});
