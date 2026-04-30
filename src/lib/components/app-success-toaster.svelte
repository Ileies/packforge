<script lang="ts">
	import { X as XIcon } from '@lucide/svelte';

	import { dismissSuccessToast, successToasts } from '$lib/client/success-toast';
	import { Button } from '$lib/components/ui/button/index';

	const regionLabel = 'Erfolgsmeldungen';

	let undoBusyId = $state<string | null>(null);

	async function runUndo(t: { id: string; onUndo?: () => void | Promise<void> }) {
		if (!t.onUndo || undoBusyId) return;
		undoBusyId = t.id;
		try {
			await t.onUndo();
		} finally {
			undoBusyId = null;
			dismissSuccessToast(t.id);
		}
	}
</script>

<div
	class="pointer-events-none fixed right-3 bottom-3 z-[90] flex max-w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 sm:right-4 sm:bottom-4"
	aria-label={regionLabel}
	role="region"
>
	{#each $successToasts as t (t.id)}
		<div
			class="border-border/70 bg-card text-card-foreground pointer-events-auto flex flex-wrap items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-md"
			role="status"
			aria-live="polite"
		>
			<p class="min-w-0 flex-1 basis-[min(100%,12rem)] leading-snug">{t.message}</p>
			<div class="flex shrink-0 items-center gap-1">
				{#if t.onUndo}
					<Button
						type="button"
						variant="secondary"
						size="sm"
						class="h-8 px-2 text-xs"
						disabled={undoBusyId != null}
						onclick={() => void runUndo(t)}
					>
						{undoBusyId === t.id ? '…' : (t.undoLabel ?? 'Rückgängig')}
					</Button>
				{/if}
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground ring-offset-background shrink-0 rounded-sm opacity-80 transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					onclick={() => dismissSuccessToast(t.id)}
					aria-label="Meldung schließen"
				>
					<XIcon class="size-4" aria-hidden="true" />
				</button>
			</div>
		</div>
	{/each}
</div>
