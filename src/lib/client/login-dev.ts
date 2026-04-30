import { apiRoutes } from './api-routes';

export type DevLoginRole = 'Admin' | 'Mitarbeiter' | 'Besucher';

export async function loginWithDevCredentials(
	role: DevLoginRole,
	password?: string
): Promise<{ user: unknown } | { error: string }> {
	const lr = await fetch(apiRoutes.auth.devLogin, {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ role, password: password || undefined })
	});
	const data = (await lr.json()) as { error?: string; user?: unknown };
	if (!lr.ok) {
		return { error: data.error ?? 'Dev-Login fehlgeschlagen' };
	}
	return { user: data.user };
}
