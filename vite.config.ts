import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		include: [
			'ace-builds/src-noconflict/ace',
			'ace-builds/src-noconflict/mode-powershell',
			'ace-builds/src-noconflict/ext-searchbox'
		]
	},
	ssr: {
		external: ['bun:sqlite']
	}
});
