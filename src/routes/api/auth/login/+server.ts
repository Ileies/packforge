import z from 'zod';

import { loginWithEntra } from '$lib/server/auth/auth-service';
import { rotateCsrfCookie, setSessionCookie } from '$lib/server/auth/session-cookies';
import { unauthorized } from '$lib/server/http/errors';
import { json } from '$lib/server/http/json';
import { parseRequestJson } from '$lib/server/http/parse-request-json';

import type { RequestHandler } from './$types';

const bodySchema = z.object({
	accessToken: z.string().min(1, 'Zugriffstoken ist erforderlich.')
});

export const POST: RequestHandler = async ({ request, cookies }) => {
	const parsed = await parseRequestJson(request, bodySchema);
	if (!parsed.ok) return parsed.response;
	const { accessToken } = parsed.data;
	const result = await loginWithEntra(accessToken);
	if (!result.success) return unauthorized(result.error, 'PF_LOGIN_FAILED');
	setSessionCookie(cookies, result.token);
	rotateCsrfCookie(cookies);
	return json({ success: true, user: result.user });
};
