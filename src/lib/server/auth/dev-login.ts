import { env } from '$env/dynamic/private';

import { computeDevLoginAllowed } from './dev-login-policy';
import type { RoleName } from './roles';
import { getRolePermissions } from './roles';
import { signSessionJwt } from './session-jwt-core';

const ROLES: RoleName[] = ['Admin', 'Mitarbeiter', 'Besucher'];

export function isDevLoginAllowed(): boolean {
	return computeDevLoginAllowed(env.NODE_ENV, env.ALLOW_DEV_LOGIN);
}

export function assertDevPassword(sent: string | undefined): void {
	const required = env.DEV_LOGIN_PASSWORD;
	if (!required) return;
	if (sent !== required) {
		const e = new Error('Ungültiges Entwickler-Passwort');
		(e as Error & { status: number }).status = 401;
		throw e;
	}
}

export async function loginWithDevProfile(role: string | undefined, password: string | undefined) {
	if (!isDevLoginAllowed()) {
		const e = new Error('Dev-Login ist deaktiviert');
		(e as Error & { status: number }).status = 403;
		throw e;
	}
	assertDevPassword(password);
	const r = (ROLES.includes(role as RoleName) ? role : 'Admin') as RoleName;
	const username = `dev.${r.toLowerCase()}@local.test`;
	const id = `dev-local:${r}`;
	const displayName = `Entwickler (${r})`;
	const secret = env.JWT_SECRET || 'dev-secret-change-in-production';
	const sessionToken = await signSessionJwt(secret, {
		username,
		role: r,
		id,
		displayName,
		entraRoles: [],
		entraGroups: []
	});
	const permissions = getRolePermissions(r);
	return {
		success: true as const,
		token: sessionToken,
		user: { username, role: r, displayName, permissions }
	};
}
