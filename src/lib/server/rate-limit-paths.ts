/** Welche Requests unterliegen welchem Limit (Roadmap: Login, KI, schwere Schreib-APIs). */
export function rateLimitCategory(pathname: string, method: string): 'login' | 'ai' | 'api_write' | null {
	if (method === 'POST' && (pathname === '/api/auth/login' || pathname === '/api/auth/dev-login')) {
		return 'login';
	}
	if (pathname.startsWith('/api/ai/')) return 'ai';
	if (
		method === 'POST' &&
		(pathname === '/api/software' ||
			pathname === '/api/formfields/import' ||
			pathname.startsWith('/api/admin/'))
	) {
		return 'api_write';
	}
	return null;
}
