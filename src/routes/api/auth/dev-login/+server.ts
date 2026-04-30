import z from 'zod';

import { loginWithDevProfile } from '$lib/server/auth/dev-login';
import { rotateCsrfCookie, setSessionCookie } from '$lib/server/auth/session-cookies';
import { jsonError, serverError } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';

import type { RequestHandler } from './$types';

const postBodySchema = z
	.object({
		role: z.string().optional(),
		password: z.string().optional()
	})
	.passthrough();

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const parsed = await parseRequestJson(request, postBodySchema);
		if (!parsed.ok) return parsed.response;
		const body = parsed.data;
		const role = typeof body?.role === 'string' ? body.role : undefined;
		const password = typeof body?.password === 'string' ? body.password : undefined;
		const result = await loginWithDevProfile(role, password);
		setSessionCookie(cookies, result.token);
		rotateCsrfCookie(cookies);
		return json({ success: true, user: result.user });
	} catch (e) {
		const status = (e as Error & { status?: number }).status ?? 500;
		const msg = e instanceof Error ? e.message : 'Fehler';
		if (status >= 500) return serverError(msg, 'PF_DEV_LOGIN');
		return jsonError(msg, status, 'PF_DEV_LOGIN');
	}
};
