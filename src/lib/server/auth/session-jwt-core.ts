import { jwtVerify, SignJWT } from 'jose';

import { JWT_AUD, JWT_ISS } from '$lib/app/brand';

export { JWT_AUD, JWT_ISS };

export type SessionPayload = {
	username: string;
	role: string;
	id: string;
	displayName: string;
	entraRoles: string[];
	entraGroups: string[];
};

function bytes(secret: string): Uint8Array {
	return new TextEncoder().encode(secret);
}

export async function signSessionJwt(secret: string, payload: SessionPayload): Promise<string> {
	const claims: Record<string, unknown> = {
		username: payload.username,
		role: payload.role,
		id: payload.id,
		displayName: payload.displayName,
		entraRoles: payload.entraRoles,
		entraGroups: payload.entraGroups
	};
	return new SignJWT(claims)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer(JWT_ISS)
		.setAudience(JWT_AUD)
		.setSubject(payload.id)
		.setExpirationTime('24h')
		.sign(bytes(secret));
}

export async function verifySessionJwt(secret: string, token: string): Promise<SessionPayload | null> {
	try {
		const { payload } = await jwtVerify(token, bytes(secret), {
			issuer: JWT_ISS,
			audience: JWT_AUD
		});
		return {
			username: String(payload.username),
			role: String(payload.role),
			id: String(payload.id),
			displayName: String(payload.displayName ?? payload.username),
			entraRoles: (payload.entraRoles as string[]) || [],
			entraGroups: (payload.entraGroups as string[]) || []
		};
	} catch {
		return null;
	}
}
