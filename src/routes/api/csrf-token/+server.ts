import { rotateCsrfCookie } from '$lib/server/auth/session-cookies';
import { json } from '$lib/server/http/json';

import type { RequestHandler } from './$types';

/** Setzt CSRF-Cookie (nicht HttpOnly), Name siehe `$lib/app/brand.ts`; Client sendet als `X-CSRF-Token` bei mutierenden Requests. */
export const GET: RequestHandler = async ({ cookies }) => {
	const token = rotateCsrfCookie(cookies);
	return json({ csrfToken: token });
};
