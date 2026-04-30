<script lang="ts">
	import { AlertDialog } from 'bits-ui';

	import { Button } from '$lib/components/ui/button/index';
	import { cn } from '$lib/utils';

	type Props = {
		open?: boolean;
		title?: string;
		description: string;
		confirmLabel?: string;
		cancelLabel?: string;
		/** Primäraktion: `destructive` für Löschen, `default` für riskante aber nicht-destruktive Schritte. */
		confirmVariant?: 'destructive' | 'default';
		confirmDisabled?: boolean;
		/** Rückgabe `true` schließt den Dialog; bei `false` bleibt er offen (z. B. nach API-Fehler). */
		onconfirm: () => boolean | Promise<boolean>;
	};

	let {
		open = $bindable(false),
		title = 'Aktion bestätigen',
		description,
		confirmLabel = 'Bestätigen',
		cancelLabel = 'Abbrechen',
		confirmVariant = 'destructive',
		confirmDisabled = false,
		onconfirm
	}: Props = $props();

	let confirming = $state(false);

	async function handleConfirm() {
		if (confirming || confirmDisabled) return;
		confirming = true;
		try {
			const ok = await onconfirm();
			if (ok) open = false;
		} finally {
			confirming = false;
		}
	}
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Portal>
		<AlertDialog.Overlay
			class={cn(
				'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 supports-backdrop-filter:backdrop-blur-xs'
			)}
		/>
		<AlertDialog.Content
			class={cn(
				'border-border bg-background data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border p-6 shadow-lg duration-200'
			)}
		>
			<AlertDialog.Title class="text-foreground text-lg font-semibold tracking-tight">
				{title}
			</AlertDialog.Title>
			<AlertDialog.Description class="text-muted-foreground text-sm leading-relaxed">
				{description}
			</AlertDialog.Description>
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<AlertDialog.Cancel>
					{#snippet child({ props })}
						<Button variant="outline" class="w-full sm:w-auto" {...props} disabled={confirming}>
							{cancelLabel}
						</Button>
					{/snippet}
				</AlertDialog.Cancel>
				<AlertDialog.Action>
					{#snippet child({ props })}
						<Button
							type="button"
							variant={confirmVariant}
							class="w-full sm:w-auto"
							{...props}
							disabled={confirmDisabled || confirming}
							onclick={(e) => {
								e.preventDefault();
								void handleConfirm();
							}}
						>
							{confirming ? '…' : confirmLabel}
						</Button>
					{/snippet}
				</AlertDialog.Action>
			</div>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
