import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter: adapter({ out: 'build' }),
		// CSP-Baseline (§3 Roadmap); style-src: unsafe-inline nötig für Svelte/Transitions laut Kit-Doku
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none'],
				'img-src': ['self', 'data:', 'https:'],
				'font-src': ['self', 'data:'],
				'style-src': ['self', 'unsafe-inline'],
				'connect-src': [
					'self',
					'https://login.microsoftonline.com',
					'https://login.live.com',
					'https://graph.microsoft.com'
				],
				'frame-src': ['self', 'https://login.microsoftonline.com', 'https://login.live.com'],
				'worker-src': ['self', 'blob:']
			}
		}
	}
};

export default config;
