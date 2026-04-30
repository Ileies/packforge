<script lang="ts">
	import Loader from 'lucide-svelte/icons/loader';

	import type { PersistStatusPresentation } from '$lib/client/script-editor-page.controller';
	import { Button } from '$lib/components/ui/button/index';

	type Props = {
		persistStatusPresentation: PersistStatusPresentation;
		persistStatusAriaBusy: boolean;
		persistSaveDisabled: boolean;
		persistToolbarLocked: boolean;
		canExport: boolean;
		canDelete: boolean;
		exportZipBusy: boolean;
		onSave: () => void | Promise<void>;
		onCheckpoint: () => void | Promise<void>;
		onExportZip: () => void | Promise<void>;
		onDelete: () => void;
		onCancelExportZip: () => void;
	};

	let {
		persistStatusPresentation,
		persistStatusAriaBusy,
		persistSaveDisabled,
		persistToolbarLocked,
		canExport,
		canDelete,
		exportZipBusy,
		onSave,
		onCheckpoint,
		onExportZip,
		onDelete,
		onCancelExportZip
	}: Props = $props();
</script>

<div
	class="bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
	role="status"
	aria-live="polite"
	aria-busy={persistStatusAriaBusy}
	aria-atomic="true"
>
	<span class={persistStatusPresentation.className}>
		{persistStatusPresentation.text}
	</span>
	<span class="text-muted-foreground hidden sm:inline text-xs">Zuletzt mit dem Server abgestimmt</span>
</div>
<div class="flex flex-wrap gap-2">
	<Button disabled={persistSaveDisabled} onclick={onSave}>Speichern</Button>
	<Button variant="secondary" disabled={persistToolbarLocked} onclick={onCheckpoint}
		>Checkpoint anlegen</Button
	>
	{#if canExport}
		<Button variant="outline" disabled={persistToolbarLocked} onclick={onExportZip}>
			{exportZipBusy ? 'Export …' : 'PSADT-ZIP'}
		</Button>
	{/if}
	{#if canDelete}
		<Button variant="destructive" disabled={persistToolbarLocked} onclick={onDelete}>Eintrag löschen</Button>
	{/if}
</div>
{#if exportZipBusy}
	<div
		class="text-muted-foreground flex flex-wrap items-center gap-2 text-xs"
		role="status"
		aria-live="polite"
	>
		<Loader class="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
		<span>PSADT-ZIP wird erstellt und heruntergeladen …</span>
		<Button type="button" variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={onCancelExportZip}
			>Abbrechen</Button
		>
	</div>
{/if}
