import { beforeEach, describe, expect, it } from 'vitest';

import { clearSessionUser, hasPermission, setSessionUser } from './session-user';

describe('session-user', () => {
	beforeEach(() => {
		clearSessionUser();
	});

	it('hasPermission ist false ohne User', () => {
		expect(hasPermission('VIEW_STAMMDATEN')).toBe(false);
	});

	it('hasPermission ist true mit passender Berechtigung', () => {
		setSessionUser({ permissions: ['VIEW_STAMMDATEN'] });
		expect(hasPermission('VIEW_STAMMDATEN')).toBe(true);
	});
});
