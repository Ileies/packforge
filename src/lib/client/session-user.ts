import { get, writable } from 'svelte/store';

/** Client-Spiegel der Server-Session (Profil/Rechte). Kein JWT in localStorage — nur HttpOnly-Cookie. */
export type SessionUser = {
	permissions?: string[];
	role?: string;
	username?: string;
	displayName?: string;
};

export const sessionUser = writable<SessionUser | null>(null);

export function setSessionUser(u: SessionUser | null): void {
	sessionUser.set(u);
}

export function clearSessionUser(): void {
	sessionUser.set(null);
}

export function clearAuth(): void {
	clearSessionUser();
}

export function hasPermission(perm: string): boolean {
	const u = get(sessionUser);
	return Boolean(u?.permissions?.includes(perm));
}
