import { requireSessionApi } from '$lib/server/auth/api-route-guards';
import { getRolePermissions } from '$lib/server/auth/roles';
import { setSessionCookie } from '$lib/server/auth/session-cookies';
import { signSessionToken } from '$lib/server/auth/session-jwt';
import { json } from '$lib/server/http/json';
import { isOpenPortfolioDemo, PORTFOLIO_GUEST_SESSION } from '$lib/server/portfolio-demo';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, locals, cookies }) => {
	const session = await requireSessionApi(request, locals);
	if (session.ok) {
		const { user } = session;
		const permissions = getRolePermissions(user.role);
		return json({
			success: true,
			user: {
				username: user.username,
				role: user.role,
				displayName: user.displayName,
				permissions
			}
		});
	}

	if (isOpenPortfolioDemo()) {
		const jwt = await signSessionToken(PORTFOLIO_GUEST_SESSION);
		setSessionCookie(cookies, jwt);
		const permissions = getRolePermissions(PORTFOLIO_GUEST_SESSION.role);
		return json({
			success: true,
			user: {
				username: PORTFOLIO_GUEST_SESSION.username,
				role: PORTFOLIO_GUEST_SESSION.role,
				displayName: PORTFOLIO_GUEST_SESSION.displayName,
				permissions
			}
		});
	}

	return session.response;
};
