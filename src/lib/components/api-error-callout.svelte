<script lang="ts">
	import type { ApiErrorSurface } from '$lib/client/api-error-present';
	import { formatErrorDiagnostic, titleForHttpError } from '$lib/client/api-error-present';
	import { Button } from '$lib/components/ui/button/index';
	import { cn } from '$lib/utils';

	let {
		message,
		status,
		code,
		docRef,
		class: className = ''
	}: ApiErrorSurface & { class?: string } = $props();

	const title = $derived(titleForHttpError(status));
	const diagnostic = $derived(formatErrorDiagnostic({ message, status, code, docRef }));
	const showBody = $derived(
		message.trim().length > 0 && message.trim().toLowerCase() !== title.trim().toLowerCase()
	);

	async function copyDiag() {
		try {
			await navigator.clipboard.writeText(diagnostic);
		} catch {
			/* Browser verweigert Zugriff */
		}
	}
</script>

<div
	class={cn(
		'rounded-md border border-destructive/35 bg-destructive/6 px-3 py-2.5 text-sm shadow-sm',
		className
	)}
	role="alert"
	aria-live="assertive"
>
	<p class="text-destructive font-semibold leading-snug">{title}</p>
	{#if showBody}
		<p class="text-destructive/95 mt-1.5 whitespace-pre-wrap break-words leading-relaxed">{message}</p>
	{/if}

	<details class="border-border/70 bg-background/60 mt-2 rounded-md border px-2 py-1.5">
		<summary
			class="text-muted-foreground cursor-pointer select-none text-xs font-medium tracking-wide uppercase"
		>
			Technische Details
		</summary>
		<pre
			class="bg-muted/50 text-foreground/95 mt-2 max-h-40 overflow-auto rounded p-2 font-mono text-xs leading-snug">{diagnostic}</pre>
		<div class="mt-2">
			<Button type="button" variant="outline" size="sm" class="h-8 text-xs" onclick={copyDiag}>
				Fehlertext kopieren
			</Button>
		</div>
	</details>
</div>
