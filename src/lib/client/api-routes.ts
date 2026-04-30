/**
 * Relative API-Pfade für `fetch` / `apiJson` im Client.
 * Zentral nur dort, wo Pfade mehrfach vorkommen oder klar als „Kanone“ gelten sollen.
 *
 * GET-`view`: siehe `docs/api.md` und `resolveDetailView` — `minimal` wird serverseitig wie `summary` behandelt.
 */
function detailWithView(
	base: string,
	id: string | number,
	opts?: { view?: 'full' | 'detail' | 'summary' | 'minimal' }
): string {
	const v = opts?.view;
	if (v === 'summary' || v === 'minimal') return `${base}/${id}?view=${v}`;
	return `${base}/${id}`;
}

export const apiRoutes = {
	csrfToken: '/api/csrf-token',
	auth: {
		me: '/api/auth/me',
		config: '/api/auth/config',
		login: '/api/auth/login',
		devLogin: '/api/auth/dev-login',
		logout: '/api/auth/logout'
	},
	software: {
		list: '/api/software',
		detail: (id: string | number, opts?: { view?: 'full' | 'detail' | 'summary' | 'minimal' }) =>
			detailWithView('/api/software', id, opts),
		checkpoints: (id: string | number) => `/api/software/${id}/checkpoints`,
		checkpoint: (id: string | number) => `/api/software/${id}/checkpoint`,
		checkpointNumber: (id: string | number, n: number) => `/api/software/${id}/checkpoint/${n}`,
		checkpointRestore: (id: string | number, n: number) => `/api/software/${id}/checkpoint/${n}/restore`,
		exportZip: (id: string | number) => `/api/software/${id}/export`
	},
	templates: {
		list: '/api/templates',
		nextMinor: (majorVersion: string | number) => `/api/templates/next-minor/${majorVersion}`,
		detail: (id: string | number, opts?: { view?: 'full' | 'detail' | 'summary' | 'minimal' }) =>
			detailWithView('/api/templates', id, opts)
	},
	packages: {
		list: '/api/packages',
		detail: (id: string | number, opts?: { view?: 'full' | 'detail' | 'summary' | 'minimal' }) =>
			detailWithView('/api/packages', id, opts)
	},
	formfields: {
		list: '/api/formfields',
		detail: (id: string | number) => `/api/formfields/${id}`,
		export: '/api/formfields/export',
		import: '/api/formfields/import',
		reorder: '/api/formfields/reorder'
	},
	ai: {
		response: '/api/ai/response',
		activeModel: '/api/ai/active-model',
		apiKey: '/api/ai/api-key',
		setModel: '/api/ai/set-model',
		setApiKey: '/api/ai/set-api-key',
		testOpenai: '/api/ai/test-openai',
		testAnthropic: '/api/ai/test-anthropic',
		scriptImprove: '/api/ai/script-improve',
		scriptFix: '/api/ai/script-fix',
		enrichment: '/api/ai/enrichment'
	},
	scriptLint: '/api/script/lint',
	settings: {
		powershellLintProfile: '/api/settings/powershell-lint-profile'
	},
	admin: {
		instanceExport: '/api/admin/instance-export'
	},
	systemFields: '/api/system-fields'
} as const;
