/**
 * Maschinenlesbare Scopes für API-Schlüssel (CI/CD, Automation).
 * Namen sind absichtlich nicht 1:1 mit JWT-Rollen-Strings — Mapping zur Berechtigungsprüfung kommt in der Auth-Middleware.
 */
export const API_KEY_SCOPES = [
	'export:run',
	'software:read',
	'software:write',
	'templates:read',
	'templates:write',
	'formfields:read',
	'formfields:write',
	'packages:read',
	'packages:write'
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

const ALLOWED = new Set<string>(API_KEY_SCOPES);

export function isApiKeyScope(s: string): s is ApiKeyScope {
	return ALLOWED.has(s);
}

/** Mindestens ein Scope; jeder Eintrag muss in {@link API_KEY_SCOPES} vorkommen. */
export function normalizeApiKeyScopes(input: unknown): ApiKeyScope[] {
	if (!Array.isArray(input) || input.length === 0) {
		const e = new Error('Scopes: nicht-leeres Array erforderlich') as Error & { status: number };
		e.status = 400;
		throw e;
	}
	const out = new Set<ApiKeyScope>();
	for (const x of input) {
		if (typeof x !== 'string' || !isApiKeyScope(x)) {
			const e = new Error(`Scopes: ungültiger Scope "${String(x)}"`) as Error & { status: number };
			e.status = 400;
			throw e;
		}
		out.add(x);
	}
	return [...out].sort();
}

export function scopesToJson(scopes: ApiKeyScope[]): string {
	return JSON.stringify(normalizeApiKeyScopes(scopes));
}

export function scopesFromJson(json: string): ApiKeyScope[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(json) as unknown;
	} catch {
		const e = new Error('Scopes: ungültiges JSON') as Error & { status: number };
		e.status = 400;
		throw e;
	}
	return normalizeApiKeyScopes(parsed);
}
