<script lang="ts">
	import type { ApiErrorSurface } from '$lib/client/api-error-present';
	import type { Row } from '$lib/client/data-editor-types';
	import ApiErrorCallout from '$lib/components/api-error-callout.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index';

	let {
		rows,
		selectedId,
		err = null,
		saving = false,
		initialLoading = true,
		onPick,
		onReorder,
		onExportJson,
		onImportFile,
		onSaveListOrder,
		onAddSpacer
	}: {
		rows: Row[];
		selectedId: number | null;
		err?: ApiErrorSurface | null;
		saving?: boolean;
		initialLoading?: boolean;
		onPick: (row: Row) => void;
		onReorder: (fromId: number, toId: number) => void;
		onExportJson: () => void | Promise<void>;
		onImportFile: (event: Event) => void | Promise<void>;
		onSaveListOrder: () => void | Promise<void>;
		onAddSpacer: () => void | Promise<void>;
	} = $props();

	let dragFieldId = $state<number | null>(null);
</script>

<Card>
	<CardHeader>
		<CardTitle tag="h1">Formfelder</CardTitle>
		<CardDescription
			>Zeile anklicken, Zeilen per Drag&amp;Drop neu sortieren (Speichern erfolgt automatisch), rechts
			bearbeiten.</CardDescription
		>
	</CardHeader>
	<CardContent>
		{#if err}
			<div class="mb-2">
				<ApiErrorCallout {...err} />
			</div>
		{/if}
		<div class="mb-3 flex flex-wrap gap-2">
			<Button size="sm" variant="outline" disabled={saving || initialLoading} onclick={onExportJson}
				>JSON exportieren</Button
			>
			<label
				class="border-input bg-background hover:bg-muted inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.8rem] font-medium"
			>
				<input
					type="file"
					accept="application/json,.json"
					class="sr-only"
					disabled={saving || initialLoading}
					onchange={onImportFile}
				/>
				JSON importieren…
			</label>
			<Button size="sm" variant="secondary" disabled={saving || initialLoading} onclick={onSaveListOrder}
				>Reihenfolge erneut speichern</Button
			>
			<Button size="sm" variant="ghost" disabled={saving || initialLoading} onclick={onAddSpacer}
				>Abstandhalter</Button
			>
		</div>
		<ScrollArea class="h-[min(60vh,520px)] rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Label</TableHead>
						<TableHead>Name</TableHead>
						<TableHead class="w-24">Typ</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if initialLoading}
						{#each [1, 2, 3, 4, 5, 6, 7, 8] as n (n)}
							<TableRow aria-hidden="true">
								<TableCell><div class="bg-muted h-4 w-28 animate-pulse rounded"></div></TableCell>
								<TableCell><div class="bg-muted h-4 w-24 animate-pulse rounded"></div></TableCell>
								<TableCell><div class="bg-muted h-4 w-12 animate-pulse rounded"></div></TableCell>
							</TableRow>
						{/each}
					{:else}
						{#each rows as r (r.id)}
							<TableRow
								draggable={!r.is_system_field}
								class="{r.is_system_field
									? 'text-muted-foreground cursor-not-allowed select-none'
									: `cursor-grab active:cursor-grabbing cursor-pointer ${selectedId === r.id ? 'bg-muted/60' : ''}`} {r.is_spacer &&
								!r.is_system_field
									? 'opacity-60'
									: ''}"
								aria-disabled={r.is_system_field}
								title={r.is_system_field
									? 'Systemfelder sind fest eingebaut und hier nicht auswählbar.'
									: 'Ziehen zum Sortieren'}
								ondragstart={(e) => {
									if (r.is_system_field) return;
									dragFieldId = r.id;
									e.dataTransfer?.setData('text/plain', String(r.id));
									e.dataTransfer!.effectAllowed = 'move';
								}}
								ondragend={() => {
									dragFieldId = null;
								}}
								ondragover={(e) => {
									if (!r.is_system_field) e.preventDefault();
								}}
								ondrop={(e) => {
									e.preventDefault();
									const raw = e.dataTransfer?.getData('text/plain') || String(dragFieldId ?? '');
									const fromId = Number(raw);
									if (!fromId || r.is_system_field) return;
									onReorder(fromId, r.id);
								}}
								onclick={() => {
									if (!r.is_system_field) onPick(r);
								}}
							>
								<TableCell class="font-medium">{r.label}</TableCell>
								<TableCell class="text-muted-foreground">{r.name}</TableCell>
								<TableCell class="text-xs">
									{r.is_system_field ? 'System' : r.is_spacer ? 'Abstand' : 'Feld'}
								</TableCell>
							</TableRow>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</ScrollArea>
	</CardContent>
</Card>
