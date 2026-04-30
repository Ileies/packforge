<script lang="ts">
	import type { Row } from '$lib/client/data-editor-types';
	import { Button } from '$lib/components/ui/button/index';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';
	import { Textarea } from '$lib/components/ui/textarea/index';

	let {
		selected,
		saving = false,
		editName = $bindable(''),
		editLabel = $bindable(''),
		editRequired = $bindable(false),
		editValidation = $bindable(''),
		editInfo = $bindable(''),
		editDefaultValue = $bindable(''),
		editAutofillSource = $bindable(''),
		editFieldScope = $bindable('both'),
		editIsDropdown = $bindable(false),
		editDropdownValues = $bindable(''),
		editPredefinedvalues = $bindable(false),
		editPredefinedvaluesMap = $bindable(''),
		editIsInstallerDropdown = $bindable(false),
		editIsReadonly = $bindable(false),
		onSave,
		onRequestDeleteField
	}: {
		selected: Row | null;
		saving?: boolean;
		editName?: string;
		editLabel?: string;
		editRequired?: boolean;
		editValidation?: string;
		editInfo?: string;
		editDefaultValue?: string;
		editAutofillSource?: string;
		editFieldScope?: string;
		editIsDropdown?: boolean;
		editDropdownValues?: string;
		editPredefinedvalues?: boolean;
		editPredefinedvaluesMap?: string;
		editIsInstallerDropdown?: boolean;
		editIsReadonly?: boolean;
		onSave: () => void | Promise<void>;
		onRequestDeleteField: () => void | Promise<void>;
	} = $props();
</script>

<Card>
	<CardHeader>
		<CardTitle tag="h2">Bearbeiten</CardTitle>
		<CardDescription>
			{#if !selected}Wählen Sie links ein Feld aus.{:else if selected.is_spacer}Abstandhalter — nicht
				editierbar, kann aber gelöscht werden.{:else}Änderungen mit Speichern übernehmen.{/if}
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		{#if selected && !selected.is_system_field && selected.is_spacer}
			<p class="text-muted-foreground text-sm">
				Abstandhalter sind nur Platzhalter für den vertikalen Abstand im Formular.
			</p>
			<Button variant="destructive" disabled={saving} onclick={onRequestDeleteField}
				>Abstandhalter löschen</Button
			>
		{:else if selected && !selected.is_system_field && !selected.is_spacer}
			<div class="space-y-2">
				<Label for="lbl">Label</Label>
				<Input id="lbl" bind:value={editLabel} disabled={saving} />
			</div>
			<div class="space-y-2">
				<Label for="nm">Name (intern)</Label>
				<Input id="nm" bind:value={editName} disabled={saving} />
			</div>
			<div class="flex items-center gap-2">
				<input
					id="req"
					type="checkbox"
					bind:checked={editRequired}
					disabled={saving}
					class="size-4 rounded border"
				/>
				<Label for="req">Pflichtfeld</Label>
			</div>
			<div class="space-y-2">
				<Label for="val">Validierung</Label>
				<Input id="val" bind:value={editValidation} disabled={saving} placeholder="z. B. Regex" />
			</div>
			<div class="space-y-2">
				<Label for="scope">Geltungsbereich (Installer-Typ)</Label>
				<select
					id="scope"
					class="border-input bg-background h-9 w-full max-w-md rounded-md border px-3 text-sm"
					bind:value={editFieldScope}
					disabled={saving}
				>
					<option value="both">Alle (EXE &amp; MSI)</option>
					<option value="msi_only">Nur MSI</option>
					<option value="exe_only">Nur EXE</option>
				</select>
			</div>
			<div class="space-y-2">
				<Label for="inf">Info-Hilfetext</Label>
				<Textarea id="inf" bind:value={editInfo} disabled={saving} rows={2} placeholder="Tooltip / Hilfe" />
			</div>
			<div class="space-y-2">
				<Label for="def">Standardwert</Label>
				<Input id="def" bind:value={editDefaultValue} disabled={saving} />
			</div>
			<div class="space-y-2">
				<Label for="af">Autofill-Quelle</Label>
				<Input id="af" bind:value={editAutofillSource} disabled={saving} placeholder="optional" />
			</div>
			<div class="flex flex-wrap gap-x-6 gap-y-2">
				<label class="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						bind:checked={editIsReadonly}
						disabled={saving}
						class="size-4 rounded border"
					/>
					Nur lesen
				</label>
				<label class="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						bind:checked={editIsDropdown}
						disabled={saving}
						class="size-4 rounded border"
					/>
					Dropdown
				</label>
				<label class="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						bind:checked={editIsInstallerDropdown}
						disabled={saving}
						class="size-4 rounded border"
					/>
					Installer-Dropdown
				</label>
				<label class="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						bind:checked={editPredefinedvalues}
						disabled={saving}
						class="size-4 rounded border"
					/>
					Vordefinierte Werte
				</label>
			</div>
			{#if editIsDropdown}
				<div class="space-y-2">
					<Label for="dd">Dropdown-Werte (JSON)</Label>
					<Textarea
						id="dd"
						bind:value={editDropdownValues}
						disabled={saving}
						rows={3}
						class="font-mono text-xs"
						placeholder="JSON-Array oder älteres Objektformat aus früheren Importen"
					/>
				</div>
			{/if}
			{#if editPredefinedvalues}
				<div class="space-y-2">
					<Label for="pvm">Predefined Map (JSON)</Label>
					<Textarea
						id="pvm"
						bind:value={editPredefinedvaluesMap}
						disabled={saving}
						rows={3}
						class="font-mono text-xs"
					/>
				</div>
			{/if}
			<div class="flex flex-wrap gap-2">
				<Button disabled={saving} onclick={onSave}>Speichern</Button>
				<Button variant="destructive" disabled={saving} onclick={onRequestDeleteField}>Löschen</Button>
			</div>
		{/if}
	</CardContent>
</Card>
