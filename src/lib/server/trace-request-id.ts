/** Korrelation mit Upstream-Proxys; sonst neue UUID. */
export function traceIdFromRequest(request: Request): string {
	const incoming = request.headers.get('x-request-id')?.trim();
	if (incoming) return incoming.slice(0, 128);
	return crypto.randomUUID();
}
