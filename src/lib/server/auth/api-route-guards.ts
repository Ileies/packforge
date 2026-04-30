import { forbidden, unauthorized } from '$lib/server/http/errors';

import { requireSession } from './request-session';
import { getRolePermissions } from './roles';
import type { SessionPayload } from './session-jwt';

export type RequireSessionApiResult = { ok: true; user: SessionPayload } | { ok: false; response: Response };

type SessionLocals = Pick<App.Locals, 'sessionUser'>;

/**
 * Session für JSON-API: zuerst `locals.sessionUser` (gesetzt in `hooks.server.ts` für geschützte
 * `/api/*`), sonst Cookie prüfen — Fallback für Tests oder zukünftige Aufrufer ohne Hook-Kontext.
 */
export async function requireSessionApi(
	request: Request,
	locals?: SessionLocals
): Promise<RequireSessionApiResult> {
	const fromHook = locals?.sessionUser;
	if (fromHook) return { ok: true, user: fromHook };
	try {
		return { ok: true, user: await requireSession(request) };
	} catch {
		return { ok: false, response: unauthorized('Nicht angemeldet', 'PF_AUTH_REQUIRED') };
	}
}

/** 403, wenn die Rolle **keine** der angegebenen Permissions hat. */
export function forbiddenUnlessAnyPermission(
	user: SessionPayload,
	permissions: readonly string[],
	message: string,
	code: string
): Response | null {
	const granted = getRolePermissions(user.role);
	if (permissions.some((p) => granted.includes(p))) return null;
	return forbidden(message, code);
}

/** 403, wenn die Rolle eine bestimmte Permission nicht hat. */
export function forbiddenWithoutPermission(
	user: SessionPayload,
	permission: string,
	message: string,
	code: string
): Response | null {
	if (getRolePermissions(user.role).includes(permission)) return null;
	return forbidden(message, code);
}
