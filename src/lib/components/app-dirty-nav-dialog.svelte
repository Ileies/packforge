<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import { onMount } from 'svelte';

	import {
		answerDirtyNavConfirm,
		type DirtyNavConfirmPending,
		dirtyNavConfirmPending
	} from '$lib/client/dirty-nav-bridge';
	import { Button } from '$lib/components/ui/button/index';
	import { cn } from '$lib/utils';

	let pending = $state<DirtyNavConfirmPending | null>(null);
	let dialogOpen = $state(false);
	/** Verhindert doppeltes `resolve`, wenn „Verlassen“ den Dialog schließt und `onOpenChange(false)` folgt. */
	let leaveConfirmedForThisOpen = $state(false);

	onMount(() => {
		const unsub = dirtyNavConfirmPending.subscribe((v) => {
			pending = v;
			dialogOpen = v != null;
		});
		return unsub;
	});

	function onOpenChange(o: boolean) {
		if (o) {
			leaveConfirmedForThisOpen = false;
			return;
		}
		if (!leaveConfirmedForThisOpen && pending) {
			answerDirtyNavConfirm(false);
		}
		leaveConfirmedForThisOpen = false;
	}

	function confirmLeave() {
		leaveConfirmedForThisOpen = true;
		answerDirtyNavConfirm(true);
		dialogOpen = false;
	}
</script>

<AlertDialog.Root bind:open={dialogOpen} {onOpenChange}>
	<AlertDialog.Portal>
		<AlertDialog.Overlay
			class={cn(
				'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-[70] bg-black/50 supports-backdrop-filter:backdrop-blur-xs'
			)}
		/>
		<AlertDialog.Content
			class={cn(
				'border-border bg-background data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[71] grid w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border p-6 shadow-lg duration-200'
			)}
		>
			<AlertDialog.Title class="text-foreground text-lg font-semibold tracking-tight">
				Ungespeicherte Änderungen
			</AlertDialog.Title>
			<AlertDialog.Description class="text-muted-foreground text-sm leading-relaxed">
				{pending?.message ?? ''}
			</AlertDialog.Description>
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
				<AlertDialog.Cancel>
					{#snippet child({ props })}
						<Button variant="outline" class="w-full sm:w-auto" {...props}>Auf der Seite bleiben</Button>
					{/snippet}
				</AlertDialog.Cancel>
				<AlertDialog.Action>
					{#snippet child({ props })}
						<Button
							type="button"
							variant="destructive"
							class="w-full sm:w-auto"
							{...props}
							onclick={(e) => {
								e.preventDefault();
								confirmLeave();
							}}
						>
							Verlassen
						</Button>
					{/snippet}
				</AlertDialog.Action>
			</div>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
