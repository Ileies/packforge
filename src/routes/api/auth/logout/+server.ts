import { logout } from '$lib/server/auth/auth-service';
import { sessionTokenFromCookie } from '$lib/server/auth/request-session';
import { clearAuthCookies } from '$lib/server/auth/session-cookies';
import { json } from '$lib/server/http/json';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, cookies }) => {
	const token = sessionTokenFromCookie(request);
	if (token) logout(token);
	clearAuthCookies(cookies);
	return json({ success: true, message: 'Abgemeldet.' });
};
