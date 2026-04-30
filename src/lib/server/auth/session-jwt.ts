import { env } from '$env/dynamic/private';

import { type SessionPayload, signSessionJwt, verifySessionJwt } from './session-jwt-core';

export type { SessionPayload };

function rawSecret(): string {
	return env.JWT_SECRET || 'dev-secret-change-in-production';
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
	return signSessionJwt(rawSecret(), payload);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
	return verifySessionJwt(rawSecret(), token);
}
