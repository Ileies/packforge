import { env } from '$env/dynamic/private';
import { PRODUCT_PUBLIC_ORIGIN } from '$lib/app/brand';

import { isDevLoginAllowed } from './dev-login';
import { getEntraUserInfo } from './entra-user';
import { validateEntraToken } from './entra-verify';
import { getRolePermissions } from './roles';
import { type SessionPayload, signSessionToken, verifySessionToken } from './session-jwt';

export function getEntraConfig() {
	const redirectFromEnv = env.AZURE_REDIRECT_URI?.trim();
	const redirectUri =
		redirectFromEnv ||
		(process.env.NODE_ENV === 'production'
			? `${PRODUCT_PUBLIC_ORIGIN}/login`
			: 'http://localhost:5173/login');
	return {
		clientId: env.AZURE_CLIENT_ID || '',
		authority: `https://login.microsoftonline.com/${env.AZURE_TENANT_ID || 'common'}`,
		redirectUri
	};
}

/** Antwort für `GET /api/auth/config` (Entra + Dev-Hinweis). */
export function getAuthPublicConfig() {
	return {
		...getEntraConfig(),
		devLogin: {
			enabled: isDevLoginAllowed(),
			passwordRequired: Boolean(env.DEV_LOGIN_PASSWORD)
		}
	};
}

export async function loginWithEntra(accessToken: string) {
	try {
		const tokenClaims = await validateEntraToken(accessToken);
		if (!tokenClaims) {
			return { success: false as const, error: 'Entra-ID-Token ungültig oder abgelaufen' };
		}
		const user = getEntraUserInfo(tokenClaims);
		const sessionToken = await signSessionToken({
			username: user.username,
			role: user.role,
			id: user.id,
			displayName: user.displayName,
			entraRoles: user.entraRoles,
			entraGroups: user.entraGroups
		});
		const permissions = getRolePermissions(user.role);
		return {
			success: true as const,
			token: sessionToken,
			user: {
				username: user.username,
				role: user.role,
				displayName: user.displayName,
				permissions
			}
		};
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Authentifizierung fehlgeschlagen';
		return { success: false as const, error: msg };
	}
}

/** Server-seitig gibt es keinen Token-Cache; Cookies werden in der Route geleert. */
export function logout(_token: string) {}

export async function getCurrentUser(token: string | undefined): Promise<SessionPayload | null> {
	if (!token) return null;
	return verifySessionToken(token);
}
