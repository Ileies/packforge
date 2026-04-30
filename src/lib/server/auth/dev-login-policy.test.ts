import { describe, expect, it } from 'vitest';

import { computeDevLoginAllowed } from './dev-login-policy';

describe('dev-login-policy', () => {
	it('false schaltet immer aus', () => {
		expect(computeDevLoginAllowed('production', 'false')).toBe(false);
		expect(computeDevLoginAllowed('development', 'false')).toBe(false);
	});

	it('true schaltet an (Production nur mit AUTH_ENTRA_OPTIONAL + DEV_LOGIN_PASSWORD laut validate-env)', () => {
		expect(computeDevLoginAllowed('production', 'true')).toBe(true);
		expect(computeDevLoginAllowed('development', 'true')).toBe(true);
	});

	it('1 und yes schalten an', () => {
		expect(computeDevLoginAllowed('development', '1')).toBe(true);
		expect(computeDevLoginAllowed('development', 'YES')).toBe(true);
	});

	it('unset oder leer: immer aus', () => {
		expect(computeDevLoginAllowed('production', undefined)).toBe(false);
		expect(computeDevLoginAllowed('development', undefined)).toBe(false);
		expect(computeDevLoginAllowed(undefined, undefined)).toBe(false);
		expect(computeDevLoginAllowed('development', '')).toBe(false);
		expect(computeDevLoginAllowed('development', '   ')).toBe(false);
	});
});
