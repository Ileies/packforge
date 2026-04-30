<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { clientLog } from '$lib/client/client-log';
	type AceEditor = import('ace-builds').Ace.Editor;

	let {
		value = $bindable(''),
		mode = 'powershell',
		theme = 'github',
		readonly = false,
		minHeight = '420px',
		class: className = ''
	}: {
		value?: string;
		mode?: string;
		theme?: string;
		readonly?: boolean;
		minHeight?: string;
		class?: string;
	} = $props();

	let host = $state<HTMLDivElement | null>(null);
	let editor = $state<AceEditor | null>(null);
	let lastExternal = $state('');
	let themeApplyGeneration = 0;

	async function ensureAceThemeLoaded(themeName: string): Promise<void> {
		switch (themeName) {
			case 'github':
				await import('ace-builds/src-noconflict/theme-github');
				return;
			case 'one_dark':
				await import('ace-builds/src-noconflict/theme-one_dark');
				return;
			case 'monokai':
				await import('ace-builds/src-noconflict/theme-monokai');
				return;
			default:
				clientLog.warn(`Unbekanntes Ace-Theme "${themeName}", nutze github.`);
				await import('ace-builds/src-noconflict/theme-github');
		}
	}

	onMount(async () => {
		if (!browser || !host) return;
		const ace = (await import('ace-builds/src-noconflict/ace')).default;
		if (mode === 'json') await import('ace-builds/src-noconflict/mode-json');
		else if (mode === 'plaintext') await import('ace-builds/src-noconflict/mode-text');
		else await import('ace-builds/src-noconflict/mode-powershell');
		await ensureAceThemeLoaded(theme);
		await import('ace-builds/src-noconflict/ext-searchbox');
		const ed = ace.edit(host);
		const aceMode =
			mode === 'json' ? 'ace/mode/json' : mode === 'plaintext' ? 'ace/mode/text' : 'ace/mode/powershell';
		ed.session.setMode(aceMode);
		ed.setOptions({
			useWorker: false,
			fontSize: '13px',
			fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
			showPrintMargin: false,
			showGutter: true,
			highlightActiveLine: true,
			highlightSelectedWord: true,
			wrap: true,
			scrollPastEnd: 0.1,
			tabSize: 4
		});
		ed.setReadOnly(readonly);
		ed.setValue(value || '', -1);
		lastExternal = value;
		ed.session.on('change', () => {
			const v = ed.getValue();
			lastExternal = v;
			value = v;
		});
		ed.setTheme(`ace/theme/${theme}`);
		editor = ed;
	});

	$effect(() => {
		if (!editor) return;
		editor.setReadOnly(readonly);
	});

	$effect(() => {
		if (!editor) return;
		const wanted = theme;
		const gen = ++themeApplyGeneration;
		void (async () => {
			await ensureAceThemeLoaded(wanted);
			if (!editor || gen !== themeApplyGeneration) return;
			editor.setTheme(`ace/theme/${wanted}`);
		})();
	});

	$effect(() => {
		if (!editor) return;
		if (value !== lastExternal) {
			const pos = editor.getCursorPosition();
			editor.setValue(value ?? '', -1);
			editor.clearSelection();
			editor.moveCursorToPosition(pos);
			lastExternal = value;
		}
	});

	onDestroy(() => {
		themeApplyGeneration++;
		editor?.destroy();
		editor = null;
	});
</script>

{#if browser}
	<div
		bind:this={host}
		class="code-editor-host w-full rounded-md border border-border {className}"
		style:min-height={minHeight}
	></div>
{:else}
	<div
		class="bg-muted text-muted-foreground flex items-center justify-center rounded-md border p-8 text-sm"
		style:min-height={minHeight}
	>
		Editor wird geladen…
	</div>
{/if}
