/** POST ohne vorheriges CSRF-Cookie (Login). */
export function isCsrfExemptApi(pathname: string, method: string): boolean {
	if (pathname === '/api/csrf-token') return true;
	if (method === 'POST' && (pathname === '/api/auth/dev-login' || pathname === '/api/auth/login'))
		return true;
	return false;
}

export const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
